import type { CapabilityDefinition, Job, Observation } from '@opengeo/contracts';

export interface WorkbenchFixture {
  version: 'workbench.v1';
  project: { name:string; monogram:string; owned_domains:string[] };
  period: { label:string; start:string; end:string };
  opportunity: { title:string; detail:string };
  capabilities: CapabilityDefinition[];
  jobs: Job[];
  observations: Observation[];
}

const observedAt='2026-09-21T09:42:00.000Z';
const questions=[
  '适合成长团队的项目管理工具有哪些？',
  '如何选择支持跨部门协作的软件？',
  '项目管理软件的核心评估指标是什么？',
  '怎样追踪多个团队的交付风险？',
  '哪些工具适合建立可复盘的项目节奏？',
];
const ranks:Array<number|null>=[2,null,4,1,3];
const owned=[true,false,false,true,false];

const observations:Observation[]=questions.map((question,index)=>({
  id:`obs_workbench_${index+1}`,object:'opengeo.observation',schema_version:'1.0.0',job_id:'job_workbench_succeeded',
  prompt:{prompt_id:`prm_workbench_${index+1}`,version_id:`prmv_workbench_${index+1}_1`,text:question},
  target:{engine:'demo-engine',surface:index===1?'mobile':'web',interaction_mode:'search',turnaround_class:'best_effort',language:'zh-CN',region:'CN'},
  collection:{method:'manual_import',profile_version:'workbench-demo-1',requested_at:observedAt,observed_at:observedAt,repeat_index:1},
  answer:{availability:'observed',format:'text',text:`这是关于“${question}”的虚构演示回答，用于验证 OpenGEO 的证据链与工作台信息架构。`},
  retrieved_sources:{availability:'observed',items:[
    {url:owned[index]?`https://lanzhou.example/guides/${index+1}`:`https://source-${index+1}.example/research`,domain:owned[index]?'lanzhou.example':`source-${index+1}.example`},
    {url:`https://reference.example/items/${index+1}`,domain:'reference.example'},
  ]},
  explicit_citations:{availability:'observed',items:[]},
  brand_mentions:[{entity_id:'entity_lanzhou',entity_name:'澜舟科技',aliases_matched:ranks[index]===null?[]:['澜舟'],mentioned:ranks[index]!==null,mention_count:ranks[index]===null?0:1,rank:ranks[index],context:null,derivation:'opengeo_parser'}],
  rankings:ranks[index]===null?[]:[{entity_id:'entity_lanzhou',entity_name:'澜舟科技',rank:ranks[index],context:null,derivation:'opengeo_parser'}],
  quality:{is_valid:true,completeness_score:1,warnings:[]},
  provenance:{normalizer_version:'1.0.0',entity_parser_version:'1.0.0',ranking_parser_version:'1.0.0'},
}));

const job=(status:Job['status'],id:string,total:number,completed:number):Job=>({
  id,object:'opengeo.job',capability_id:'observe.ai_answer',status,result_state:status==='succeeded'?'complete':'sufficient',turnaround_class:'best_effort',
  progress:{total_items:total,completed_items:completed,failed_items:0,cancelled_items:0,completion_ratio:completed/total},
  requested_config:{interaction_mode:'search',turnaround_class:'best_effort'},effective_config:{interaction_mode:'search',turnaround_class:'best_effort'},
  health:{status:status==='partial'?'delayed':'operational',estimated_completion_at:null,message:status==='partial'?'仍有样本等待补采。':null},warnings:[],
  timestamps:{created_at:'2026-09-21T09:20:00.000Z',updated_at:observedAt,started_at:'2026-09-21T09:21:00.000Z',completed_at:status==='succeeded'?observedAt:null},links:{},
});

export const WORKBENCH_FIXTURE_V1:WorkbenchFixture={
  version:'workbench.v1',
  project:{name:'澜舟科技',monogram:'L',owned_domains:['lanzhou.example']},
  period:{label:'9月15日—9月21日',start:'2026-09-15',end:'2026-09-21'},
  opportunity:{title:'“采购评估”类问题缺少自有内容引用',detail:'3 个高意向问题提及了品牌，但没有引用自有域名。'},
  capabilities:[{
    capability_id:'observe.ai_answer',family:'observation',version:'1.0.0',request_schema_ref:'opengeo-job.v1.schema.json',result_schema_ref:'opengeo-observation.v1.schema.json',
    execution:{public_model:'job',turnaround_classes:['best_effort','expedited','interactive'],supports_partial_results:true,supports_cancel:true,supports_prefer_wait:true},
    billing:{unit:'observation',quoteable:true},
  }],
  jobs:[job('succeeded','job_workbench_succeeded',5,5),job('partial','job_workbench_partial',4,3)],
  observations,
};
