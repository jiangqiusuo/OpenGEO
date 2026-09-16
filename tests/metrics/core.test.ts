import { describe, expect, it } from 'vitest';
import { observationFixtures } from '@opengeo/contracts';
import { computeMetrics } from '@opengeo/metrics';

describe('core metrics', () => {
  it('computes versioned mention and top3 rates', () => {
    const metrics = computeMetrics(observationFixtures, {entityId: 'entity_demo', planned: 6});
    expect(metrics.filter((m) => ['mention_rate', 'top3_rate_absolute', 'top3_rate_conditional'].includes(m.metric_id)).map((m) => m.value)).toEqual([0.8, 0.6, 0.75]);
    expect(metrics.every((m) => m.metric_version === '1.0.0')).toBe(true);
  });
});
