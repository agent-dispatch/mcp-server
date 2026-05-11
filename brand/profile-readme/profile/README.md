<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/wordmark-dark.svg">
    <img src="./assets/wordmark.svg" alt="AgentDispatch" width="580">
  </picture>
</p>

<h3 align="center">Spawn cloud agents from your AI.</h3>

<p align="center">
  Claude Code, OpenClaw, and Hermes plan brilliantly — and choke on multi-hour work.<br/>
  AgentDispatch hands them a managed cloud runtime: one MCP call, results when they land.
</p>

<p align="center">
  <a href="https://github.com/agent-dispatch/mcp-server"><strong>MCP server</strong></a> ·
  <a href="https://github.com/agent-dispatch/sdk-js">SDK</a> ·
  <a href="https://github.com/agent-dispatch/cli">CLI</a> ·
  <a href="https://github.com/agent-dispatch/core">Core</a> ·
  <a href="https://github.com/agent-dispatch/docs">Docs</a>
</p>

---

## The problem

Local AI assistants — Claude Code, OpenClaw, Hermes — plan brilliantly. They get cramped the moment work gets long. A deep-research sweep, an account-wide audit, a multi-hour reasoning job: none of it belongs in a laptop's context window.

## The fix

AgentDispatch is the one tool your local agent is missing: **spawn a cloud agent with this instruction, come back later for the result.** The run happens on managed cloud compute. Status, logs, and final output stream back over MCP.

```
spawn_cloud_agent({ instruction: "Audit every Lambda for public invoke." })
// → task_id, then status / logs / result on demand
```

- ☁️ **Real cloud, not your laptop.** AWS Bedrock AgentCore today; bring your own cloud tomorrow.
- ⏱️ **Built for marathons.** Sync, session, or job mode — same API.
- 🔭 **Full visibility.** Status, logs, results, cancellation.
- 🪶 **Boring defaults.** SQLite, stdio, no hidden services.

## Made for the agents you already use

| Local assistant | What it gets |
| --- | --- |
| 🤖 **Claude Code** | A cloud companion for parallel audits, long refactors, and deep-research sweeps. |
| 🦅 **OpenClaw** | Offloads multi-step research and tool-rich runs to a managed cloud worker. |
| 🪽 **Hermes** | Runs long-context reasoning and hours-long jobs without leaving the chat. |
| Claude Desktop · Cursor · Continue · Goose · Zed | Same MCP config, same primitive. |

## Three faces, one runtime

- **MCP server** — for AI assistants ([`mcp-server`](https://github.com/agent-dispatch/mcp-server)).
- **TypeScript SDK** — for your own application code ([`sdk-js`](https://github.com/agent-dispatch/sdk-js)).
- **CLI** — for operators and scripts ([`cli`](https://github.com/agent-dispatch/cli)).

All three call into the same dispatcher and share the same runtime profiles.

## How it fits together

```
   Claude Code   ·   OpenClaw   ·   Hermes
                      │  MCP
                      ▼
            ┌───────────────────┐
            │   AgentDispatch   │   ← spawn / status / logs / result / cancel
            └─────────┬─────────┘
                      │
                      ▼
            ┌───────────────────┐
            │   cloud adapter   │   (AWS Bedrock AgentCore today)
            └─────────┬─────────┘
                      ▼
            ┌───────────────────┐
            │   cloud worker    │   runs Strands today · your framework next
            └───────────────────┘
```

The adapter contract is small and stable, so a new cloud (or a new framework) is a focused, well-scoped addition — not a rewrite.

## Repositories

| Repo | What it is |
| --- | --- |
| [`mcp-server`](https://github.com/agent-dispatch/mcp-server) | **Start here.** MCP face for the runtime — the viral entry point. |
| [`core`](https://github.com/agent-dispatch/core) | Runtime contracts and dispatch orchestration. The heart. |
| [`sdk-js`](https://github.com/agent-dispatch/sdk-js) | TypeScript SDK for application code. |
| [`cli`](https://github.com/agent-dispatch/cli) | Command-line interface for operators. |
| [`store-sqlite`](https://github.com/agent-dispatch/store-sqlite) | Default SQLite + filesystem state store. |
| [`adapter-aws-agentcore`](https://github.com/agent-dispatch/adapter-aws-agentcore) | AWS Bedrock AgentCore adapter. |
| [`worker-agentcore`](https://github.com/agent-dispatch/worker-agentcore) | Standard AgentCore worker contract. Reference Strands worker lives here; add your own framework by handling its `framework` string. |
| [`adapter-template`](https://github.com/agent-dispatch/adapter-template) | Starter for new cloud adapters. |
| [`docs`](https://github.com/agent-dispatch/docs) | Documentation and guides. |

## Build a new worker or adapter

A new **framework worker** is a function that maps `{ instruction, context, framework, runtime_tools }` to a result envelope — see [`worker-agentcore`](https://github.com/agent-dispatch/worker-agentcore).

A new **cloud adapter** implements five methods (dispatch, status, logs, result, cancel) — fork [`adapter-template`](https://github.com/agent-dispatch/adapter-template).

Open a discussion when you ship — we'd love to link it.

## Community

- Issues and PRs welcome on any repo.
- Architecture questions, framework integrations, and ideas → open a discussion in `docs`.

<p align="center">
  <sub>Apache-2.0 · Built by the AgentDispatch contributors</sub>
</p>
