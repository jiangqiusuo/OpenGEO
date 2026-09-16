import type { MetricResult, Observation } from '@opengeo/contracts';

type MetricOptions = {
  entityId: string;
  planned: number;
  computedAt?: string;
};

type Normalized = {
  observations: Observation[];
  valid: Observation[];
  mentioned: Observation[];
};

const VERSION = '1.0.0';

/** Compute the stable target rank for an observation. Invalid, missing and
 * non-positive ranks are ignored; duplicate ranking records use the best rank. */
function targetRank(observation: Observation, entityId: string): number | null {
  const ranks = (observation.rankings ?? [])
    .filter((r) => r.entity_id === entityId && Number.isFinite(r.rank) && r.rank >= 1)
    .map((r) => r.rank);
  if (ranks.length > 0) return Math.min(...ranks);

  // Older fixtures may carry rank on a brand mention. Treat it as an explicit
  // rank only when no ranking record exists; a missing rank remains missing.
  const mentionRanks = (observation.brand_mentions ?? [])
    .filter((m) => m.entity_id === entityId && m.mentioned && m.rank != null && Number.isFinite(m.rank) && m.rank >= 1)
    .map((m) => m.rank as number);
  return mentionRanks.length > 0 ? Math.min(...mentionRanks) : null;
}

function isMentioned(observation: Observation, entityId: string): boolean {
  // Multiple parser rows for one entity must not inflate the boolean metric.
  return (observation.brand_mentions ?? []).some((m) =>
    m.entity_id === entityId && (m.mentioned === true || (m.mention_count ?? 0) > 0)
  );
}

function normalize(observations: Observation[]): Normalized {
  const byId = new Map<string, Observation>();
  for (const observation of observations) {
    if (!byId.has(observation.id)) byId.set(observation.id, observation);
  }
  const unique = [...byId.values()];
  const valid = unique.filter((o) => o.quality?.is_valid === true);
  return { observations: unique, valid, mentioned: [] };
}

function result(
  metricId: string,
  value: number | null,
  options: MetricOptions,
  sample: MetricResult['sample'],
  extraScope: Record<string, unknown> = {},
  evidenceExtra: Record<string, unknown> = {}
): MetricResult {
  return {
    metric_id: metricId,
    metric_version: VERSION,
    value,
    unit: metricId === 'average_rank' ? 'rank' : 'ratio',
    scope: { target_entity_id: options.entityId, ...extraScope },
    sample,
    evidence_query: { target_entity_id: options.entityId, metric_id: metricId, ...evidenceExtra },
    ...(options.computedAt ? { computed_at: options.computedAt } : {}),
  };
}

/**
 * Compute deterministic, provider-independent OpenGEO metrics.
 * Invalid observations and duplicate IDs are excluded before all calculations.
 */
export function computeMetrics(observations: Observation[], options: MetricOptions): MetricResult[] {
  if (!Number.isInteger(options.planned) || options.planned < 0) {
    throw new Error('planned must be a non-negative integer');
  }
  const normalized = normalize(observations);
  const { valid } = normalized;
  const mentioned = valid.filter((o) => isMentioned(o, options.entityId));
  const top3 = valid.filter((o) => {
    const rank = targetRank(o, options.entityId);
    return rank !== null && rank >= 1 && rank <= 3;
  });
  const top1 = valid.filter((o) => targetRank(o, options.entityId) === 1);
  const mentionedRanks = mentioned
    .map((o) => targetRank(o, options.entityId))
    .filter((rank): rank is number => rank !== null);
  const planned = options.planned;
  const validCount = valid.length;
  const ratioSample = (included: number): MetricResult['sample'] => ({
    planned,
    valid: validCount,
    included,
    excluded: validCount - included,
  });

  return [
    result('answer_rate', planned === 0 ? null : validCount / planned, options, { planned, valid: validCount, included: validCount, excluded: Math.max(0, planned - validCount) }),
    result('mention_rate', validCount === 0 ? null : mentioned.length / validCount, options, { planned, valid: validCount, included: mentioned.length, excluded: validCount - mentioned.length }),
    result('top3_rate_absolute', validCount === 0 ? null : top3.length / validCount, options, { planned, valid: validCount, included: top3.length, excluded: validCount - top3.length }),
    result('top3_rate_conditional', mentioned.length === 0 ? null : top3.filter((o) => isMentioned(o, options.entityId)).length / mentioned.length, options, { planned, valid: validCount, included: top3.filter((o) => isMentioned(o, options.entityId)).length, excluded: mentioned.length - top3.filter((o) => isMentioned(o, options.entityId)).length }),
    result('top1_rate', validCount === 0 ? null : top1.length / validCount, options, ratioSample(validCount)),
    result('average_rank', mentionedRanks.length === 0 ? null : mentionedRanks.reduce((sum, rank) => sum + rank, 0) / mentionedRanks.length, options, ratioSample(mentionedRanks.length), {}, { rank_source: 'target_ranking' }),
    result('result_completeness', planned === 0 ? null : validCount / planned, options, { planned, valid: validCount, included: validCount, excluded: Math.max(0, planned - validCount) }),
  ];
}

export type { MetricOptions };
// Backward-compatible helper used by the Community contract tests. It infers
// the first tracked entity and uses the supplied observation count as planned.
export function computeCoreMetrics(observations: Observation[]): MetricResult[] {
  const entityId = observations.flatMap((o) => o.brand_mentions ?? [])[0]?.entity_id;
  if (!entityId) {
    return ['mention_rate', 'top3_rate_absolute', 'top3_rate_conditional'].map((metricId) =>
      result(metricId, null, { entityId: '', planned: observations.length }, {
        planned: observations.length,
        valid: 0,
        included: 0,
        excluded: 0,
      })
    );
  }
  const all = computeMetrics(observations, { entityId, planned: observations.length });
  const wanted = new Set(['mention_rate', 'top3_rate_absolute', 'top3_rate_conditional']);
  return all.filter((m) => wanted.has(m.metric_id));
}

