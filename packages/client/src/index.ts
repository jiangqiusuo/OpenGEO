export interface OpenGEOClientOptions { baseUrl: string; fetch?: typeof globalThis.fetch }
export class OpenGEOClient {
  private readonly request: typeof globalThis.fetch;
  constructor(private readonly options: OpenGEOClientOptions) { this.request = options.fetch ?? globalThis.fetch; }
  async capabilities<T = unknown>(): Promise<T> { const r = await this.request(`${this.options.baseUrl}/v1/capabilities`); if (!r.ok) throw new Error(`OpenGEO request failed: ${r.status}`); return r.json() as Promise<T>; }
  async getJob<T = unknown>(id: string): Promise<T> { const r = await this.request(`${this.options.baseUrl}/v1/jobs/${encodeURIComponent(id)}`); if (!r.ok) throw new Error(`OpenGEO request failed: ${r.status}`); return r.json() as Promise<T>; }
}
