# OpenGEO Community 工作台

这是 OpenGEO Community 的前端原型，用虚构数据展示监测总览、指标依据、任务进度和优化工作流。

## 当前可用

- 响应式工作台总览。
- 品牌提及率、绝对 Top 3、自有域名引用率和样本完整度的示例展示。
- 可交互的指标依据抽屉。
- 部分结果和统一 Job 状态的界面表达。
- 所有尚未接入的操作均显示“规划中”，点击后会提示当前状态。

在线预览：<https://app.open-geo.net/>（备用地址：<https://opengeo-workbench.pages.dev/>）

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

生产构建：

```bash
pnpm web:build
```

当前页面只使用虚构样本，不会调用外部服务，也不会创建真实监测任务。
