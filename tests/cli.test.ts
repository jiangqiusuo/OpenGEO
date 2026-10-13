import { describe, expect, it, vi } from 'vitest';
import { runCli } from '@sysiphus/cli';
import { createMockServer } from '../apps/mock-api/src/mock-server';

const io = () => { let value = ''; return { stream: { write(chunk: string) { value += chunk; } }, value: () => value }; };

async function withMock(run: (call: (args: string[]) => Promise<{ code: number; stdout: string; stderr: string }>) => Promise<void>) {
  const server = createMockServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  try {
    await run(async (args) => {
      const stdout = io(); const stderr = io();
      const code = await runCli([...args, '--base-url', baseUrl], { stdout: stdout.stream, stderr: stderr.stream, env: {} });
      return { code, stdout: stdout.value(), stderr: stderr.value() };
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

describe('Community CLI', () => {
  it('tracks a real local Job and its observations, preserving idempotency and terminal state', async () => {
    await withMock(async (call) => {
      const args = ['monitor', '--prompt', 'Demo Brand', '--idempotency-key', 'cli-local-001'];
      const created = await call(args);
      expect(created.code).toBe(0); expect(created.stderr).toBe('');
      const job = JSON.parse(created.stdout);
      expect(job.status).toBe('queued');
      expect(JSON.parse((await call(args)).stdout).id).toBe(job.id);
      expect(JSON.parse((await call(['items', job.id])).stdout).data).toEqual([]);
      expect(JSON.parse((await call(['job', job.id])).stdout).status).toBe('running');
      expect(JSON.parse((await call(['job', job.id])).stdout)).toMatchObject({ id: job.id, status: 'succeeded', result_state: 'complete' });
      const items = JSON.parse((await call(['items', job.id])).stdout).data;
      expect(items).toHaveLength(1); expect(items[0].job_id).toBe(job.id);
      const lateCancel = await call(['cancel', job.id]);
      expect(lateCancel.code).toBe(1); expect(lateCancel.stderr).toContain('job_terminal');
      expect(JSON.parse((await call(['job', job.id])).stdout).status).toBe('succeeded');
    });
  });

  it('cancels a newly created local Job and reports a conflicting idempotency key as failure', async () => {
    await withMock(async (call) => {
      const args = ['monitor', '--prompt', 'Cancel demo', '--idempotency-key', 'cli-local-cancel-001'];
      const job = JSON.parse((await call(args)).stdout);
      const conflict = await call(['monitor', '--prompt', 'Different prompt', '--idempotency-key', 'cli-local-cancel-001']);
      expect(conflict.code).toBe(1); expect(conflict.stdout).toBe(''); expect(conflict.stderr).toContain('idempotency_conflict');
      const cancelled = await call(['cancel', job.id]);
      expect(cancelled.code).toBe(0); expect(JSON.parse(cancelled.stdout).status).toBe('cancelled');
      expect(JSON.parse((await call(['job', job.id])).stdout).status).toBe('cancelled');
      expect(JSON.parse((await call(['items', job.id])).stdout).data).toEqual([]);
    });
  });
  it('lists capabilities through the public client', async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const stdout = io(); const stderr = io();
    await expect(runCli(['--', 'capabilities'], { fetch, stdout: stdout.stream, stderr: stderr.stream, env: {} })).resolves.toBe(0);
    expect(fetch).toHaveBeenCalledWith('http://localhost:8787/v1/capabilities', { headers: {} });
    expect(JSON.parse(stdout.value())).toEqual({ data: [] });
    expect(stderr.value()).toBe('');
  });

  it('creates a monitoring Job with contract fields and runtime auth', async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ id: 'job_cli', status: 'queued' }), { status: 202, headers: { 'content-type': 'application/json' } }));
    const stdout = io(); const stderr = io();
    const code = await runCli(['monitor', '--prompt', 'Where is OpenGEO mentioned?', '--idempotency-key', 'cli-001', '--profile', 'global-llm-v1', '--turnaround', 'interactive', '--wait', '2'], { fetch, stdout: stdout.stream, stderr: stderr.stream, env: { OPENGEO_API_KEY: 'test-key' } });
    expect(code).toBe(0);
    const init = fetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBe('Bearer test-key');
    expect(headers.get('idempotency-key')).toBe('cli-001');
    expect(headers.get('prefer')).toBe('wait=2');
    expect(JSON.parse(String(init.body))).toMatchObject({ capability_id: 'observe.ai_answer', prompts: ['Where is OpenGEO mentioned?'], monitoring_profile: 'global-llm-v1', turnaround_class: 'interactive' });
    expect(stdout.value()).not.toContain('test-key');
  });

  it('queries a Job without exposing the API key', async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ id: 'job_cli', status: 'succeeded' }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const stdout = io(); const stderr = io();
    expect(await runCli(['job', 'job_cli'], { fetch, stdout: stdout.stream, stderr: stderr.stream, env: { OPENGEO_BASE_URL: 'https://api.opengeo.test/', OPENGEO_API_KEY: 'private-key' } })).toBe(0);
    expect(fetch).toHaveBeenCalledWith('https://api.opengeo.test/v1/jobs/job_cli', { headers: { authorization: 'Bearer private-key' } });
    expect(stdout.value()).not.toContain('private-key');
  });

  it('supports Job items, partial finalization, and cancellation commands', async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ status: 'queued' }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const stdout = io(); const stderr = io();
    expect(await runCli(['items', 'job_cli'], { fetch, stdout: stdout.stream, stderr: stderr.stream, env: {} })).toBe(0);
    expect(await runCli(['finalize', 'job_cli', '--cancel-remaining'], { fetch, stdout: stdout.stream, stderr: stderr.stream, env: {} })).toBe(0);
    expect(await runCli(['cancel', 'job_cli'], { fetch, stdout: stdout.stream, stderr: stderr.stream, env: {} })).toBe(0);
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([
      'http://localhost:8787/v1/jobs/job_cli/items',
      'http://localhost:8787/v1/jobs/job_cli/finalize-partial',
      'http://localhost:8787/v1/jobs/job_cli/cancel',
    ]);
    expect(JSON.parse(String(fetch.mock.calls[1][1]?.body))).toEqual({ cancel_remaining: true });
    expect(stderr.value()).toBe('');
  });

  it('rejects invalid monitor arguments before sending a request', async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response()); const stdout = io(); const stderr = io();
    expect(await runCli(['monitor', '--prompt', 'test', '--idempotency-key', 'cli-002', '--wait', '-1'], { fetch, stdout: stdout.stream, stderr: stderr.stream, env: {} })).toBe(1);
    expect(fetch).not.toHaveBeenCalled();
    expect(stderr.value()).toContain('invalid_value:wait');
  });
});
