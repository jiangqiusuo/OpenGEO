# 贡献指南

感谢你帮助改进 OpenGEO Community。完整的分支、提交、Issue 分诊、PR、评审、合并和发布流程见 [`docs/development-workflow.md`](docs/development-workflow.md)。公开 Issue 的范围和标签约定见 [`docs/issue-triage.md`](docs/issue-triage.md)。

## 开始之前

1. 先搜索已有 Issue 和 Pull Request，避免重复工作。
2. 涉及公共字段、状态、错误或语义的变更，先创建设计 Issue，再开始实现。
3. 从最新 `main` 创建工作分支；`main` 受保护，禁止直接推送。
4. 不要提交真实凭据、客户数据或未公开的敏感信息。
5. 示例必须虚构、脱敏并与特定外部服务无关。

## 分支和提交

分支使用短横线命名，例如 `feat/job-client`、`fix/partial-result`、`docs/api-guide`、`chore/ci-policy`。提交信息遵循 Conventional Commits：

```text
<type>(<scope>): <imperative summary>
```

允许的 `type` 包括 `feat`、`fix`、`docs`、`refactor`、`test`、`chore`、`build` 和 `ci`。公共契约变更必须在提交正文或 PR 中说明兼容性影响。

## 本地验证

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:contracts
pnpm build
pnpm audit --audit-level=high
```

## Pull Request

- PR 标题必须符合 Conventional Commits；可以先以 Draft PR 开始讨论。
- PR 只解决一个可审查的问题，描述问题、最终行为、契约影响、风险和实际验证结果。
- 所有 PR 必须通过 `verify` 和 `pr-policy`；对话必须解决后才能合并。
- 默认使用 Squash merge，合并提交应保留清晰的 Conventional Commit 标题。
- 公共契约变更需要同时更新 TypeScript 类型、JSON Schema、OpenAPI、Fixture、契约测试和变更日志。
- 未完成的能力必须标记为 planned，不得把路线图或占位实现描述为已可用。

## 兼容性

- 新增可选字段通常属于兼容变更。
- 删除字段、收窄枚举或改变字段含义属于破坏性变更，需要新版本契约。
- `interaction_mode` 与 `turnaround_class` 不得合并。
- 公开 Job 不得暴露私有执行状态。

提交贡献即表示你同意按照 Apache License 2.0 提供该贡献，并遵守 [行为准则](CODE_OF_CONDUCT.md)。
