# AGENTS.md — opengeo public repository

## Repository role

This is the public Apache-2.0 OpenGEO Community repository.

## Hard rules

- Keep credentials, personal data, and information not authorized for public release out of commits, examples, and public discussions.
- Use fictional or sanitized examples. Describe monitored products and public integrations accurately, using public documentation and verified behavior.
- Public long-running operations use the OpenGEO Job contract.
- Keep `interaction_mode` separate from `turnaround_class`.
- Do not silently degrade requested capabilities.
- Public metrics must reference a versioned metric definition.
- Prefer contract tests and fixtures before UI-specific data shapes.
- Do not implement P1/P2 work unless the active Goal explicitly permits it.
