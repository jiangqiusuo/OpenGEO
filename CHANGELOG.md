# Changelog

## 0.1.0 — 2026-09-19

首个公开契约版本，适用于本地 Mock、契约集成和 Community 工具开发。

### Included

- OpenAPI 3.1 文档和 JSON Schema registry。
- Job、Observation、Prompt、Publication、Capability 和 MetricResult 公共类型。
- `queued`、`partial`、`succeeded`、`failed`、`finalized_partial` Fixture。
- `Prefer: wait`、`Idempotency-Key`、部分结果和取消语义。
- TypeScript Community client 与本地 Mock API Quickstart。
- 基础 GEO 指标和脱敏公共示例。

### Compatibility

后续兼容策略见 [公共契约版本与兼容策略](docs/versioning.md)。本版本不承诺未出现在 OpenAPI、Schema 或文档中的内部实现细节。

### Package release status

`@opengeo/client` 和 `@opengeo/cli` 已完成本地 package metadata 与 `npm pack --dry-run` 验证；当前不自动发布到 npm。
