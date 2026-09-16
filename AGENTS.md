# AGENTS.md — opengeo public repository

## Repository role

This is the public Apache-2.0 OpenGEO Community repository.

## Hard rules

- Never add real provider names, upstream endpoints, purchase prices, account pools, private routing, private error payloads, tokens or customer data.
- Public long-running operations use the OpenGEO Job contract.
- Keep `interaction_mode` separate from `turnaround_class`.
- Do not silently degrade requested capabilities.
- Public metrics must reference a versioned metric definition.
- Prefer contract tests and fixtures before UI-specific data shapes.
- Do not implement P1/P2 work unless the active Goal explicitly permits it.
