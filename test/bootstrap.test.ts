import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import type { BackendAdapter } from "@agentdispatch/core";
import { createRuntimeServiceFromConfig, loadAgentDispatchConfig } from "../src/index.js";

let stateDir: string | undefined;

afterEach(async () => {
  if (stateDir) await rm(stateDir, { recursive: true, force: true });
});

describe("MCP bootstrap", () => {
  it("loads config from disk", async () => {
    stateDir = await mkdtemp(join(tmpdir(), "agentdispatch-mcp-"));
    const configPath = join(stateDir, "agentdispatch.config.json");
    await writeFile(configPath, JSON.stringify({
      stateDir,
      accounts: { "dev-aws": { provider: "aws", region: "us-west-2", credentialSource: "aws-sdk-default" } },
      backends: {}
    }));

    await expect(loadAgentDispatchConfig(configPath)).resolves.toMatchObject({
      accounts: { "dev-aws": { provider: "aws" } }
    });
  });

  it("constructs runtime with injected mock adapters", async () => {
    stateDir = await mkdtemp(join(tmpdir(), "agentdispatch-mcp-"));
    const adapter: BackendAdapter = {
      name: "mock",
      provider: "aws",
      capabilities: () => [{ provider: "aws", capability: "agent-runtime", taskTypes: ["agent.run"], targetModes: ["session"] }],
      resolveTarget: async (request) => ({
        account: { name: request.accountProfile, provider: request.provider, credentialSource: "test" },
        target: { provider: request.provider, accountProfile: request.accountProfile, capability: request.capability, backend: "mock", mode: request.target.mode }
      }),
      provision: async () => ({}),
      startTask: async () => ({ result: { ok: true } }),
      streamEvents: async function* () {},
      cancel: async () => ({ status: "cancelled" }),
      cleanup: async () => ({ status: "skipped" })
    };

    const runtime = await createRuntimeServiceFromConfig({
      stateDir,
      accounts: { "dev-aws": { provider: "aws", region: "us-west-2", credentialSource: "aws-sdk-default" } },
      backends: {}
    }, { adapters: [adapter] });

    expect(runtime.listProviders()).toEqual(["aws"]);
  });
});
