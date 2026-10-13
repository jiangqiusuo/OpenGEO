# 博客内容维护

文章的唯一内容源是 `apps/web/src/blog-content.ts`。Vite 在开发和构建时从同一份内容生成列表、文章页、RSS、sitemap 和 JSON-LD；不要再手工修改生成的 HTML/XML。

## 发布流程

1. 从最新 main 创建分支，新增文章，先设置 `status: 'draft'`。
2. 使用小写英文和连字符设置唯一 `slug`，填写标题、摘要、分类和正文。英文标题/摘要用于辅助阅读，当前文章正文为中文，不代表已有完整英文版本。
3. 审核事实、功能描述与示例，填入 `reviewedBy`，设置 `status: 'published'` 及真实的发布日期、更新日期。
4. 运行 `pnpm test`、`pnpm lint`、`pnpm typecheck` 和 `pnpm web:build`。构建会拒绝重复/非法路径、未审核文章及非法日期。
5. 创建 PR，经 CI 后合并并部署。草稿不会出现在构建产物中；未来日期的文章在到期后的下一次构建才出现，不会自动定时上线。

阅读时间根据正文长度计算。正文以纯文本段落维护，HTML 标签会转义。修改 slug 会改变文章 URL，应保留旧路径重定向。

## 页面与测量

正文直接存在于 HTML 中，禁用 JavaScript 也可阅读。真实静态页面共享 `/public-site.js`、`/content.css` 和 `/privacy/` 设置入口；不存在的路径由 `404.html` 返回错误页面。

构建默认不配置分析收集器。部署时可通过 `OPENGEO_PUBLIC_GA4_ID` 配置 GA4 ID，不在公开源码中硬编码。开发与 Pages 预览域名不加载分析；实际发布域名上，也只有 v2 明确同意后才在 `/about/` 和真实博客页面加载 Google 脚本。旧 v1 授权不会自动升级。

固定事件为 `landing_view`、`blog_index_view`、`blog_article_view`、`docs_click`、`github_click` 和 `workbench_click`，另发送显式 `page_view`。调用参数中的页面地址无查询参数或片段，来源字段为空；带参数/片段的访问、工作台、API、设置页和 404 不启动收集器。不会把输入、API Key 或任务数据写入事件。

存储不可用、Do Not Track 或 Global Privacy Control 时不启用分析。撤回先禁用事件、清理本部署分析 Cookie，再重载文档以卸载 SDK。第三方脚本被屏蔽时页面仍可使用。GA4 会处理设备、网络信息与分析 Cookie，不能描述为“完全匿名”；Microsoft Clarity 录屏仍未启用。

接线依据：[Google 同意模式](https://developers.google.com/tag-platform/security/guides/consent)、[手动 page_view 与关闭默认 page_view](https://developers.google.com/analytics/devguides/collection/ga4/views)。浏览器请求成功不等同后台报表已出现，后台验收需另记录。
