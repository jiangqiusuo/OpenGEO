# @opengeo/cli

OpenGEO Community CLI。它从 `OPENGEO_BASE_URL` 读取服务地址，从 `OPENGEO_API_KEY` 读取可选运行时 API Key，不接受 `--api-key` 参数，也不会把凭据写入命令历史。

```bash
opengeo capabilities
opengeo monitor --prompt "How visible is OpenGEO?" --idempotency-key example-001
opengeo job job_demo_queued
```

本地开发和完整命令说明见仓库的 [CLI 文档](../../docs/cli.md)。
