import { createHash } from 'node:crypto';
import type { Observation } from '@sysiphus/contracts';
import { computeMetrics } from '@sysiphus/metrics';

const fail = (code:string):never => { throw new Error(code); };
const record = (value:unknown):Record<string,unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string,unknown> : fail('invalid_input_object');
const text = (value:unknown,max:number):string => typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : fail('invalid_text');
const allowed = (value:Record<string,unknown>,keys:string[]) => { if(Object.keys(value).some(key=>!keys.includes(key)))fail('unknown_input_field'); };
const timestamp = (value:unknown):string => {
  if(typeof value !== 'string'||value.length>64||!/T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value))return fail('observed_at_requires_timezone');
  const date=new Date(value);return Number.isNaN(date.getTime())?fail('invalid_observed_at'):date.toISOString();
};
const normalized = (value:string) => value.normalize('NFKC').toLowerCase();
const literalPattern = (value:string):string => {
  const escaped=value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return `${/^[a-z0-9_]/.test(value)?'(?<![a-z0-9_])':''}${escaped}${/[a-z0-9_]$/.test(value)?'(?![a-z0-9_])':''}`;
};

/** An offline import, not a collector, semantic scorer, or recommendation model. */
export function analyzeAnswers(value:unknown) {
  const input=record(value);allowed(input,['brand','aliases','observed_at','planned','answers']);
  const brand=text(input.brand,120);
  if(input.aliases!==undefined&&(!Array.isArray(input.aliases)||input.aliases.length>20))fail('invalid_aliases');
  const names=[...new Set([brand,...((input.aliases??[]) as unknown[]).map(alias=>text(alias,120))].map(normalized))].sort((a,b)=>b.length-a.length);
  const observedAt=timestamp(input.observed_at);
  if(!Array.isArray(input.answers)||input.answers.length>1000)fail('invalid_answers');
  const answers=input.answers as unknown[];
  const planned=input.planned??answers.length;
  if(!Number.isSafeInteger(planned)||(planned as number)<answers.length||(planned as number)>10000)fail('invalid_planned');
  const jobId=`job_import_${createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0,24)}`;
  const ids=new Set<string>();
  const observations:Observation[]=answers.map((entry,index)=>{
    const row=record(entry);allowed(row,['id','prompt','engine','answer','rank','citations','observed_at']);
    const id=row.id===undefined?`obs_${jobId.slice(4)}_${index+1}`:text(row.id,128);
    if(!id.startsWith('obs_'))fail('invalid_observation_id');
    if(ids.has(id))fail('duplicate_observation_id');ids.add(id);
    const prompt=text(row.prompt,4000),engine=text(row.engine,120);
    const answer=row.answer===null?null:text(row.answer,200000);
    const valid=answer!==null;
    const folded=normalized(answer??'');
    const matches=[...folded.matchAll(new RegExp(names.map(literalPattern).join('|'),'gu'))];
    const mentioned=matches.length>0;
    const rank=row.rank??null;
    if(rank!==null&&(!Number.isSafeInteger(rank)||(rank as number)<1||(rank as number)>10000||!mentioned))fail('invalid_manual_rank');
    if(row.citations!==undefined&&(!Array.isArray(row.citations)||row.citations.length>100))fail('invalid_citations');
    if(!valid&&(rank!==null||Array.isArray(row.citations)&&row.citations.length>0))fail('unavailable_answer_has_evidence');
    const urls=[...new Set(((row.citations??[]) as unknown[]).map(value=>{
      if(typeof value!=='string'||value.length>2048)fail('invalid_citation_url');
      try{const url=new URL(value as string);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)fail('invalid_citation_url');return url.href;}
      catch{return fail('invalid_citation_url');}
    }))];
    return {id,object:'opengeo.observation',schema_version:'1.0.0',job_id:jobId,
      prompt:{prompt_id:`prompt_${index+1}`,version_id:'manual.v1',text:prompt},
      target:{engine,surface:'local',interaction_mode:'standard',turnaround_class:'best_effort'},
      collection:{method:'manual_import',profile_version:'manual-answers.v1',observed_at:row.observed_at===undefined?observedAt:timestamp(row.observed_at),repeat_index:1},
      answer:{availability:valid?'observed':'not_available',format:'text',text:answer},
      retrieved_sources:{availability:'not_requested',items:[]},
      explicit_citations:{availability:!valid?'not_available':row.citations===undefined?'unknown':'observed',items:urls.map(url=>({url,domain:new URL(url).hostname}))},
      brand_mentions:[{entity_id:'target_brand',entity_name:brand,aliases_matched:names.filter(name=>new RegExp(literalPattern(name),'u').test(folded)),mentioned,mention_count:matches.length,derivation:'opengeo_parser'}],
      rankings:rank===null?[]:[{entity_id:'target_brand',entity_name:brand,rank:rank as number,derivation:'human_corrected'}],
      quality:{is_valid:valid,completeness_score:valid?1:0,warnings:[{code:'manual_input_unverified'},{code:'literal_mentions_not_recommendations'}]},
      provenance:{normalizer_version:'manual-answers.v1',entity_parser_version:'literal-nfkc-ascii-boundary.v1',ranking_parser_version:'human-supplied.v1'}};
  });
  const metrics=computeMetrics(observations,{entityId:'target_brand',planned:planned as number});
  const byEngine=[...new Set(observations.map(item=>item.target.engine))].map(engine=>{
    const group=observations.filter(item=>item.target.engine===engine);
    return {engine,planned_basis:'provided_rows',metrics:computeMetrics(group,{entityId:'target_brand',planned:group.length})};
  });
  return {object:'opengeo.local_analysis',version:'1.0.0',source:'manual_import',brand,
    sample:{planned,provided:observations.length,valid:observations.filter(item=>item.quality.is_valid).length},
    limitations:['User-supplied answers and citations; no website collection or independent verification.','Literal mentions do not imply recommendations or positive sentiment.','Ranks are supplied by the user, never inferred from text.'],
    metrics,by_engine:byEngine,observations};
}
