import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AgentDispatchError, type DispatchRequest, type RuntimeService } from "@agentdispatch/core";
import { mcpToolSchemas } from "./schemas.js";

export function createAgentDispatchMcpServer(runtime: RuntimeService): McpServer {
  const server = new McpServer({ name: "agentdispatch", version: "0.1.0" });

  server.tool("list_providers", mcpToolSchemas.list_providers.shape, async () => jsonContent(runtime.listProviders()));

  server.tool("list_capabilities", mcpToolSchemas.list_capabilities.shape, async ({ provider }) => {
    return jsonContent(runtime.listCapabilities(provider));
  });

  server.tool("list_account_profiles", mcpToolSchemas.list_account_profiles.shape, async () => jsonContent(runtime.listAccountProfiles()));

  server.tool("spawn_cloud_agent", mcpToolSchemas.spawn_cloud_agent.shape, async (input) => {
    return jsonContent(await runtime.dispatchTask(createSpawnCloudAgentRequest(runtime, input)));
  });

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

function createSpawnCloudAgentRequest(runtime: RuntimeService, input: {
  instruction: string;
  context?: Record<string, unknown>;
  framework?: string;
  runtime_tools?: Record<string, unknown>;
  provider?: string;
  account_profile?: string;
  target?: { mode?: string; details?: Record<string, unknown> };
  metadata?: Record<string, unknown>;
}): DispatchRequest {
  const account = selectAccount(runtime, input.provider, input.account_profile);
  const capability = selectCapability(runtime, account.provider);
  return {
    provider: account.provider,
    accountProfile: account.name,
    capability,
    taskType: "agent.run",
    target: {
      mode: input.target?.mode ?? "session",
      details: input.target?.details
    },
    input: {
      instruction: input.instruction,
      context: input.context ?? {},
      framework: input.framework,
      runtime_tools: input.runtime_tools
    },
    metadata: input.metadata
  };
}

function selectAccount(runtime: RuntimeService, provider?: string, accountProfile?: string) {
  const accounts = runtime.listAccountProfiles();
  const account = accounts.find((candidate) => {
    return (!provider || candidate.provider === provider) && (!accountProfile || candidate.name === accountProfile);
  }) ?? accounts[0];
  if (!account) {
    throw new AgentDispatchError({ code: "account_profile.not_configured", message: "No AgentDispatch account profile is configured." });
  }
  return account;
}

function selectCapability(runtime: RuntimeService, provider: string): string {
  const capability = runtime.listCapabilities(provider).find((candidate) => {
    return candidate.capability === "agent-runtime" && candidate.taskTypes.includes("agent.run") && candidate.targetModes.includes("session");
  });
  if (!capability) {
    throw new AgentDispatchError({ code: "capability.not_configured", message: `No agent-runtime capability is configured for provider ${provider}.` });
  }
  return capability.capability;
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
