# @agent-dispatch/mcp-server

<h3 align="center">Spawn cloud agents from your AI.</h3>

<p align="center">
  Claude Code, Codex, OpenClaw, and Hermes are great at planning. They choke when a job runs for hours.<br/>
  <code>@agent-dispatch/mcp-server</code> hands them a managed cloud runtime — one MCP call, durable status, results when they land.
</p>

<p align="center">
  <a href="#quick-start"><strong>Quick start</strong></a> ·
  <a href="#what-it-does">What it does</a> ·
  <a href="#supported-clients-and-frameworks">Clients & frameworks</a> ·
  <a href="#configuration">Config</a> ·
  <a href="https://github.com/agent-dispatch">The rest of AgentDispatch</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@agent-dispatch/mcp-server"><img alt="npm" src="https://img.shields.io/npm/v/@agent-dispatch/mcp-server?color=7C3AED&label=npm&style=flat-square"></a>
  <img alt="MCP" src="https://img.shields.io/badge/MCP-1.x-06B6D4?style=flat-square">
  <img alt="AWS Bedrock AgentCore" src="https://img.shields.io/badge/AWS-Bedrock%20AgentCore-FF9900?style=flat-square">
  <img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-0EA5E9?style=flat-square">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square">
</p>

---

## Why this exists

Local AI assistants plan brilliantly. They get cramped the moment work gets long:

- A **deep-research** sweep across fifty pages of docs.
- An **account-wide audit** that has to touch every service.
- A **multi-hour** job that has no business sitting in your IDE's context window.

Doing it inline burns context, blocks the chat, and dies the second you close the laptop. That's not what local agents are for.

**AgentDispatch is the missing tool.** One MCP server gives your assistant a single primitive: *spawn a cloud agent with this instruction, come back later for the result.* The work runs on managed cloud compute. Status, logs, and the final output flow back through the same MCP channel.

- ☁️ **Real cloud, not your laptop.** AWS Bedrock AgentCore today; new clouds plug in through one small adapter contract.
- ⏱️ **Built for marathons.** Sessions for stateful runs. Runtime mode for provisioned per-task resources. Same MCP contract.
- 🔭 **Full visibility.** Status, paginated logs, results, cancellation — over MCP, the SDK, or the CLI.
- 🪶 **Boring defaults.** SQLite state. stdio transport. Zero hidden services. Runs on a laptop, in CI, or on a server.

## What it does

A single MCP server exposes nine tools to your assistant:

| Tool | What it does |
| --- | --- |
| `spawn_cloud_agent` | The shortcut. One `instruction`, defaults from a runtime profile, returns a durable `task_id` and optional `cloud_agent` metadata. |
| `dispatch_task` | The escape hatch. Full control over provider, capability, backend, target, and input. |
| `get_task_status` | Current status for a dispatched task. |
| `get_task_logs` | Paginated logs, cursor-based. |
| `get_task_result` | Final result payload when the task completes. |
| `cancel_task` | Cancel an in-flight task. |
| `list_providers` | Providers configured in this server. |
| `list_capabilities` | Capabilities a provider exposes, filterable by provider. |
| `list_account_profiles` | Account profiles configured for dispatch. |

The model side looks like this:

```ts
spawn_cloud_agent({ instruction: "Audit our S3 buckets for public read and report findings." })
// → { task_id: "task_...", status: "running", cloud_agent: { ... } }

get_task_status({ task_id: "task_..." })
get_task_logs({ task_id: "task_...", cursor: 0, limit: 200 })
get_task_result({ task_id: "task_..." })
```

