import { describe, expect, it } from 'vitest';
import { deriveWorkbenchView, loadWorkbenchView, parseAuditProjection, safeReferenceUrl } from '../apps/web/src/workbench-data.js';
import { WORKBENCH_FIXTURE_V1 } from '../apps/web/src/workbench-fixture.v1.js';

describe('Community workbench read model',()=>{
  it('keeps each metric formula and supporting observation set aligned with its numerator',()=>{
    const view=deriveWorkbenchView(WORKBENCH_FIXTURE_V1);
    expect(view.metrics.map(item=>[item.id,item.supportIds.length])).toEqual([['mention',4],['top3',3],['owned',2],['valid',5]]);
    const top3=view.metrics.find(item=>item.id==='top3')!;
    expect(top3.supportIds).toEqual(['obs_workbench_1','obs_workbench_4','obs_workbench_5']);
    expect(top3.formula).toContain('排名不大于 3');
    expect(view.metrics.find(item=>item.id==='owned')!.definition).toContain('不等同回答明确引用');
    expect(new Set(view.metrics.map(item=>item.formula)).size).toBe(4);
  });
  it('does not truncate metric evidence to the five-row overview preview',()=>{
    const fixture=structuredClone(WORKBENCH_FIXTURE_V1);
    fixture.observations.push({...structuredClone(fixture.observations[0]),id:'obs_sixth'});
    const view=deriveWorkbenchView(fixture);
    expect(view.observations).toHaveLength(6);
    expect(view.metrics.find(item=>item.id==='mention')!.supportIds).toContain('obs_sixth');
    expect(view.observations.find(item=>item.id==='obs_sixth')!.references[0]).toEqual({label:'lanzhou.example',url:'https://lanzhou.example/guides/1'});
  });
  it('does not turn unsafe or credential-bearing source URLs into links',()=>{
    for(const value of ['javascript:alert(1)','data:text/html,test','https://user:pass@example.test','/relative',null])expect(safeReferenceUrl(value)).toBeNull();
    expect(safeReferenceUrl('https://source.example/research')).toBe('https://source.example/research');
    const fixture=structuredClone(WORKBENCH_FIXTURE_V1);
    fixture.observations[0].retrieved_sources!.items[0].url='javascript:alert(1)';
    expect(deriveWorkbenchView(fixture).observations[0].references[0].url).toBeNull();
  });
  it('derives visible metrics from the versioned contract fixture',()=>{
    const view=deriveWorkbenchView(WORKBENCH_FIXTURE_V1);
    expect(view.fixtureVersion).toBe('workbench.v1');
    expect(view.visibility.value).toBe('80.0%');
    expect(view.metrics.map(metric=>metric.value)).toEqual(['80.0%','60.0%','40.0%','5']);
    expect(view.observations).toHaveLength(5);
    expect(JSON.stringify(WORKBENCH_FIXTURE_V1)).not.toMatch(/dataforseo|molizhishu|secret|token|provider|upstream|cost|price|raw/i);
    expect(view.audit.version).toBe('opengeo-audit-summary.v1');
    expect(view.audit.source).toBe('fixture');
    expect(view.audit.status).toBe('fixture');
    expect(view.audit.items[0]).toEqual(expect.objectContaining({action:'workspace.api_key_revoked'}));
    expect(JSON.stringify(view.audit)).not.toMatch(/details|token|secret|provider|upstream|cost|price|raw/i);
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
    expect(view.audit.source).toBe('fixture');
    expect(view.audit.status).toBe('fixture');
    expect(view.audit.note).toContain('未配置');
  });

  it('falls back explicitly when the configured Mock API is unavailable',async()=>{
    const view=await loadWorkbenchView({baseUrl:'http://127.0.0.1:8787',fetchImpl:async()=>new Response(null,{status:503})});
    expect(view.source).toBe('fixture-fallback');
    expect(view.sourceNote).toContain('已安全回退');
    expect(view.observations).toHaveLength(5);
    expect(view.audit.source).toBe('fixture-fallback');
    expect(view.audit.status).toBe('fallback');
  });

  it('preserves structured API error context when falling back to the fixture',async()=>{
    const fetchImpl:typeof fetch=async()=>Response.json({error:{code:'rate_limited',message:'Try again later.'}},{status:429,headers:{'retry-after':'30','x-request-id':'req_workbench_1'}});
    const view=await loadWorkbenchView({baseUrl:'http://127.0.0.1:8787',fetchImpl});
    expect(view.source).toBe('fixture-fallback');
    expect(view.loadError).toEqual({status:429,code:'rate_limited',message:'Try again later.',requestId:'req_workbench_1',retryAfter:'30'});
  });

  it('loads the audit projection as a read-only, sanitized summary',async()=>{
    const fetchImpl:typeof fetch=async input=>{
      const path=new URL(typeof input==='string'?input:input instanceof URL?input:input.url).pathname;
      if(path.endsWith('/demo'))return Response.json({audit:{items:[{id:'audit_mock_1',action:'workspace.created',operation_key:'activity:workspace.created:1',created_at:'2026-10-02T01:02:03.000Z',details:{token:'must-not-render'}}],has_more:false,next_cursor:null}});
      if(path==='/v1/capabilities')return Response.json({object:'list',data:WORKBENCH_FIXTURE_V1.capabilities});
      if(path.endsWith('/items'))return Response.json({object:'list',data:WORKBENCH_FIXTURE_V1.observations.slice(0,1)});
      return Response.json(WORKBENCH_FIXTURE_V1.jobs[path.endsWith('partial')?1:0]);
    };
    const view=await loadWorkbenchView({baseUrl:'http://127.0.0.1:8787',activityOverviewUrl:'http://127.0.0.1:8787/mock/activity/demo',fetchImpl});
    expect(view.audit.source).toBe('mock-api');
    expect(view.audit.status).toBe('observed');
    expect(view.audit.items).toEqual([{id:'audit_mock_1',action:'workspace.created',operationKey:'activity:workspace.created:1',createdAt:'2026-10-02T01:02:03.000Z'}]);
    expect(view.audit.items[0]).not.toHaveProperty('details');
  });

  it('keeps the workbench usable when the audit projection is missing or unavailable',async()=>{
    const baseFetch:typeof fetch=async input=>{
      const path=new URL(typeof input==='string'?input:input instanceof URL?input:input.url).pathname;
      if(path==='/v1/capabilities')return Response.json({object:'list',data:WORKBENCH_FIXTURE_V1.capabilities});
      if(path.endsWith('/items'))return Response.json({object:'list',data:WORKBENCH_FIXTURE_V1.observations.slice(0,1)});
      return Response.json(WORKBENCH_FIXTURE_V1.jobs[0]);
    };
    const missing=await loadWorkbenchView({baseUrl:'http://127.0.0.1:8787',activityOverviewUrl:'http://127.0.0.1:8787/mock/activity/demo',fetchImpl:baseFetch});
    expect(missing.source).toBe('mock-api');
    expect(missing.audit.status).toBe('not_available');
    const unavailable=await loadWorkbenchView({baseUrl:'http://127.0.0.1:8787',activityOverviewUrl:'http://127.0.0.1:8787/mock/activity/demo',fetchImpl:async input=>{const path=new URL(typeof input==='string'?input:input instanceof URL?input:input.url).pathname;if(path.endsWith('/demo'))return new Response(null,{status:503});return baseFetch(input);}});
    expect(unavailable.source).toBe('mock-api');
    expect(unavailable.audit.status).toBe('fallback');
    expect(unavailable.audit.source).toBe('fixture-fallback');
  });

  it('accepts only the public audit projection fields',()=>{
    expect(parseAuditProjection({audit:{items:[{id:'a',action:'workspace.created',operation_key:'op',created_at:'2026-10-01T00:00:00.000Z',details:{raw:'hidden'}},{id:'invalid'}],has_more:true,next_cursor:'cursor'}})).toEqual({version:'opengeo-audit-summary.v1',items:[{id:'a',action:'workspace.created',operationKey:'op',createdAt:'2026-10-01T00:00:00.000Z'}],hasMore:true,nextCursor:'cursor'});
    expect(parseAuditProjection({audit:{items:[{id:'b',action:'workspace.member_added',operationKey:'op-b',createdAt:'2026-10-01T00:00:01.000Z'}],hasMore:false,nextCursor:null}})?.items[0]).toEqual({id:'b',action:'workspace.member_added',operationKey:'op-b',createdAt:'2026-10-01T00:00:01.000Z'});
    expect(parseAuditProjection({audit:{details:{token:'hidden'}}})).toBeNull();
  });
});
