<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark-dark.svg">
    <img src="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark.svg" alt="AgentDispatch" width="520">
  </picture>
</p>

<h3 align="center">TypeScript SDK for AgentDispatch.</h3>

<p align="center">
  <code>@agent-dispatch/sdk</code> is the ergonomic way to dispatch cloud agents from your app code. One client, every provider you have configured.
</p>

---

## Install

```bash
npm install @agent-dispatch/sdk @agent-dispatch/core
```

## Quick start

```ts
import { createClient } from "@agent-dispatch/sdk";

const client = createClient({ configPath: "agentdispatch.config.json" });

const { taskId } = await client.spawnCloudAgent({
  instruction: "Find all functions over 300 lines and propose split points.",
  runtime: "code-review"
});

for await (const event of client.streamTask(taskId)) {
  console.log(event);
}

const result = await client.getTaskResult(taskId);
```

## Features

- **Typed end-to-end** — request/response types come from [`@agent-dispatch/core`](https://github.com/agent-dispatch/core).
- **Sync, session, and job modes** — same client API regardless of target mode.
- **Streaming** — async iterator over status + log events.
- **Cancellation** — built on `AbortSignal`.

## API surface

```ts
client.spawnCloudAgent(input)
client.dispatchTask(request)
client.getTaskStatus(taskId)
client.getTaskLogs(taskId, { cursor, limit })
client.getTaskResult(taskId)
client.cancelTask(taskId)
client.streamTask(taskId)            // async iterable
client.listProviders()
client.listCapabilities(provider?)
client.listAccountProfiles()
```

## See also

- [`@agent-dispatch/mcp-server`](https://github.com/agent-dispatch/mcp-server) — same surface, exposed over MCP
- [`@agent-dispatch/cli`](https://github.com/agent-dispatch/cli) — same surface, from your terminal

## License

Apache-2.0.
