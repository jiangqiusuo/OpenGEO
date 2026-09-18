## 问题与结果

请说明这个 PR 解决的问题，以及合并后开发者能够观察到的最终行为。

## 工作流检查

- [ ] 我从最新 `main` 创建了分支，没有直接向 `main` 推送
- [ ] PR 标题符合 Conventional Commits（例如 `feat(cli): add job command`）
- [ ] 这个 PR 只解决一个可审查的问题；未完成工作已拆分为后续 Issue
- [ ] 我已搜索相关 Issue/PR，并在需要时链接设计 Issue

## 契约影响

- [ ] 不改变公共契约
- [ ] 已同步 TypeScript 类型、JSON Schema、OpenAPI、Fixture 和契约测试
- [ ] 已在 `CHANGELOG.md` 记录兼容性影响

## 安全与公开边界

- [ ] 示例和测试数据均为虚构、脱敏数据
- [ ] 不包含凭据、客户数据、上游任务 ID、采购成本、账户池或私有路由
- [ ] `interaction_mode` 与 `turnaround_class` 保持独立
- [ ] 未把未实现能力描述为已经可用

## 评审与发布

- [ ] 已考虑向后兼容性、迁移和回滚方式
- [ ] 如涉及公开契约、版本或文档，已同步变更日志和对应文档
- [ ] 如涉及安全边界，已说明公开/私有字段和错误信息边界

## 验证

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:contracts
pnpm build
```

请列出实际运行结果，以及尚未运行的检查和原因。
