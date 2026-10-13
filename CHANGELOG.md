# Changelog

## Unreleased

- 修复浏览器客户端调用原生 fetch 的接收者绑定，避免本地 Mock 读取触发 Illegal invocation 并回退 Fixture；默认与显式传入 fetch 均有回归。公共契约不变，npm 已发布 0.1.1 尚不包含此修复。

- 保护博客代码块免受 CDN 邮箱混淆改写，保留 `package@version` 命令的静态文本与复制内容。

- 新增已发布 0.1.1 CLI 的本地任务教程和 PowerShell 代码块，说明同 ID 查询、结果读取、幂等重试与取消；补充 CLI 到本机 HTTP Mock 的完整生命周期回归，明确 `--wait` 不自动轮询。无需发布新的 npm 包或改变公共契约。

- 公开页支持独立、默认关闭的交互录屏选择：全部正文屏蔽，排除来源地址、敏感 URL、工作台与隐私页，下载后复核授权并支持撤回、存储失败和跨标签页停止。部署配置缺省时不加载第三方录屏。
- 公开介绍、博客与隐私页使用内容指纹版本的 CSS/脚本，避免新 HTML 配上浏览器缓存的旧样式或测量/复制逻辑；构建同时输出对应资源。
- 发布可运行的 Mock→Job 教程，文章代码与下载脚本均来自同一示例。Mock 监测创建新增同 ID 的 queued/running/succeeded 模拟、幂等冲突与容量边界；未知 Job 返回 404，未模拟的创建能力返回 501，替代此前永远 queued 的响应。仅影响本地 Mock，公共 API 契约不变。
- 新增静态产品介绍页 `/about/` 与工作台入口；支持部署配置的 GA4 v2 同意管理，默认关闭，排除私有页面、敏感 URL、预览域名，提供撤回和加载失败处理。
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
