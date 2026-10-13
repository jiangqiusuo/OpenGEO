/* global console, process, fetch, AbortSignal */
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL, URL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export async function runTutorial(base = 'http://127.0.0.1:8787') {
  const origin = new URL(base);
  if (origin.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname) || origin.pathname !== '/' || origin.username || origin.password || origin.search || origin.hash) {
    throw new Error('This tutorial only accepts a loopback HTTP origin.');
  }
  const request = async (path, options = {}) => {
    const response = await fetch(new URL(path, origin), { ...options, redirect: 'error', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Mock returned HTTP ${response.status}`);
    return response.json();
  };
  const created = await request('/v1/monitor-runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': randomUUID() },
    body: JSON.stringify({ capability_id: 'observe.ai_answer', prompts: ['Which tools help teams understand AI search visibility?'], interaction_mode: 'search', turnaround_class: 'best_effort' })
  });
  if (!/^job_[a-z0-9_]+$/.test(created.id)) throw new Error('Invalid Job ID');
  const trace = [created.status];
  let job = created;
  for (let attempt = 0; attempt < 8 && job.status !== 'succeeded'; attempt++) {
    await delay(100);
    job = await request(`/v1/jobs/${encodeURIComponent(created.id)}`);
    trace.push(job.status);
    if (['failed', 'cancelled', 'finalized_partial'].includes(job.status)) throw new Error(`Job ended with ${job.status}`);
  }
  if (job.status !== 'succeeded' || job.result_state !== 'complete') throw new Error('Mock did not finish within the bounded polling window');
  const items = await request(`/v1/jobs/${encodeURIComponent(job.id)}/items`);
  if (!Array.isArray(items.data) || items.data.length !== job.progress.completed_items || items.data.some((item) => item.job_id !== job.id)) throw new Error('Observations do not match the completed Job');
  return { source: 'local-mock', job_id: job.id, status_trace: trace, result_state: job.result_state, observation_count: items.data.length, answer: items.data[0]?.answer.text };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  runTutorial(process.argv[2]).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
