# Job、轮询与 Webhook

OpenGEO 的长时操作统一返回 Job。客户端不需要为不同执行方式维护不同结果结构，而是根据 Job 状态和结果可用性继续工作。

## 推荐的轮询流程

```text
POST /v1/monitor-runs
        │
        ├─ 200：Prefer 等待窗口内完成的同一个 Job
        └─ 202：已接受，读取 Location 或响应中的 Job ID
                  │
                  ├─ GET /v1/jobs/{job_id}
                  └─ GET /v1/jobs/{job_id}/items
```

客户端应使用指数退避或服务端提供的下一次建议时间，避免固定高频请求。每次查询都使用同一个 Job ID；不要因为客户端超时而重新创建任务。

## Job 状态

状态和 `result_state` 必须以契约为准。常见流程包括：

```text
queued → running → succeeded
queued → running → partial → succeeded
queued → running → finalized_partial
queued → cancelled
queued → failed
```

`partial` 表示部分结果已经可以读取，不等于整个 Job 成功。客户端可以先读取已完成的 items，再根据业务决定继续等待、取消剩余任务或调用 `finalize-partial`。

## Prefer: wait

`Prefer: wait=N` 的单位是秒，只改变本次 HTTP 请求最多等待多久，不改变 Job 的生命周期，也不改变执行能力。服务端在窗口内完成时返回同一个 Job；窗口结束时仍应使用返回的 Job ID 继续查询。

## Webhook 状态

Webhook 是后续 Cloud/API 集成的设计入口，当前公开 Community OpenAPI 0.1.0 尚未提供 webhook 注册 endpoint。当前可用方式是轮询 Job；不要根据本页自行拼接未发布的 webhook URL、签名字段或事件名称。

当 webhook 契约进入公开版本时，必须同时提供事件 Schema、签名验证、重放保护、失败重试和幂等规则，并通过 OpenAPI/契约测试后再更新本页。

## 取消和定稿

- `POST /v1/jobs/{job_id}/cancel`：请求停止尚未完成的剩余任务；已经完成的 items 不会被删除。
- `POST /v1/jobs/{job_id}/finalize-partial`：将当前可用的部分结果定稿。是否允许定稿由 Job 当前状态决定，非法状态会返回冲突错误。

这两个动作都应使用原 Job ID，并按返回的 Job 状态继续查询；客户端不能把取消或定稿当作同步删除操作。
