import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { RuntimeService, type AgentDispatchConfig, type BackendAdapter } from "@agentdispatch/core";
import { AwsAgentCoreAdapter } from "@agentdispatch/adapter-aws-agentcore";
import { SqliteTaskStore } from "@agentdispatch/store-sqlite";

export interface RuntimeBootstrapOptions {
  configPath?: string;
  adapters?: BackendAdapter[];
}

export async function loadAgentDispatchConfig(configPath = process.env.AGENTDISPATCH_CONFIG ?? "agentdispatch.config.json"): Promise<AgentDispatchConfig> {
  const path = resolve(configPath);
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as AgentDispatchConfig;
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
