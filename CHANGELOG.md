# Changelog

## 0.1.0 — 2026-09-12

First public release.

Initial release of the Agent Grove community node for n8n.

- Agent Grove credential: API key and base URL, with a connection test.
- Agent Grove node with three operations: Run (send input to an agent and wait
  for its answer), Get (fetch one agent by id) and List (list the agents on
  your Agent Grove account).
- The node is usable as an AI Agent tool: attach it to an AI Agent node so the
  model can call agents hosted on your Agent Grove account.
