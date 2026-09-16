import { describe, expect, it } from 'vitest';
import type { Observation } from '@opengeo/contracts';
import { computeMetrics } from '../src/index.js';

const now = '2026-09-09T00:00:00Z';
function observation(id: string, rank: number | null, mentioned = rank !== null, valid = true): Observation {
  return {
    id,
    object: 'opengeo.observation', schema_version: '1.0.0', job_id: 'job_demo',
    prompt: { prompt_id: 'prm_demo', version_id: 'prmv_demo', text: 'demo' },
    target: { engine: 'demo', surface: 'web', interaction_mode: 'search', turnaround_class: 'best_effort' },
    collection: { method: 'manual_import', profile_version: 'test', observed_at: now, repeat_index: 1 },
    answer: { availability: valid ? 'observed' : 'failed_to_extract', text: valid ? 'answer' : null },
    brand_mentions: [{ entity_id: 'entity_demo', entity_name: 'Demo', aliases_matched: mentioned ? ['Demo'] : [], mentioned, mention_count: mentioned ? 1 : 0, context: null, derivation: 'opengeo_parser' }],
    rankings: rank === null ? [] : [{ entity_id: 'entity_demo', entity_name: 'Demo', rank, context: null, derivation: 'opengeo_parser' }],
    quality: { is_valid: valid, completeness_score: valid ? 1 : 0, warnings: [] },
    provenance: { normalizer_version: '1', entity_parser_version: '1', ranking_parser_version: '1' },
  };
}
const base = [observation('obs_1', 1), observation('obs_2', 3), observation('obs_3', 5), observation('obs_4', null, false), observation('obs_5', null, true), observation('obs_invalid', 1, true, false)];
describe('metrics package', () => {
  it('computes core three metrics', () => {
    const m = computeMetrics(base, { entityId: 'entity_demo', planned: 6, computedAt: now });
    const by = Object.fromEntries(m.map(x => [x.metric_id, x]));
    expect(by.mention_rate.value).toBeCloseTo(4/5); expect(by.top3_rate_absolute.value).toBeCloseTo(2/5); expect(by.top3_rate_conditional.value).toBeCloseTo(2/4);
  });
  it('deduplicates IDs and excludes invalid', () => {
    const m = computeMetrics([...base, observation('obs_1', 5)], { entityId: 'entity_demo', planned: 6 });
    expect(m.find(x=>x.metric_id==='mention_rate')?.sample.valid).toBe(5);
  });
  it('returns null for zero denominators or missing ranks', () => {
    const m = computeMetrics([observation('x', null, false)], { entityId: 'entity_demo', planned: 1 });
    expect(m.find(x=>x.metric_id==='top3_rate_conditional')?.value).toBeNull(); expect(m.find(x=>x.metric_id==='average_rank')?.value).toBeNull();
    expect(computeMetrics([], { entityId: 'entity_demo', planned: 0 }).find(x=>x.metric_id==='mention_rate')?.value).toBeNull();
  });
});
