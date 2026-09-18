# OpenGEO CLI

基础 CLI 复用公开 TypeScript 客户端和 OpenAPI 0.1.0 契约，当前提供能力查询、创建监测 Job 和查询 Job 三个命令。

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

```bash
pnpm cli -- monitor \
  --prompt "OpenGEO 在这个问题中的可见度如何？" \
  --idempotency-key "cli-example-001" \
  --turnaround best_effort \
  --interaction search \
  --wait 5
```

`--idempotency-key` 必须由调用方显式提供。网络异常后使用同一个键重放，不要自动生成新键并重复创建任务。

## 查询 Job

```bash
pnpm cli -- job job_demo_queued
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

当前 CLI 是 Community 开发入口，不包含生产账号管理、计费运营或供应商专用参数。
