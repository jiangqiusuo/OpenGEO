# OpenGEO、Elmo 与 OneGlanse：如何选择

核对日期：2026-10-15。比较项目范围和代码路径，不作运行性能、效果或价格排名。

| 你关心的问题 | OpenGEO Community | Elmo | OneGlanse |
| --- | --- | --- | --- |
| 主要用途 | 把已有 AI 回答变成可复核的指标；为开发者提供契约、SDK、CLI 和测试工具 | 自托管的 AI 可见度监测与分析平台 | 通过浏览器采集 AI 产品界面的回答，再进行分析 |
| 回答从哪里来 | 本地导入由用户提供；Mock 使用虚构数据。真实监测另接 API 环境 | 按配置接外部采集接口或直接模型 API，具体回答表面取决于接入方式 | 自己的浏览器采集层与用户配置的 AI 账号 |
| 分析方式 | 确定性指标；本地导入使用字面品牌匹配和人工排名，保留输入证据 | 自行实现监测管理、提及及分析逻辑，结合配置的数据接入 | 采集与分析分层；后续分析仍调用配置的分析模型 |
| 本地部署范围 | 此仓库的工具、Mock 和示例工作台；不包含完整真实监测后端 | 仓库提供应用与自托管部署方案 | 仓库提供应用、浏览器 Agent 与分析服务 |
| 开源许可 | Apache-2.0 | MIT | MIT |
| 使用前确认 | 需要的是导入分析/集成工具，还是完整托管监测服务 | 所需采集渠道、凭据、运行成本及其对应能力 | 账号登录、浏览器运行条件和分析模型配置 |

**适合选择 OpenGEO 的情况**：你已经保存了一批回答，希望用公开公式检查品牌提及；或想把任务、部分结果、取消和证据读取接到自己的程序中。先运行[本地回答分析](analyze-answers.md)或[CLI Mock](local-demo.md)，再决定是否适合。

如果你正在寻找开箱即用的完整自托管监测产品，应分别评估 Elmo、OneGlanse 的安装和数据接入要求。不能因为 OpenGEO 的工具开源，就推断完整监测后端也包含在本仓库中。

## 核对依据

- Elmo：[仓库与许可](https://github.com/elmohq/elmo/tree/20d2c151dce4f73e045e7416660f2185d5de055e)、[数据接入注册与解析](https://github.com/elmohq/elmo/blob/20d2c151dce4f73e045e7416660f2185d5de055e/packages/lib/src/providers/index.ts)、[提及处理](https://github.com/elmohq/elmo/blob/20d2c151dce4f73e045e7416660f2185d5de055e/packages/lib/src/mentions.ts)。
- OneGlanse：[架构](https://github.com/oneglanse/oneglanse/blob/b2c6e730b6818e64a4cef8b73c6605911c890626/ARCHITECTURE.md)、[浏览器 Agent](https://github.com/oneglanse/oneglanse/blob/b2c6e730b6818e64a4cef8b73c6605911c890626/apps/agent/src/core/createAgent.ts)、[分析调用](https://github.com/oneglanse/oneglanse/blob/b2c6e730b6818e64a4cef8b73c6605911c890626/packages/services/src/analysis/runAnalysis.ts)。
- OpenGEO：[导入分析实现](../scripts/answer-analysis.ts)、[指标计算](../packages/metrics/src/index.ts)、[公共契约](../openapi/openapi.json)。

以上是公开文档和指定版本源码核对，没有部署或实测竞品。功能可用性、费用和限制应以各项目当前发布及实际环境为准；这里不复制无法独立验证的用户推荐或 AI 推荐语。
