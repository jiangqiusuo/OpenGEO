# OpenGEO

OpenGEO 提供用于构建 GEO 工具的开放数据契约、指标实现和 TypeScript 开发工具。当前版本包含可复用的 Schema、Mock API、客户端与基础测试设施。

> 当前公开契约版本为 `0.1.0`，适合用于本地 Mock、契约集成和 Community 工具开发。版本规则见 [版本与兼容策略](docs/versioning.md)。

## 已实现

- OpenAPI 3.1 公共 API 契约。
- Job、Observation、Prompt、Publication、Capability 和 MetricResult JSON Schema。
- `queued`、`partial`、`succeeded`、`failed`、`finalized_partial` 等脱敏 Fixture。
- Mention Rate、Answer Rate、Top 1、绝对/条件 Top 3、Average Rank 和 Result Completeness 指标。
- 不连接外部服务的本地 Mock API。
- 调用 OpenGEO API 的 TypeScript 薄客户端。
- 契约兼容性、敏感字段扫描和指标确定性测试。

## 快速开始

要求 Node.js 22 或更高版本，以及 pnpm 11。

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

启动本地 Mock API：

```bash
pnpm mock
```

默认地址为 `http://localhost:8787`。Mock API 只返回虚构示例，不产生外部副作用。

## 仓库结构

```text
apps/mock-api/       本地公共 API Mock
openapi/             OpenAPI 3.1 真源
packages/contracts/  TypeScript 类型、JSON Schema、能力目录和 Fixture
packages/metrics/    可复现的基础 GEO 指标
packages/client/     公共 API 薄客户端
docs/                契约与使用说明
tests/               跨包契约和安全边界测试
```

## 核心约定

- 所有长时操作都返回 OpenGEO Job。
- `turnaround_class` 表示交付速度，`interaction_mode` 表示回答方式，两者保持独立。
- 部分结果、未请求、不支持、不可用和解析失败使用不同状态表达。
- OpenAPI 与 JSON Schema 是 endpoint reference 的数据源。
- 响应字段遵循已发布契约，示例数据不得包含敏感信息。

更多说明见 [Quickstart](docs/quickstart.md)、[公共契约](docs/contracts.md)、[版本与兼容策略](docs/versioning.md)、[变更日志](CHANGELOG.md) 和 [OpenAPI 文档](openapi/openapi.json)。

## 参与贡献

提交 Issue 或 Pull Request 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。安全问题请按照 [SECURITY.md](SECURITY.md) 私下报告。

## 许可证

OpenGEO 使用 [Apache License 2.0](LICENSE)。
