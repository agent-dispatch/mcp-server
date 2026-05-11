<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/wordmark-dark.svg">
    <img src="./assets/wordmark.svg" alt="AgentDispatch" width="560">
  </picture>
</p>

<h3 align="center">The provider-neutral runtime for AI agents.</h3>

<p align="center">
  One contract. Any agent. Any cloud.<br/>
  Spawn long-running cloud agents from your CLI, your code, or any MCP client — without picking a provider for life.
</p>

<p align="center">
  <a href="https://github.com/agent-dispatch/mcp-server"><strong>MCP server</strong></a> ·
  <a href="https://github.com/agent-dispatch/sdk-js">SDK</a> ·
  <a href="https://github.com/agent-dispatch/cli">CLI</a> ·
  <a href="https://github.com/agent-dispatch/core">Core</a> ·
  <a href="https://github.com/agent-dispatch/docs">Docs</a>
</p>

---

## Why AgentDispatch?

Every agent runtime today ships its own API, its own worker contract, its own deployment story. Pick one and you're locked in. Switch providers and you rewrite orchestration code from scratch.

**AgentDispatch is the dispatch layer in between.** Write one integration. Point it at AWS Bedrock AgentCore today, plug in something else tomorrow — without touching the calling code.

- 🧠 **Built for the agent era.** Long-running, stateful, multi-step tasks are first-class.
- 🧩 **Provider-neutral by design.** A small, stable capability + adapter contract.
- ⚡ **Three faces, one runtime.** CLI for humans, SDK for code, MCP server for AI assistants.
- 🪶 **Lightweight defaults.** SQLite store. stdio transport. Zero hidden services.
- 🔓 **Open.** Apache-2.0 across the stack. Adapter template included.

## How it fits together

```
   Humans              Apps              AI assistants
     │                  │                      │
     ▼                  ▼                      ▼
   ┌─────┐         ┌─────────┐          ┌─────────────┐
   │ cli │         │ sdk-js  │          │ mcp-server  │
   └──┬──┘         └────┬────┘          └──────┬──────┘
      └─────────────────┼──────────────────────┘
                        ▼
              ┌───────────────────┐
              │       core        │  ← contracts + dispatch
              └─────────┬─────────┘
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌──────────────────┐
  │  store   │    │ adapter  │ →  │ worker (in cloud)│
  │ (sqlite) │    │   (aws)  │    └──────────────────┘
  └──────────┘    └──────────┘
```

## Start here

Most people want one of these three:

- **AI assistant control plane** — wire [`mcp-server`](https://github.com/agent-dispatch/mcp-server) into Claude Desktop / Cursor / Claude Code and your model can spawn cloud agents on demand.
- **From your own app** — install [`sdk-js`](https://github.com/agent-dispatch/sdk-js) and call `client.spawnCloudAgent({...})`.
- **From your terminal** — `npx @agent-dispatch/cli spawn "..."` and watch it run.

```bash
npm install \
  @agent-dispatch/core \
  @agent-dispatch/mcp-server \
  @agent-dispatch/store-sqlite \
  @agent-dispatch/adapter-aws-agentcore
```

## Repositories

| Repo | What it is |
| --- | --- |
| [`core`](https://github.com/agent-dispatch/core) | Runtime contracts and dispatch orchestration. The heart. |
| [`mcp-server`](https://github.com/agent-dispatch/mcp-server) | MCP face for the runtime. The viral entry point. |
| [`sdk-js`](https://github.com/agent-dispatch/sdk-js) | TypeScript SDK for application code. |
| [`cli`](https://github.com/agent-dispatch/cli) | Command-line interface for operators. |
| [`store-sqlite`](https://github.com/agent-dispatch/store-sqlite) | Default SQLite + filesystem state store. |
| [`adapter-aws-agentcore`](https://github.com/agent-dispatch/adapter-aws-agentcore) | AWS Bedrock AgentCore adapter. |
| [`worker-agentcore`](https://github.com/agent-dispatch/worker-agentcore) | Standard AgentCore worker contract. |
| [`adapter-template`](https://github.com/agent-dispatch/adapter-template) | Starter for new cloud adapters. |
| [`docs`](https://github.com/agent-dispatch/docs) | Documentation and guides. |

## Build your own adapter

Adding a new provider is meant to be a focused, well-scoped task. Fork [`adapter-template`](https://github.com/agent-dispatch/adapter-template), implement the five-method contract from [`core`](https://github.com/agent-dispatch/core), ship.

## Community

- Issues and PRs welcome on any repo.
- Open a discussion on `docs` for questions, design ideas, or to share an adapter you've built.

<p align="center">
  <sub>Apache-2.0 · Built by the AgentDispatch contributors</sub>
</p>
