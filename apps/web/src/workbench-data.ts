import type { CapabilityDefinition, Job, Observation } from '@sysiphus/contracts';
import { OpenGEOClient, OpenGEORequestError } from '@sysiphus/client';
import { WORKBENCH_FIXTURE_V1, type WorkbenchFixture } from './workbench-fixture.v1';

export type WorkbenchSource='fixture'|'mock-api'|'fixture-fallback';
export type WorkbenchAuditSource='fixture'|'mock-api'|'fixture-fallback';
export interface WorkbenchMetric { label:string;value:string;delta:string;tone:'blue'|'green'|'amber'|'ink';note:string }
export interface WorkbenchEvidence { id:string;query:string;platform:string;brand:'已提及'|'未提及';rank:string;source:string;answer:string }
export interface WorkbenchRun { id:string;title:string;detail:string;completed:string;time:string;status:'success'|'waiting';canAnalyze:boolean }
export interface WorkbenchAuditItem { id:string; action:string; operationKey:string; createdAt:string }
export interface WorkbenchAuditSummary { version:'opengeo-audit-summary.v1'; source:WorkbenchAuditSource; status:'observed'|'fixture'|'fallback'|'not_available'; items:WorkbenchAuditItem[]; nextCursor:string|null; hasMore:boolean; note:string }
export interface WorkbenchView {
  fixtureVersion:string;source:WorkbenchSource;sourceLabel:string;sourceNote:string;
  project:WorkbenchFixture['project'];period:WorkbenchFixture['period'];opportunity:WorkbenchFixture['opportunity'];
  capabilities:number;visibility:{value:string;count:string;trend:string};metrics:WorkbenchMetric[];
  workflow:Array<{title:string;detail:string;state:'done'|'current'|'planned'}>;observations:WorkbenchEvidence[];runs:WorkbenchRun[];audit:WorkbenchAuditSummary;
  loadError?: WorkbenchLoadError;
}
export interface WorkbenchLoadError { status?:number; code?:string; message?:string; requestId?:string; retryAfter?:string }

const percent=(value:number,total:number)=>total===0?'—':`${(value/total*100).toFixed(1)}%`;
const observationMention=(item:Observation)=>item.brand_mentions?.some(mention=>mention.mentioned)??false;
const observationRank=(item:Observation)=>item.rankings?.map(ranking=>ranking.rank).sort((a,b)=>a-b)[0]??null;
const auditFromFixture=(fixture:WorkbenchFixture,source:WorkbenchAuditSource,note:string):WorkbenchAuditSummary=>({
  version:'opengeo-audit-summary.v1',source,status:source==='mock-api'?'observed':source==='fixture'?'fixture':'fallback',
  items:(fixture.audit?.items??[]).slice(0,10).map(item=>({id:item.id,action:item.action,operationKey:item.operationKey,createdAt:item.createdAt})),
  nextCursor:fixture.audit?.nextCursor??null,hasMore:fixture.audit?.hasMore??false,note,
});

