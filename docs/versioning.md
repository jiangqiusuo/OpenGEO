# 公共契约版本与兼容策略

当前公共契约版本是 `0.1.0`，由 `packages/contracts/src/version.ts` 中的 `PUBLIC_CONTRACT_VERSION` 定义。OpenAPI 文档和后续 SDK 发布必须与这个值保持一致。

## 版本规则

- `MAJOR` 版本用于不兼容变更，例如移除字段、改变字段类型、改变 Job 生命周期语义或改变错误结构。
- `MINOR` 版本用于向后兼容的新增，例如可选字段、新的 capability 或新的 endpoint。
- `PATCH` 版本用于不改变契约含义的修复，例如示例、描述、校验提示和文档链接修正。

在 `1.0.0` 之前，契约仍处于公开演进阶段。每次变更都必须在 `CHANGELOG.md` 中记录影响范围、迁移方式和验证结果；如果变更无法保持向后兼容，必须明确提升主版本或在发布说明中标记迁移窗口。

## 稳定性边界

以下内容属于公共契约，变更需要版本评估：

- OpenAPI path、method、request/response schema 和错误 code。
- Job、Observation、Capability、MetricResult 的公开字段和枚举。
- `Prefer: wait`、`Idempotency-Key`、部分结果和取消语义。
- `packages/client` 导出的类型和方法签名。

供应商执行细节、内部路由、采购成本、凭据和客户数据不属于公共契约，也不能通过版本文件或示例发布。

## 发布前检查

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

契约测试会检查 OpenAPI 版本与 `PUBLIC_CONTRACT_VERSION` 一致，并验证 JSON Schema、Fixture 和外部 `$ref`。
