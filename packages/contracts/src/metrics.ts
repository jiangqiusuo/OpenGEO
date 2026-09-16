import type {Observation, MetricResult} from './types.js';
export function computeMetric(metric_id:string, observations:Observation[], targetEntityId:string, competitorId?:string): MetricResult {
 const valid=observations.filter(o=>o.quality.is_valid); const mentioned=valid.filter(o=>o.brand_mentions?.some(m=>m.entity_id===targetEntityId&&m.mentioned));
 const rank=(o:Observation)=>o.rankings?.find(r=>r.entity_id===targetEntityId)?.rank;
 let included=valid.length, value:number|null=null;
 if(metric_id==='mention_rate') value=valid.length?mentioned.length/valid.length:null;
 else if(metric_id==='top3_rate_absolute') value=valid.length?valid.filter(o=>{const r=rank(o);return r!=null&&r>=1&&r<=3}).length/valid.length:null;
 else if(metric_id==='top3_rate_conditional') value=mentioned.length?mentioned.filter(o=>{const r=rank(o);return r!=null&&r>=1&&r<=3}).length/mentioned.length:null;
 else if(metric_id==='top1_rate') value=valid.length?valid.filter(o=>rank(o)===1).length/valid.length:null;
 else if(metric_id==='average_rank'){const rs=mentioned.map(rank).filter((r):r is number=>r!=null); value=rs.length?rs.reduce((a,b)=>a+b,0)/rs.length:null; included=rs.length;}
 else if(metric_id==='competitor_win_rate'&&competitorId){const pairs=valid.map(o=>[rank(o),o.rankings?.find(r=>r.entity_id===competitorId)?.rank] as const).filter(([a,b])=>a!=null&&b!=null); value=pairs.length?pairs.filter(([a,b])=>Number(a)<Number(b)).length/pairs.length:null; included=pairs.length;}
 else throw new Error(`Unsupported metric ${metric_id}`);
 const observationIds=observations.map(o=>o.id); const matchedObservationIds=mentioned.map(o=>o.id);
 return {metric_id,metric_version:'1.0.0',value,unit:'ratio',scope:{target_entity_id:targetEntityId},sample:{planned:observations.length,valid:valid.length,included,excluded:valid.length-included},evidence_query:{target_entity_id:targetEntityId,observation_ids:observationIds,matched_observation_ids:matchedObservationIds}};
}
