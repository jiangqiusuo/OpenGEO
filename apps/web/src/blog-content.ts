export type BlogPost = {
  slug: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
  status: 'draft' | 'published';
  reviewedBy?: string;
  body: BlogBlock[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'partial-results-and-retries',
    title: '任务还没完成时，怎样使用已有结果',
    titleEn: 'Using available results before a Job is complete',
    excerpt: '区分请求成功、任务完成和结果可用，再决定等待、定稿或取消。避免重复创建，也不把失败当成零提及。',
    excerptEn: 'Separate HTTP success, Job completion and result availability before waiting, finalizing or cancelling.',
    publishedAt: '2026-10-13', updatedAt: '2026-10-13', category: '工程', status: 'published', reviewedBy: 'OpenGEO maintainers',
    body: [
      '一批监测中的回答可能不会同时完成。已经读到结果时，可以先复查这些回答；还有任务在运行时，不要把当前数据当成整个观察窗口。OpenGEO 用 Job 状态和 result_state 分别表达执行进度和结果可用程度。',
      { kind: 'heading', text: '202 只表示请求已被接受' },
      '创建后保存返回的 Job ID，之后查询同一个任务和它的 items。一次 HTTP 请求成功不等于监测完成；一次查询超时也不等于 Job 失败。查询应有退避间隔、请求超时和总等待上限，不能因为等待太久就创建另一批。',
      'Prefer: wait=N 只表达本次请求的等待偏好。CLI 的 --wait 不会自动循环轮询；需要继续查询时仍使用返回的 ID。',
      { kind: 'heading', text: '部分结果有三种选择' },
      'partial 表示已有部分可用结果。先读取 items，再决定是否继续等剩余工作。如果当前覆盖范围已经足够，可以请求 finalize-partial，并用 cancel_remaining=true 表达停止剩余工作；最终根据返回状态确认定稿。',
      '如果只想停止剩余执行，使用 cancel。取消不等于删除已经完成的回答，也不等于完整成功。定稿后的 finalized_partial 需要保留“部分结果”标识；取消后的状态和已保存结果也要重新读取确认。收到状态冲突时，先查询原 Job，不重复提交。',
      { kind: 'heading', text: '显示结果时把范围一起交代' },
      '展示 Job 状态、已完成与总样本数、实际加载的观察数量，再展示指标。只加载一页结果时，页面条数不是任务总进度；有效样本比例也不是完成率。检索来源与回答明确引用应分别表达，避免给出超出证据的判断。',
      { kind: 'heading', text: '失败不能换成零提及' },
      'HTTP 错误、Job 失败和结果字段不可用需要分别保留。没有请求、能力不支持、暂不可用、解析失败和公开内容被隐藏，都不能统一转换成“品牌未被提及”。排查时保留 Job ID、安全的请求 ID 与错误码，不把凭据或完整私有响应放入反馈。',
      '网络中断后，如果需要重放创建请求，保持请求内容和原 Idempotency-Key 相同。限流时遵守 Retry-After；请求有误或没有权限时先修正，不自动换平台或降低能力。提交结果未知时先核对原任务，再决定下一步。',
      { kind: 'heading', text: '先本地练习，再接真实环境' },
      'Mock 的动态 job_mock_* 只按确定规则推进到成功，不模拟真实 partial。job_demo_* 是固定 Fixture，其写操作只是示例响应，不代表持久化状态机。工作台仍为只读模拟预览；本文解释契约和客户端决策，不表示这些写操作已在页面开放。',
      '开发者文档中的“部分结果、失败与重试”指南提供状态与动作对照表，接口字段继续以 OpenAPI 为准。先完成本地 CLI 教程，再在自己的受控测试环境里验证取消、定稿及结果关联。'
    ]
  },
  {
    slug: 'cli-local-quickstart',
    title: '用已发布的 CLI 创建、查询和取消本地任务',
    titleEn: 'Create, inspect and cancel local Jobs with the published CLI',
    excerpt: '从 npm 的 0.1.1 命令行工具开始，保存真实返回的 Job ID，读取模拟结果，再练习取消。无需 API Key。',
    excerptEn: 'Use the published 0.1.1 CLI to track a local Job, read simulated results and practice cancellation without an API key.',
    publishedAt: '2026-10-13', updatedAt: '2026-10-13', category: '教程', status: 'published', reviewedBy: 'OpenGEO maintainers',
    body: [
      '如果你想先试 OpenGEO 的命令行工具，这篇教程可以帮你完成一次本地任务。CLI 使用 npm 已发布的 @sysiphus/cli 0.1.1；服务端使用仓库里的 Mock。回答与品牌都是虚构数据，不需要申请 API Key，也不会执行真实监测。',
      { kind: 'heading', text: '先启动本地 Mock' },
      '需要 Node.js 22 或更高版本、Git 和 pnpm 11。在一个终端进入仓库并启动 Mock，保持这个终端打开。首次安装依赖以及获取 CLI 包需要网络，下面的任务请求只发往本机。',
      { kind: 'code', language: 'bash', text: 'git clone https://github.com/jiangqiusuo/OpenGEO.git\ncd OpenGEO\npnpm install\npnpm mock' },
      { kind: 'heading', text: '在第二个终端创建任务' },
      '下面使用 Windows PowerShell。npm.cmd 避免 PowerShell 脚本执行策略拦截 npm.ps1。npm exec 临时运行指定版本，无需全局安装。所有命令都明确指定本机地址；已有其他项目的 OPENGEO_API_KEY 时，请使用一个未设置该变量的终端。',
      { kind: 'code', language: 'powershell', text: '$job = npm.cmd exec --yes --package=@sysiphus/cli@0.1.1 -- opengeo monitor --prompt "Demo Brand" --idempotency-key "cli-local-001" --base-url http://127.0.0.1:8787 | ConvertFrom-Json\nif ($LASTEXITCODE -ne 0) { throw "创建任务失败" }\n$job.id\n$job.status' },
      '默认配置为 search 和 best_effort，符合本地 Mock 的支持范围。第一次创建会得到 job_mock_* 和 queued。请保存响应中的 id；具体编号取决于当前 Mock 已创建的任务数量，不要把教程中的示意编号当成你自己的任务。',
      { kind: 'heading', text: '用同一个 ID 读取进度与结果' },
      { kind: 'code', language: 'powershell', text: 'npm.cmd exec --yes --package=@sysiphus/cli@0.1.1 -- opengeo job $job.id --base-url http://127.0.0.1:8787\nnpm.cmd exec --yes --package=@sysiphus/cli@0.1.1 -- opengeo job $job.id --base-url http://127.0.0.1:8787\nnpm.cmd exec --yes --package=@sysiphus/cli@0.1.1 -- opengeo items $job.id --base-url http://127.0.0.1:8787' },
      '在全新的模拟任务上，第一次 job 查询推进到 running，第二次推进到 succeeded 与 complete。items 返回的每条观察结果，其 job_id 应与 $job.id 相同。若创建后直接读取 items，会得到空数组；空数组本身不能证明任务失败。',
      '两次查询完成是 Mock 的教学规则。真实 API 需要按返回的状态处理，并设置轮询间隔和总等待上限。CLI 的 --wait 5 只发送单次请求的等待偏好，不会每五秒轮询，也不保证五秒内完成。',
      { kind: 'heading', text: '重试与取消各练习一次' },
      '保持问题和幂等键相同，重新执行创建命令，会得到同一个 Job。需要创建另一项任务时才使用新键；同一个键配不同问题会返回冲突。重启 Mock 会清空这些内存记录，所以这个练习要在同一次 Mock 运行中完成。',
      { kind: 'code', language: 'powershell', text: '$cancelJob = npm.cmd exec --yes --package=@sysiphus/cli@0.1.1 -- opengeo monitor --prompt "Cancel demo" --idempotency-key "cli-local-cancel-001" --base-url http://127.0.0.1:8787 | ConvertFrom-Json\nif ($LASTEXITCODE -ne 0) { throw "创建待取消任务失败" }\nnpm.cmd exec --yes --package=@sysiphus/cli@0.1.1 -- opengeo cancel $cancelJob.id --base-url http://127.0.0.1:8787\nnpm.cmd exec --yes --package=@sysiphus/cli@0.1.1 -- opengeo job $cancelJob.id --base-url http://127.0.0.1:8787' },
      '这里创建一项新任务并在读取进度前取消，随后状态应保持 cancelled。已经成功完成的任务不会因为再次取消而倒退到 cancelled。本地练习不涉及扣费或退款。',
      { kind: 'heading', text: '遇到错误时先检查什么' },
      '连接失败时，先检查 Mock 终端是否还在运行以及端口是否一致。若你调整了 OPEN_GEO_PORT，也要修改每条命令的 --base-url。HTTP 409 表示幂等键与请求冲突；422 表示请求了 Mock 不支持的配置；429 表示模拟任务数量达到上限，可在练习结束后重启 Mock 清空数据。',
      'macOS 和 Linux 使用 npm 代替 npm.cmd；可以先直接运行 monitor，从 JSON 复制 id，再作为 job、items 或 cancel 的参数。仓库开发者也可以用 pnpm cli -- 执行相同子命令。完成后在 Mock 终端按 Ctrl+C 停止服务。CLI 参考和自动轮询的 Node 教程分别提供更完整的参数说明与代码。'
    ]
  },
  {
    slug: 'mock-to-job-quickstart',
    title: '从本地 Mock 到一个完整的 Job',
    titleEn: 'From a local Mock to a completed Job',
    excerpt: '不用 API Key，先在本地跑通创建、轮询和读取结果。示例有明确的等待上限，结果都是虚构数据。',
    excerptEn: 'Create, poll and read one local Job without an API key. Results are simulated fixtures, with bounded polling.',
    publishedAt: '2026-10-13', updatedAt: '2026-10-13', category: '教程', status: 'published', reviewedBy: 'OpenGEO maintainers',
    body: [
      '这篇教程用本地 Mock 理解 OpenGEO 的 Job 流程。你会创建一个任务，使用同一个 ID 查询进度，再读取属于该任务的观察结果。模拟回答与 Demo Brand 都是虚构数据，不表示实际监测效果。',
      { kind: 'heading', text: '准备环境并启动 Mock' },
      '需要 Node.js 22 或更高版本、Git 和 pnpm 11。在一个终端运行下面的命令；Mock 只监听本机 127.0.0.1，保持这个终端打开。首次安装依赖需要网络，之后的监测示例只请求本机。',
      { kind: 'code', language: 'bash', text: 'git clone https://github.com/jiangqiusuo/OpenGEO.git\ncd OpenGEO\npnpm install\npnpm mock' },
      { kind: 'heading', text: '另开终端执行示例' },
      '进入同一个 OpenGEO 目录，再运行已包含在仓库里的脚本。Windows PowerShell、macOS 和 Linux 都可以使用这条 Node 命令，不需要在命令中粘贴密钥。',
      { kind: 'code', language: 'bash', text: 'node examples/mock-to-job.mjs' },
      '默认地址是 http://127.0.0.1:8787。若端口已被占用，在启动 Mock 的终端设置 OPEN_GEO_PORT，再把对应的本机地址作为脚本的唯一参数，例如 node examples/mock-to-job.mjs http://127.0.0.1:8788。脚本拒绝外网地址和重定向，避免把教程请求发到真实服务。',
      { kind: 'heading', text: '一条请求发生了什么' },
      'POST /v1/monitor-runs 返回 202 和 queued 状态。响应中的 id 是之后查询与结果关联的依据，Location 指向这个 Job。创建时使用新的幂等键；同一个键与相同请求会返回同一个 Job，改动问题则会返回冲突。',
      '本地模拟器第一次查询返回 running，第二次返回 succeeded 与 complete，然后 items 返回对应的观察结果。这是可预测的教学流程；真实服务的等待时长、部分结果和失败原因应按 API 返回值判断，不能用两次查询推断真实任务已经完成。',
      { kind: 'code', language: 'json', text: '{\n  "source": "local-mock",\n  "job_id": "job_mock_1",\n  "status_trace": ["queued", "running", "succeeded"],\n  "result_state": "complete",\n  "observation_count": 1\n}' },
      '上面的输出摘录省略了 answer；任务编号取决于本机 Mock 已创建的任务数量。检查 source 为 local-mock、最后状态为 succeeded，以及每条观察的 job_id 与任务一致。',
      { kind: 'heading', text: '可复制的完整代码' },
      '下面的代码直接来自仓库里的 examples/mock-to-job.mjs，也是页面下载的同一份文件。轮询最多八次，每次请求有超时；遇到失败、取消、部分定稿或超出窗口会报错，不会一直等待。',
      { kind: 'code', language: 'javascript', text: MOCK_TO_JOB_SOURCE },
      { kind: 'heading', text: '常见问题与下一步' },
      '连接失败时先确认 Mock 终端还在运行、端口一致。端口被占用时请换一个可用的本机端口，不要停止不认识的服务。Mock 只模拟字符串问题、search 和 best_effort；其他配置会明确拒绝，生成和发布入口尚未模拟。最多保存一百个任务，达到上限后重启 Mock 会清空虚构数据。',
      'job_demo_* 是工作台使用的固定 Fixture，不会随轮询推进；本教程创建的是 job_mock_*。完成后在 Mock 终端按 Ctrl+C 停止服务。接入真实 API 时，再阅读开发者文档的认证、能力、部分结果和错误处理说明；不要把这份只允许本机的教程脚本直接当作生产客户端。'
    ]
  },
  {
    slug: 'geo-visibility-and-evidence',
    title: 'GEO 可见度为什么必须和证据一起看',
    titleEn: 'Why GEO visibility needs evidence',
    excerpt: '一次 AI 回答中的提及，并不等于稳定的品牌可见度。先固定问题、样本和证据，再谈优化。',
    excerptEn: 'A single mention in an AI answer is not stable visibility. Fix the query, sample and evidence before optimizing.',
    publishedAt: '2026-10-13',
    updatedAt: '2026-10-13',
    category: '方法',
    status: 'published',
    reviewedBy: 'OpenGEO maintainers',
    body: [
      'GEO 的难点不在于得到一条看起来不错的回答，而在于知道这条回答是否可以复查。相同的问题在不同时间、平台和上下文中可能产生不同结果。',
      'OpenGEO 把每次监测建模为 Job，并保存问题、回答、引用和样本范围。这样一次“被提及”才有机会变成可以对比的观察，而不是一张孤立的截图。',
      '开始优化前，先固定三件事：问题集合、观察窗口和证据等级。随后再比较提及率、排名位置和引用质量的变化。',
      '这套顺序也让团队可以安全地停止任务、处理部分结果，并解释一次结果为什么暂时不可用。可验证性是优化流程的起点。',
    ],
  },
];
import { MOCK_TO_JOB_SOURCE } from '../example-source';

export type BlogBlock = string | { kind: 'heading'; text: string } | { kind: 'code'; language: 'bash' | 'powershell' | 'javascript' | 'json'; text: string };
