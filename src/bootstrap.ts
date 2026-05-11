import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { RuntimeService, validateConfig, type AgentDispatchConfig, type BackendAdapter } from "@agent-dispatch/core";
import { AwsAgentCoreAdapter } from "@agent-dispatch/adapter-aws-agentcore";
import { SqliteTaskStore } from "@agent-dispatch/store-sqlite";

export interface RuntimeBootstrapOptions {
  configPath?: string;
  adapters?: BackendAdapter[];
}

export async function loadAgentDispatchConfig(configPath = process.env.AGENTDISPATCH_CONFIG ?? "agentdispatch.config.json"): Promise<AgentDispatchConfig> {
  const path = resolve(configPath);
  const raw = await readFile(path, "utf8");
  const config = JSON.parse(raw) as AgentDispatchConfig;
  assertValidConfig(config);
  return config;
}

export async function createRuntimeServiceFromConfig(config: AgentDispatchConfig, options: RuntimeBootstrapOptions = {}): Promise<RuntimeService> {
  const store = new SqliteTaskStore({ stateDir: config.stateDir ?? ".agentdispatch" });
  await store.ensureReady();
  const adapters = options.adapters ?? createConfiguredAdapters(config);
  return new RuntimeService({ config, store, adapters });
}

export async function createRuntimeServiceFromConfigFile(options: RuntimeBootstrapOptions = {}): Promise<RuntimeService> {
  const config = await loadAgentDispatchConfig(options.configPath);
  return createRuntimeServiceFromConfig(config, options);
}

export function createRuntimeCheckReport(runtime: RuntimeService) {
  return {
    ok: true,
    providers: runtime.listProviders(),
    capabilities: runtime.listCapabilities(),
    accounts: runtime.listAccountProfiles().map((account) => ({
      name: account.name,
      provider: account.provider,
      region: account.region,
      credentialSource: account.credentialSource
    })),
    runtimes: runtime.listRuntimeProfiles().map((runtimeProfile) => ({
      name: runtimeProfile.name,
      provider: runtimeProfile.provider,
      account: runtimeProfile.account,
      capability: runtimeProfile.capability,
      backend: runtimeProfile.backend,
      target: runtimeProfile.target
    }))
  };
}

function createConfiguredAdapters(config: AgentDispatchConfig): BackendAdapter[] {
  const adapters: BackendAdapter[] = [];
  for (const backend of Object.values(config.backends)) {
    if (backend.adapter !== "aws-agentcore") continue;
    const account = config.accounts[backend.account];
    if (!account) {
      throw new Error(`Backend ${backend.adapter} references missing account ${backend.account}.`);
    }
    adapters.push(new AwsAgentCoreAdapter({
      account: { name: backend.account, ...account },
      region: account.region ?? String(backend.details?.region ?? process.env.AWS_REGION ?? "us-east-1"),
      runtimeArn: optionalString(backend.details?.runtimeArn ?? process.env.AGENTDISPATCH_AGENTCORE_RUNTIME_ARN),
      qualifier: optionalString(backend.details?.qualifier) ?? "DEFAULT",
      defaultExecutionRoleArn: optionalString(backend.details?.defaultExecutionRoleArn),
      deleteRuntimeOnCompletion: backend.details?.deleteRuntimeOnCompletion !== false
    }));
  }
  return adapters;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function assertValidConfig(config: AgentDispatchConfig): void {
  const errors = validateConfig(config);
  if (errors.length > 0) {
    throw new Error(`Invalid AgentDispatch config:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
}
