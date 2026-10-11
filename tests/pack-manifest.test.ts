import { describe, expect, it } from 'vitest';
import { assertPackagedManifest } from '../scripts/verify-packaged-manifests.js';

describe('packaged npm manifests', () => {
  it('accepts a normal semver dependency range', () => {
    expect(() => assertPackagedManifest({ dependencies: { '@sysiphus/client': '^0.1.1' } })).not.toThrow();
  });

  it('rejects workspace protocols that npm cannot install', () => {
    expect(() => assertPackagedManifest({ dependencies: { '@sysiphus/client': 'workspace:^' } }, 'cli/package.json')).toThrow('unconverted workspace dependency');
  });
});
