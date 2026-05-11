<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark-dark.svg">
    <img src="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark.svg" alt="AgentDispatch" width="520">
  </picture>
</p>

<h3 align="center">The standard worker contract for AgentCore agents.</h3>

<p align="center">
  <code>@agent-dispatch/worker-agentcore</code> defines the request and response shapes AgentDispatch dispatches into AgentCore — and a small runtime helper so you don't have to implement the framing yourself.
</p>

---

## Install

```bash
npm install @agent-dispatch/worker-agentcore
```

## The contract

Inbound (from AgentDispatch → worker):

```jsonc
{
  "instruction": "string",
  "context": { /* arbitrary */ },
  "framework": "strands" | "...",
  "runtime_tools": { /* runtime-tool config */ }
}
```

Outbound (worker → AgentDispatch):

```jsonc
{
  "status": "succeeded" | "failed",
  "result": { /* arbitrary */ },
  "logs": [{ "ts": "...", "level": "info", "message": "..." }]
}
```

## Usage in a worker

```ts
import { createWorker } from "@agent-dispatch/worker-agentcore";

export const handler = createWorker(async ({ instruction, context, runtimeTools }) => {
  // your agent loop here
  return { result: { answer: "..." } };
});
```

The helper:

- Validates the inbound payload.
- Wires logs into the AgentCore output channel.
- Captures errors into the standard failure envelope.

## License

Apache-2.0.
