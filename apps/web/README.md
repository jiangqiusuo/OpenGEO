# OpenGEO Community 工作台

这是 OpenGEO Community 的前端原型，用虚构数据展示监测总览、指标依据、任务进度和优化工作流。

## 当前可用

- 响应式工作台总览。
- 品牌提及率、绝对 Top 3、自有域名引用率和有效样本的示例展示；有效比例不等于任务完成度。
- 按指标 ID 选择公式与支持样本，按观察 ID 打开对应回答和检索来源。
- 模态详情支持 Escape、Tab/Shift+Tab 焦点循环及关闭后的焦点恢复。
- 手机导航与证据卡保留提及、排名和来源；模拟数据说明在主要内容区常驻。
- 部分结果和统一 Job 状态的界面表达。
- 只读活动摘要，分别标记示例数据、已同步、暂不可用和 Fixture 回退。
- 尚未接入的操作标记“规划中”，侧栏规划功能、演示趋势和技术标识默认折叠；预设曲线不参与本次指标计算。

在线预览：<https://app.open-geo.net/>（备用地址：<https://opengeo-workbench.pages.dev/>）

品牌首页：<https://open-geo.net/>。首页使用静态 HTML，提供产品预览、工作流程、方法文章和 FAQ；所有数字来自公开 Fixture 并注明模拟数据，不代表客户或优化成果。现有工作台、介绍、博客和文档保留为独立入口。

本地首页预览为 `/homepage/`。构建输出 `homepage/index.html`，部署时将品牌根域 `/` 重写到该静态路径；工作台域名的 `/` 继续使用 Vite 应用。首页 canonical 指向品牌根域，独立 `home-sitemap.xml` 只列根域首页，原博客地图保持原有 URL。

品牌首页不加载访问统计或交互录屏脚本；现有公开介绍/博客的独立测量授权逻辑保持。后续如接线首页测量，需要单独验证同意、撤回、查询参数与来源隔离。

工作台与公开介绍、博客、隐私页共用 `design-tokens.css` 的颜色、CJK 字体、代码字体、焦点和圆角。公共静态页面引用带内容指纹的同一份样式，工作台由 Vite 打包；阅读页面保留独立的正文尺寸与行宽。接口的部分结果处理见 [操作指南](../../docs/job-results.md)。

公开博客：<https://app.open-geo.net/blog/>；RSS：<https://app.open-geo.net/rss.xml>。博客文章只使用公开方法和脱敏示例，不包含任务、客户或供应商数据。

公开页面的测量默认关闭。部署环境可以通过运行时配置接入 GA4 或 Clarity，但页面只在访客明确同意后发出脱敏事件；分析 ID 不写入 Community 源码。

## 本地运行

从仓库根目录执行：

```bash
pnpm web:dev
```

默认页面使用编译时类型检查的 `workbench.v1` 公开 Fixture，不需要 API 或密钥。若要读取本地 Mock API：

```bash
pnpm mock
VITE_OPEN_GEO_API_URL=http://127.0.0.1:8787 pnpm web:dev
```

Windows PowerShell 可先设置 `$env:VITE_OPEN_GEO_API_URL='http://127.0.0.1:8787'`。工作台会读取 `/v1/capabilities`、演示 Job 和 Job items；请求或响应校验失败时自动回退到版本化 Fixture，并在左侧数据源状态中明确显示，不会把失败伪装成实时数据。

总览预览前5条有效观察，指标详情展示前20条支持样本；计算范围为全部已加载观察，不代表服务端分页后的全部数据。指标口径以 [`workbench-metrics.v1`](../../docs/workbench-metrics.md) 为准。来源仅将合法 HTTP/HTTPS 且不含 URL 用户名/密码的地址渲染为链接，检索来源不等同回答明确引用。

活动摘要使用独立数据源。默认 Mock 不提供活动接口，因此即使监测数据成功读取，活动卡片仍标记为“示例数据”。需要测试活动摘要时，可将 `VITE_OPEN_GEO_ACTIVITY_URL` 设置为你控制的 Mock JSON 地址，并同时配置 `VITE_OPEN_GEO_API_URL`。这项配置不会向该地址附加 API Key。

响应格式为 `{"audit":{"items":[{"id":"activity_demo_1","action":"workspace.created","operationKey":"demo:created:1","createdAt":"2026-10-01T00:00:00.000Z"}],"nextCursor":null,"hasMore":false}}`。字段也可使用 `operation_key`、`created_at`、`next_cursor`、`has_more`。工作台最多保留 10 条，卡片预览 4 条；其他字段不进入摘要。缺失摘要时显示“暂不可用”，请求失败时显示“Fixture 回退”，两种状态均保留示例供查看。

生产构建：

```bash
pnpm web:build
```

当前页面只使用虚构样本，不会调用外部服务，也不会创建真实监测任务。
