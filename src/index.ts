import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DispatchRequest, RuntimeService } from "@agentdispatch/core";

const dispatchSchema = {
  provider: z.string(),
  account_profile: z.string(),
  capability: z.string(),
  task_type: z.string(),
  target: z.object({
    mode: z.string(),
    details: z.record(z.unknown()).optional()
  }),
  input: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional()
};

export function createAgentDispatchMcpServer(runtime: RuntimeService): McpServer {
  const server = new McpServer({ name: "agentdispatch", version: "0.1.0" });

  server.tool("list_providers", {}, async () => jsonContent(runtime.listProviders()));

  server.tool("list_capabilities", { provider: z.string().optional() }, async ({ provider }) => {
    return jsonContent(runtime.listCapabilities(provider));
  });

  server.tool("list_account_profiles", {}, async () => jsonContent(runtime.listAccountProfiles()));

  server.tool("dispatch_task", dispatchSchema, async (input) => {
    const request: DispatchRequest = {
      provider: input.provider,
      accountProfile: input.account_profile,
      capability: input.capability,
      taskType: input.task_type,
      target: input.target,
      input: input.input,
      metadata: input.metadata
    };
    return jsonContent(await runtime.dispatchTask(request));
  });

  server.tool("get_task_status", { task_id: z.string() }, async ({ task_id }) => {
    return jsonContent(await runtime.getTaskStatus(task_id));
  });

  server.tool("get_task_logs", { task_id: z.string(), cursor: z.number().optional(), limit: z.number().optional() }, async ({ task_id, cursor, limit }) => {
    return jsonContent(await runtime.getTaskLogs(task_id, cursor, limit));
  });

  server.tool("get_task_result", { task_id: z.string() }, async ({ task_id }) => {
    return jsonContent(await runtime.getTaskResult(task_id));
  });

  server.tool("cancel_task", { task_id: z.string() }, async ({ task_id }) => {
    return jsonContent(await runtime.cancelTask(task_id));
  });

  return server;
}

function jsonContent(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}
