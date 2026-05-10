import { describe, expect, it } from "vitest";
import { createAgentDispatchMcpServer } from "../src/index.js";

describe("MCP server", () => {
  it("can be constructed around a runtime service", () => {
    const runtime = {
      listProviders: () => ["aws"],
      listCapabilities: () => [{ provider: "aws", capability: "agent-runtime", taskTypes: ["agent.run"], targetModes: ["session"] }],
      listAccountProfiles: () => [{ name: "dev-aws", provider: "aws", credentialSource: "aws-sdk-default" }],
      dispatchTask: async () => ({}),
      getTaskStatus: async () => ({}),
      getTaskLogs: async () => ({}),
      getTaskResult: async () => ({}),
      cancelTask: async () => ({})
    } as any;

    expect(createAgentDispatchMcpServer(runtime)).toBeTruthy();
  });
});
