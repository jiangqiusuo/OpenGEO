# 贡献指南

感谢你帮助改进 OpenGEO Community。

## 开始之前

1. 先搜索已有 Issue，避免重复工作。
2. 涉及公共字段、状态或语义的变更，请先创建设计 Issue。
3. 不要提交真实凭据、客户数据、外部执行方私有响应、采购成本或内部路由信息。
4. 示例必须虚构、脱敏并与特定外部服务无关。

## 本地验证

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Pull Request 应说明问题、最终行为和验证方式。公共契约变更需要同时更新 TypeScript 类型、JSON Schema、OpenAPI、Fixture 和相关测试。

## 兼容性

- 新增可选字段通常属于兼容变更。
- 删除字段、收窄枚举或改变字段含义属于破坏性变更，需要新版本契约。
- `interaction_mode` 与 `turnaround_class` 不得合并。
- 公开 Job 不得暴露私有执行状态。

提交贡献即表示你同意按照 Apache License 2.0 提供该贡献。
