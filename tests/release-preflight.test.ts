import { describe, expect, it } from 'vitest';
import { classifyRegistryStatus, checkRegistry } from '../scripts/release-preflight.js';

describe('npm release preflight', () => {
  it('classifies registry visibility without treating it as organization ownership', () => {
    expect(classifyRegistryStatus('@opengeo/client', 404)).toEqual({ name: '@opengeo/client', status: 404, result: 'unpublished' });
    expect(classifyRegistryStatus('@opengeo/cli', 200)).toEqual({ name: '@opengeo/cli', status: 200, result: 'published' });
    expect(classifyRegistryStatus('@opengeo/cli', 403).result).toBe('unknown');
  });

  it('checks both package names through an injectable fetcher', async () => {
    const fetcher: typeof fetch = async input => new Response(null, { status: String(input).includes('client') ? 404 : 404 });
    await expect(checkRegistry(fetcher)).resolves.toEqual([
      { name: '@opengeo/client', status: 404, result: 'unpublished' },
      { name: '@opengeo/cli', status: 404, result: 'unpublished' },
    ]);
  });
});
