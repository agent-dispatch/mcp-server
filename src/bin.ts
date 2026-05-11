#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRuntimeCheckReport, createRuntimeServiceFromConfigFile } from "./bootstrap.js";
import { createAgentDispatchMcpServer } from "./index.js";

const configPath = process.argv.includes("--config")
  ? process.argv[process.argv.indexOf("--config") + 1]
  : undefined;
const checkOnly = process.argv.includes("--check");

const runtime = await createRuntimeServiceFromConfigFile({ configPath });
if (checkOnly) {
  process.stdout.write(`${JSON.stringify(createRuntimeCheckReport(runtime), null, 2)}\n`);
  process.exit(0);
}

const transport = new StdioServerTransport();
const server = createAgentDispatchMcpServer(runtime);
await server.connect(transport);
