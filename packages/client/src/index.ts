export interface OpenGEOClientOptions { baseUrl: string; apiKey?: string; fetch?: typeof globalThis.fetch }
export interface MonitorRunRequest { capability_id: 'observe.ai_answer'; prompts: Array<string | Record<string, unknown>>; turnaround_class?: 'best_effort' | 'expedited' | 'interactive'; interaction_mode?: 'standard' | 'reasoning' | 'search' | 'reasoning_search'; monitoring_profile?: 'cn-search-v1' | 'global-llm-v1' }
export interface FinalizePartialRequest { cancel_remaining?: boolean }

/**
 * The stable error envelope returned by the public API.
 *
 * `details` remains unknown on purpose: endpoints may add safe, contract-specific
 * fields without forcing every client release to understand them first.
 */
export interface OpenGEOErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
  [key: string]: unknown;
}

/** A failed HTTP request with the information needed for caller-side recovery. */
export class OpenGEORequestError extends Error {
  readonly name = 'OpenGEORequestError';
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly requestId?: string;
  readonly retryAfter?: string;

  constructor(status: number, payload: unknown, headers?: Headers) {
    const envelope = OpenGEORequestError.envelope(payload);
    super(typeof envelope.message === 'string' && envelope.message.length > 0
      ? envelope.message
      : `OpenGEO request failed: ${status}`);
    this.status = status;
    this.code = typeof envelope.code === 'string' ? envelope.code : undefined;
    this.details = envelope.details;
    this.requestId = headers?.get('x-request-id') ?? headers?.get('request-id') ?? undefined;
    this.retryAfter = headers?.get('retry-after') ?? undefined;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  private static envelope(payload: unknown): OpenGEOErrorPayload {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
    const record = payload as Record<string, unknown>;
    const nested = record.error;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) return nested as OpenGEOErrorPayload;
    return record as OpenGEOErrorPayload;
  }

  static async fromResponse(response: Response): Promise<OpenGEORequestError> {
    let payload: unknown;
    try {
      payload = await response.clone().json();
    } catch {
      payload = undefined;
    }
    return new OpenGEORequestError(response.status, payload, response.headers);
  }
}

export class OpenGEOClient {
  private readonly request: typeof globalThis.fetch;
  constructor(private readonly options: OpenGEOClientOptions) { this.request = options.fetch ?? globalThis.fetch; }
  private endpoint(path: string): string { return `${this.options.baseUrl.replace(/\/$/, '')}${path}`; }
  private headers(initial: Record<string, string> = {}): Record<string, string> { return this.options.apiKey ? { ...initial, authorization: `Bearer ${this.options.apiKey}` } : initial; }
  private async json<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.request(this.endpoint(path), init);
    if (!response.ok) throw await OpenGEORequestError.fromResponse(response);
    return response.json() as Promise<T>;
  }
  async capabilities<T = unknown>(): Promise<T> { return this.json<T>('/v1/capabilities', { headers: this.headers() }); }
  async getJob<T = unknown>(id: string): Promise<T> { return this.json<T>(`/v1/jobs/${encodeURIComponent(id)}`, { headers: this.headers() }); }
  async getJobItems<T = unknown>(id: string): Promise<T> { return this.json<T>(`/v1/jobs/${encodeURIComponent(id)}/items`, { headers: this.headers() }); }
  async finalizePartial<T = unknown>(id: string, input: FinalizePartialRequest = {}): Promise<T> { return this.json<T>(`/v1/jobs/${encodeURIComponent(id)}/finalize-partial`, { method: 'POST', headers: this.headers({ 'content-type': 'application/json' }), body: JSON.stringify(input) }); }
  async cancelJob<T = unknown>(id: string): Promise<T> { return this.json<T>(`/v1/jobs/${encodeURIComponent(id)}/cancel`, { method: 'POST', headers: this.headers() }); }
  async createMonitorRun<T = unknown>(input: MonitorRunRequest, idempotencyKey: string, preferWaitMs?: number): Promise<T> { const headers: Record<string, string> = this.headers({ 'content-type': 'application/json', 'idempotency-key': idempotencyKey }); if (preferWaitMs !== undefined) headers.prefer = `wait=${Math.max(0, Math.floor(preferWaitMs / 1000))}`; return this.json<T>('/v1/monitor-runs', { method: 'POST', headers, body: JSON.stringify(input) }); }
}
