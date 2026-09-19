# 多语言客户端

OpenGEO 以 OpenAPI 3.1 为契约源。语言客户端应由同一份契约生成或校验，避免各语言手工复制字段和错误语义。

## 当前可用

### TypeScript

```ts
import { OpenGEOClient } from '@opengeo/client';

const client = new OpenGEOClient({ baseUrl: 'http://localhost:8787' });
const job = await client.createMonitorRun(
  {
    capability_id: 'observe.ai_answer',
    prompts: ['OpenGEO 在这个问题中的可见度如何？'],
    turnaround_class: 'best_effort',
    interaction_mode: 'search',
  },
  'language-typescript-001',
  5000,
);
console.log(job);
```

同一客户端还提供 `getJobItems(jobId)`、`finalizePartial(jobId, { cancel_remaining })` 和 `cancelJob(jobId)`，分别对应 Job 结果项、部分结果定稿和取消接口。它们都沿用同一套认证和 HTTP 错误处理。

### cURL

```bash
curl -X POST "http://localhost:8787/v1/monitor-runs" \
  -H "content-type: application/json" \
  -H "idempotency-key: language-curl-001" \
  -H "prefer: wait=5" \
  -d '{
    "capability_id": "observe.ai_answer",
    "prompts": ["OpenGEO 在这个问题中的可见度如何？"],
    "turnaround_class": "best_effort",
    "interaction_mode": "search"
  }'
```

## 计划中的语言示例

Python、Go 和 Java 示例将在对应客户端进入公开仓库后加入。它们必须覆盖同一组行为：Bearer 认证、`Idempotency-Key`、`Prefer`、Job 查询、partial result、取消和错误分类。只有复制运行并通过契约测试后，语言才会从计划状态变为可用状态。

## 生成约束

- 生成器的输入只能是版本化 OpenAPI 文件。
- 示例不能包含真实凭据、供应商字段、采购成本或客户数据。
- 生成客户端的错误类型必须保留 HTTP 状态和 Job 层状态的区别。
- 客户端新增字段前，先更新契约和 Fixture，再更新生成产物和文档。