export const deriveWorkbenchView=(fixture:WorkbenchFixture,source:WorkbenchSource='fixture',sourceNote='版本化公开 Fixture',audit?:WorkbenchAuditSummary):WorkbenchView=>{
  const valid=fixture.observations.filter(item=>item.quality.is_valid);
  const mentioned=valid.filter(observationMention);
  const top3=valid.filter(item=>{const rank=observationRank(item);return rank!==null&&rank<=3;});
  const owned=valid.filter(item=>item.retrieved_sources?.items.some(sourceItem=>sourceItem.domain!==null&&sourceItem.domain!==undefined&&fixture.project.owned_domains.includes(sourceItem.domain)));
  const observations=valid.slice(0,5).map(item=>{const rank=observationRank(item);const sources=item.retrieved_sources?.items.length??0;return {id:item.id,query:item.prompt.text,platform:`AI 回答 · ${item.target.surface==='mobile'?'移动端':'桌面端'}`,brand:observationMention(item)?'已提及' as const:'未提及' as const,rank:rank===null?'—':`第 ${rank} 位`,source:`${sources} 条来源`,answer:item.answer.text??'该样本没有可展示的回答正文。'};});
  const runs=fixture.jobs.map((item,index)=>{const progress=item.progress;const total=progress?.total_items??0;const completed=progress?.completed_items??0;return {id:item.id,title:index===0?'品牌基础监测':'竞品补充监测',detail:`${total} 个样本 · 统一 Job`,completed:`${completed} / ${total}`,time:new Date(item.timestamps.updated_at).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}),status:item.status==='succeeded'?'success' as const:'waiting' as const,canAnalyze:item.result_state==='sufficient'||item.result_state==='complete'||item.result_state==='finalized_partial'};});
  const validCount=valid.length;
  return {
    fixtureVersion:fixture.version,source,sourceLabel:source==='mock-api'?'本地 Mock API':source==='fixture-fallback'?'Fixture 回退':'契约 Fixture',sourceNote,
    project:fixture.project,period:fixture.period,opportunity:fixture.opportunity,capabilities:fixture.capabilities.length,
    visibility:{value:percent(mentioned.length,validCount),count:`${mentioned.length} / ${validCount} 条有效回答`,trend:'演示基线'},
    metrics:[
      {label:'品牌提及率',value:percent(mentioned.length,validCount),delta:'演示基线',tone:'blue',note:`${mentioned.length} / ${validCount} 条有效回答`},
      {label:'绝对 Top 3',value:percent(top3.length,validCount),delta:'演示基线',tone:'green',note:`${top3.length} / ${validCount} 条有效回答`},
      {label:'自有域名引用率',value:percent(owned.length,validCount),delta:'演示基线',tone:'amber',note:`${owned.length} / ${validCount} 条有效回答`},
      {label:'有效样本',value:String(validCount),delta:percent(validCount,fixture.observations.length),tone:'ink',note:`${fixture.observations.length-validCount} 条无效样本`},
    ],
    workflow:[
      {title:'设置问题',detail:`${validCount} 个演示问题`,state:'done'},
      {title:'执行监测',detail:`${validCount} 条有效回答`,state:'done'},
      {title:'理解表现',detail:`${fixture.capabilities.length} 项可用能力`,state:'current'},
      {title:'生成内容',detail:'规划中',state:'planned'},
      {title:'发布',detail:'规划中',state:'planned'},
      {title:'复测',detail:'规划中',state:'planned'},
    ],
    observations,runs,audit:audit??auditFromFixture(fixture,source,source==='fixture'?'版本化公开 Fixture 提供只读活动摘要':source==='mock-api'?'读取 Mock API 的只读活动摘要':'活动摘要已回退到版本化公开 Fixture'),
  };
};

