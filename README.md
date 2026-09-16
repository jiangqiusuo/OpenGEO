# OpenGEO Community

OpenGEO 是面向生成式搜索优化（GEO）的开源契约、指标和客户端基础设施。它把监测、生成、发布和复测等长时操作统一表达为稳定的 OpenGEO Job，并为 Community 产品与商业 API 提供同一套公开数据结构。

> 当前版本为 `0.1.0` 的早期开发版。公共契约、能力目录、基础指标、Mock API 和薄客户端已经可运行；真实监测、付费能力和 SaaS 服务不在本仓库中。

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

默认地址为 `http://localhost:8787`。Mock API 只返回虚构示例，不会调用外部服务或消费任何余额。

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
- 公共响应不得包含外部执行方、内部任务 ID、采购成本、路由策略或真实凭据。

更多说明见 [公共契约](docs/contracts.md) 和 [OpenAPI 文档](openapi/openapi.json)。

## 开源与商业边界

本仓库公开公共契约、指标、Mock、客户端和未来的 Community 产品。商业 API 服务端、多租户计费、私有执行适配、内部路由和运营系统位于独立私有仓库。

这种边界允许第三方围绕稳定公开契约构建工具，同时保护商业运行所需的凭据、成本和执行策略。

## 参与贡献

提交 Issue 或 Pull Request 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。安全问题请按照 [SECURITY.md](SECURITY.md) 私下报告。

## 许可证

OpenGEO Community 使用 [Apache License 2.0](LICENSE)。
