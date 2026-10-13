import { readFileSync } from 'node:fs';

// Render and download the executable example itself; do not maintain a second copy.
export const MOCK_TO_JOB_SOURCE = readFileSync(new URL('../../examples/mock-to-job.mjs', import.meta.url), 'utf8');
