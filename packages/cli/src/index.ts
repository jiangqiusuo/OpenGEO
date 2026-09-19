import { OpenGEOClient, type MonitorRunRequest } from '@opengeo/client';

export interface CliIo { write(value: string): void }
export interface CliDependencies { fetch?: typeof globalThis.fetch; stdout?: CliIo; stderr?: CliIo; env?: Record<string, string | undefined> }

const usage = `OpenGEO CLI

Usage:
  pnpm cli -- capabilities [--base-url URL]
  pnpm cli -- monitor --prompt TEXT --idempotency-key KEY [options]
  pnpm cli -- job JOB_ID [--base-url URL]
  pnpm cli -- items JOB_ID [--base-url URL]
  pnpm cli -- finalize JOB_ID [--cancel-remaining] [--base-url URL]
  pnpm cli -- cancel JOB_ID [--base-url URL]

Monitor options:
  --turnaround best_effort|expedited|interactive
  --interaction standard|reasoning|search|reasoning_search
  --profile cn-search-v1|global-llm-v1
  --wait SECONDS
  --base-url URL

Environment:
  OPENGEO_BASE_URL  Defaults to http://localhost:8787
  OPENGEO_API_KEY   Optional Bearer API key; never pass it as a CLI argument
`;

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`missing_value:${name}`);
  return value;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T, name: string): T {
  if (value === undefined) return fallback;
  if (allowed.includes(value as T)) return value as T;
  throw new Error(`invalid_value:${name}`);
}

function output(io: CliIo, value: unknown): void { io.write(`${JSON.stringify(value, null, 2)}\n`); }

export async function runCli(argv: string[], dependencies: CliDependencies = {}): Promise<number> {
  if (argv[0] === '--') argv = argv.slice(1);
  const stdout = dependencies.stdout ?? process.stdout;
  const stderr = dependencies.stderr ?? process.stderr;
  const env = dependencies.env ?? process.env;
  const command = argv[0];
  if (!command || command === '--help' || command === '-h' || command === 'help') { stdout.write(usage); return 0; }
  try {
    const baseUrl = (option(argv, '--base-url') ?? env.OPENGEO_BASE_URL ?? 'http://localhost:8787').replace(/\/$/, '');
    const client = new OpenGEOClient({ baseUrl, apiKey: env.OPENGEO_API_KEY, fetch: dependencies.fetch });
    if (command === 'capabilities') { output(stdout, await client.capabilities()); return 0; }
    if (command === 'job') {
      const id = argv[1];
      if (!id || id.startsWith('--')) throw new Error('job_id_required');
      output(stdout, await client.getJob(id));
      return 0;
    }
    if (command === 'items') {
      const id = argv[1];
      if (!id || id.startsWith('--')) throw new Error('job_id_required');
      output(stdout, await client.getJobItems(id));
      return 0;
    }
    if (command === 'finalize') {
      const id = argv[1];
      if (!id || id.startsWith('--')) throw new Error('job_id_required');
      output(stdout, await client.finalizePartial(id, { cancel_remaining: argv.includes('--cancel-remaining') }));
      return 0;
    }
    if (command === 'cancel') {
      const id = argv[1];
      if (!id || id.startsWith('--')) throw new Error('job_id_required');
      output(stdout, await client.cancelJob(id));
      return 0;
    }
    if (command === 'monitor') {
      const prompt = option(argv, '--prompt');
      const idempotencyKey = option(argv, '--idempotency-key');
      if (!prompt) throw new Error('prompt_required');
      if (!idempotencyKey) throw new Error('idempotency_key_required');
      const turnaround = oneOf(option(argv, '--turnaround'), ['best_effort', 'expedited', 'interactive'] as const, 'best_effort', 'turnaround');
      const interaction = oneOf(option(argv, '--interaction'), ['standard', 'reasoning', 'search', 'reasoning_search'] as const, 'search', 'interaction');
      const profile = option(argv, '--profile');
      if (profile !== undefined && profile !== 'cn-search-v1' && profile !== 'global-llm-v1') throw new Error('invalid_value:profile');
      const wait = option(argv, '--wait');
      const waitSeconds = wait === undefined ? undefined : Number(wait);
      if (waitSeconds !== undefined && (!Number.isInteger(waitSeconds) || waitSeconds < 0)) throw new Error('invalid_value:wait');
      const request: MonitorRunRequest = { capability_id: 'observe.ai_answer', prompts: [prompt], turnaround_class: turnaround, interaction_mode: interaction, ...(profile ? { monitoring_profile: profile } : {}) };
      output(stdout, await client.createMonitorRun(request, idempotencyKey, waitSeconds === undefined ? undefined : waitSeconds * 1000));
      return 0;
    }
    stderr.write(`Unknown command: ${command}\n\n${usage}`);
    return 2;
  } catch (error) {
    stderr.write(`${error instanceof Error ? error.message : 'OpenGEO CLI failed'}\n`);
    return 1;
  }
}
