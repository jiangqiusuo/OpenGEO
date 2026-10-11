<div align="center">

# OpenGEO

**面向开发者的 GEO（生成式引擎优化）开放工具包**  
**An open toolkit for developer-first Generative Engine Optimization**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![Contract](https://img.shields.io/badge/contract-0.1.0-6f42c1.svg)](openapi/openapi.json)
[![npm](https://img.shields.io/npm/v/%40sysiphus%2Fclient?label=%40sysiphus%2Fclient)](https://www.npmjs.com/package/@sysiphus/client)

[中文](#中文) · [English](#english)

</div>

---

## 中文

### OpenGEO 是什么

OpenGEO 是一个面向开发者和产品团队的 GEO 开放工具包。它把“提出问题、执行一次可追踪的任务、读取观察结果、计算指标、复核变化”整理成稳定的公共契约，让团队可以在本地 Mock、自动化测试和自己的工具中构建 GEO 工作流。

OpenGEO 当前的产品形态是 **工作台 + 可组合工作流**。工作台负责查看任务、结果和指标；工作流负责把任务编排、证据整理和复核步骤连接起来。Agent 是后续的辅助入口，用于解释结果、发现证据和建议下一步，不替代可验证的 Job 契约。

### 当前能力（0.1.x）

- **OpenAPI 3.1 公共契约**：版本化的 Job、Observation、Prompt、Publication、Capability 和 MetricResult 数据结构。
- **可追踪的异步 Job**：支持排队、部分结果、成功、失败、取消和部分结果定稿等状态。
- **指标基础设施**：包含 Mention Rate、Answer Rate、Top 1、Top 3、Average Rank 和 Result Completeness 等可复现指标。
- **本地 Mock API**：不连接外部服务，可用于快速开始、契约测试和演示。
- **TypeScript 客户端与 CLI**：提供能力查询、任务创建、任务读取和示例工作流。
- **工作台原型**：用于展示任务、能力、观察结果和未实现操作的明确状态。
- **开发者文档**：包括 Quickstart、API Reference、Webhook 与轮询、错误与限流、多语言示例和版本策略。

所有公开示例均为虚构或脱敏数据。仓库不会要求开发者提交访问令牌、客户信息或外部服务凭据。

### 快速开始

要求 Node.js 22+ 与 pnpm 11。

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

启动工作台开发服务器：

```bash
pnpm web:dev
```

默认 Mock 地址为 `http://localhost:8787`。工作台预览地址为 <https://app.open-geo.net/>，本地开发时使用 Vite 输出的地址。

### 版本路线

| 版本 | 方向 | 计划交付 |
| --- | --- | --- |
| **0.1.x** | 公共契约与开发工具 | OpenAPI、Schema、Mock、指标、TypeScript 客户端、CLI、契约测试和开发者文档 |
| **0.2.x** | 工作流与可观测性 | 更完整的任务编排、证据视图、Webhook 辅助工具、可访问性和多语言示例 |
| **0.3.x** | Community 体验 | 工作台信息架构、可复用组件、插件接口、教程和真实项目的可复现样例 |
| **1.0** | 稳定生态 | 兼容性承诺、迁移指南、扩展接口稳定版和社区协作流程 |

版本路线是公开的产品方向。具体交付以变更日志、契约版本和测试结果为准。

### 项目结构

```text
apps/mock-api/       本地公共 API Mock
apps/web/            Community 工作台原型
openapi/             OpenAPI 3.1 源文件
packages/contracts/  TypeScript 类型、Schema、能力目录和 Fixture
packages/metrics/    可复现的 GEO 指标
packages/client/     TypeScript 客户端
packages/cli/        命令行工具
docs/                契约、指南和 API 文档
tests/               跨包契约、指标和安全边界测试
```

### 参与贡献

请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)、[开发工作流](docs/development-workflow.md) 和 [仓库治理基线](docs/repository-governance.md)。提交 Issue 时请描述可复现步骤；提交 Pull Request 时请说明契约影响、测试结果和文档变化。安全问题请按照 [SECURITY.md](SECURITY.md) 私下报告。

### 许可证

OpenGEO 使用 [Apache License 2.0](LICENSE)。

---

## English

### What is OpenGEO?

OpenGEO is a developer-first toolkit for Generative Engine Optimization (GEO). It turns a GEO workflow—asking a question, running a traceable task, reading observations, computing metrics, and reviewing change—into a stable public contract that can be used with local mocks, automated tests, and community-built tools.

The current product shape is a **workbench plus composable workflows**. The workbench presents jobs, observations, and metrics. Workflows connect execution, evidence collection, and review steps. An Agent-assisted entry point is planned for explaining results and suggesting next steps; it does not replace the verifiable Job contract.

### Current capabilities (0.1.x)

- **OpenAPI 3.1 public contract** with versioned Job, Observation, Prompt, Publication, Capability, and MetricResult structures.
- **Traceable asynchronous Jobs** with queued, partial, succeeded, failed, cancelled, and finalized-partial states.
- **Metric primitives** including Mention Rate, Answer Rate, Top 1, Top 3, Average Rank, and Result Completeness.
- **Local Mock API** for quickstarts, contract tests, and demos without external calls.
- **TypeScript client and CLI** for capability discovery, job creation, job retrieval, and example workflows.
- **Workbench prototype** that makes jobs, capabilities, observations, and planned actions explicit.
- **Developer documentation** covering Quickstart, API Reference, webhooks and polling, errors and limits, language examples, and versioning.

Public examples use fictional or sanitized data. The repository does not require contributors to commit access tokens, customer data, or external service credentials.

### Quickstart

Node.js 22+ and pnpm 11 are required.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run the local Mock API:

```bash
pnpm mock
```

Run the workbench in development:

```bash
pnpm web:dev
```

The default Mock endpoint is `http://localhost:8787`. The hosted workbench preview is available at <https://app.open-geo.net/>; local development uses the address printed by Vite.

### Version roadmap

| Version | Focus | Planned delivery |
| --- | --- | --- |
| **0.1.x** | Public contract and developer tools | OpenAPI, schemas, mocks, metrics, TypeScript client, CLI, contract tests, and developer docs |
| **0.2.x** | Workflows and observability | Richer job orchestration, evidence views, webhook helpers, accessibility, and more language examples |
| **0.3.x** | Community experience | Workbench information architecture, reusable components, plugin interfaces, tutorials, and reproducible examples |
| **1.0** | Stable ecosystem | Compatibility commitments, migration guides, stable extension points, and community collaboration practices |

The roadmap describes public product direction. Actual delivery is defined by changelogs, contract versions, and passing verification.

### Repository layout

```text
apps/mock-api/       local public API Mock
apps/web/            Community workbench prototype
openapi/             OpenAPI 3.1 source
packages/contracts/  TypeScript types, schemas, capabilities, and fixtures
packages/metrics/    reproducible GEO metrics
packages/client/     TypeScript client
packages/cli/        command-line tool
docs/                contracts, guides, and API documentation
tests/               cross-package contract, metric, and security-boundary tests
```

### Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), the [development workflow](docs/development-workflow.md), and the [repository governance baseline](docs/repository-governance.md) before opening an Issue or Pull Request. Include reproduction steps for issues, and describe contract impact, verification, and documentation changes in pull requests. Report security issues privately according to [SECURITY.md](SECURITY.md).

### License

OpenGEO is released under the [Apache License 2.0](LICENSE).