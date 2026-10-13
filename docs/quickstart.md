# OpenGEO Quickstart

这份 Quickstart 使用仓库内置的 Mock API，帮助你在本地验证 Job、幂等键和轮询流程。Mock 不连接外部服务，也不会产生外部副作用。

## 1. 启动 Mock API

在仓库根目录执行：

```bash
pnpm install
pnpm mock
```

Mock 只监听本机 `127.0.0.1:8787`。另开一个终端读取能力目录：

```bash
curl http://localhost:8787/v1/capabilities
```

## 2. 创建一个监测 Job

也可以直接在第二个终端执行 `node examples/mock-to-job.mjs`（或 `pnpm tutorial:mock`），自动完成下面的创建、轮询和结果校验。完整图文教程见 <https://app.open-geo.net/blog/mock-to-job-quickstart/>。

所有长时间操作都返回 Job。请求必须带有每次调用唯一的 `Idempotency-Key`；短暂等待可以通过 `Prefer: wait=N` 表达，`N` 的单位是秒。

```bash
curl -X POST http://localhost:8787/v1/monitor-runs \
  -H 'content-type: application/json' \
  -H 'idempotency-key: quickstart-001' \
  -H 'prefer: wait=5' \
  -d '{
    "capability_id": "observe.ai_answer",
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
curl http://localhost:8787/v1/jobs/job_mock_1
curl http://localhost:8787/v1/jobs/job_mock_1/items
```

用创建响应中的实际 `id` 替换 `job_mock_1`。新建模拟任务首次查询为 `running`，再次查询为 `succeeded/complete`；完成前 items 为空，完成后结果的 `job_id` 与任务一致。该行为按查询次数模拟，不代表真实平台的延迟。

Mock 支持 1–10 个字符串问题、`search` 和 `best_effort`，其他配置明确拒绝，生成/发布/验证创建入口返回 501。最多保存 100 个任务，达到上限需要重启清空虚构数据。相同幂等键与相同输入复用任务，冲突输入返回 409；`Prefer: wait` 在本模拟器中不延迟响应。

`job_demo_*` 为工作台静态 Fixture，不随查询推进。真实 API 的客户端应根据 `status` 与 `result_state` 判断生命周期；`partial` 结果的定稿或继续等待按 API 文档处理，不由本教程两次查询的模拟规则决定。

## 4. 使用 TypeScript 客户端

```ts
import { OpenGEOClient } from '@sysiphus/client';

const client = new OpenGEOClient({ baseUrl: 'http://localhost:8787' });
const job = await client.createMonitorRun(
  {
    capability_id: 'observe.ai_answer',
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
