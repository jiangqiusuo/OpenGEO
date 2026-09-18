export interface OpenGEOClientOptions { baseUrl: string; fetch?: typeof globalThis.fetch }
export interface MonitorRunRequest { capability_id: 'observe.ai_answer'; prompts: Array<string | Record<string, unknown>>; turnaround_class?: 'best_effort' | 'expedited' | 'interactive'; interaction_mode?: 'standard' | 'reasoning' | 'search' | 'reasoning_search'; monitoring_profile?: 'cn-search-v1' | 'global-llm-v1' }
export class OpenGEOClient {
  private readonly request: typeof globalThis.fetch;
  constructor(private readonly options: OpenGEOClientOptions) { this.request = options.fetch ?? globalThis.fetch; }
  async capabilities<T = unknown>(): Promise<T> { const r = await this.request(`${this.options.baseUrl}/v1/capabilities`); if (!r.ok) throw new Error(`OpenGEO request failed: ${r.status}`); return r.json() as Promise<T>; }
  async getJob<T = unknown>(id: string): Promise<T> { const r = await this.request(`${this.options.baseUrl}/v1/jobs/${encodeURIComponent(id)}`); if (!r.ok) throw new Error(`OpenGEO request failed: ${r.status}`); return r.json() as Promise<T>; }
  async createMonitorRun<T = unknown>(input: MonitorRunRequest, idempotencyKey: string, preferWaitMs?: number): Promise<T> { const headers: Record<string, string> = { 'content-type': 'application/json', 'idempotency-key': idempotencyKey }; if (preferWaitMs !== undefined) headers.prefer = `wait=${Math.max(0, Math.floor(preferWaitMs / 1000))}`; const r = await this.request(`${this.options.baseUrl}/v1/monitor-runs`, { method: 'POST', headers, body: JSON.stringify(input) }); if (!r.ok) throw new Error(`OpenGEO request failed: ${r.status}`); return r.json() as Promise<T>; }
}
