# 错误、重试与限流

OpenGEO 的错误处理分成 HTTP 层、Job 层和结果项层。客户端应保留这些层次，不要把所有非成功状态转换成空结果。

## 当前契约中的 HTTP 错误

| 状态 | 含义 | 客户端动作 |
|---:|---|---|
| 400 | 请求字段、Header 或执行选项无效 | 修正请求后再提交；不要盲目重试同一请求 |
| 404 | Job 或其他资源不存在 | 检查 ID、Workspace 和环境；不要自动创建替代任务 |
| 409 | 当前资源状态不允许该动作，或幂等键冲突 | 重新读取资源状态；确认原请求是否已经生效 |
| 501 | 契约预留能力当前未实现 | 将能力标记为 unavailable，不要降级成另一种能力 |

具体错误 Schema、字段和示例以 [OpenAPI 3.1](../openapi/openapi.json) 为准。

## Job 层和结果项层

HTTP `202` 只表示请求已被接受，不表示所有结果已经成功。客户端还要处理 Job 的 `queued`、`running`、`partial`、`succeeded`、`failed`、`cancelled` 和 `finalized_partial`，以及结果项的 `not_requested`、`not_supported`、`not_available`、`failed_to_extract` 和 `redacted` 等状态。

这些状态表达的信息不同：

- `not_supported`：当前能力或平台不支持该请求。
- `not_requested`：调用方没有请求该结果。
- `not_available`：请求了，但当前没有可用结果。
- `failed_to_extract`：已取得原始结果，但解析失败。
- `redacted`：结果存在，但公开响应按契约隐藏了内容。

## 重试原则

1. 创建请求必须使用唯一的 `Idempotency-Key`。网络超时后先用同一个键重放，不能无条件生成新任务。
2. 查询 Job 可以重试，但应使用退避并复用同一 Job ID。
3. 不要重试 `submission_unknown` 或未确认提交结果的请求，先查询原始 Job 或使用运营侧核对流程。
4. 不要把 `unsupported`、`unavailable` 或解析失败静默降级成另一种能力。

## 限流

Community 契约 0.1.0 尚未发布固定的数值限流表。客户端应：

- 识别 HTTP `429` 和可能存在的 `Retry-After`；
- 在没有 `Retry-After` 时使用有上限的指数退避；
- 限制并发轮询数量；
- 将最终失败记录为可观察的错误，而不是无限重试。

正式限流值、配额和计费规则进入公开版本前，必须同时更新 OpenAPI、错误文档、客户端测试和变更日志。
