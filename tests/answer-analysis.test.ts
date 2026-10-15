import { execFile } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { describe, expect, it, vi } from 'vitest';
import { analyzeAnswers } from '../scripts/answer-analysis';
import sample from '../examples/answers.sample.json';
import observationSchema from '../packages/contracts/schemas/opengeo-observation.v1.schema.json';
import metricSchema from '../packages/contracts/schemas/opengeo-metric-result.v1.schema.json';

const input = (answer: string | null, extra = {}) => ({ brand: 'Acme', observed_at: '2026-10-15T08:00:00Z', answers: [{ prompt: 'Which tools?', engine: 'example-engine', answer, ...extra }] });
const value = (report: ReturnType<typeof analyzeAnswers>, id: string) => report.metrics.find(metric => metric.metric_id === id)?.value;

describe('offline answer analysis', () => {
  it('computes reproducible metrics and contract-valid evidence without contacting sources', () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('no network allowed'));
    try {
      const report = analyzeAnswers(sample);
      expect(report.sample).toEqual({ planned: 3, provided: 3, valid: 2 });
      expect(value(report, 'mention_rate')).toBe(0.5);
      expect(value(report, 'average_rank')).toBe(2);
      expect(value(report, 'answer_rate')).toBe(2 / 3);
      const ajv = new Ajv({ strict: false }); addFormats(ajv);
      const observation = ajv.compile(observationSchema), metric = ajv.compile(metricSchema);
      for (const item of report.observations) expect(observation(item), JSON.stringify(observation.errors)).toBe(true);
      for (const item of report.metrics) expect(metric(item), JSON.stringify(metric.errors)).toBe(true);
      expect(report.observations[0].retrieved_sources?.availability).toBe('not_requested');
      expect(report.observations[0].rankings?.[0].derivation).toBe('human_corrected');
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });
  it('matches literal aliases without counting overlapping aliases or partial ASCII words', () => {
    const report = analyzeAnswers({ ...input('ACME Labs, Ａｃｍｅ, Acmeology.'), aliases: ['Acme Labs'] });
    expect(report.observations[0].brand_mentions?.[0].mention_count).toBe(2);
    expect(value(analyzeAnswers(input('Acmeology')), 'mention_rate')).toBe(0);
    expect(value(analyzeAnswers({ ...input('星河是一个示例'), brand: '星河' }), 'mention_rate')).toBe(1);
    expect(value(analyzeAnswers({ ...input('A+B (demo)'), brand: 'A+B' }), 'mention_rate')).toBe(1);
  });
  it('keeps unavailable, not mentioned and unranked separate, including missing planned samples', () => {
    expect(value(analyzeAnswers(input(null)), 'mention_rate')).toBeNull();
    expect(value(analyzeAnswers(input('Another brand')), 'mention_rate')).toBe(0);
    expect(value(analyzeAnswers(input('Acme is mentioned')), 'average_rank')).toBeNull();
    const report = analyzeAnswers({ ...input('Acme'), planned: 4 });
    expect(value(report, 'answer_rate')).toBe(0.25);
    expect(report.by_engine[0].metrics[0].sample.planned).toBe(1);
    expect(analyzeAnswers({ ...input('Acme'), answers: [] }).metrics.every(metric => metric.value === null)).toBe(true);
  });
  it.each([
    { ...input('Acme'), observed_at: '2026-10-15' },
    { ...input('Acme'), planned: 0 },
    { ...input('Acme'), surprise: 'field' },
    input('Another brand', { rank: 1 }),
    input('Acme', { rank: 0 }),
    input(null, { citations: ['https://example.com/'] }),
    input('Acme', { citations: ['javascript:alert(1)'] }),
    input('Acme', { citations: ['https://user:pass@example.com/'] }),
    { ...input('Acme'), answers: [input('Acme', { id: 'obs_duplicate' }).answers[0], input('Acme', { id: 'obs_duplicate' }).answers[0]] },
  ])('rejects ambiguous or invalid input %#', candidate => { expect(() => analyzeAnswers(candidate)).toThrow(); });
  it('runs the repository command with BOM input and does not echo invalid private input', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'opengeo-answers-'));
    const exec = promisify(execFile);
    try {
      const path = join(dir, 'answers.json');
      await writeFile(path, '\uFEFF' + JSON.stringify(sample));
      const result = await exec(process.execPath, ['--import', 'tsx', 'scripts/analyze-answers.ts', '--input', path]);
      expect(JSON.parse(result.stdout).sample.valid).toBe(2);
      await writeFile(path, '{"private-customer-answer": "must-not-echo"');
      try { await exec(process.execPath, ['--import', 'tsx', 'scripts/analyze-answers.ts', '--input', path]); expect.fail('must reject invalid JSON'); }
      catch (error) { const result = error as { stderr: string; stdout: string }; expect(result.stderr.trim()).toBe('invalid_json'); expect(result.stdout).toBe(''); }
      await writeFile(path, ' '.repeat(5 * 1024 * 1024 + 1));
      await expect(exec(process.execPath, ['--import', 'tsx', 'scripts/analyze-answers.ts', '--input', path])).rejects.toMatchObject({ stderr: 'input_file_too_large\n' });
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
});
