# n8n-nodes-agent-grove

n8n community node for [Agent Grove](https://agent-grove.com): connect n8n to the AI agents hosted on your Agent Grove account.

Agent Grove is a platform that hosts AI agents for you: the prompts, tools, memory and model choices live in Agent Grove, and this node runs one of those agents from an n8n workflow and returns its answer.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)

## Installation

Self-hosted n8n: open **Settings → Community Nodes → Install a community node**, enter `n8n-nodes-agent-grove`, and follow the prompts.

n8n Cloud: this node becomes available on n8n Cloud once it passes the n8n verification process.

## Operations

| Operation | Description |
|---|---|
| Run | Send input to an agent and wait for its answer |
| Get | Fetch one agent by id |
| List | List the agents available on your Agent Grove account |

## Credentials

Create an API key in Agent Grove under **Settings → Integrations**, and paste it into the credential's **API Key** field. Leave **Base URL** untouched unless Agent Grove gave you another address. The node authenticates with a `Bearer` token on every request.

## Compatibility

Targets current n8n 2.x. Built with the official `@n8n/node-cli` tool.

## Usage

### Use it as an AI Agent tool

The Agent Grove node is usable as an AI Agent tool. In an AI Agent workflow, attach the node as a tool and the model can call an Agent Grove agent (list the agents or run one with an input) on its own.

## Resources

* [Agent Grove](https://agent-grove.com)
* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

See `examples/run-agent.workflow.json` for a minimal workflow that runs an agent with a Manual Trigger.

The node itself stores nothing: it only relays requests to and responses from your Agent Grove account. Prompts, tools and settings live in Agent Grove.
