import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { RuntimeService, type BackendAdapter, type DispatchRequest, type RuntimeEvent, type RuntimeRecord, type TaskStore } from "@agent-dispatch/core";
import { createAgentDispatchMcpServer, createRuntimeServiceFromConfig } from "../src/index.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

class MemoryStore implements TaskStore {
  private readonly tasks = new Map<string, any>();
  private readonly runtimes = new Map<string, RuntimeRecord>();
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
  async saveRuntime(runtime: RuntimeRecord) { this.runtimes.set(runtime.id, runtime); }
  async updateRuntime(runtimeId: string, patch: Partial<RuntimeRecord>) {
    const current = this.runtimes.get(runtimeId);
    if (!current) throw new Error(`Runtime ${runtimeId} was not found.`);
    const next = { ...current, ...patch };
    this.runtimes.set(runtimeId, next);
    return next;
  }
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
    prepareTask: async ({ dispatch }) => ({
      providerRefs: { runtimeSessionId: "agentcore_session_mock" },
      cloudAgent: {
        protocol: dispatch.target.protocol ?? "a2a",
        provider: "aws",
        backend: "mock-agent-runtime",
        accountProfile: dispatch.accountProfile,
        sessionId: "agentcore_session_mock",
        providerRefs: { runtimeSessionId: "agentcore_session_mock" },
        a2a: {
          transport: "json-rpc-2.0-http",
          messageMethod: "message/send"
        }
      }
    }),
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
      backends: {
        "mock-agent-runtime": {
          provider: "aws",
          capability: "agent-runtime",
          adapter: "mock-agent-runtime",
          account: "dev-aws"
        }
      },
      runtimes: {
        "research-agent": {
          provider: "aws",
          account: "dev-aws",
          capability: "agent-runtime",
          backend: "mock-agent-runtime",
          protocol: "a2a",
          target: { mode: "session", protocol: "a2a", details: { runtimeArn: "arn:aws:bedrock-agentcore:test" } },
          framework: "echo",
          model: { provider: "bedrock", modelId: "anthropic.claude-3-5-sonnet" },
          runtimeTools: { enabled: ["web-search"] }
        }
      },
      defaults: {
        runtime: "research-agent"
      }
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

  it("spawns cloud agents with default routing through a real MCP client transport", async () => {
    const { client, server } = await createClient();
    try {
      const handle = await callJson(client, "spawn_cloud_agent", {
        instruction: "run through spawn_cloud_agent",
        context: { repo: "agent-dispatch" }
      });
      expect(handle).toMatchObject({
        provider: "aws",
        capability: "agent-runtime",
        backend: "mock-agent-runtime",
        cloudAgent: {
          protocol: "a2a",
          sessionId: "agentcore_session_mock",
          a2a: { messageMethod: "message/send" }
        }
      });

      await expect(waitForTerminalStatus(client, handle.taskId)).resolves.toMatchObject({
        taskType: "agent.run",
        backend: "mock-agent-runtime",
        target: {
          mode: "session",
          protocol: "a2a",
          details: { runtimeArn: "arn:aws:bedrock-agentcore:test" }
        },
        input: {
          instruction: "run through spawn_cloud_agent",
          context: { repo: "agent-dispatch" },
          protocol: "a2a",
          framework: "echo",
          model: { provider: "bedrock", modelId: "anthropic.claude-3-5-sonnet" },
          runtime_tools: { enabled: ["web-search"] }
        }
      });
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

  it("returns structured clarification when spawn input is incomplete", async () => {
    const { client, server } = await createClient();
    try {
      const response = await callJson(client, "spawn_cloud_agent", {});
      expect(response).toMatchObject({
        status: "needs_clarification",
        retry_tool: "spawn_cloud_agent",
        questions: expect.arrayContaining([
          expect.objectContaining({ id: "instruction" })
        ])
      });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("runs spawn_cloud_agent end-to-end through config bootstrap and SQLite state", async () => {
    const stateDir = await mkdtemp(join(tmpdir(), "agentdispatch-mcp-e2e-"));
    tempDirs.push(stateDir);
    const runtime = await createRuntimeServiceFromConfig({
      stateDir,
      accounts: {
        "dev-aws": { provider: "aws", region: "us-west-2", credentialSource: "aws-sdk-default" }
      },
      backends: {
        "mock-backend": {
          provider: "aws",
          capability: "agent-runtime",
          adapter: "mock-agent-runtime",
          account: "dev-aws"
        }
      },
      defaults: {
        provider: "aws",
        accountProfile: "dev-aws",
        capability: "agent-runtime",
        backend: "mock-backend",
        targetMode: "session",
        protocol: "a2a",
        framework: "smoke",
        model: { provider: "test", modelId: "smoke-model" },
        runtimeTools: { enabled: ["repo-search"] }
      }
    }, {
      adapters: [mockAdapter([{ taskId: "ignored", type: "task.log", message: "sqlite smoke log" }])]
    });
    const { client, server } = await createClient(runtime);
    try {
      const handle = await callJson(client, "spawn_cloud_agent", {
        instruction: "run SQLite-backed smoke path",
        context: { repo: "agent-dispatch" }
      });
      expect(handle).toMatchObject({
        provider: "aws",
        accountProfile: "dev-aws",
        capability: "agent-runtime",
        backend: "mock-agent-runtime",
        cloudAgent: {
          protocol: "a2a",
          sessionId: "agentcore_session_mock"
        }
      });

      const task = await waitForTerminalStatus(client, handle.taskId);
      expect(task).toMatchObject({
        status: "succeeded",
        taskType: "agent.run",
        target: { mode: "session", protocol: "a2a" },
        input: {
          instruction: "run SQLite-backed smoke path",
          context: { repo: "agent-dispatch" },
          framework: "smoke",
          model: { provider: "test", modelId: "smoke-model" },
          runtime_tools: { enabled: ["repo-search"] }
        }
      });
      await expect(callJson(client, "get_task_logs", { task_id: handle.taskId })).resolves.toMatchObject({
        data: "sqlite smoke log\n"
      });
      await expect(callJson(client, "get_task_result", { task_id: handle.taskId })).resolves.toMatchObject({
        status: "succeeded",
        result: { ok: true }
      });
    } finally {
      await client.close();
      await server.close();
    }
  });
});
