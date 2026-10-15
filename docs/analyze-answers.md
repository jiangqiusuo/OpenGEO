# 分析你自己保存的 AI 回答

无需 API Key、模型付费或启动服务。把已有回答放进一个 JSON 文件，OpenGEO 在本机计算品牌提及和已提供的排名，并保留回答与来源记录。

这是仓库内的命令，尚未包含在已发布的 `@sysiphus/cli@0.1.1` 中。它不自动访问 AI 网站、不发送回答、不下载来源页面。

## 三步开始

要求 Node.js 22+、pnpm 11。

```bash
git clone https://github.com/jiangqiusuo/OpenGEO.git
cd OpenGEO
pnpm install
pnpm analyze:answers --input examples/answers.sample.json
```

示例全部虚构。输出应包含 `planned: 3`、`provided: 3`、`valid: 2`；`mention_rate` 为 `0.5`，`average_rank` 为 `2`。第三条回答不可用，因此不作为“未提及”加入提及率分母。

复制示例到仓库外的私有位置，修改品牌、问题与回答，再把自己的文件路径传给 `--input`。不要把真实业务回答提交到仓库。

```json
{
  "brand": "Northstar Labs",
  "aliases": ["Northstar"],
  "observed_at": "2026-10-15T08:00:00Z",
  "answers": [
    {
      "prompt": "Which fictional tools help small teams?",
      "engine": "example-engine",
      "answer": "1. Harbor Tools. 2. Northstar Labs provides project boards.",
      "rank": 2,
      "citations": ["https://example.com/fictional-tools"]
    }
  ]
}
```

## 如何填写

| 字段 | 含义 |
| --- | --- |
| `brand` / `aliases` | 目标品牌及可选别名；使用 Unicode NFKC、忽略大小写的字面匹配；ASCII 名称有单词边界 |
| `observed_at` | 采集回答的时间，须包含 `Z` 或时区偏移；每条回答可单独覆盖 |
| `answers[].prompt` / `engine` | 原问题和实际使用的平台或模型标识；由你填写，不验证平台身份 |
| `answer` | 完整回答；拿不到回答时填 `null`，不能省略或填空字符串 |
| `rank` | 可选，由你核对的排名；没有明确排名时省略，程序不会根据文字顺序猜测 |
| `citations` | 可选，你保存的明确引用 URL；省略表示未知，空数组表示记录为无；不会自动验证或抓取 |
| `planned` | 可选，原计划样本数，默认输入条数；不能小于输入条数 |
| `answers[].id` | 可选，以 `obs_` 开头且批次内唯一；省略时生成稳定 ID |

文件不超过 5 MiB，最多 1,000 条回答；URL 仅接受 HTTP/HTTPS，不接受内嵌用户名和密码。错误只输出简短错误码，不回显回答原文。

## 怎样读报告

- `metrics`：沿用[版本化指标](../packages/metrics/README.md)，同时输出分子、有效样本和计划范围。
- `observations`：每条回答、字面提及、人工排名和明确引用记录，可回到原文复核；来源标记为 `manual_import`，未做独立真实性验证。
- `by_engine`：按输入的模型标识分组；分组计划数只取已提供行，未收到的计划样本不擅自分配给模型。

提及不等于推荐或正面评价；别名可能歧义，需人工检查。未提供排名时，`average_rank` 为 `null`；Top 1/Top 3 只计已提供的排名，不能把未排名回答推断为排名靠后。引用 URL 只是输入记录，不等于该来源支持回答或引用你的品牌。

比较不同批次时，先固定问题集合、模型、语言、时间窗口和样本数量。这个报告描述输入样本，不能代表全部 AI 用户的体验，也不能证明某次内容优化带来了增长。

要体验异步任务创建、查询和取消，使用另一条独立的[本地 Mock 流程](local-demo.md)。Mock 结果不是你这份导入报告的结果。
