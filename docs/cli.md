# OpenGEO CLI

基础 CLI 复用公开 TypeScript 客户端和 OpenAPI 0.1.0 契约，当前提供能力查询、创建监测 Job、查询 Job/结果项、部分结果定稿和取消 Job 命令。

## 启动 Mock

```bash
pnpm install
pnpm mock
```

另开一个终端执行 CLI：

```bash
pnpm cli -- capabilities
```

## 创建监测 Job

已发布的 npm CLI 可以直接运行，无需全局安装：

```bash
npm exec --yes --package=@sysiphus/cli@0.1.1 -- opengeo monitor --prompt "Demo Brand" --idempotency-key "cli-example-001" --base-url http://127.0.0.1:8787
```

Windows PowerShell 使用 `npm.cmd`。返回 JSON 中的 `id` 是后续 `job`、`items` 与 `cancel` 的参数；不要使用固定的 `job_demo_*` 替代刚创建的任务。完整步骤见[已发布 CLI 本地教程](https://app.open-geo.net/blog/cli-local-quickstart/)。

```bash
pnpm cli -- monitor \
  --prompt "OpenGEO 在这个问题中的可见度如何？" \
  --idempotency-key "cli-example-001" \
  --turnaround best_effort \
  --interaction search \
  --wait 5
```

`--idempotency-key` 必须由调用方显式提供。网络异常后使用同一个键重放，不要自动生成新键并重复创建任务。

`--wait` 是本次创建请求的 `Prefer: wait=N` 等待偏好，不自动轮询，也不是请求超时。仍可能立即收到 `queued`。本地 Mock 的动态任务首次查询为 `running`，再次查询为 `succeeded`；这是教学模拟，不代表真实执行时长。自动轮询示例见[Mock→Job 教程](https://app.open-geo.net/blog/mock-to-job-quickstart/)。

## 查询 Job

```bash
pnpm cli -- job job_demo_queued
```

查询 Job 结果项、定稿当前部分结果或取消剩余执行：

```bash
pnpm cli -- items job_demo_partial
pnpm cli -- finalize job_demo_partial --cancel-remaining
pnpm cli -- cancel job_demo_partial
```

## 连接其他环境

```bash
export OPENGEO_BASE_URL="https://api.example.test"
export OPENGEO_API_KEY="<runtime-secret>"
pnpm cli -- capabilities
```

Windows PowerShell：

```powershell
$env:OPENGEO_BASE_URL = "https://api.example.test"
$env:OPENGEO_API_KEY = "<runtime-secret>"
pnpm.cmd cli -- capabilities
```

API Key 只从 `OPENGEO_API_KEY` 读取。CLI 不提供 `--api-key` 参数，避免凭据进入 shell history；输出和错误信息也不会打印该值。

## 参数

| 参数 | 可选值 | 默认值 |
|---|---|---|
| `--turnaround` | `best_effort`、`expedited`、`interactive` | `best_effort` |
| `--interaction` | `standard`、`reasoning`、`search`、`reasoning_search` | `search` |
| `--profile` | `cn-search-v1`、`global-llm-v1` | 不指定 |
| `--wait` | 非负整数秒 | 不等待 |
| `--base-url` | HTTP/HTTPS URL | `OPENGEO_BASE_URL` 或本地 Mock |

本地 Mock 仅支持 `search` 与 `best_effort` 的字符串问题，其他配置会明确拒绝。`job_demo_*` 是固定状态 Fixture，动态创建的 `job_mock_*` 才会随查询推进；结果只用于理解契约，不代表真实监测。
