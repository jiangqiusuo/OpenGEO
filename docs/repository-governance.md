# 公开仓库治理基线

OpenGEO Community 的仓库规则用于保护公共契约和可复制开发流程，同时保持个人维护阶段仍可正常迭代。

## main 分支

建议启用以下保护：

- 合并前必须通过 `verify` CI；
- 分支必须与最新 `main` 保持同步；
- 合并前解决全部 review conversation；
- 禁止强制推送和删除 `main`；
- 使用 Pull Request 合并；个人维护阶段不强制第二位审批人；
- 不对管理员启用不可绕过限制，避免单维护者在 CI 配置故障时被永久锁死。

## Pull Request

PR 必须说明问题、最终行为、契约影响和实际验证结果。公共契约变更应同时更新：

1. TypeScript 类型；
2. JSON Schema；
3. OpenAPI；
4. Fixture；
5. 契约测试；
6. 兼容性说明和变更日志。

仓库的 `.github/pull_request_template.md` 提供统一检查表。

## Issue 分类

建议使用以下标签：

| 标签 | 用途 |
|---|---|
| `area:contracts` | 公共契约、Schema、OpenAPI |
| `area:client` | TypeScript 或其他语言客户端 |
| `area:cli` | Community CLI |
| `area:docs` | Quickstart、Reference 和指南 |
| `breaking-change` | 可能破坏兼容性的提案 |
| `security` | 已公开且适合公开跟踪的安全加固；未修复漏洞仍使用 Security Advisory |

Bug 和功能建议继续使用 Issue Form。真实凭据、客户数据、供应商秘密和未修复漏洞不得进入公开 Issue。

## 发布

- 公共契约版本、OpenAPI `info.version`、CHANGELOG 和 Git tag 保持一致。
- 发布前运行完整 CI 和契约测试。
- Planned endpoint 在实现并通过验收前继续返回 `501`，文档中明确标记为计划状态。
