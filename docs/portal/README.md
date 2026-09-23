# OpenGEO Developer Portal

这里是公开 API Developer Portal 的静态入口。页面使用仓库中的 [`openapi/openapi.json`](../../openapi/openapi.json) 作为 endpoint、参数、请求体、响应 Schema 和示例的唯一来源；Markdown 只补充概念、快速开始和工作流说明。

## 本地预览

在仓库根目录执行：

```bash
pnpm dlx serve .
```

然后打开 `/docs/portal/`。也可以在任意静态服务器上托管仓库目录。页面通过 Scalar 的浏览器组件渲染 OpenAPI 3.1 reference，开发者可以在左侧按资源浏览，在中间查看字段，在右侧复制请求示例。

## 文档分层

| 页面类型 | 内容 | 数据来源 |
| --- | --- | --- |
| Overview | 产品概念、Base URL、认证、Job 生命周期和快速开始 | `docs/quickstart.md` 等指南 |
| Reference | Method、Path、参数、Schema、响应和错误 | `openapi/openapi.json` |
| Guide | 轮询、Webhook 设计、错误处理、语言示例 | `docs/` 指南与生成示例 |

新增 endpoint 时先修改 OpenAPI、Schema、Fixture 和契约测试，再更新导航说明。不要在 Markdown 或组件中复制字段定义。

## 视觉方向

Portal 采用紧凑的 developer-first 信息层级：持久 API 导航、清晰的 Method/Path 标题、可复制代码和高对比度 Schema。工作台使用同一套 OpenGEO 视觉令牌，但保持“信号 → 证据 → 行动”的产品主线。它借鉴现代 API 文档的交互惯例，不复制任何第三方品牌资产或页面代码。
