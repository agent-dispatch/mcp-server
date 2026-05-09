#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

console.error("agentdispatch-mcp requires an application bootstrap that wires a RuntimeService, store, and adapters.");
console.error("Import createAgentDispatchMcpServer from @agentdispatch/mcp-server in your host process.");

const transport = new StdioServerTransport();
void transport.close?.();
