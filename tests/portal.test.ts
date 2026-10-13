import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { generatePortalAssets } from '../scripts/portal-assets.mjs';

describe('Developer Portal entrypoint', () => {
  it('points the Scalar reference at the repository OpenAPI source', async () => {
    const html = await readFile(new URL('../docs/portal/index.html', import.meta.url), 'utf8');
    expect(html).toContain('data-url="../../openapi/openapi.json"');
    expect(html).toContain('@scalar/api-reference@1.71.0');
    expect(html).not.toContain('@latest');
    expect(html).not.toMatch(/api[_-]?key|token|secret/i);
  });

  it('keeps the Pages artifact layout compatible with the relative OpenAPI URL', async () => {
    const workflow = await readFile(new URL('../.github/workflows/docs-preview.yml', import.meta.url), 'utf8');
    expect(workflow).toContain('site/docs/portal');
    expect(workflow).toContain('site/openapi/openapi.json');
    expect(workflow).toContain('actions/deploy-pages@v4');
    expect(workflow).toContain('node scripts/portal-assets.mjs site');
    expect(workflow).toContain('apps/web/design-tokens.css');
    const assets = generatePortalAssets();
    expect(assets.get('docs/portal/quickstart.html')).toContain('pnpm mock');
    expect(JSON.parse(assets.get('openapi/openapi.json')!).openapi).toBe('3.1.0');
    for (const page of ['index.html', 'quickstart.html']) {
      const html = assets.get(`docs/portal/${page}`)!;
      expect(html).not.toContain('{{');
      const localAssets = [...html.matchAll(/(?:href|src)="\.\/([^"\s]+\.(?:css|svg))"/g)].map(match => match[1]);
      expect(localAssets.length).toBeGreaterThanOrEqual(3);
      for (const name of localAssets) expect(assets.has(`docs/portal/${name}`)).toBe(true);
    }
  });

  it('provides a provider-neutral mock quickstart without credentials', async () => {
    const html = await readFile(new URL('../docs/portal/quickstart.html', import.meta.url), 'utf8');
    expect(html).toContain('pnpm mock');
    expect(html).toContain('idempotency-key: quickstart-001');
    expect(html).toContain('不会连接真实供应商');
    expect(html).toContain('/docs/job-results.md');
    expect(html).not.toContain('/v1/jobs/job_demo_queued');
    expect(html).not.toMatch(/api[_-]?key|token|secret/i);
  });
});
