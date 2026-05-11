<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/wordmark-dark.svg">
    <img src="brand/wordmark.svg" alt="AgentDispatch" width="580">
  </picture>
</p>

<h3 align="center">Spawn cloud agents from your AI.</h3>

<p align="center">
  Claude Code, OpenClaw, and Hermes are great at planning. They choke when a job runs for hours.<br/>
  <code>@agent-dispatch/mcp-server</code> hands them a managed cloud runtime — one MCP call, results when they land.
</p>

<p align="center">
  <a href="#quick-start"><strong>Quick start</strong></a> ·
  <a href="#what-it-does">What it does</a> ·
  <a href="#supported-clients-and-frameworks">Supported clients & frameworks</a> ·
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

**AgentDispatch is the missing tool.** One MCP server gives your assistant a single primitive: *spawn a cloud agent with this instruction, come back later for the result.* The work runs on managed cloud compute. Status, logs, and the final output stream back through the same MCP channel.

- ☁️ **Real cloud, not your laptop.** AWS Bedrock AgentCore today; new clouds plug in through one small adapter contract.
- ⏱️ **Built for marathons.** Sessions for stateful runs. Jobs for hours-long work. Sync for fast turn-around. Same API, three modes.
- 🔭 **Full visibility.** Status, paginated logs, results, cancellation — over MCP, the SDK, or the CLI.
- 🪶 **Boring defaults.** SQLite state. stdio transport. Zero hidden services. Runs on a laptop, in CI, on a server.

## What it does

A single MCP server exposes nine tools to your assistant:

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

The model side looks like this:

```ts
spawn_cloud_agent({ instruction: "Audit our S3 buckets for public read and report findings." })
// → { task_id: "task_...", status: "running" }

get_task_status({ task_id: "task_..." })
get_task_logs({ task_id: "task_...", cursor: 0 })
get_task_result({ task_id: "task_..." })
```

All tool inputs are validated with [Zod](https://zod.dev). See [`src/schemas.ts`](src/schemas.ts) for the exact shapes.

## Supported clients

Anything that speaks MCP. The common ones today:

- 🤖 **Claude Code** — add it to `~/.claude/mcp_settings.json` (or your project's `.mcp.json`).
- 🦅 **OpenClaw** — add it to your MCP server list and call `spawn_cloud_agent` from inside any task.
- 🪽 **Hermes** — same wire-up; long-running reasoning and tool-rich runs move to the cloud.
- Claude Desktop, Cursor, Continue, Goose, Zed — same JSON, different config file.

## What the cloud agent runs

`spawn_cloud_agent` and `dispatch_task` both accept an optional `framework` string, and runtime profiles carry a default. The value travels through to the worker — **AgentDispatch doesn't interpret it; the worker does.** That means you can wire any agent framework that your worker knows how to instantiate.

Today the reference worker in [`worker-agentcore`](https://github.com/agent-dispatch/worker-agentcore) ships with **Strands** support. Other frameworks (your own agent loop, an OpenClaw-style runner, a Hermes-style long-context worker) become available the moment your worker handles their `framework` value. There's no allow-list in AgentDispatch itself.

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
// Claude Code, Claude Desktop, OpenClaw, Hermes, Cursor — same shape
{
  "mcpServers": {
    "agentdispatch": {
      "command": "npx",
      "args": ["agentdispatch-mcp", "--config", "/abs/path/agentdispatch.config.json"]
    }
  }
}
```

The defaults come from your runtime profile — provider, account, backend, target mode, framework, and runtime tools are all resolved for you. From the model side, `spawn_cloud_agent({ instruction })` is the only call you need.

## How it works

```
   Claude Code   ·   OpenClaw   ·   Hermes   ·   any MCP client
                          │  stdio
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

1. **Local assistant** issues `spawn_cloud_agent` over MCP.
2. **MCP server** validates input, hydrates defaults from a runtime profile, calls the core runtime.
3. **Core** picks the right capability + adapter, persists the task, dispatches.
4. **Adapter** invokes the worker in your cloud — synchronous, session, or job target mode.
5. **Worker** runs an agent framework on managed cloud infrastructure. The reference worker in [`worker-agentcore`](https://github.com/agent-dispatch/worker-agentcore) ships with Strands; add support for any other framework by handling its `framework` string.
6. Status, logs, and results flow back through the same path.

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
      "runtimeTools": { "enabled": ["web-search", "code-interpreter"] }
    }
  },
  "defaults": {
    "runtime": "research-agent"
  }
}
```

Once `defaults.runtime` is set, `spawn_cloud_agent` only needs an `instruction`. The `framework` value is passed straight through to the worker — change it to any string your worker recognises.

Validate the wiring before connecting an MCP client:

```bash
npx agentdispatch-mcp --config agentdispatch.config.json --check
```

## Real-world use cases

- **Deep research from chat.** Claude Code spawns a cloud agent: "Read the last 90 days of CloudTrail anomalies and propose detection rules." The session keeps going. Twenty minutes later it pulls the result.
- **Parallel codebase audits.** Claude Code fans out a dozen `spawn_cloud_agent` calls, one per service, and aggregates the reports.
- **Long-running OpenClaw runs.** OpenClaw plans the work locally, dispatches the multi-hour execution to a managed AgentCore worker.
- **Tool-rich Hermes jobs.** Hermes uses cloud-side tools (web, code interpreter, repo access) that aren't available to the local process.

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

If you ship a new framework worker (or a new cloud adapter), please open a discussion — we'd love to link it from the org README.

## License

Apache-2.0. See [`LICENSE`](LICENSE).

<p align="center">
  <sub>Built by the AgentDispatch contributors · <a href="https://github.com/agent-dispatch">github.com/agent-dispatch</a></sub>
</p>
