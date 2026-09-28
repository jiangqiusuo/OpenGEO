# @sysiphus/client

OpenGEO Community 的 TypeScript 客户端。客户端只依赖公开 OpenGEO 契约，不包含供应商适配器或商业服务逻辑。

```ts
import { OpenGEOClient } from '@sysiphus/client';

const client = new OpenGEOClient({ baseUrl: 'http://localhost:8787' });
const job = await client.createMonitorRun(
  { capability_id: 'observe.ai_answer', prompts: ['How visible is OpenGEO?'] },
  'example-001',
);
console.log(job);
```

完整示例见仓库的 [Quickstart](../../docs/quickstart.md)。

## HTTP 错误

请求返回非 2xx 状态时，客户端会抛出 `OpenGEORequestError`。它保留 `status`、公共错误码 `code`、安全的 `details`、`requestId` 和 `Retry-After`，调用方可以据此区分鉴权失败、资源不存在、状态冲突、限流和暂不可用，而不必通过字符串解析错误消息。

```ts
import { OpenGEORequestError } from '@sysiphus/client';

try {
  await client.capabilities();
} catch (error) {
  if (error instanceof OpenGEORequestError && error.status === 429) {
    const wait = error.retryAfter ?? '使用有上限的退避';
    console.log(`请求被限流，稍后重试：${wait}`);
  }
}
```

`details` 保持为未知对象，避免客户端把服务端扩展字段误当作稳定契约。客户端不会自动重试写请求；重试策略应由调用方结合 `Idempotency-Key`、Job 状态和 `Retry-After` 自行决定。
