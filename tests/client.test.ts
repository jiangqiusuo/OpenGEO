import { describe, expect, it, vi } from 'vitest';
import { OpenGEOClient } from '@opengeo/client';

describe('Community client',()=>{
  it('creates a neutral overseas monitoring Job request without provider fields',async()=>{
    const request=vi.fn(async(_url:RequestInfo|URL,_init?:RequestInit)=>new Response(JSON.stringify({id:'job_demo_queued',status:'queued'}),{status:202,headers:{'content-type':'application/json'}}));
    const client=new OpenGEOClient({baseUrl:'https://api.opengeo.test',fetch:request});
    await expect(client.createMonitorRun({capability_id:'observe.ai_answer',prompts:['Where is OpenGEO mentioned?'],monitoring_profile:'global-llm-v1',turnaround_class:'interactive'},'idem-1',1500)).resolves.toMatchObject({id:'job_demo_queued'});
    expect(request).toHaveBeenCalledWith('https://api.opengeo.test/v1/monitor-runs',expect.objectContaining({method:'POST'}));
    const init=request.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('idempotency-key')).toBe('idem-1');
    expect(new Headers(init.headers).get('prefer')).toBe('wait=1');
    expect(String(init.body)).not.toMatch(/provider|dataforseo|token|secret/i);
  });
});
