import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import SwaggerParser from '@apidevtools/swagger-parser';
import { fileURLToPath } from 'node:url';
import { schemaRegistry, fixtureJobs, fixtureObservations, fixturePrompt, CAPABILITIES } from '@opengeo/contracts';

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
for (const schema of Object.values(schemaRegistry)) ajv.addSchema(schema);

function validate(name: string, value: unknown) {
  const schema = schemaRegistry[name as keyof typeof schemaRegistry];
  if (!schema) throw new Error(`Unknown schema ${name}`);
  const check = ajv.getSchema(schema.$id as string) ?? ajv.compile(schema);
  const ok = check(value);
  expect(ok, `${name}: ${ajv.errorsText(check.errors)}`).toBe(true);
}

const forbiddenKey = /(provider|upstream|token|secret|password|api[_-]?key|purchase[_-]?price|account[_-]?pool|customer[_-]?id)/i;
const forbiddenValue = /(dataforseo|serpapi|openai|anthropic|豆包|供应商|上游)/i;
function scanSensitive(value: unknown, path = '$'): string[] {
  const hits: string[] = [];
  if (Array.isArray(value)) value.forEach((v, i) => hits.push(...scanSensitive(v, `${path}[${i}]`)));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) {
    if (forbiddenKey.test(k)) hits.push(`${path}.${k}`);
    hits.push(...scanSensitive(v, `${path}.${k}`));
  }
  else if (typeof value === 'string' && forbiddenValue.test(value)) hits.push(`${path}=${value}`);
  return hits;
}

describe('G0 公共契约', () => {
  it('所有 JSON Schema 可被 Ajv 2020 编译', () => {
    for (const schema of Object.values(schemaRegistry)) expect(() => ajv.compile(schema)).not.toThrow();
  });

  it('Fixture 全部通过对应 Schema', () => {
    Object.values(fixtureJobs).forEach(job => validate('job', job));
    fixtureObservations.forEach(observation => validate('observation', observation));
    validate('prompt', fixturePrompt);
    CAPABILITIES.forEach(capability => validate('capability', capability));
  });

  it('可用性状态保持可区分，不能用空数组代替', () => {
    const base = fixtureObservations[0];
    const states = ['not_requested', 'not_supported', 'not_available', 'failed_to_extract', 'redacted', 'unknown'] as const;
    for (const availability of states) {
      const candidate = { ...base, videos: { availability, items: [] } };
      validate('observation', candidate);
      expect(candidate.videos.availability).toBe(availability);
    }
  });

  it('交互模式与时效档位是独立字段', () => {
    const target = fixtureObservations[0].target;
    expect(target).toHaveProperty('interaction_mode');
    expect(target).toHaveProperty('turnaround_class');
    expect(target.interaction_mode).not.toBe(target.turnaround_class);
  });

  it('公共 Fixture 不含供应商或敏感内部字段', () => {
    const all = { fixtureJobs, fixtureObservations, fixturePrompt, CAPABILITIES };
    expect(scanSensitive(all)).toEqual([]);
  });

  it('OpenAPI 3.1 文档可解析且外部 Schema refs 可解析', async () => {
    const document = await SwaggerParser.dereference(fileURLToPath(new URL('../openapi/openapi.json', import.meta.url)));
    const api = document as unknown as { openapi?: string; paths?: Record<string, unknown>; components?: { schemas?: Record<string, unknown> } };
    expect((api.paths?.['/v1/monitor-runs'] as {post?: unknown})?.post).toBeTruthy();
    expect(api.components?.schemas?.Job).toBeTruthy();
    expect(api.components?.schemas?.Observation).toBeTruthy();
  });
});






