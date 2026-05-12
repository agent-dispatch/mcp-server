import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AgentDispatchError, type DispatchRequest, type RuntimeProfile, type RuntimeService } from "@agent-dispatch/core";
import packageJson from "../package.json" with { type: "json" };
import { mcpToolSchemas } from "./schemas.js";

export function createAgentDispatchMcpServer(runtime: RuntimeService): McpServer {
  const server = new McpServer({ name: "agentdispatch", version: packageJson.version });

  server.tool("list_providers", mcpToolSchemas.list_providers.shape, async () => jsonContent(runtime.listProviders()));

  server.tool("list_capabilities", mcpToolSchemas.list_capabilities.shape, async ({ provider }) => {
    return jsonContent(runtime.listCapabilities(provider));
  });

  server.tool("list_account_profiles", mcpToolSchemas.list_account_profiles.shape, async () => jsonContent(runtime.listAccountProfiles()));

  server.tool("spawn_cloud_agent", mcpToolSchemas.spawn_cloud_agent.shape, async (input) => {
    const clarification = createSpawnClarification(runtime, input);
    if (clarification) return jsonContent(clarification);
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
  instruction?: string;
  runtime?: string;
  context?: Record<string, unknown>;
  protocol?: string;
  framework?: string;
  model?: string | Record<string, unknown>;
  runtime_tools?: Record<string, unknown>;
  provider?: string;
  account_profile?: string;
  target?: { mode?: string; protocol?: string; details?: Record<string, unknown> };
  metadata?: Record<string, unknown>;
}): DispatchRequest {
  const profile = selectRuntimeProfile(runtime, input.runtime);
  const defaults = runtime.getDefaults();
  const provider = input.provider ?? profile?.provider ?? defaults.provider;
  const account = selectAccount(runtime, provider, input.account_profile ?? profile?.account ?? defaults.accountProfile);
  const targetMode = input.target?.mode ?? profile?.target?.mode ?? defaults.targetMode ?? "session";
  const protocol = input.protocol ?? input.target?.protocol ?? profile?.protocol ?? profile?.target?.protocol ?? defaults.protocol;
  const capability = selectCapability(runtime, account.provider, targetMode, profile?.capability ?? defaults.capability);
  const backend = profile?.backend ?? defaults.backend;
  return {
    provider: account.provider,
    accountProfile: account.name,
    capability,
    backend,
    taskType: "agent.run",
    target: {
      mode: targetMode,
      protocol,
      details: mergeRecords(profile?.target?.details, input.target?.details)
    },
    input: {
      instruction: input.instruction?.trim(),
      context: input.context ?? {},
      protocol,
      framework: input.framework ?? profile?.framework ?? defaults.framework,
      model: input.model ?? profile?.model ?? defaults.model,
      runtime_tools: mergeRecords(defaults.runtimeTools, profile?.runtimeTools, input.runtime_tools)
    },
    metadata: mergeRecords(profile?.metadata, input.metadata)
  };
}

function createSpawnClarification(runtime: RuntimeService, input: {
  instruction?: string;
  runtime?: string;
  context?: Record<string, unknown>;
  protocol?: string;
  framework?: string;
  model?: string | Record<string, unknown>;
  runtime_tools?: Record<string, unknown>;
  provider?: string;
  account_profile?: string;
  target?: { mode?: string; protocol?: string; details?: Record<string, unknown> };
  metadata?: Record<string, unknown>;
}) {
  const questions: Array<{ id: string; question: string; choices?: string[] }> = [];
  const profiles = runtime.listRuntimeProfiles();
  const defaults = runtime.getDefaults();
  const selectedProfile = input.runtime
    ? runtime.getRuntimeProfile(input.runtime)
    : runtime.getDefaultRuntimeProfile();

  if (input.runtime && !selectedProfile) {
    questions.push({
      id: "runtime",
      question: `Runtime profile ${input.runtime} is not configured. Which runtime profile should I use?`,
      choices: profiles.map((profile) => profile.name)
    });
  }

  if (!input.instruction?.trim()) {
    questions.push({
      id: "instruction",
      question: "What task should the cloud subagent run?"
    });
  }

  const provider = input.provider ?? selectedProfile?.provider ?? defaults.provider;
  const accountName = input.account_profile ?? selectedProfile?.account ?? defaults.accountProfile;
  const backendName = selectedProfile?.backend ?? defaults.backend;
  const backend = backendName ? runtime.getBackend(backendName) : undefined;
  const targetMode = input.target?.mode ?? selectedProfile?.target?.mode ?? defaults.targetMode ?? "session";
  const targetDetails = mergeRecords(selectedProfile?.target?.details, input.target?.details) ?? {};
  const accounts = runtime.listAccountProfiles();
  const matchingAccounts = provider ? accounts.filter((account) => account.provider === provider) : accounts;
  if (accounts.length === 0) {
    questions.push({
      id: "account_profile",
      question: "No account profiles are configured. Which provider account profile should be added before spawning?"
    });
  } else if (accountName && !accounts.some((account) => account.name === accountName)) {
    questions.push({
      id: "account_profile",
      question: `Account profile ${accountName} is not configured. Which account profile should I use?`,
      choices: matchingAccounts.map((account) => account.name)
    });
  }

  const requiredInputs = selectedProfile?.requiredInputs ?? [];
  for (const requiredInput of requiredInputs) {
    if (hasSpawnInput(input, requiredInput, selectedProfile, defaults)) continue;
    questions.push({
      id: requiredInput,
      question: `What ${requiredInput} should the cloud subagent use?`
    });
  }

  if (provider === "aws" && backend?.adapter === "aws-agentcore") {
    if (targetMode === "session" && !targetDetails.runtimeArn && !backend.details?.runtimeArn && !process.env.AGENTDISPATCH_AGENTCORE_RUNTIME_ARN) {
      questions.push({
        id: "runtimeArn",
        question: "Which AWS AgentCore runtime ARN should this cloud subagent use?"
      });
    }
    if (targetMode === "runtime") {
      if (!targetDetails.ecrImageUri) {
        questions.push({
          id: "ecrImageUri",
          question: "Which ECR image URI should AgentDispatch deploy for this cloud subagent?"
        });
      }
      if (!targetDetails.executionRoleArn && !backend.details?.defaultExecutionRoleArn) {
        questions.push({
          id: "executionRoleArn",
          question: "Which AgentCore execution role ARN should AgentDispatch use?"
        });
      }
    }
  }

  if (questions.length === 0) return undefined;
  return {
    status: "needs_clarification",
    retry_tool: "spawn_cloud_agent",
    questions,
    available_runtimes: profiles.map((profile) => ({
      name: profile.name,
      provider: profile.provider,
      protocol: profile.protocol ?? profile.target?.protocol,
      framework: profile.framework,
      model: profile.model
    }))
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

function hasSpawnInput(
  input: {
    context?: Record<string, unknown>;
    runtime_tools?: Record<string, unknown>;
    model?: string | Record<string, unknown>;
    protocol?: string;
    framework?: string;
    target?: { protocol?: string; details?: Record<string, unknown> };
    metadata?: Record<string, unknown>;
  },
  key: string,
  profile: RuntimeProfile | undefined,
  defaults: ReturnType<RuntimeService["getDefaults"]>
): boolean {
  if (key === "model") return Boolean(input.model ?? profile?.model ?? defaults.model);
  if (key === "protocol") return Boolean(input.protocol ?? input.target?.protocol ?? profile?.protocol ?? profile?.target?.protocol ?? defaults.protocol);
  if (key === "framework") return Boolean(input.framework ?? profile?.framework ?? defaults.framework);
  if (key === "runtime_tools") return Boolean(input.runtime_tools ?? profile?.runtimeTools ?? defaults.runtimeTools);
  return Boolean(
    input.context?.[key] ??
    input.metadata?.[key] ??
    input.target?.details?.[key] ??
    profile?.target?.details?.[key]
  );
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
