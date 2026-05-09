#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRuntimeServiceFromConfigFile } from "./bootstrap.js";
import { createAgentDispatchMcpServer } from "./index.js";

const configPath = process.argv.includes("--config")
  ? process.argv[process.argv.indexOf("--config") + 1]
  : undefined;

const transport = new StdioServerTransport();
const runtime = await createRuntimeServiceFromConfigFile({ configPath });
const server = createAgentDispatchMcpServer(runtime);
await server.connect(transport);
