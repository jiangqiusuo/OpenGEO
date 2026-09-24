# OpenGEO Community 开发工作流

这份规则适用于公开 `opengeo` 仓库。它把个人维护阶段的快速迭代转换成可以扩展到外部贡献者的协作流程。

## 分支模型

`main` 是可审查、可构建的集成分支。所有改动都从最新 `main` 创建短生命周期分支，并通过 Pull Request 合并：

| 变更类型 | 分支示例 |
|---|---|
| 新能力 | `feat/job-client` |
| Bug 修复 | `fix/partial-result` |
| 文档 | `docs/api-guide` |
| 重构 | `refactor/client-boundary` |
| 测试 | `test/contract-fixture` |
| CI/依赖 | `ci/audit-gate`、`chore/dependency-update` |

不要在 `main` 上直接提交。紧急修复也先创建分支和 Draft PR；只有 GitHub 不可用或需要恢复仓库时，维护者才可以记录原因后使用管理员应急路径。

## 提交信息

提交使用 Conventional Commits：

```text
<type>(<scope>): <imperative summary>
```

例如：

```text
feat(client): add idempotent monitor request
fix(contracts): require capability id
docs(api): clarify polling semantics
ci(policy): validate pull request titles
```

`type` 使用 `feat`、`fix`、`docs`、`refactor`、`test`、`chore`、`build` 或 `ci`。`scope` 使用 `contracts`、`client`、`cli`、`mock`、`metrics`、`docs` 或实际受影响的包。标题使用祈使语气，避免把 Issue 编号和实现细节塞进标题。

## Issue 到 PR

公开 Issue 的范围、标签和关闭规则见 [`docs/issue-triage.md`](./issue-triage.md)。跨仓库路线、供应商状态和内部凭据仍由私有 Goal 看板管理。

1. 先搜索已有 Issue/PR。
2. 公共契约、错误语义、状态机或兼容性变更先提交设计 Issue。
3. Bug Issue 必须包含版本、环境和最小复现；功能 Issue 必须说明用户问题、边界和兼容性影响。
4. 开发分支保持聚焦，完成一项可审查的改动后创建 Draft 或 Ready PR。
5. PR 描述必须说明问题、最终行为、契约影响、风险、迁移/回滚方式和实际验证命令。

## 自动门禁和评审

每个 PR 必须通过：

- `verify`：安装锁定依赖，执行 lint、类型检查、测试、契约测试、构建和高危依赖审计。
- `pr-policy`：检查 PR 标题和正文是否满足基本协作要求。
- 所有 review conversation 必须解决。

当前维护阶段不强制第二位审批人，但有外部贡献者后应为公共契约、认证、安全和破坏性变更增加至少一位维护者审批。维护者应优先审查行为、兼容性、测试证据和公开边界，再审查代码风格。

## 合并和发布

- 默认使用 Squash merge，保持 `main` 历史按一个 PR 一个主题组织。
- 合并前分支必须与最新 `main` 同步，CI 必须重新通过。
- 公共契约发布时同步 `package.json`、OpenAPI `info.version`、CHANGELOG 和 Git tag。
- 发布前运行完整 CI、契约测试和安全审计；发布说明只描述已实现并通过验收的能力。

## 安全和公开边界

凭据、客户数据、供应商秘密、私有路由、采购成本和未修复漏洞不能进入公开 Issue、PR、日志或测试 Fixture。未修复漏洞使用 GitHub 私有漏洞报告；不要在公开 Issue 中讨论可利用细节。

## 维护者应急路径

如果需要绕过正常流程恢复仓库，维护者必须在后续 Issue 或 PR 中记录原因、影响、恢复步骤和补充测试。应急路径不能用来绕过安全审查或把未完成能力直接发布到 `main`。
