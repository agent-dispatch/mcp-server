import { describe, expect, it } from "vitest";
import { createAgentDispatchMcpServer } from "../src/index.js";

describe("MCP server", () => {
  it("can be constructed around a runtime service", () => {
    const runtime = {
      listProviders: () => ["aws"],
      listCapabilities: () => [],
      listAccountProfiles: () => [],
      dispatchTask: async () => ({}),
      getTaskStatus: async () => ({}),
      getTaskLogs: async () => ({}),
      getTaskResult: async () => ({}),
      cancelTask: async () => ({})
    } as any;

    expect(createAgentDispatchMcpServer(runtime)).toBeTruthy();
  });
});
