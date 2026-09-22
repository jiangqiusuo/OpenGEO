import { describe, expect, it } from 'vitest';
import { deriveWorkbenchView, loadWorkbenchView } from '../apps/web/src/workbench-data.js';
import { WORKBENCH_FIXTURE_V1 } from '../apps/web/src/workbench-fixture.v1.js';

describe('Community workbench read model',()=>{
  it('derives visible metrics from the versioned contract fixture',()=>{
    const view=deriveWorkbenchView(WORKBENCH_FIXTURE_V1);
    expect(view.fixtureVersion).toBe('workbench.v1');
    expect(view.visibility.value).toBe('80.0%');
    expect(view.metrics.map(metric=>metric.value)).toEqual(['80.0%','60.0%','40.0%','5']);
    expect(view.observations).toHaveLength(5);
    expect(JSON.stringify(WORKBENCH_FIXTURE_V1)).not.toMatch(/dataforseo|molizhishu|api[_-]?key|secret/i);
  });

  it('loads capabilities, jobs and observations from a configured Mock API',async()=>{
    const fetchImpl:typeof fetch=async input=>{
      const path=new URL(typeof input==='string'?input:input instanceof URL?input:input.url).pathname;
      if(path==='/v1/capabilities')return Response.json({object:'list',data:WORKBENCH_FIXTURE_V1.capabilities});
      if(path.endsWith('/items'))return Response.json({object:'list',data:WORKBENCH_FIXTURE_V1.observations.slice(0,3)});
      return Response.json(WORKBENCH_FIXTURE_V1.jobs[path.endsWith('partial')?1:0]);
    };
    const view=await loadWorkbenchView({baseUrl:'http://127.0.0.1:8787',fetchImpl});
    expect(view.source).toBe('mock-api');
    expect(view.observations).toHaveLength(3);
    expect(view.runs).toHaveLength(2);
    expect(view.sourceNote).toContain('3 条 Observation');
  });

  it('falls back explicitly when the configured Mock API is unavailable',async()=>{
    const view=await loadWorkbenchView({baseUrl:'http://127.0.0.1:8787',fetchImpl:async()=>new Response(null,{status:503})});
    expect(view.source).toBe('fixture-fallback');
    expect(view.sourceNote).toContain('已安全回退');
    expect(view.observations).toHaveLength(5);
  });
});
