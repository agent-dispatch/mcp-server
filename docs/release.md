# Release Workflow

`@agent-dispatch/mcp-server` is published after `@agent-dispatch/core`, `@agent-dispatch/store-sqlite`, and `@agent-dispatch/adapter-aws-agentcore`.

## Prerequisites

- Publish upstream AgentDispatch packages for the target compatibility line.
- Configure npm Trusted Publisher for `agent-dispatch/mcp-server` using workflow `.github/workflows/publish.yml`.
- Confirm the target package version has not already been published.

## Publish

Use the `Publish` GitHub Actions workflow with the target version. The workflow updates upstream AgentDispatch packages to latest compatible published versions, validates typecheck, tests, and build, then publishes through Trusted Publisher.
