import { describe, expect, it } from 'vitest';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { jobFixtures, observationFixtures } from '@opengeo/contracts';
import jobSchema from '../../packages/contracts/schemas/opengeo-job.v1.schema.json';
import observationSchema from '../../packages/contracts/schemas/opengeo-observation.v1.schema.json';

describe('public fixtures', () => {
  it('validate against the public schemas', () => {
    const ajv = new Ajv({ strict: false }); addFormats(ajv);
    const job = ajv.compile(jobSchema), observation = ajv.compile(observationSchema);
    expect(Object.values(jobFixtures).every((x) => job(x))).toBe(true);
    expect(observationFixtures.every((x) => observation(x))).toBe(true);
  });
  it('does not expose private provider fields', () => {
    const text = JSON.stringify({ ...jobFixtures.partial, ...observationFixtures[0] }).toLowerCase();
    for (const forbidden of ['provider', 'provider_task_id', 'provider_cost', 'token', 'purchase_price']) expect(text).not.toContain(forbidden);
  });
});
