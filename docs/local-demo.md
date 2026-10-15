# 一条命令体验 OpenGEO CLI

要求 Node.js 22+ 与 pnpm 11。在 Community 仓库根目录安装依赖后运行：

```powershell
pnpm install
pnpm demo:local
```

程序自动启动只绑定本机回环地址的临时 Mock，使用同一份 CLI 创建任务、查询进度、读取回答并取消另一个任务。你会看到 `queued → running → succeeded`、`complete` 和 `cancelled`。任务状态与观察必须属于同一个 Job 才算成功。

结束后临时服务自动关闭。无需 API Key、固定端口或额外终端；不会读取你现有的 Key 或请求真实服务。这里只体验虚构数据和公开契约，不代表完成真实 AI 平台监测。

想看界面，可打开[只读工作台预览](https://app.open-geo.net/)：点击“品牌提及率”，查看支持样本，再点击具体样本读取回答与来源。预览和本地 CLI 是两个独立示例，预览不会显示这次临时任务。

需要自己逐步调用时，继续阅读[CLI 本地教程](https://app.open-geo.net/blog/cli-local-quickstart/)。

## English

With Node.js 22+ and pnpm 11, run `pnpm install` followed by `pnpm demo:local` in the repository root. The command starts a temporary loopback Mock and runs the actual repository CLI through job creation, polling, matching observations and cancellation. It shuts down automatically, ignores existing API credentials and does not make remote monitoring calls.

The [online workbench](https://app.open-geo.net/) is a separate fictional preview. Click a metric, inspect its supporting samples, then open an answer and its sources. It does not display jobs from the temporary local demo.
