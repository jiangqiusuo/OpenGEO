<div align="center">

# OpenGEO

**AI 回答有没有提到你？用公开指标和原始证据来检查。**

开源 GEO 工具包 · 本地回答分析 · TypeScript SDK / CLI

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/%40sysiphus%2Fclient?label=%40sysiphus%2Fclient)](https://www.npmjs.com/package/@sysiphus/client)

**中文** · [English](README.en.md)

[官网](https://open-geo.net/) · [示例工作台](https://app.open-geo.net/) · [在线沙盒](https://api.open-geo.net/console/) · [开发文档](https://jiangqiusuo.github.io/OpenGEO/docs/portal/)

</div>

## 用 OpenGEO 做什么

当用户向 AI 询问产品或方案时，你可能想知道：品牌是否被提到、出现在什么位置、回答用了哪些来源。OpenGEO 帮你把这些判断放回具体样本中，避免只看一张截图或一个百分比。

| 你的需求 | 现在可以做的事 |
| --- | --- |
| 已经保存了一批 AI 回答，想检查品牌表现 | 本地导入 JSON，计算字面提及率、人工提供的排名与有效样本比例，保留回答和引用记录 |
| 想把 GEO 观察接入自己的程序 | 使用版本化 OpenAPI、TypeScript SDK 和 CLI，创建任务、等待部分结果、读取证据、取消或定稿 |
| 先了解工作台，不配置凭据 | 打开只读示例，或用 GitHub 登录在线沙盒，创建模拟任务并保存历史 |
| 想核对一个指标从哪里来 | 查看公开的计算公式、样本范围和对应 Observation，而不是接受一个无法复核的评分 |

**当前开源范围是分析与开发工具。** 本仓库不包含完整的真实监测运行后端，也不会自动登录各 AI 网站抓取回答。在线沙盒有真实账号和持久任务，但回答仍是模拟数据；真实 API 接入以获准环境的能力目录为准。

## 五分钟：分析一份回答

要求 Node.js 22+、pnpm 11。

```bash
git clone https://github.com/jiangqiusuo/OpenGEO.git
cd OpenGEO
pnpm install
pnpm analyze:answers --input examples/answers.sample.json
```

示例中有 3 条虚构记录，2 条回答可用，其中 1 条提到目标品牌并由人工标记第 2 名。输出包括：

```text
有效回答       2 / 3
品牌提及率     1 / 2 = 50%
平均已知排名   2
```

把示例复制到仓库外，替换为自己的品牌、问题、平台标识和回答，再传入文件路径即可。分析过程不调用模型或抓取网站。**提及不代表推荐；没有提供排名时不会猜测排名；引用记录不做独立真实性验证。** 详见[输入格式和报告说明](docs/analyze-answers.md)。

这是仓库命令，尚未包含在已发布的 `@sysiphus/cli@0.1.1` 中。

## 体验任务的完整流程

```bash
pnpm demo:local
```

这条命令演示任务的创建、查询、读取和取消，结束后自动关闭临时服务。全程使用虚构数据，无需 API Key。[操作说明](docs/local-demo.md)

## 从回答到可复核的结果

### 01 · 导入你保存的回答

提供品牌、问题和 AI 回答；已有的排名与引用可以一并保留。每条记录都有对应的原文，方便核对。

### 02 · 看清品牌出现在哪里

查看有效回答比例、品牌提及率和已知排名。比如示例中的 **50%**，表示 **2 条有效回答中有 1 条提到品牌**，样本数量和比例一起展示。

### 03 · 回到原文检查依据

逐条查看哪些回答提到了品牌、排名是否由你提供、记录了哪些引用。把“没有提及”和“没有获取到回答”分开，方便判断下一步需要补什么数据。

<details>
<summary>查看指标、计算口径与比较条件</summary>

- **回答是否可用**：Answer Rate、Result Completeness。
- **品牌是否出现**：Mention Rate。
- **已有排名如何分布**：Top 1、绝对/条件 Top 3、Average Rank；不推断缺失的排名。

零分母返回 `null`。比较前应固定问题、模型、语言、时间窗口和样本数量。OpenGEO 记录与分析观察，不保证 AI 引用、推荐或排名提升。

[指标定义](packages/metrics/README.md) · [公共契约](openapi/openapi.json)

</details>

## 与完整监测平台如何区别

| 项目 | 主要定位 | 数据获取方式 | 自托管范围 |
| --- | --- | --- | --- |
| **OpenGEO Community** | 可复核的分析与开发工具 | 本地导入；Mock；另接受控 API | 工具、Mock、示例工作台 |
| **Elmo** | AI 可见度监测管理与分析 | 按配置接外部采集接口或模型 API | 完整应用部署方案 |
| **OneGlanse** | 浏览器采集与 AI 可见度分析 | 浏览器采集层；后续调用配置的分析模型 | 应用、浏览器 Agent 与分析服务 |

核对于 2026-10-15，依据指定版本公开源码，未运行竞品或评测效果。详见[比较依据与选择建议](docs/project-comparison.md)。这里没有以未经验证的 AI 推荐语代替实际能力。

## 当前状态与下一步

| 状态 | 范围 |
| --- | --- |
| 可用 | 本地回答分析、版本化契约与指标、已发布 SDK / CLI、本地 Mock、示例工作台 |
| 独立托管沙盒 | GitHub 登录、任务与历史结果保存、虚拟额度；模拟回答 |
| 接下来优先 | 受控真实监测的在线闭环、预算与限流验收、真实试用反馈 |
| 后续方向 | 项目/品牌/问题管理、多次观察比较、导出与工作流集成 |

内容生成、自动发布和排名提升不属于当前已交付能力。后续版本以实际发布和验收为准。[变更日志](CHANGELOG.md)

## 开发与贡献

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`packages/contracts` 提供 Schema 与 Fixture；`packages/metrics` 提供计算；`packages/client` 和 `packages/cli` 提供集成入口；`apps/mock-api` 和 `apps/web` 提供本地 API 与示例界面。

[贡献指南](CONTRIBUTING.md) · [开发工作流](docs/development-workflow.md) · [仓库治理](docs/repository-governance.md) · [安全报告](SECURITY.md)

使用 [Apache License 2.0](LICENSE)。欢迎提交可复现问题、改进公式或贡献脱敏示例。
