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

### cURL 与 Python

由 OpenAPI 生成并通过 `pnpm examples:check` 校验的完整示例位于：

- [cURL 监测 Job](./examples/curl/monitor-run.sh)
- [Python 监测 Job](./examples/python/monitor_run.py)
- [Go 监测 Job](./examples/go/monitor_run.go)
- [Java 监测 Job](./examples/java/MonitorRun.java)

示例只使用环境变量注入 Base URL、API Key 和幂等键，不把凭据写入文件。运行 `pnpm examples:generate` 可根据当前 OpenAPI 契约重新生成。

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

## 示例范围

当前 Go 和 Java 文件是可复制运行的单请求示例，使用各自标准库提交监测 Job；它们与 cURL/Python 一样覆盖 Bearer 认证、`Idempotency-Key`、`Prefer` 和 HTTP 错误保留。Job 查询、partial result 和取消应继续使用同一 OpenAPI 契约中的 endpoint，待对应语言客户端进入仓库后再提供完整封装。

## 生成约束

- 生成器的输入只能是版本化 OpenAPI 文件。
- 示例不能包含真实凭据、供应商字段、采购成本或客户数据。
- 生成客户端的错误类型必须保留 HTTP 状态和 Job 层状态的区别。
- 客户端新增字段前，先更新契约和 Fixture，再更新生成产物和文档。
- 运行 `pnpm examples:generate` 重新生成全部四种无依赖示例，`pnpm examples:check` 会在 CI 中阻止漂移。
