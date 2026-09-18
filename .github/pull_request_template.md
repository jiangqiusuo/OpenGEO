## 问题与结果

请说明这个 PR 解决的问题，以及合并后开发者能够观察到的最终行为。

## 契约影响

- [ ] 不改变公共契约
- [ ] 已同步 TypeScript 类型、JSON Schema、OpenAPI、Fixture 和契约测试
- [ ] 已在 `CHANGELOG.md` 记录兼容性影响

## 安全与公开边界

- [ ] 示例和测试数据均为虚构、脱敏数据
- [ ] 不包含凭据、客户数据、上游任务 ID、采购成本、账户池或私有路由
- [ ] `interaction_mode` 与 `turnaround_class` 保持独立
- [ ] 未把未实现能力描述为已经可用

## 验证

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:contracts
pnpm build
```

请列出实际运行结果，以及尚未运行的检查和原因。
