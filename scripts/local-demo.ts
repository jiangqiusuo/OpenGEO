import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createMockServer } from '../apps/mock-api/src/mock-server';
import { runCli } from '../packages/cli/src/index';
import type { Job, Observation } from '@sysiphus/contracts';

// This entry point owns a short-lived loopback Mock. It never inherits a real key or base URL.
const server = createMockServer();
const started = once(server, 'listening');
server.listen(0, '127.0.0.1');
await started;
const port = (server.address() as AddressInfo).port;
const base = `http://127.0.0.1:${port}`;
const boundedFetch: typeof fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.origin !== base) throw new Error('Local demo cannot access a remote service');
  return fetch(input, { ...init, redirect: 'error', signal: AbortSignal.timeout(5000) });
};
async function cli<T>(args: string[]): Promise<T> {
  let output = ''; let error = '';
  const code = await runCli([...args, '--base-url', base], {
    env: {}, fetch: boundedFetch,
    stdout: { write: value => { output += value; } },
    stderr: { write: value => { error += value; } }
  });
  if (code !== 0) throw new Error(error.trim() || 'CLI demo failed');
  return JSON.parse(output) as T;
}
try {
  console.log(`OpenGEO 本地试用 · 虚构数据 · 无需 API Key\n临时 Mock：${base} · PID ${process.pid}`);
  const job = await cli<Job>(['monitor', '--prompt', 'Which tools help teams review AI answers?', '--idempotency-key', randomUUID()]);
  console.log(`1. CLI 创建任务：${job.id} → ${job.status}`);
  let current = job; const trace = [job.status];
  for (let attempt = 0; attempt < 8 && current.status !== 'succeeded'; attempt++) {
    current = await cli<Job>(['job', job.id]); trace.push(current.status);
  }
  if (current.status !== 'succeeded' || current.result_state !== 'complete') throw new Error('Mock did not finish in the bounded window');
  const result = await cli<{ data: Observation[] }>(['items', job.id]);
  if (!current.progress || result.data.length !== current.progress.completed_items || result.data.some(item => item.job_id !== job.id)) throw new Error('Job and observations do not match');
  console.log(`2. CLI 查询进度：${trace.join(' → ')}\n3. CLI 读取结果：${result.data.length} 条观察，${current.result_state}\n示例回答：${result.data[0]?.answer.text ?? '无回答'}`);
  const cancelJob = await cli<Job>(['monitor', '--prompt', 'A disposable cancellation example', '--idempotency-key', randomUUID()]);
  const cancelled = await cli<Job>(['cancel', cancelJob.id]);
  if (cancelled.status !== 'cancelled') throw new Error('Mock cancellation failed');
  console.log(`4. CLI 取消另一个任务：${cancelled.status}\n本地 CLI 闭环通过。网页预览：https://app.open-geo.net/ （模拟数据）`);
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  });
  console.log('临时 Mock 已关闭，没有保留后台服务。');
}
