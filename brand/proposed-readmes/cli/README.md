<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark-dark.svg">
    <img src="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark.svg" alt="AgentDispatch" width="520">
  </picture>
</p>

<h3 align="center">The AgentDispatch command line.</h3>

<p align="center">
  Spawn, inspect, and cancel cloud agents from your terminal — same runtime, same profiles as the SDK and MCP server.
</p>

---

## Install

```bash
npm install -g @agent-dispatch/cli
# or one-shot
npx @agent-dispatch/cli --help
```

## Common commands

```bash
# Validate config
agentdispatch check --config agentdispatch.config.json

# Spawn an agent with the default runtime profile
agentdispatch spawn "Summarize the latest release notes from our changelog."

# Same, with an explicit runtime profile
agentdispatch spawn --runtime research-agent "Investigate this anomaly"

# Lifecycle
agentdispatch status <task-id>
agentdispatch logs   <task-id> --follow
agentdispatch result <task-id>
agentdispatch cancel <task-id>

# Introspection
agentdispatch providers
agentdispatch capabilities --provider aws
agentdispatch accounts
```

## Output

All commands support `--json` for machine-readable output. Otherwise the CLI prints a compact, syntax-highlighted view.

## See also

- [`@agent-dispatch/sdk`](https://github.com/agent-dispatch/sdk-js) — same operations, from code
- [`@agent-dispatch/mcp-server`](https://github.com/agent-dispatch/mcp-server) — same operations, from an MCP client

## License

Apache-2.0.
