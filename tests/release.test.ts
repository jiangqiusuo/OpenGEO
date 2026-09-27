import { describe, expect, it } from 'vitest';
import { validateReleaseMetadata, validateTagVersion } from '../scripts/release-check.js';

describe('Community package release metadata', () => {
  it('keeps package names, versions, files and changelog aligned', async () => {
    await expect(validateReleaseMetadata()).resolves.toBeUndefined();
  });

  it('rejects a release tag that does not match the package version', () => {
    expect(() => validateTagVersion('0.1.0', 'refs/tags/v0.2.0')).toThrow('does not match package version');
    expect(() => validateTagVersion('0.1.0', 'refs/tags/v0.1.0')).not.toThrow();
    expect(() => validateTagVersion('0.1.0', 'refs/heads/main')).not.toThrow();
  });
});
