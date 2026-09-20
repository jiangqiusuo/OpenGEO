# @opengeo/client

OpenGEO Community 的 TypeScript 客户端。客户端只依赖公开 OpenGEO 契约，不包含供应商适配器或商业服务逻辑。

```ts
import { OpenGEOClient } from '@opengeo/client';

const client = new OpenGEOClient({ baseUrl: 'http://localhost:8787' });
const job = await client.createMonitorRun(
  { capability_id: 'observe.ai_answer', prompts: ['How visible is OpenGEO?'] },
  'example-001',
);
console.log(job);
```

完整示例见仓库的 [Quickstart](../../docs/quickstart.md)。
