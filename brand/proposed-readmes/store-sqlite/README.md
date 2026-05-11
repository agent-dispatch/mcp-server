<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark-dark.svg">
    <img src="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark.svg" alt="AgentDispatch" width="520">
  </picture>
</p>

<h3 align="center">SQLite + filesystem state store for AgentDispatch.</h3>

<p align="center">
  <code>@agent-dispatch/store-sqlite</code> is the default, zero-config store. Tasks and metadata live in SQLite; logs and large results live as files under a state directory.
</p>

---

## Install

```bash
npm install @agent-dispatch/store-sqlite @agent-dispatch/core
```

## Usage

```ts
import { createSqliteStore } from "@agent-dispatch/store-sqlite";
import { createRuntimeService } from "@agent-dispatch/core";

const store = createSqliteStore({ stateDir: ".agentdispatch" });
const runtime = createRuntimeService({ store, adapters: [...], config });
```

The store will create `<stateDir>/state.db` and a `logs/` directory on first use.

## Why SQLite

- **No infrastructure.** Single file. Works on a laptop, in CI, and on a server.
- **Transactional.** Task state transitions are atomic.
- **Inspectable.** It's just SQLite — `sqlite3 .agentdispatch/state.db` and you can read everything.

For larger deployments, implement the `Store` contract from [`@agent-dispatch/core`](https://github.com/agent-dispatch/core) against Postgres, DynamoDB, or your store of choice.

## License

Apache-2.0.
