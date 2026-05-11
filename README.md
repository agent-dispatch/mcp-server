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
npm install @agent-dispatch/core @agent-dispatch/mcp-server @agent-dispatch/store-sqlite @agent-dispatch/adapter-aws-agentcore
npx agentdispatch-mcp --config agentdispatch.config.json
```

The server loads account profiles, SQLite storage, and configured adapters from `agentdispatch.config.json`.

Configure `defaults.runtime` for the simple agent path. Agents can then call `spawn_cloud_agent` with only an `instruction`; AgentDispatch resolves provider, account, backend, target mode, framework, and runtime tool defaults from the named runtime profile.

Minimal AWS AgentCore session-mode config:

```json
{
  "stateDir": ".agentdispatch",
  "accounts": {
    "dev-aws": {
      "provider": "aws",
      "region": "us-west-2",
      "credentialSource": "aws-sdk-default"
    }
  },
  "backends": {
    "aws-agentcore": {
      "provider": "aws",
      "capability": "agent-runtime",
      "adapter": "aws-agentcore",
      "account": "dev-aws",
      "details": {
        "runtimeArn": "arn:aws:bedrock-agentcore:us-west-2:123456789012:agent/00000000-0000-0000-0000-000000000000:1",
        "qualifier": "DEFAULT"
      }
    }
  },
  "runtimes": {
    "research-agent": {
      "provider": "aws",
      "account": "dev-aws",
      "capability": "agent-runtime",
      "backend": "aws-agentcore",
      "target": { "mode": "session" },
      "framework": "strands",
      "runtimeTools": { "enabled": ["web-search"] }
    }
  },
  "defaults": {
    "runtime": "research-agent"
  }
}
```
