<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark-dark.svg">
    <img src="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark.svg" alt="AgentDispatch" width="520">
  </picture>
</p>

<h3 align="center">The provider-neutral core of AgentDispatch.</h3>

<p align="center">
  <code>@agent-dispatch/core</code> defines the runtime contracts — providers, capabilities, accounts, backends, runtime profiles — and the dispatch loop every other AgentDispatch package builds on.
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#concepts">Concepts</a> ·
  <a href="#usage">Usage</a> ·
  <a href="https://github.com/agent-dispatch">The rest of the stack</a>
</p>

---

## What's in here

- **`RuntimeService`** — the dispatch orchestrator. Resolves runtime profiles, validates capabilities, persists tasks, drives adapters.
- **Contracts** — `DispatchRequest`, `RuntimeProfile`, capability descriptors, task lifecycle types.
- **Errors** — `AgentDispatchError` with stable, structured error codes.

If you're building an adapter, a store, a CLI, or an MCP server, this is the package you depend on.

## Install

```bash
npm install @agent-dispatch/core
```

## Concepts

| Term | Meaning |
| --- | --- |
| **Provider** | A cloud or runtime ecosystem (`aws`, future: `azure`, `gcp`, `self-hosted`). |
| **Capability** | A typed contract a provider exposes (e.g. `agent-runtime` with task types `agent.run`). |
| **Account profile** | Named credentials + region scope. |
| **Backend** | A concrete deployment of a capability (e.g. an AgentCore runtime ARN). |
| **Runtime profile** | The high-level "what to run" preset: provider + account + capability + target + framework. |
| **Adapter** | The plug-in that fulfils a capability against a real cloud API. |
| **Store** | Pluggable state for tasks, logs, and results. |

The dispatch loop, in one sentence: *pick a capability, pick an adapter, persist a task, invoke the worker, stream status and logs back.*

## Usage

Bootstrap a runtime from config and dispatch a task:

```ts
import { createRuntimeService } from "@agent-dispatch/core";
import { createSqliteStore } from "@agent-dispatch/store-sqlite";
import { createAwsAgentCoreAdapter } from "@agent-dispatch/adapter-aws-agentcore";

const runtime = createRuntimeService({
  store: createSqliteStore({ stateDir: ".agentdispatch" }),
  adapters: [createAwsAgentCoreAdapter()],
  config: /* loaded from agentdispatch.config.json */
});

const task = await runtime.dispatchTask({
  provider: "aws",
  accountProfile: "dev-aws",
  capability: "agent-runtime",
  taskType: "agent.run",
  target: { mode: "session" },
  input: { instruction: "summarise the latest CloudTrail anomalies" }
});

await runtime.getTaskStatus(task.taskId);
await runtime.getTaskLogs(task.taskId, 0, 100);
await runtime.getTaskResult(task.taskId);
```

## Building an adapter

The adapter contract is intentionally small. See [`adapter-template`](https://github.com/agent-dispatch/adapter-template) for a starting point.

## License

Apache-2.0.
