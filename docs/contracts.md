# OpenGEO 公共契约

OpenGEO Community 使用 OpenAPI 3.1 与 JSON Schema Draft 2020-12 描述公共接口。机器可读的入口是 [`openapi.json`](../openapi/openapi.json)。Schema 文件位于 `packages/contracts/schemas/`，OpenAPI 通过相对 `$ref` 直接引用这些文件，避免复制后发生漂移。

## Job 语义

需要等待的能力都返回公共 Job 对象。创建监测任务使用 `POST /v1/monitor-runs`，默认响应为 `202 Accepted`，并在 `Location` 头中给出 `/v1/jobs/{job_id}`。客户端可发送 `Prefer: wait=90` 请求短暂等待；无论是否等待完成，响应都保持同一个 Job 结构。

Job 的 `status` 描述执行生命周期，`result_state` 描述结果可用程度。`partial` 与 `finalized_partial` 是有意公开的状态，客户端可以读取当前结果，或调用 `finalize-partial` 结束剩余工作。`cancel` 用于请求取消尚未完成的工作。

## 可用性

观测中的可选集合必须带 `availability`。`not_requested`、`not_supported`、`not_available`、`failed_to_extract`、`redacted` 与 `unknown` 具有不同含义，不能用空数组替代状态。只有 `observed` 才表示集合已成功采集；空数组仅表示已观测且确实没有条目。

## 能力档位

`interaction_mode` 描述回答方式（`standard`、`reasoning`、`search`、`reasoning_search`），`turnaround_class` 描述期望时效（`best_effort`、`expedited`、`interactive`），两者互相独立。能力目录只声明实际支持的档位，客户端不应根据实现方名称推断能力。

## 当前范围

G0 提供健康检查、能力目录、监测 Job 与 Job 控制接口。生成、发布和验证路径在 OpenAPI 中保留为 `501` 预留项，表示尚未实现；不会伪装成可用功能，也不会连接真实供应商。
