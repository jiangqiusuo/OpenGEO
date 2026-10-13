# OpenGEO Developer Portal

这里是公开 API Developer Portal 的静态入口。页面使用仓库中的 [`openapi/openapi.json`](../../openapi/openapi.json) 作为 endpoint、参数、请求体、响应 Schema 和示例的唯一来源；Markdown 只补充概念、快速开始和工作流说明。

## 本地预览

在仓库根目录执行：

```bash
pnpm install
pnpm web:dev
```

然后打开 Vite 地址的 `/docs/portal/`。此入口复用工作台的开发服务，不必再启动静态服务器。页面通过固定版本 `@scalar/api-reference@1.71.0` 渲染 OpenAPI 3.1 reference，开发者可以在左侧按资源浏览，在中间查看字段，在右侧复制请求示例；首次加载 Scalar 需要网络。

单独部署时执行 `node scripts/portal-assets.mjs <输出目录>`，再用已有静态服务器托管输出目录。HTML 源文件中的样式占位符由组装器替换，不能直接托管未组装的源码目录。

## GitHub Pages 预览

仓库工作流 [`docs-preview.yml`](../../.github/workflows/docs-preview.yml) 使用同一组装器生成 Pages artifact，保持 OpenAPI 的相对路径，并输出共享基础样式、Portal 样式和 Logo 的内容指纹文件。修改 Portal、OpenAPI、组装器、共享基础样式或 Logo 都会更新预览。首次启用前，维护者在 Settings → Pages 中选择 GitHub Actions。

## 文档分层

| 页面类型 | 内容 | 数据来源 |
| --- | --- | --- |
| Overview | 产品概念、Base URL、认证、Job 生命周期和快速开始 | `docs/quickstart.md` 等指南 |
| Reference | Method、Path、参数、Schema、响应和错误 | `openapi/openapi.json` |
| Guide | 轮询、Webhook 设计、错误处理、语言示例 | `docs/` 指南与生成示例 |

新增 endpoint 时先修改 OpenAPI、Schema、Fixture 和契约测试，再更新导航说明。不要在 Markdown 或组件中复制字段定义。

## 视觉方向

Portal 复用 `apps/web/design-tokens.css` 的系统 CJK 字体、代码字体、浅灰画布、蓝色交互、边框和圆角。Scalar 默认网络字体关闭，通过其主题变量映射共享基础样式，保留深浅色切换。页面提供快速开始、API Reference 与工作台入口；数据字段仍只来自 OpenAPI，未把接口定义复制到 UI。

主题配置依据 [Scalar 官方主题文档](https://github.com/scalar/scalar/blob/main/documentation/themes.md)，并在固定版本中实际验证。本项目未修改 API 契约或接入真实认证；本地示例继续使用虚构数据。
