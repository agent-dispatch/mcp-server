import { describe, expect, it } from "vitest";
import { dispatchTaskInputSchema, getTaskLogsInputSchema, mcpToolSchemas, spawnCloudAgentInputSchema } from "../src/index.js";

describe("MCP schemas", () => {
  it("keeps dispatch_task provider-neutral", () => {
    const parsed = dispatchTaskInputSchema.parse({
      provider: "gcp",
      account_profile: "prod-gcp",
      capability: "service-deploy",
      task_type: "service.deploy",
      target: { mode: "managed-service", protocol: "http" },
      input: { image: "gcr.io/project/service:latest", service_name: "api" }
    });

    expect(parsed).toMatchObject({
      provider: "gcp",
      account_profile: "prod-gcp",
      capability: "service-deploy",
      task_type: "service.deploy"
    });
  });

  it("exports stable MCP tool schemas", () => {
    expect(Object.keys(mcpToolSchemas).sort()).toEqual([
      "cancel_task",
      "dispatch_task",
      "get_task_logs",
      "get_task_result",
      "get_task_status",
      "list_account_profiles",
      "list_capabilities",
      "list_providers",
      "spawn_cloud_agent"
    ]);
  });

  it("keeps spawn_cloud_agent simple for agents", () => {
    const parsed = spawnCloudAgentInputSchema.parse({
      runtime: "research-agent",
      instruction: "Run this in the cloud",
      context: { repo: "agent-dispatch" },
      protocol: "a2a",
      model: { provider: "bedrock", modelId: "anthropic.claude-3-5-sonnet" },
      runtime_tools: { enabled: ["web-search"] }
    });

    expect(parsed).toMatchObject({
      runtime: "research-agent",
      instruction: "Run this in the cloud",
      context: { repo: "agent-dispatch" },
      protocol: "a2a",
      model: { provider: "bedrock", modelId: "anthropic.claude-3-5-sonnet" },
      runtime_tools: { enabled: ["web-search"] }
    });
  });

  it("accepts direct clarification answer fields", () => {
    expect(spawnCloudAgentInputSchema.parse({
      instruction: "run",
      runtimeArn: "arn:aws:bedrock-agentcore:us-west-2:123456789012:agent/11111111-1111-1111-1111-111111111111:1",
      ecrImageUri: "123456789012.dkr.ecr.us-west-2.amazonaws.com/agentdispatch-worker:latest",
      executionRoleArn: "arn:aws:iam::123456789012:role/AgentDispatchAgentCoreExecutionRole",
      environmentVariables: { AGENTDISPATCH_AGENT_FRAMEWORK: "openclaw" }
    })).toMatchObject({
      runtimeArn: expect.stringContaining("agent/11111111"),
      ecrImageUri: expect.stringContaining("agentdispatch-worker"),
      executionRoleArn: expect.stringContaining("AgentDispatchAgentCoreExecutionRole"),
      environmentVariables: { AGENTDISPATCH_AGENT_FRAMEWORK: "openclaw" }
    });
  });

  it("constrains get_task_logs cursor and limit", () => {
    expect(getTaskLogsInputSchema.parse({ task_id: "task_1", cursor: 0, limit: 64_000 })).toMatchObject({
      task_id: "task_1",
      cursor: 0,
      limit: 64_000
    });
    expect(() => getTaskLogsInputSchema.parse({ task_id: "task_1", cursor: -1 })).toThrow();
    expect(() => getTaskLogsInputSchema.parse({ task_id: "task_1", cursor: 1.5 })).toThrow();
    expect(() => getTaskLogsInputSchema.parse({ task_id: "task_1", limit: 0 })).toThrow();
    expect(() => getTaskLogsInputSchema.parse({ task_id: "task_1", limit: 64_001 })).toThrow();
  });
});
