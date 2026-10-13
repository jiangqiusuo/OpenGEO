# Changelog

## Unreleased

- 博客由单一内容源生成静态正文、RSS、sitemap 和结构化数据，加入审核/日期检查、真实 404 与隐私设置。移除未接入实际静态页的 React 测量层；当前仅提供浏览器内事件，不启用第三方分析。
- 在 OpenAPI 3.1 的所有公开响应中声明 `X-Request-Id`，与 Core 的实际响应行为保持一致。

## 0.1.1 — 2026-10-11

- 修正 CLI 发布包对 Client 的依赖声明，确保独立 npm 安装使用有效的 semver 版本范围。
- 保持公共契约、CLI 命令和 Client API 与 0.1.0 兼容。

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

`@sysiphus/client@0.1.0` 和 `@sysiphus/cli@0.1.0` 已通过 staged approve 并公开发布。后续版本使用 GitHub Actions npm Trusted Publishing，以 stage-only OIDC 方式提交 staged release。
