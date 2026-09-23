import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('Developer Portal entrypoint', () => {
  it('points the Scalar reference at the repository OpenAPI source', async () => {
    const html = await readFile(new URL('../docs/portal/index.html', import.meta.url), 'utf8');
    expect(html).toContain('data-url="../../openapi/openapi.json"');
    expect(html).toContain('@scalar/api-reference');
    expect(html).not.toMatch(/api[_-]?key|token|secret/i);
  });
});
