import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { CAPABILITIES, PUBLIC_CONTRACT_VERSION, jobFixtures, observationFixtures, type Job, type Observation } from '@sysiphus/contracts';

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,idempotency-key,prefer' };
const json = (res: ServerResponse, status: number, body: unknown) => { res.writeHead(status, { 'content-type': 'application/json', ...cors }); res.end(JSON.stringify(body)); };
const fail = (res: ServerResponse, status: number, code: string) => json(res, status, { error: { code, message: code } });
interface Record { job: Job; items: Observation[]; reads: number; }

/** Local-only deterministic simulator, not a provider or production runtime. */
export function createMockServer(maxJobs = 100) {
  if (!Number.isInteger(maxJobs) || maxJobs < 1) throw new Error('Invalid mock job limit');
  const jobs = new Map<string, Record>();
  const keys = new Map<string, { signature: string; id: string }>();
  let sequence = 0;
  const sendJob = (res: ServerResponse, record: Record) => {
    res.setHeader('location', `/v1/jobs/${record.job.id}`);
    json(res, 202, record.job);
  };
  async function create(req: IncomingMessage, res: ServerResponse) {
    const key = req.headers['idempotency-key'];
    if (typeof key !== 'string' || !key.trim() || key.length > 200) return fail(res, 400, 'idempotency_key_required');
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of req) {
      bytes += Buffer.byteLength(chunk);
      if (bytes <= 16384) chunks.push(Buffer.from(chunk));
    }
    if (bytes > 16384) return fail(res, 413, 'request_too_large');
    let body: { capability_id?: unknown; prompts?: unknown; interaction_mode?: unknown; turnaround_class?: unknown };
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return fail(res, 400, 'invalid_json'); }
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((name) => !['capability_id', 'prompts', 'interaction_mode', 'turnaround_class'].includes(name)) || body.capability_id !== 'observe.ai_answer' || !Array.isArray(body.prompts) || body.prompts.length < 1 || body.prompts.length > 10 || body.prompts.some((p) => typeof p !== 'string' || !p.trim())) return fail(res, 400, 'invalid_monitor_request');
    // This simulator deliberately implements one configuration; do not silently degrade others.
    if ((body.interaction_mode ?? 'search') !== 'search' || (body.turnaround_class ?? 'best_effort') !== 'best_effort') return fail(res, 422, 'mock_configuration_unsupported');
    const prompts = body.prompts as string[];
    const signature = JSON.stringify(prompts);
    const existing = keys.get(key);
    if (existing) return existing.signature === signature ? sendJob(res, jobs.get(existing.id)!) : fail(res, 409, 'idempotency_conflict');
    if (jobs.size >= maxJobs) return fail(res, 429, 'mock_capacity_reached');
    const id = `job_mock_${++sequence}`;
    const now = new Date().toISOString();
    const job: Job = { ...structuredClone(jobFixtures.queued), id, progress: { total_items: prompts.length, completed_items: 0, failed_items: 0, cancelled_items: 0, completion_ratio: 0 }, timestamps: { created_at: now, updated_at: now, started_at: null, completed_at: null }, links: { self: `/v1/jobs/${id}`, items: `/v1/jobs/${id}/items` } };
    const items = prompts.map((text, i): Observation => ({ ...structuredClone(observationFixtures[0]), id: `obs_mock_${sequence}_${i + 1}`, job_id: id, prompt: { prompt_id: `prm_mock_${sequence}_${i + 1}`, version_id: 'prmv_mock_1', text }, collection: { ...observationFixtures[0].collection, requested_at: now, observed_at: now }, answer: { availability: 'observed', format: 'text', text: `Mock fixture: Demo Brand appears in this simulated answer for "${text}".` } }));
    const record = { job, items, reads: 0 };
    jobs.set(id, record); keys.set(key, { signature, id });
    sendJob(res, record);
  }
  async function handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
    if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { status: 'ok', contract_version: PUBLIC_CONTRACT_VERSION });
    if (req.method === 'GET' && url.pathname === '/v1/capabilities') return json(res, 200, { object: 'list', data: CAPABILITIES });
    if (req.method === 'POST' && url.pathname === '/v1/monitor-runs') return create(req, res);
    if (req.method === 'POST' && ['/v1/generation-jobs', '/v1/publications', '/v1/verification-runs'].includes(url.pathname)) return fail(res, 501, 'capability_unavailable');
    const match = url.pathname.match(/^\/v1\/jobs\/([^/]+)(?:\/(items|cancel|finalize-partial))?$/);
    if (!match) return fail(res, 404, 'not_found');
    let id: string;
    try { id = decodeURIComponent(match[1]); } catch { return fail(res, 400, 'invalid_job_id'); }
    const record = jobs.get(id);
    if (record) {
      if (req.method === 'GET' && match[2] === 'items') return json(res, 200, { object: 'list', data: record.job.status === 'succeeded' ? record.items : [] });
      if (req.method === 'GET' && !match[2]) {
        if (record.job.status === 'queued' || record.job.status === 'running') {
          record.reads++;
          const now = new Date().toISOString();
          record.job.status = record.reads >= 2 ? 'succeeded' : 'running';
          record.job.timestamps.started_at ??= now;
          record.job.timestamps.updated_at = now;
          if (record.job.status === 'succeeded') { record.job.result_state = 'complete'; record.job.timestamps.completed_at = now; record.job.progress!.completed_items = record.items.length; record.job.progress!.completion_ratio = 1; }
        }
        return json(res, 200, record.job);
      }
      if (req.method === 'POST' && match[2] === 'cancel') {
        if (record.job.status === 'succeeded') return fail(res, 409, 'job_terminal');
        record.job.status = 'cancelled'; record.job.result_state = 'none'; record.job.progress!.cancelled_items = record.items.length; record.job.progress!.completion_ratio = 1; record.job.timestamps.completed_at = new Date().toISOString(); record.job.timestamps.updated_at = record.job.timestamps.completed_at;
        return json(res, 202, record.job);
      }
      if (req.method === 'POST' && match[2] === 'finalize-partial') return fail(res, 409, 'no_partial_results');
      return fail(res, 404, 'not_found');
    }
    // Preserve named fixtures for the read-only workbench. They do not advance on polling.
    const fixtureKey = id.slice('job_demo_'.length);
    const fixture = id.startsWith('job_demo_') && Object.hasOwn(jobFixtures, fixtureKey) ? jobFixtures[fixtureKey] : undefined;
    if (!fixture) return fail(res, 404, 'not_found');
    if (req.method === 'GET' && !match[2]) return json(res, 200, fixture);
    if (req.method === 'GET' && match[2] === 'items') return json(res, 200, { object: 'list', data: fixture.result_state === 'none' ? [] : observationFixtures.map((item) => ({ ...item, id: fixtureKey === 'succeeded' ? item.id : `${item.id}_${fixtureKey}`, job_id: id })) });
    if (req.method === 'POST' && match[2] === 'finalize-partial') return json(res, 200, jobFixtures.finalized_partial);
    if (req.method === 'POST' && match[2] === 'cancel') return json(res, 200, { ...fixture, status: 'cancelled', result_state: 'none' });
    return fail(res, 404, 'not_found');
  }
  return createServer((req, res) => { void handle(req, res).catch(() => { if (!res.headersSent) fail(res, 500, 'mock_internal_error'); else res.end(); }); });
}
