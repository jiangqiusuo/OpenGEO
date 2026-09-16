import type { Job, Observation, Prompt } from './types.js';

const now = '2026-01-01T00:00:00.000Z';
export const promptFixtures: Prompt[] = [{
  prompt_id: 'prm_demo', objective_id: 'obj_demo', version_id: 'prmv_demo_1',
  text: 'Which tools help teams understand AI search visibility?', language: 'en',
  source: { type: 'manual', source_text: null, parent_prompt_version_id: null }, status: 'approved', tags: ['demo'],
  default_sampling: { repeat_count: 1, interaction_mode: 'search', turnaround_class: 'best_effort' }
}];

export const observationFixtures: Observation[] = [1, 2, 3, 4, 5, 6].map((n) => {
  const rank = [1, 3, 5, null, 2, 4][n - 1];
  const valid = n !== 6;
  return {
    id: `obs_demo_${n}`, object: 'opengeo.observation', schema_version: '1.0.0', job_id: 'job_demo_succeeded',
    prompt: { prompt_id: 'prm_demo', version_id: 'prmv_demo_1', text: promptFixtures[0].text },
    target: { engine: 'demo-engine', surface: 'web', interaction_mode: 'search', turnaround_class: 'best_effort', language: 'en', region: 'US' },
    collection: { method: 'manual_import', profile_version: 'demo-1', requested_at: now, observed_at: now, repeat_index: 1 },
    answer: { availability: valid ? 'observed' : 'failed_to_extract', format: 'text', text: valid ? `Answer ${n}` : null },
    retrieved_sources: { availability: valid ? 'observed' : 'not_available', items: valid ? [{ url: `https://example.test/source-${n}`, domain: 'example.test' }] : [] },
    explicit_citations: { availability: valid ? 'observed' : 'not_available', items: [] },
    brand_mentions: [{ entity_id: 'entity_demo', entity_name: 'Demo Brand', aliases_matched: n === 4 ? [] : ['Demo Brand'], mentioned: rank !== null, mention_count: rank === null ? 0 : 1, rank, context: null, derivation: 'opengeo_parser' }],
    rankings: rank === null ? [] : [{ entity_id: 'entity_demo', entity_name: 'Demo Brand', rank, context: null, derivation: 'opengeo_parser' }],
    quality: { is_valid: valid, completeness_score: valid ? 1 : 0, warnings: valid ? [] : [{ code: 'parse_failed' }] },
    provenance: { normalizer_version: '1.0.0', entity_parser_version: '1.0.0', ranking_parser_version: '1.0.0' }
  };
});

const job = (status: Job['status'], result_state: Job['result_state'], turnaround_class: Job['turnaround_class']): Job => ({
  id: `job_demo_${status}`, object: 'opengeo.job', capability_id: 'observe.ai_answer', status, result_state, turnaround_class,
  progress: { total_items: status === 'partial' || status === 'finalized_partial' ? 40 : 5, completed_items: status === 'partial' || status === 'finalized_partial' ? 37 : status === 'succeeded' ? 5 : 0, failed_items: status === 'failed' ? 1 : 0, cancelled_items: 0, completion_ratio: status === 'partial' || status === 'finalized_partial' ? .925 : status === 'succeeded' ? 1 : 0 },
  requested_config: { interaction_mode: 'search', turnaround_class }, effective_config: { interaction_mode: 'search', turnaround_class },
  health: { status: status === 'partial' ? 'delayed' : 'operational', estimated_completion_at: null, message: status === 'partial' ? 'Results are arriving later than usual.' : null },
  warnings: [], timestamps: { created_at: now, updated_at: now, started_at: status === 'queued' ? null : now, completed_at: ['succeeded', 'failed', 'finalized_partial'].includes(status) ? now : null }, links: {}
});

export const jobFixtures: Record<string, Job> = {
  queued: job('queued', 'none', 'best_effort'), partial: job('partial', 'sufficient', 'best_effort'), succeeded: job('succeeded', 'complete', 'best_effort'), failed: job('failed', 'none', 'expedited'), finalized_partial: job('finalized_partial', 'finalized_partial', 'interactive')
};
export const fixtureJobs = jobFixtures;
export const fixtureObservations = observationFixtures;
export const fixturePrompt = promptFixtures[0];
export const fixturePublication = { id: 'pub_demo', object: 'opengeo.publication' as const, channel_type: 'owned_site' as const, status: 'draft' as const, content_asset_id: 'asset_demo', target_id: null, published_url: null, proof_asset_id: null, failure: null, created_at: now, updated_at: null };
