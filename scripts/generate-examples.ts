import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

type Schema = { $ref?: string; const?: string; enum?: string[]; properties?: Record<string, Schema>; required?: string[] };
type Operation = { operationId?: string; parameters?: Array<{ name?: string; in?: string }>; requestBody?: { content?: { 'application/json'?: { schema?: Schema } } } };
type OpenApi = { paths?: Record<string, { post?: Operation }>; components?: { schemas?: Record<string, Schema> } };

export interface ExampleBundle { curl: string; python: string; endpoint: string; method: string; requiredFields: string[] }

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const specPath = join(root, 'openapi/openapi.json');
const curlPath = join(root, 'docs/examples/curl/monitor-run.sh');
const pythonPath = join(root, 'docs/examples/python/monitor_run.py');

async function loadSpec(): Promise<OpenApi> {
  return JSON.parse(await readFile(specPath, 'utf8')) as OpenApi;
}

export function renderExamples(document: OpenApi): ExampleBundle {
  const entry = Object.entries(document.paths ?? {}).find(([, path]) => path.post?.operationId === 'createMonitorRun');
  if (!entry?.[1].post) throw new Error('createMonitorRun operation is missing from OpenAPI');
  const [path, pathItem] = entry;
  const operation = pathItem.post;
  if (!operation) throw new Error('createMonitorRun operation is missing from OpenAPI');
  const rawSchema = operation.requestBody?.content?.['application/json']?.schema;
  const ref = rawSchema?.['$ref'];
  const schema = ref?.startsWith('#/components/schemas/') ? document.components?.schemas?.[ref.replace('#/components/schemas/', '')] : rawSchema;
  const requiredFields = schema?.required ?? [];
  if (!schema || !requiredFields.includes('capability_id') || !requiredFields.includes('prompts')) throw new Error('monitor request schema must require capability_id and prompts');
  const method = 'POST';
  const payload = JSON.stringify({
    capability_id: schema.properties?.capability_id?.const ?? 'observe.ai_answer',
    prompts: ['How visible is OpenGEO for this question?'],
    turnaround_class: schema.properties?.turnaround_class?.enum?.[0] ?? 'best_effort',
    interaction_mode: schema.properties?.interaction_mode?.enum?.includes('search') ? 'search' : schema.properties?.interaction_mode?.enum?.[0] ?? 'standard',
  }, null, 2);
  const curl = `#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${'${OPENGEO_BASE_URL:-http://localhost:8787}'}"
IDEMPOTENCY_KEY="${'${OPENGEO_IDEMPOTENCY_KEY:-example-monitor-001}'}"
headers=(-H "content-type: application/json" -H "idempotency-key: $IDEMPOTENCY_KEY" -H "prefer: wait=5")
if [[ -n "${'${OPENGEO_API_KEY:-}'}" ]]; then
  headers+=(-H "Authorization: Bearer ${'${OPENGEO_API_KEY}'}")
fi

curl --fail-with-body -X ${method} "$BASE_URL${path}" "${'${headers[@]}'}" --data '${payload.replace(/'/g, "'\\''")}'
`;
  const python = `#!/usr/bin/env python3
"""Generated from OpenAPI operationId=createMonitorRun. Uses only the Python standard library."""
import json
import os
import urllib.request

base_url = os.environ.get("OPENGEO_BASE_URL", "http://localhost:8787").rstrip("/")
body = ${JSON.stringify(payload)}
request = urllib.request.Request(
    base_url + ${JSON.stringify(path)},
    data=body.encode("utf-8"),
    method=${JSON.stringify(method)},
    headers={
        "content-type": "application/json",
        "idempotency-key": os.environ.get("OPENGEO_IDEMPOTENCY_KEY", "example-monitor-001"),
        "prefer": "wait=5",
        **({"authorization": "Bearer " + os.environ["OPENGEO_API_KEY"]} if os.environ.get("OPENGEO_API_KEY") else {}),
    },
)
with urllib.request.urlopen(request) as response:
    print(json.dumps(json.load(response), ensure_ascii=False, indent=2))
`;
  return { curl, python, endpoint: path, method, requiredFields };
}

export async function generateExamples(checkOnly = false): Promise<void> {
  const bundle = renderExamples(await loadSpec());
  const existing = await Promise.all([readFile(curlPath, 'utf8').catch(() => ''), readFile(pythonPath, 'utf8').catch(() => '')]);
  if (checkOnly) {
    if (existing[0] !== bundle.curl || existing[1] !== bundle.python) throw new Error('generated examples are stale; run pnpm examples:generate');
    return;
  }
  await Promise.all([writeFile(curlPath, bundle.curl), writeFile(pythonPath, bundle.python)]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  generateExamples(process.argv.includes('--check')).catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
