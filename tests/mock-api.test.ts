import { afterEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createMockServer } from '../apps/mock-api/src/mock-server';

const servers: ReturnType<typeof createMockServer>[] = [];
async function start(limit = 100) {
  const server = createMockServer(limit); servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}
afterEach(async () => { await Promise.all(servers.splice(0).map((s) => new Promise<void>((resolve, reject) => s.close((e) => e ? reject(e) : resolve())))); });
const input = { capability_id: 'observe.ai_answer', prompts: ['虚构品牌的演示问题'], interaction_mode: 'search', turnaround_class: 'best_effort' };
const create = (origin: string, key = 'test-one', body = JSON.stringify(input)) => fetch(`${origin}/v1/monitor-runs`, { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': key }, body });
describe('local monitoring Mock and runnable tutorial', () => {
  it('uses one Job ID from queued to running to complete and returns matching observations', async () => {
    const origin = await start(); const response = await create(origin); const queued = await response.json();
    expect(response.status).toBe(202); expect(response.headers.get('location')).toBe(`/v1/jobs/${queued.id}`);
    expect(queued).toMatchObject({ status: 'queued', result_state: 'none', progress: { total_items: 1 } });
    expect(await (await fetch(`${origin}/v1/jobs/${queued.id}/items`)).json()).toMatchObject({ data: [] });
    expect(await (await fetch(`${origin}/v1/jobs/${queued.id}`)).json()).toMatchObject({ id: queued.id, status: 'running', result_state: 'none' });
    const final = await (await fetch(`${origin}/v1/jobs/${queued.id}`)).json();
    expect(final).toMatchObject({ id: queued.id, status: 'succeeded', result_state: 'complete', progress: { completed_items: 1, completion_ratio: 1 } });
    const items = await (await fetch(`${origin}/v1/jobs/${queued.id}/items`)).json();
    expect(items.data).toHaveLength(1); expect(items.data[0]).toMatchObject({ job_id: queued.id, prompt: { text: input.prompts[0] } });
  });
  it('reuses the same key but rejects conflicting requests and bounds memory', async () => {
    const origin = await start(1); const first = await (await create(origin)).json();
    expect(await (await create(origin)).json()).toMatchObject({ id: first.id });
    expect((await create(origin, 'test-one', JSON.stringify({ ...input, prompts: ['different'] }))).status).toBe(409);
    expect((await create(origin, 'test-two')).status).toBe(429);
  });
  it('cancellation stays terminal with no results; unknown and malformed IDs do not become fake jobs', async () => {
    const origin = await start(); const job = await (await create(origin)).json();
    expect((await fetch(`${origin}/v1/jobs/${job.id}/cancel`, { method: 'POST' })).status).toBe(202);
    expect(await (await fetch(`${origin}/v1/jobs/${job.id}`)).json()).toMatchObject({ status: 'cancelled', result_state: 'none' });
    expect(await (await fetch(`${origin}/v1/jobs/${job.id}/items`)).json()).toMatchObject({ data: [] });
    expect((await fetch(`${origin}/v1/jobs/missing`)).status).toBe(404);
    expect((await fetch(`${origin}/v1/jobs/job_demo_toString`)).status).toBe(404);
    expect((await fetch(`${origin}/v1/jobs/%ZZ`)).status).toBe(400);
  });
  it('rejects missing keys, invalid JSON, oversized bodies and unsupported modes without degrading', async () => {
    const origin = await start();
    expect((await create(origin, '')).status).toBe(400);
    expect((await create(origin, 'invalid-json', 'invalid')).status).toBe(400);
    expect((await create(origin, 'large', 'x'.repeat(17000))).status).toBe(413);
    expect((await create(origin, 'mode', JSON.stringify({ ...input, interaction_mode: 'reasoning' }))).status).toBe(422);
    expect((await fetch(`${origin}/v1/publications`, { method: 'POST' })).status).toBe(501);
    expect((await fetch(`${origin}/v1/jobs/job_demo_succeeded`)).status).toBe(200);
  });
  it('executes the exact published Node example against a real loopback server', async () => {
    const origin = await start();
    const example = fileURLToPath(new URL('../examples/mock-to-job.mjs', import.meta.url));
    const { stdout } = await promisify(execFile)(process.execPath, [example, origin]);
    expect(JSON.parse(stdout)).toMatchObject({ source: 'local-mock', status_trace: ['queued', 'running', 'succeeded'], result_state: 'complete', observation_count: 1 });
    await expect(promisify(execFile)(process.execPath, [example, 'https://example.test'])).rejects.toMatchObject({ code: 1 });
  });
});
