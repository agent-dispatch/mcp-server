<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark-dark.svg">
    <img src="https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark.svg" alt="AgentDispatch" width="520">
  </picture>
</p>

<h3 align="center">AWS Bedrock AgentCore adapter for AgentDispatch.</h3>

<p align="center">
  <code>@agent-dispatch/adapter-aws-agentcore</code> implements the AgentDispatch capability contract against Amazon Bedrock AgentCore. Drop it into your runtime and the rest of the stack (CLI, SDK, MCP) just works.
</p>

---

## Install

```bash
npm install @agent-dispatch/adapter-aws-agentcore @agent-dispatch/core
```

## What it does

- Implements the `agent-runtime` capability for the `aws` provider.
- Supports session and job target modes.
- Invokes AgentCore runtimes by ARN + qualifier.
- Streams logs and results back into the configured store.

## Configuration

```json
{
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
        "runtimeArn": "arn:aws:bedrock-agentcore:us-west-2:123456789012:agent/<uuid>:1",
        "qualifier": "DEFAULT"
      }
    }
  }
}
```

`credentialSource: "aws-sdk-default"` uses the standard AWS SDK credential chain (env vars, profiles, instance metadata, etc.).

## Requirements

- An AWS account with Bedrock AgentCore enabled in the target region.
- An AgentCore runtime ARN you have permission to invoke.
- A worker contract compatible with [`@agent-dispatch/worker-agentcore`](https://github.com/agent-dispatch/worker-agentcore).

## License

Apache-2.0.
