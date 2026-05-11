<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/wordmark-dark.svg">
    <img src="brand/wordmark.svg" alt="AgentDispatch" width="560">
  </picture>
</p>

<h3 align="center">Give your AI assistant a fleet of cloud agents.</h3>

<p align="center">
  <code>@agent-dispatch/mcp-server</code> exposes provider-neutral agent orchestration to any MCP client — so Claude, Cursor, and Claude Code can spawn and supervise long-running cloud agents with a single tool call.
</p>

<p align="center">
  <a href="#quick-start"><strong>Quick start</strong></a> ·
  <a href="#tools">Tools</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#configuration">Config</a> ·
  <a href="https://github.com/agent-dispatch">The rest of AgentDispatch</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@agent-dispatch/mcp-server"><img alt="npm" src="https://img.shields.io/npm/v/@agent-dispatch/mcp-server?color=7C3AED&label=npm&style=flat-square"></a>
  <img alt="MCP" src="https://img.shields.io/badge/MCP-1.x-06B6D4?style=flat-square">
  <img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-0EA5E9?style=flat-square">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square">
</p>

---

## Why this exists

Modern AI assistants are great at planning work. They're not great at *running* it — long-running, sandboxed, multi-step jobs need real cloud infrastructure.

**AgentDispatch closes that loop.** This MCP server turns any compliant client into a control plane for cloud agents:

- 🧠 **One tool, every cloud.** Today: AWS Bedrock AgentCore. Tomorrow: anything that implements the adapter contract.
- ⚡ **Spawn in one line.** `spawn_cloud_agent({ instruction: "..." })` and you're off — sane defaults from your runtime profile.
- 🔭 **Full lifecycle.** Status, logs, results, cancel — all over MCP.
- 🧩 **Provider-neutral by design.** Built on [`@agent-dispatch/core`](https://github.com/agent-dispatch/core)'s capability + adapter model.
- 🪶 **Lightweight.** stdio transport, SQLite state, zero hidden services.

## Quick start

```bash
npm install \
  @agent-dispatch/core \
  @agent-dispatch/mcp-server \
  @agent-dispatch/store-sqlite \
  @agent-dispatch/adapter-aws-agentcore

npx agentdispatch-mcp --config agentdispatch.config.json --check
```

Wire it into your MCP client:

```jsonc
// Claude Desktop, Cursor, Claude Code — same shape
{
  "mcpServers": {
    "agentdispatch": {
      "command": "npx",
      "args": ["agentdispatch-mcp", "--config", "/abs/path/agentdispatch.config.json"]
    }
  }
}
```

Then, from the model side:

```ts
spawn_cloud_agent({ instruction: "Audit our S3 buckets for public read and report findings." })
// → { task_id: "task_...", status: "running" }

get_task_status({ task_id: "task_..." })
get_task_logs({ task_id: "task_...", cursor: 0 })
get_task_result({ task_id: "task_..." })
```

The defaults come from your runtime profile — provider, account, backend, target mode, framework, and runtime tools are all resolved for you.

## Tools

| Tool | What it does |
| --- | --- |
| `spawn_cloud_agent` | The shortcut. One `instruction`, defaults from a runtime profile, returns a `task_id`. |
| `dispatch_task` | The escape hatch. Full control over provider, capability, backend, target, and input. |
| `get_task_status` | Current status for a dispatched task. |
| `get_task_logs` | Paginated logs, cursor-based. |
| `get_task_result` | Final result payload when the task completes. |
| `cancel_task` | Cancel an in-flight task. |
| `list_providers` | Providers configured in this server. |
| `list_capabilities` | Capabilities a provider exposes (filterable). |
| `list_account_profiles` | Account profiles configured for dispatch. |

All tool inputs are validated with [Zod](https://zod.dev). See [`src/schemas.ts`](src/schemas.ts) for the exact shapes.

## How it works

```
   MCP client (Claude, Cursor, Claude Code)
                 │  stdio
                 ▼
   ┌─────────────────────────────┐
   │  @agent-dispatch/mcp-server │   ← this repo
   └──────────────┬──────────────┘
                  │
                  ▼
   ┌─────────────────────────────┐
   │     @agent-dispatch/core    │   ← runtime contracts + dispatch
   └──────┬──────────┬───────────┘
          │          │
          ▼          ▼
   ┌──────────┐  ┌────────────────────────────┐
   │  store   │  │  adapter (e.g. AWS         │
   │ (sqlite) │  │  AgentCore) → worker       │
   └──────────┘  └────────────────────────────┘
```

1. **Caller** issues a tool call over MCP.
2. **MCP server** validates input, hydrates defaults from a runtime profile, and calls the core runtime.
3. **Core** picks the right capability + adapter, persists the task, dispatches.
4. **Adapter** invokes the worker on the target cloud (synchronous, session, or job).
5. Status, logs, and results flow back the same way.

## Configuration

Minimal AWS Bedrock AgentCore (session mode):

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

Once `defaults.runtime` is set, `spawn_cloud_agent` only needs an `instruction`. Everything else is resolved from the named runtime profile.

Validate the wiring before connecting an MCP client:

```bash
npx agentdispatch-mcp --config agentdispatch.config.json --check
```

## Real-world use cases

- **Background research from chat.** Tell Claude "go investigate X, come back when you have findings" — the model spawns a session-mode agent, polls status, returns the result inline.
- **Parallel codebase audits.** Claude Code fans out a dozen `spawn_cloud_agent` calls, one per service, and aggregates the reports.
- **Long-running data jobs.** Job-mode tasks run for minutes-to-hours without holding the assistant's context open.
- **Tool-using cloud agents.** Compose runtime tools (web search, code interpreter, etc.) into a single runtime profile and reuse from anywhere.

## The rest of AgentDispatch

This MCP server is one face of a small, focused stack:

| Repo | Role |
| --- | --- |
| [`core`](https://github.com/agent-dispatch/core) | Runtime contracts and dispatch orchestration |
| [`mcp-server`](https://github.com/agent-dispatch/mcp-server) | **You are here.** MCP face for the runtime |
| [`sdk-js`](https://github.com/agent-dispatch/sdk-js) | TypeScript SDK for application code |
| [`cli`](https://github.com/agent-dispatch/cli) | Command-line interface |
| [`store-sqlite`](https://github.com/agent-dispatch/store-sqlite) | SQLite + filesystem state store |
| [`adapter-aws-agentcore`](https://github.com/agent-dispatch/adapter-aws-agentcore) | AWS Bedrock AgentCore adapter |
| [`worker-agentcore`](https://github.com/agent-dispatch/worker-agentcore) | Standard AgentCore worker contract |
| [`adapter-template`](https://github.com/agent-dispatch/adapter-template) | Starter for new cloud adapters |
| [`docs`](https://github.com/agent-dispatch/docs) | Documentation |

## Contributing

PRs, issues, and adapter contributions are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the local workflow.

If you ship a new adapter, please open a discussion — we'd love to link it from the org README.

## License

Apache-2.0. See [`LICENSE`](LICENSE).

<p align="center">
  <sub>Built by the AgentDispatch contributors · <a href="https://github.com/agent-dispatch">github.com/agent-dispatch</a></sub>
</p>
