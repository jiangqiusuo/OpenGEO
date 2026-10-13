# 处理部分结果、失败与重试

创建请求被接受后，始终保存返回的 Job ID。HTTP 请求成功、Job 执行成功和结果项可用是三个独立判断；字段定义以 [OpenAPI 3.1](../openapi/openapi.json) 为准。

## 先看状态，再决定动作

| 当前状态 | 怎么理解 | 下一步 |
|---|---|---|
| `queued` / `running` | 已接受或仍在执行 | 使用同一个 ID 查询，设置退避间隔和总等待上限 |
| `partial` | 已有部分可用结果，剩余工作未完成 | 先读取 items，再选择等待、定稿或取消 |
| `succeeded` | 执行成功结束 | 核对 `result_state` 与每项可用性，不把成功直接等同所有字段存在 |
| `failed` | 执行失败结束 | 保留已有证据及错误；不要把失败响应改成“没有提及” |
| `cancelled` | 执行已取消 | 重新读取状态及已有 items；取消不是删除结果 |
| `finalized_partial` | 当前部分结果已定稿 | 按部分覆盖范围使用结果，不能标记为全量成功 |

客户端查询超时只表示这次查询没有完成，不代表 Job 失败或取消。`Prefer: wait=N` 只限制本次创建请求的等待窗口；CLI `--wait` 不会自动循环查询。

## 等待、定稿、取消分别适合什么时候

| 决定 | 请求 | 结果解释 |
|---|---|---|
| 继续等待 | 查询原 Job 和 items | 保留原任务，不重新创建另一批 |
| 使用当前结果并停止剩余工作 | `POST /v1/jobs/{job_id}/finalize-partial`，body 为 `{"cancel_remaining":true}` | 根据返回状态确认定稿，记录实际覆盖范围 |
| 只请求停止剩余工作 | `POST /v1/jobs/{job_id}/cancel` | 根据返回状态确认取消，不把已有 items 删除 |

只有当前状态允许时才能定稿或取消。收到 `409` 后先重新读取原 Job，判断是否已经终结或已完成相同动作，不反复提交冲突请求。并发执行可能在请求期间继续推进，最终以服务端返回状态为准。

展示部分结果时，至少同时展示 Job 状态、已完成/总数、实际观察数量及每项可用性。结果数还受查询范围和分页影响，不能用一次 items 响应的长度替代任务总进度。

## 三层错误处理

| 层次 | 检查依据 | 保留的信息 |
|---|---|---|
| HTTP | 状态码与错误信封 | `status`、错误 `code`、安全的请求 ID、`Retry-After` |
| Job | `status`、`result_state`、进度 | Job ID、生命周期及当前已完成范围 |
| 结果项 | 字段可用性 | `not_requested`、`not_supported`、`not_available`、`failed_to_extract`、`redacted` 等原始区别 |

`@sysiphus/client` 的 `OpenGEORequestError` 保留这些 HTTP 信息；客户端不自动重试写操作。网络中断后，同一创建意图应使用**相同请求和原 `Idempotency-Key`**，以免重复创建。修改请求内容时不要复用该键。

`429` 优先遵守 `Retry-After`，兼容秒数和 HTTP 日期，缺失时采用有上限的退避。`401/403` 先确认权限，`400/422` 先修正请求，`404` 先检查 ID 与环境，`501` 表示当前实现不提供能力。未知提交结果先核对原 Job；不要自动更换能力或平台来掩盖失败。轮询必须有请求超时、总等待上限和并发上限。

## 本地练习与真实服务的区别

本地 Mock 创建的 `job_mock_*` 按确定规则由 queued、running 到 succeeded；它不模拟真实等待时长，也不会产生动态 partial。`job_demo_*` 是固定契约 Fixture，查询不会推进；其写操作只是固定示例响应，不代表持久化状态机或完整结果关联。不要用这两种行为推断真实服务中的取消、定稿、结算或性能。

先按 [CLI 本地教程](https://app.open-geo.net/blog/cli-local-quickstart/) 完成创建和读取，再结合本页实现生产客户端。进一步阅读：[错误与限流](./errors-and-limits.md)、[Job 与轮询](./webhooks-and-polling.md)、[CLI 参数](./cli.md)。
