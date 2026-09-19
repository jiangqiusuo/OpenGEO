import { describe, expect, it, vi } from 'vitest';
import { runCli } from '@opengeo/cli';

const io = () => { let value = ''; return { stream: { write(chunk: string) { value += chunk; } }, value: () => value }; };

describe('Community CLI', () => {
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
