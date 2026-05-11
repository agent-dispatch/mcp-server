# @agent-dispatch/mcp-server

MCP server exposing provider-neutral AgentDispatch tools.

Tools:

- `list_providers`
- `list_capabilities`
- `list_account_profiles`
- `spawn_cloud_agent`
- `dispatch_task`
- `get_task_status`
- `get_task_logs`
- `get_task_result`
- `cancel_task`

## Running

```bash
agentdispatch-mcp --config agentdispatch.config.json
```

The server loads account profiles, SQLite storage, and configured adapters from `agentdispatch.config.json`.

Configure `defaults.runtime` for the simple agent path. Agents can then call `spawn_cloud_agent` with only an `instruction`; AgentDispatch resolves provider, account, backend, target mode, framework, and runtime tool defaults from the named runtime profile.
