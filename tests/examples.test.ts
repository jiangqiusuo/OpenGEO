import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { renderExamples } from '../scripts/generate-examples.js';

describe('generated language examples', () => {
  it('matches the OpenAPI monitor operation and contains no private fields', async () => {
    const document = JSON.parse(await readFile(new URL('../openapi/openapi.json', import.meta.url), 'utf8')) as Parameters<typeof renderExamples>[0];
    const bundle = renderExamples(document);
    expect(bundle).toMatchObject({ endpoint: '/v1/monitor-runs', method: 'POST', requiredFields: ['capability_id', 'prompts'] });
    expect(bundle.curl).toContain('idempotency-key');
    expect(bundle.python).toContain('urllib.request');
    expect(`${bundle.curl}\n${bundle.python}`).not.toMatch(/provider|upstream|purchase|dataforseo|secret/i);
    expect(await readFile(new URL('../docs/examples/curl/monitor-run.sh', import.meta.url), 'utf8')).toBe(bundle.curl);
    expect(await readFile(new URL('../docs/examples/python/monitor_run.py', import.meta.url), 'utf8')).toBe(bundle.python);
  });
});
