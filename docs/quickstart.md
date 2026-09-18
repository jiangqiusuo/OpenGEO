# OpenGEO Quickstart

这份 Quickstart 使用仓库内置的 Mock API，帮助你在本地验证 Job、幂等键和轮询流程。Mock 不连接外部服务，也不会产生外部副作用。

## 1. 启动 Mock API

在仓库根目录执行：

```bash
pnpm install
pnpm mock
```

默认地址是 `http://localhost:8787`。另开一个终端验证健康检查：

```bash
curl http://localhost:8787/v1/capabilities
```

## 2. 创建一个监测 Job

所有长时间操作都返回 Job。请求必须带有每次调用唯一的 `Idempotency-Key`；短暂等待可以通过 `Prefer: wait=N` 表达，`N` 的单位是秒。

```bash
curl -X POST http://localhost:8787/v1/monitor-runs \
  -H 'content-type: application/json' \
  -H 'idempotency-key: quickstart-001' \
  -H 'prefer: wait=5' \
  -d '{
    "prompts": ["OpenGEO 在这个问题中的可见度如何？"],
    "turnaround_class": "best_effort",
    "interaction_mode": "search"
  }'
```

Mock 会返回一个带有 `Location` 的 `202 Accepted` Job。真实部署若启用认证，还需要添加：

```text
Authorization: Bearer <your-api-key>
```

不要把 API key 写入仓库、示例文件或日志。

## 3. 查询 Job 和结果

从创建响应中取得 `id`，然后查询：

```bash
curl http://localhost:8787/v1/jobs/job_demo_queued
curl http://localhost:8787/v1/jobs/job_demo_queued/items
```

客户端应根据 `status` 和 `result_state` 判断生命周期与结果可用性。`partial` 结果可以先读取当前已完成项目，再根据业务需要调用 `finalize-partial` 或继续等待。

## 4. 使用 TypeScript 客户端

```ts
import { OpenGEOClient } from '@opengeo/client';

const client = new OpenGEOClient({ baseUrl: 'http://localhost:8787' });
const job = await client.createMonitorRun(
  {
    prompts: ['OpenGEO 在这个问题中的可见度如何？'],
    turnaround_class: 'best_effort',
    interaction_mode: 'search',
  },
  'quickstart-typescript-001',
  5000,
);

console.log(job);
```

生产环境请使用部署方提供的 HTTPS Base URL，并通过安全的运行时密钥管理注入认证信息。公共契约只保证 Job、Observation、Capability 和错误结构；具体可用能力以 `/v1/capabilities` 返回值为准。

## 5. 下一步

- 阅读 [公共契约](./contracts.md)。
- 查看 [OpenAPI 3.1 定义](../openapi/openapi.json)。
- 运行 `pnpm test:contracts` 验证 Schema、Fixture 和 OpenAPI 引用。
- 运行 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` 完成完整本地检查。
