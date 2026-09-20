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
    expect(bundle.go).toContain('http.NewRequest');
    expect(bundle.java).toContain('HttpClient.newHttpClient');
    expect(`${bundle.curl}\n${bundle.python}\n${bundle.go}\n${bundle.java}`).not.toMatch(/provider|upstream|purchase|dataforseo|secret/i);
    expect((await readFile(new URL('../docs/examples/curl/monitor-run.sh', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')).toBe(bundle.curl);
    expect((await readFile(new URL('../docs/examples/python/monitor_run.py', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')).toBe(bundle.python);
    expect((await readFile(new URL('../docs/examples/go/monitor_run.go', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')).toBe(bundle.go);
    expect((await readFile(new URL('../docs/examples/java/MonitorRun.java', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')).toBe(bundle.java);
  });
});