All tool inputs are validated with [Zod](https://zod.dev). See [`src/schemas.ts`](src/schemas.ts) for the exact shapes.

## Agent-facing contract

`spawn_cloud_agent` is intentionally small. Runtime profiles supply the provider, account, backend, target mode, framework, model, protocol, and default tools.

```json
{
  "runtime": "research-agent",
  "instruction": "Run the background research task and report progress.",
  "protocol": "a2a",
  "context": {
    "repo": "agent-dispatch",
    "priority": "background"
  }
}
```

Immediate response:

```json
{
  "task_id": "task_...",
  "status": "running",
  "provider": "aws",
  "account_profile": "dev-aws",
  "capability": "agent-runtime",
  "backend": "aws-agentcore",
  "poll": {
    "status_tool": "get_task_status",
    "logs_tool": "get_task_logs",
    "result_tool": "get_task_result"
  },
  "cloud_agent": {
    "protocol": "a2a",
    "provider": "aws",
    "runtime_session_id": "agentdispatch-...",
    "protocol_hints": {
      "transport": "aws-agentcore-runtime",
      "message_method": "message/send"
    }
  }
}
```

If the agent does not provide enough information, the server returns a structured clarification instead of failing late:

```json
{
  "status": "needs_clarification",
  "missing": ["instruction", "runtimeArn"],
  "questions": [
    { "id": "instruction", "question": "What task should the cloud subagent run?" },
    { "id": "runtimeArn", "question": "Which AWS AgentCore runtime ARN should this cloud subagent use?" }
  ]
}
```

## Supported clients and frameworks

Anything that speaks MCP works. The common clients today:

- **Claude Code** — add it to `~/.claude/mcp_settings.json` or your project's MCP config.
- **Codex** — add this server as a local MCP server for cloud handoff tasks.
- **OpenClaw** — call `spawn_cloud_agent` from inside any task that should leave the local runtime.
- **Hermes** — move long-running reasoning and tool-rich runs to managed cloud infrastructure.
- Claude Desktop, Cursor, Continue, Goose, Zed — same JSON, different config file.

`spawn_cloud_agent` and `dispatch_task` both accept an optional `framework` string, and runtime profiles carry a default. AgentDispatch does not interpret the value; the worker does. That means OpenClaw-style, Hermes-style, Strands, LangChain, or custom workers can all fit the same MCP contract as soon as your cloud worker knows how to handle the framework.

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
{
  "mcpServers": {
    "agentdispatch": {
      "command": "npx",
      "args": ["agentdispatch-mcp", "--config", "/abs/path/agentdispatch.config.json"]
    }
  }
}
```

The defaults come from your runtime profile. From the model side, `spawn_cloud_agent({ instruction })` is the only call required for the common path.

## How it works

```text
   Claude Code · Codex · OpenClaw · Hermes · any MCP client
                          │ stdio
                          ▼
   ┌─────────────────────────────────────────────┐
   │       @agent-dispatch/mcp-server            │   ← this repo
   └─────────────────────┬───────────────────────┘
                         │
                         ▼
   ┌─────────────────────────────────────────────┐
   │           @agent-dispatch/core              │   ← contracts + dispatch
   └──────┬──────────┬───────────────────────────┘
          │          │
          ▼          ▼
   ┌──────────┐  ┌──────────────────────────────────┐
   │  store   │  │  adapter (AWS Bedrock AgentCore) │
   │ (sqlite) │  │      ↓                           │
   └──────────┘  │  cloud worker — runs the task    │
                 └──────────────────────────────────┘
```

1. Local assistant issues `spawn_cloud_agent` over MCP.
2. MCP server validates input, hydrates defaults from a runtime profile, calls the core runtime.
3. Core picks the capability and adapter, persists the task, dispatches.
4. Adapter invokes the worker in your cloud.
5. Worker runs an agent framework on managed cloud infrastructure.
6. Status, logs, results, and optional `cloud_agent` metadata flow back through the same path.

## Configuration

Minimal AWS Bedrock AgentCore session-mode config:

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
    "agentcore-dev": {
      "adapter": "aws-agentcore",
      "account": "dev-aws",
      "details": {
        "region": "us-west-2",
        "runtimeArn": "arn:aws:bedrock-agentcore:us-west-2:123456789012:runtime/my-runtime",
        "protocol": "a2a"
      }
    }
  },
  "runtimes": {
    "research-agent": {
      "provider": "aws",
      "account": "dev-aws",
      "capability": "agent-runtime",
      "backend": "agentcore-dev",
      "target": { "mode": "session" },
      "protocol": "a2a",
      "framework": "strands",
      "runtimeTools": { "enabled": ["web-search", "code-interpreter"] }
    }
  },
  "defaults": {
    "runtime": "research-agent"
  }
}
```

Once `defaults.runtime` is set, `spawn_cloud_agent` only needs an `instruction`. The `framework`, `model`, `runtimeTools`, and `protocol` values are passed through to the worker.

Validate before connecting an MCP client:

```bash
npx agentdispatch-mcp --config agentdispatch.config.json --check
```

## Interaction model

`spawn_cloud_agent` is the control-plane call. After spawn, the lead agent can:

- Poll via `get_task_status`, `get_task_logs`, and `get_task_result`.
- Continue native subagent interaction with returned `cloud_agent` protocol metadata.
- Use A2A JSON-RPC `message/send` when the runtime protocol is `a2a`.
- Cancel through AgentDispatch so provider references remain durable.

## Real-world use cases

- **Deep research from chat.** Codex or Claude Code spawns a cloud agent: "Read the last 90 days of CloudTrail anomalies and propose detection rules."
- **Parallel codebase audits.** A lead agent fans out a dozen `spawn_cloud_agent` calls, one per service, then aggregates reports.
- **Long-running OpenClaw runs.** OpenClaw plans locally, then dispatches multi-hour execution to a managed AgentCore worker.
- **Tool-rich Hermes jobs.** Hermes uses cloud-side tools that are not available to the local process.

## The rest of AgentDispatch

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

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Contributing

PRs, issues, and adapter contributions are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the local workflow.

If you ship a new framework worker or a new cloud adapter, open a discussion so it can be linked from the org README.

## License

Apache-2.0. See [`LICENSE`](LICENSE).

<p align="center">
  <sub>Built by the AgentDispatch contributors · <a href="https://github.com/agent-dispatch">github.com/agent-dispatch</a></sub>
</p>
