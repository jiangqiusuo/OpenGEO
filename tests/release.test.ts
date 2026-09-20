import { describe, expect, it } from 'vitest';
import { validateReleaseMetadata } from '../scripts/release-check.js';

describe('Community package release metadata', () => {
  it('keeps package names, versions, files and changelog aligned', async () => {
    await expect(validateReleaseMetadata()).resolves.toBeUndefined();
  });
});
