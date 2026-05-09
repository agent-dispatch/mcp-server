# @agentdispatch/mcp-server

MCP server exposing provider-neutral AgentDispatch tools.

Tools:

- `list_providers`
- `list_capabilities`
- `list_account_profiles`
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
