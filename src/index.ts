import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AgentDispatchError, type DispatchRequest, type RuntimeProfile, type RuntimeService } from "@agentdispatch/core";
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
      backend: input.backend,
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
  runtime?: string;
  context?: Record<string, unknown>;
  framework?: string;
  runtime_tools?: Record<string, unknown>;
  provider?: string;
  account_profile?: string;
  target?: { mode?: string; details?: Record<string, unknown> };
  metadata?: Record<string, unknown>;
}): DispatchRequest {
  const profile = selectRuntimeProfile(runtime, input.runtime);
  const defaults = runtime.getDefaults();
  const provider = input.provider ?? profile?.provider ?? defaults.provider;
  const account = selectAccount(runtime, provider, input.account_profile ?? profile?.account ?? defaults.accountProfile);
  const targetMode = input.target?.mode ?? profile?.target?.mode ?? defaults.targetMode ?? "session";
  const capability = selectCapability(runtime, account.provider, targetMode, profile?.capability ?? defaults.capability);
  return {
    provider: account.provider,
    accountProfile: account.name,
    capability,
    backend: profile?.backend,
    taskType: "agent.run",
    target: {
      mode: targetMode,
      details: mergeRecords(profile?.target?.details, input.target?.details)
    },
    input: {
      instruction: input.instruction,
      context: input.context ?? {},
      framework: input.framework ?? profile?.framework ?? defaults.framework,
      runtime_tools: mergeRecords(defaults.runtimeTools, profile?.runtimeTools, input.runtime_tools)
    },
    metadata: mergeRecords(profile?.metadata, input.metadata)
  };
}

function selectRuntimeProfile(runtime: RuntimeService, runtimeName?: string): RuntimeProfile | undefined {
  if (!runtimeName) return runtime.getDefaultRuntimeProfile();
  const profile = runtime.getRuntimeProfile(runtimeName);
  if (!profile) {
    throw new AgentDispatchError({ code: "runtime_profile.not_found", message: `Runtime profile ${runtimeName} was not found.` });
  }
  return profile;
}

function selectAccount(runtime: RuntimeService, provider?: string, accountProfile?: string) {
  const accounts = runtime.listAccountProfiles();
  const account = accountProfile
    ? accounts.find((candidate) => candidate.name === accountProfile)
    : accounts.find((candidate) => !provider || candidate.provider === provider);
  if (!account) {
    throw new AgentDispatchError({
      code: "account_profile.not_configured",
      message: accountProfile
        ? `Account profile ${accountProfile} is not configured.`
        : provider
          ? `No AgentDispatch account profile is configured for provider ${provider}.`
          : "No AgentDispatch account profile is configured."
    });
  }
  if (provider && account.provider !== provider) {
    throw new AgentDispatchError({
      code: "account_profile.provider_mismatch",
      message: `Account profile ${account.name} is for ${account.provider}, not ${provider}.`
    });
  }
  return account;
}

function selectCapability(runtime: RuntimeService, provider: string, targetMode: string, requestedCapability?: string): string {
  if (requestedCapability) return requestedCapability;
  const capability = runtime.listCapabilities(provider).find((candidate) => {
    return candidate.capability === "agent-runtime" && candidate.taskTypes.includes("agent.run") && candidate.targetModes.includes(targetMode);
  });
  if (!capability) {
    throw new AgentDispatchError({
      code: "capability.not_configured",
      message: `No agent-runtime capability is configured for provider ${provider} with target mode ${targetMode}.`
    });
  }
  return capability.capability;
}

function mergeRecords(...records: Array<Record<string, unknown> | undefined>): Record<string, unknown> | undefined {
  const merged = Object.assign({}, ...records.filter(Boolean));
  return Object.keys(merged).length > 0 ? merged : undefined;
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