const record=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const listData=(value:unknown):unknown[]=>record(value)&&Array.isArray(value.data)?value.data:[];
const isCapability=(value:unknown):value is CapabilityDefinition=>record(value)&&typeof value.capability_id==='string'&&typeof value.version==='string';
const isJob=(value:unknown):value is Job=>record(value)&&value.object==='opengeo.job'&&typeof value.id==='string'&&typeof value.status==='string'&&record(value.timestamps);
const isObservation=(value:unknown):value is Observation=>record(value)&&value.object==='opengeo.observation'&&typeof value.id==='string'&&record(value.prompt)&&record(value.quality);
const isAuditItem=(value:unknown):value is Record<string,unknown>=>record(value)&&typeof value.id==='string'&&typeof value.action==='string'&&(typeof value.operation_key==='string'||typeof value.operationKey==='string')&&(typeof value.created_at==='string'||typeof value.createdAt==='string');
export const parseAuditProjection=(value:unknown):Omit<WorkbenchAuditSummary,'source'|'status'|'note'>|null=>{
  const root=record(value)&&record(value.audit)?value.audit:value;
  if(!record(root)||!Array.isArray(root.items))return null;
  const items=root.items.filter(isAuditItem).slice(0,10).map(item=>({id:item.id as string,action:item.action as string,operationKey:(typeof item.operation_key==='string'?item.operation_key:item.operationKey) as string,createdAt:(typeof item.created_at==='string'?item.created_at:item.createdAt) as string}));
  return {version:'opengeo-audit-summary.v1',items,nextCursor:typeof root.next_cursor==='string'?root.next_cursor:typeof root.nextCursor==='string'?root.nextCursor:null,hasMore:root.has_more===true||root.hasMore===true};
};
export interface LoadWorkbenchOptions { baseUrl?:string;jobIds?:string[];fetchImpl?:typeof fetch;activityOverviewUrl?:string }
export const loadWorkbenchView=async(options:LoadWorkbenchOptions={}):Promise<WorkbenchView>=>{
  if(!options.baseUrl)return deriveWorkbenchView(WORKBENCH_FIXTURE_V1);
  try{
    const base=new URL(options.baseUrl);if(!['http:','https:'].includes(base.protocol))throw new Error('invalid_mock_url');
    const request=options.fetchImpl??fetch;const jobIds=options.jobIds??['job_demo_succeeded','job_demo_partial'];
    const client=new OpenGEOClient({baseUrl:base.toString(),apiKey:import.meta.env.VITE_OPEN_GEO_API_KEY,fetch:request});
    const [capabilityPayload,itemPayload,...jobPayloads]=await Promise.all([
      client.capabilities(),
      client.getJobItems(jobIds[0]??'job_demo_succeeded'),
      ...jobIds.map(id=>client.getJob(id)),
    ]);
    const capabilities=listData(capabilityPayload).filter(isCapability);
    const observations=listData(itemPayload).filter(isObservation);
    const jobs=jobPayloads.filter(isJob);
    if(capabilities.length===0||observations.length===0||jobs.length===0)throw new Error('mock_payload_invalid');
    const view=deriveWorkbenchView({...WORKBENCH_FIXTURE_V1,capabilities,observations,jobs},'mock-api',`读取 ${capabilities.length} 项能力、${jobs.length} 个 Job 和 ${observations.length} 条 Observation`,auditFromFixture(WORKBENCH_FIXTURE_V1,'fixture','活动数据源未配置，展示版本化公开 Fixture 示例'));
    if(options.activityOverviewUrl){
      try{
        const auditResponse=await request(options.activityOverviewUrl);
        if(!auditResponse.ok)throw new Error('audit_projection_unavailable');
        const parsed=parseAuditProjection(await auditResponse.json());
        if(parsed)view.audit={...parsed,source:'mock-api',status:'observed',note:'读取 Mock API 的只读活动摘要（不包含内部字段）'};
        else view.audit={...auditFromFixture(WORKBENCH_FIXTURE_V1,'fixture-fallback','Mock API 未提供符合契约的活动摘要，已回退到版本化公开 Fixture'),status:'not_available'};
      }catch{view.audit={...auditFromFixture(WORKBENCH_FIXTURE_V1,'fixture-fallback','活动摘要不可用，已回退到版本化公开 Fixture'),status:'fallback'};}
    }
    return view;
  }catch(error){
    const loadError=error instanceof OpenGEORequestError?{status:error.status,code:error.code,message:error.message,requestId:error.requestId,retryAfter:error.retryAfter}:undefined;
    const fallback=deriveWorkbenchView(WORKBENCH_FIXTURE_V1,'fixture-fallback','Mock API 不可用，已安全回退到版本化公开 Fixture');
    return loadError?{...fallback,loadError}:fallback;
  }
};

export const DEFAULT_WORKBENCH_VIEW=deriveWorkbenchView(WORKBENCH_FIXTURE_V1);
