# GitHub Issue 分诊规则

这份规则适用于公开的 `opengeo` Community 仓库。Issue 是公开问题和贡献入口；跨仓库路线、供应商状态、预算、凭据和内部部署仍记录在私有 `opengeo-internal` 看板。

## 什么时候创建 Issue

适合创建 Issue 的内容包括：

- 可以复现的 Bug，包含版本、环境和最小复现步骤；
- 面向公开契约、客户端、CLI、Mock 或文档的功能建议；
- OpenAPI、Schema、Fixture 或示例之间的不一致；
- 需要先讨论兼容性、错误语义或用户体验的变更。

不应放入公开 Issue 的内容包括真实凭据、客户数据、供应商内部路由、采购成本、生产地址和未修复漏洞细节。安全问题使用仓库的 Security Advisory 入口。

## Issue、Goal 与 PR 的关系

```text
公开 Issue       收集问题或建议
      ↓
维护者分诊       复现、确认范围、添加标签
      ↓
Goal / 计划      只有跨仓库或需要验收的工作才进入内部 Goal
      ↓
Pull Request     一个可审查的实现切片
      ↓
CI + Review      verify、pr-policy 和人工审查
      ↓
关闭 Issue       PR 合并且验收证据齐全
```

小型文档修正可以直接创建 PR；涉及公开契约、兼容性或行为变化时，先创建 Issue 再实现。

## 建议标签

| 标签组 | 值 | 用途 |
|---|---|---|
| 类型 | `bug`、`enhancement`、`documentation`、`security` | 说明 Issue 是问题、功能、文档还是安全事项 |
| 区域 | `area:contract`、`area:client`、`area:cli`、`area:mock`、`area:docs` | 指向受影响的公开模块 |
| 优先级 | `priority:p0`、`priority:p1`、`priority:p2` | 由维护者分诊，不由提交者单方面承诺 |
| 状态 | `status:triage`、`status:accepted`、`status:blocked`、`status:ready` | 表示分诊和实现状态 |

Issue 模板提供事实收集；维护者在分诊后补充区域、优先级和状态标签。标签名称可以逐步在 GitHub 仓库中建立，不要求一次性创建全部标签。

## 关闭和关联

- PR 正文使用 `Closes #123` 或 `Fixes #123` 关联已经解决的 Issue；只有验收完成后才关闭。
- 纯讨论、重复问题和无法复现的问题应说明原因后关闭，保留必要的上下文。
- 需要用户提供私有信息时，将 Issue 转为维护者评论并引导使用安全渠道，不要求用户公开粘贴凭据。
- Issue 不替代 `GOAL.md`；Goal 负责跨仓库交付结果，Issue 负责公开问题入口。
