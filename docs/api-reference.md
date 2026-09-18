# OpenGEO API 开发者入口

OpenGEO 的公开接口以仓库中的 [OpenAPI 3.1 定义](../openapi/openapi.json) 为唯一契约来源。本文帮助开发者从契约、Mock 和客户端开始集成；字段详情、请求参数和响应 Schema 不在 Markdown 中重复维护。

## 文档阅读顺序

1. [Quickstart](./quickstart.md)：启动本地 Mock，创建并查询第一个 Job。
2. [公共契约](./contracts.md)：理解 Job、Observation、Capability、Prompt、Publication 和 Metric Result。
3. [版本与兼容策略](./versioning.md)：确认契约版本和变更规则。
4. [OpenAPI 3.1](../openapi/openapi.json)：查看 endpoint、参数、Schema 和示例的机器可读定义。

## API 分组

| 分组 | Endpoint | 用途 |
|---|---|---|
| Health | `GET /health` | 服务健康状态 |
| Capabilities | `GET /v1/capabilities` | 查询当前可用能力和平台状态 |
| Monitoring | `POST /v1/monitor-runs` | 创建异步监测 Job |
| Jobs | `GET /v1/jobs/{job_id}` | 查询 Job 状态和结果摘要 |
| Job items | `GET /v1/jobs/{job_id}/items` | 查询逐项结果和 Observation |
| Partial result | `POST /v1/jobs/{job_id}/finalize-partial` | 定稿当前已完成的部分结果 |
| Cancellation | `POST /v1/jobs/{job_id}/cancel` | 停止尚未完成的剩余任务 |
| Generation | `POST /v1/generation-jobs` | 创建内容生成 Job |
| Publication | `POST /v1/publications` | 创建发布记录 |
| Verification | `POST /v1/verification-runs` | 创建复测 Job |

## 统一请求规则

- 所有长时操作返回 OpenGEO Job，客户端只需要处理同一套生命周期。
- 每次创建请求都必须提供唯一的 `Idempotency-Key`。
- `turnaround_class` 表示交付速度预期，`interaction_mode` 表示回答交互方式；两者不能互相替代。
- `Prefer: wait=N` 只改变客户端等待行为，不改变 Job 语义。超时后仍使用同一个 Job ID 查询。
- 能力差异以 `GET /v1/capabilities` 为准；客户端不能假设所有平台支持同一组字段。
- `partial` 结果可以先被读取；需要结束当前批次时再调用 `finalize-partial`。

## 最小请求示例

```bash
curl -X POST "http://localhost:8787/v1/monitor-runs" \
  -H "content-type: application/json" \
  -H "idempotency-key: docs-example-001" \
  -H "prefer: wait=5" \
  -d '{
    "prompts": ["OpenGEO 在这个问题中的可见度如何？"],
    "turnaround_class": "best_effort",
    "interaction_mode": "search"
  }'
```

生产环境的认证信息必须由运行时 Secret 注入，不能写进仓库、示例、Issue 或日志。公开仓库的 Mock 不连接外部服务，也不会产生外部副作用。

## 错误和结果处理

客户端应同时读取 HTTP 状态码、Job `status` 和结果 `result_state`。`unsupported`、`unavailable`、`not_requested`、`empty` 和 `parse_failed` 表示不同状态，不能统一转换为成功或空字符串。

错误响应、字段定义和示例以 OpenAPI 文件为准。新增能力时，先更新契约、Schema、Fixture 和契约测试，再更新本页的导航说明。

## 语言客户端

当前仓库提供 TypeScript 客户端：

```ts
import { OpenGEOClient } from '@opengeo/client';

const client = new OpenGEOClient({ baseUrl: 'http://localhost:8787' });
const job = await client.createMonitorRun(
  {
    prompts: ['OpenGEO 在这个问题中的可见度如何？'],
    turnaround_class: 'best_effort',
    interaction_mode: 'search',
  },
  'docs-typescript-001',
  5000,
);
console.log(job);
```

Python、Go 和 Java 示例将在对应客户端进入公开仓库后，直接从同一份 OpenAPI 契约生成或校验，避免手工维护不同版本的字段表。
