import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DispatchRequest, RuntimeService } from "@agentdispatch/core";
import { mcpToolSchemas } from "./schemas.js";

export function createAgentDispatchMcpServer(runtime: RuntimeService): McpServer {
  const server = new McpServer({ name: "agentdispatch", version: "0.1.0" });

  server.tool("list_providers", mcpToolSchemas.list_providers.shape, async () => jsonContent(runtime.listProviders()));

  server.tool("list_capabilities", mcpToolSchemas.list_capabilities.shape, async ({ provider }) => {
    return jsonContent(runtime.listCapabilities(provider));
  });

  server.tool("list_account_profiles", mcpToolSchemas.list_account_profiles.shape, async () => jsonContent(runtime.listAccountProfiles()));

  server.tool("dispatch_task", mcpToolSchemas.dispatch_task.shape, async (input) => {
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

  server.tool("get_task_status", mcpToolSchemas.get_task_status.shape, async ({ task_id }) => {
    return jsonContent(await runtime.getTaskStatus(task_id));
  });

  server.tool("get_task_logs", mcpToolSchemas.get_task_logs.shape, async ({ task_id, cursor, limit }) => {
    return jsonContent(await runtime.getTaskLogs(task_id, cursor, limit));
  });

  server.tool("get_task_result", mcpToolSchemas.get_task_result.shape, async ({ task_id }) => {
    return jsonContent(await runtime.getTaskResult(task_id));
  });

  server.tool("cancel_task", mcpToolSchemas.cancel_task.shape, async ({ task_id }) => {
    return jsonContent(await runtime.cancelTask(task_id));
  });

  return server;
}

export * from "./bootstrap.js";
export * from "./schemas.js";

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
