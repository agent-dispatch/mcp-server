import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { RuntimeService, type BackendAdapter, type DispatchRequest, type RuntimeEvent, type TaskStore } from "@agentdispatch/core";
import { createAgentDispatchMcpServer } from "../src/index.js";

class MemoryStore implements TaskStore {
  private readonly tasks = new Map<string, any>();
  private readonly events = new Map<string, RuntimeEvent[]>();
  private readonly logs = new Map<string, string>();
  private readonly artifacts = new Map<string, any[]>();

  async saveTask(task: any) { this.tasks.set(task.id, task); }
  async getTask(taskId: string) { return this.tasks.get(taskId); }
  async updateTask(taskId: string, patch: any) {
    const next = { ...this.tasks.get(taskId), ...patch };
    this.tasks.set(taskId, next);
    return next;
  }
  async listTasks() { return [...this.tasks.values()]; }
  async saveRuntime() {}
  async saveSession() {}
  async appendEvent(event: RuntimeEvent) {
    const current = this.events.get(event.taskId) ?? [];
    const next = { ...event, sequence: current.length + 1 };
    this.events.set(event.taskId, [...current, next]);
    return next;
  }
  async listEvents(taskId: string) { return this.events.get(taskId) ?? []; }
  async appendLog(taskId: string, chunk: string) { this.logs.set(taskId, `${this.logs.get(taskId) ?? ""}${chunk}`); }
  async readLogs(taskId: string, cursor = 0, limit = 64_000) {
    const data = this.logs.get(taskId) ?? "";
    return { taskId, cursor, nextCursor: Math.min(data.length, cursor + limit), data: data.slice(cursor, cursor + limit) };
  }
  async saveArtifact(artifact: any) {
    this.artifacts.set(artifact.taskId, [...(this.artifacts.get(artifact.taskId) ?? []), artifact]);
  }
  async listArtifacts(taskId: string) { return this.artifacts.get(taskId) ?? []; }
}

function mockAdapter(events: RuntimeEvent[]): BackendAdapter {
  return {
    name: "mock-agent-runtime",
    provider: "aws",
    capabilities: () => [{ provider: "aws", capability: "agent-runtime", taskTypes: ["agent.run"], targetModes: ["session"] }],
    resolveTarget: async (request) => ({
      account: { name: request.accountProfile, provider: request.provider, credentialSource: "test" },
      target: { provider: request.provider, accountProfile: request.accountProfile, capability: request.capability, backend: "mock-agent-runtime", mode: request.target.mode }
    }),
    provision: async () => ({}),
    startTask: async () => ({ result: { ok: true } }),
    streamEvents: async function* (taskId) {
      for (const event of events) {
        yield { ...event, taskId };
      }
    },
    cancel: async () => ({ status: "cancelled" }),
    cleanup: async () => ({ status: "completed" })
  };
}

function createRuntime(adapter = mockAdapter([{ taskId: "ignored", type: "task.log", message: "hello" }])) {
  return new RuntimeService({
    config: {
      accounts: { "dev-aws": { provider: "aws", credentialSource: "aws-sdk-default" } },
      backends: {}
    },
    store: new MemoryStore(),
    adapters: [adapter]
  });
}

async function createClient(runtime = createRuntime()) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createAgentDispatchMcpServer(runtime);
  const client = new Client({ name: "agentdispatch-test", version: "0.1.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, server };
}

async function callJson(client: Client, name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  const content = result.content as Array<{ type: string; text?: string }>;
  const text = content.find((item) => item.type === "text")?.text;
  if (!text) throw new Error(`Tool ${name} did not return text content.`);
  return JSON.parse(text);
}

async function waitForTerminalStatus(client: Client, taskId: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const task = await callJson(client, "get_task_status", { task_id: taskId });
    if (["succeeded", "failed", "cancelled"].includes(task.status)) return task;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error(`Task ${taskId} did not reach a terminal status.`);
}

const request: DispatchRequest = {
  provider: "aws",
  accountProfile: "dev-aws",
  capability: "agent-runtime",
  taskType: "agent.run",
  target: { mode: "session" },
  input: { instruction: "run through MCP" }
};

describe("MCP tool invocation", () => {
  it("dispatches and polls tasks through a real MCP client transport", async () => {
    const { client, server } = await createClient();
    try {
      await expect(callJson(client, "list_providers")).resolves.toEqual(["aws"]);
      await expect(callJson(client, "list_capabilities", { provider: "aws" })).resolves.toHaveLength(1);
      await expect(callJson(client, "list_account_profiles")).resolves.toHaveLength(1);

      const handle = await callJson(client, "dispatch_task", {
        provider: request.provider,
        account_profile: request.accountProfile,
        capability: request.capability,
        task_type: request.taskType,
        target: request.target,
        input: request.input
      });
      expect(handle).toMatchObject({ provider: "aws", capability: "agent-runtime", backend: "mock-agent-runtime" });

      await expect(waitForTerminalStatus(client, handle.taskId)).resolves.toMatchObject({ status: "succeeded" });
      await expect(callJson(client, "get_task_logs", { task_id: handle.taskId })).resolves.toMatchObject({ data: "hello\n" });
      await expect(callJson(client, "get_task_result", { task_id: handle.taskId })).resolves.toMatchObject({ status: "succeeded" });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("surfaces unsupported provider errors to MCP clients", async () => {
    const { client, server } = await createClient();
    try {
      await expect(callJson(client, "dispatch_task", {
        provider: "gcp",
        account_profile: "dev-aws",
        capability: "agent-runtime",
        task_type: "agent.run",
        target: { mode: "session" },
        input: { instruction: "run" }
      })).rejects.toThrow();
    } finally {
      await client.close();
      await server.close();
    }
  });
});
