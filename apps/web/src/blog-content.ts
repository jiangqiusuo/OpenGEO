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

export type BlogBlock = string | { kind: 'heading'; text: string } | { kind: 'code'; language: 'bash' | 'javascript' | 'json'; text: string };
