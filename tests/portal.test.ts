import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

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
    expect(workflow).toContain('docs/portal/quickstart.html');
  });

  it('provides a provider-neutral mock quickstart without credentials', async () => {
    const html = await readFile(new URL('../docs/portal/quickstart.html', import.meta.url), 'utf8');
    expect(html).toContain('pnpm mock');
    expect(html).toContain('idempotency-key: quickstart-001');
    expect(html).toContain('不会连接真实供应商');
    expect(html).not.toMatch(/api[_-]?key|token|secret/i);
  });
});
