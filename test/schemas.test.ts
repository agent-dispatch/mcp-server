import { describe, expect, it } from "vitest";
import { dispatchTaskInputSchema, getTaskLogsInputSchema, mcpToolSchemas, spawnCloudAgentInputSchema } from "../src/index.js";

describe("MCP schemas", () => {
  it("keeps dispatch_task provider-neutral", () => {
    const parsed = dispatchTaskInputSchema.parse({
      provider: "gcp",
      account_profile: "prod-gcp",
      capability: "service-deploy",
      task_type: "service.deploy",
      target: { mode: "managed-service" },
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
      runtime_tools: { enabled: ["web-search"] }
    });

    expect(parsed).toMatchObject({
      runtime: "research-agent",
      instruction: "Run this in the cloud",
      context: { repo: "agent-dispatch" },
      runtime_tools: { enabled: ["web-search"] }
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
