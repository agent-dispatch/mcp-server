<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark-dark.svg">
    <img src="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark.svg" alt="AgentDispatch" width="520">
  </picture>
</p>

<h3 align="center">Ship an AgentDispatch adapter in an afternoon.</h3>

<p align="center">
  Fork this template, implement five methods, register your adapter — your runtime is now reachable from the CLI, the SDK, and every MCP client.
</p>

---

## Why this exists

Every new agent runtime today ships its own API. AgentDispatch hides that diversity behind one capability contract. To support a new provider you only need to bridge that contract — this template gives you the scaffolding.

## What you get

- A `package.json` with the right peer dependencies.
- A `src/index.ts` with the adapter factory signature.
- A typed skeleton for the `agent-runtime` capability.
- A `vitest` setup with a contract conformance test.
- A `CONTRIBUTING.md` aimed at adapter authors.

## How to use it

```bash
gh repo create my-org/agent-dispatch-adapter-mything \
  --template agent-dispatch/adapter-template --public

cd agent-dispatch-adapter-mything
npm install
npm test
```

Then edit `src/index.ts` and implement:

```ts
createMyThingAdapter(): Adapter {
  return {
    provider: "mything",
    capabilities: [...],
    async dispatch(task) { /* your provider call */ },
    async getStatus(taskId) { /* ... */ },
    async getLogs(taskId, cursor, limit) { /* ... */ },
    async getResult(taskId) { /* ... */ },
    async cancel(taskId) { /* ... */ }
  };
}
```

Open a discussion on the org when you publish — we'd love to link it.

## License

Apache-2.0.
