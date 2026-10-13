import { useEffect, useRef, useState } from 'react';
import { DEFAULT_WORKBENCH_VIEW, loadWorkbenchView, type WorkbenchMetricId, type WorkbenchEvidence } from './workbench-data';
import { SurfaceDialog } from './SurfaceDialog';
import { Icon } from './Icons';

type Selection={kind:'metric';id:WorkbenchMetricId}|{kind:'observation';id:string};
const plannedNavigation=[['项目','project'],['提示词','prompt'],['监测任务管理','pulse'],['证据库管理','evidence'],['内容','content'],['发布','publish'],['复测与对比','compare'],['用量与钱包','usage'],['设置','settings']] as const;
const auditActionLabel=(action:string)=>({'workspace.created':'创建工作区','workspace.member_added':'添加成员','workspace.api_key_created':'创建 API Key','workspace.api_key_revoked':'撤销 API Key'}[action]??action);
const auditTime=(value:string)=>new Date(value).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});

function ObservationContent({item}:{item:WorkbenchEvidence}) {
  return <>
    <p className="detail-question">{item.query}</p>
    <dl className="definition-list"><div><dt>采集环境</dt><dd>{item.platform}</dd></div><div><dt>品牌与排名</dt><dd>{item.brand} · {item.rank}</dd></div></dl>
    <section className="drawer-section"><h3>回答正文</h3><p className="answer-text">{item.answer}</p></section>
    <section className="drawer-section"><h3>检索来源 · {item.references.length} 条</h3><p>检索来源不等同回答明确引用。</p>
      {item.references.length?<ul className="reference-list">{item.references.map((ref,index)=><li key={index}>{ref.url?<a href={ref.url} target="_blank" rel="noopener noreferrer">{ref.label} ↗</a>:<span>{ref.label}（无可用链接）</span>}</li>)}</ul>:<p className="empty-state">该观察没有可展示的检索来源。</p>}
    </section>
  </>;
}

export function App() {
  const [selection,setSelection]=useState<Selection|null>(null);
  const [navigationOpen,setNavigationOpen]=useState(false);
  const [toast,setToast]=useState('');
  const [workbench,setWorkbench]=useState(DEFAULT_WORKBENCH_VIEW);
  const detailTrigger=useRef<HTMLElement|null>(null);
  const menuTrigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>{let active=true;void loadWorkbenchView({baseUrl:import.meta.env.VITE_OPEN_GEO_API_URL,activityOverviewUrl:import.meta.env.VITE_OPEN_GEO_ACTIVITY_URL}).then(value=>{if(active)setWorkbench(value);});return()=>{active=false;};},[]);
  useEffect(()=>{if(!toast)return;const timer=window.setTimeout(()=>setToast(''),2600);return()=>window.clearTimeout(timer);},[toast]);
  const planned=(label:string)=>setToast(`${label}尚未接入，已标记为规划中。`);
  const openDetail=(next:Selection,trigger:HTMLElement)=>{detailTrigger.current=trigger;setSelection(next);};
  const selectedMetric=selection?.kind==='metric'?workbench.metrics.find(item=>item.id===selection.id):undefined;
  const selectedObservation=selection?.kind==='observation'?workbench.observations.find(item=>item.id===selection.id):undefined;
  const support=selectedMetric?workbench.observations.filter(item=>selectedMetric.supportIds.includes(item.id)):[];
  const analyzableRun=workbench.runs.find(run=>run.status==='waiting'&&run.canAnalyze);
  const navigation=(mobile=false)=><nav aria-label={mobile?'移动导航':'主导航'}>
    <p className="nav-caption">查看当前结果</p>
    {([['总览','overview','overview'],['最近监测','pulse','runs'],['最近证据','evidence','evidence']] as const).map(([label,icon,id])=><a className="nav-item" href={`#${id}`} key={id} onClick={()=>setNavigationOpen(false)}><Icon name={icon}/><span>{label}</span></a>)}
    <details className="planned-nav"><summary>规划中的功能</summary>{plannedNavigation.map(([label,icon])=><button className="nav-item" key={label} onClick={()=>{planned(label);if(mobile)setNavigationOpen(false);}}><Icon name={icon}/><span>{label}</span><em>规划中</em></button>)}</details>
  </nav>;
  return <div className="shell">
    <aside className="sidebar">
      <a className="brand" href="#overview" aria-label="OpenGEO 总览"><img className="brand-mark" src="/logo-mark.svg" alt="" aria-hidden="true"/><span>OpenGEO</span><small>Community</small></a>
      <div className="project-switch"><span className="project-monogram">{workbench.project.monogram}</span><span><strong>{workbench.project.name}</strong><small>示例工作区</small></span></div>
      {navigation()}
      <div className={`sidebar-note ${workbench.source}`}><span className="status-dot"/><div><strong>{workbench.sourceLabel}</strong><small>{workbench.sourceNote}</small></div></div>
    </aside>
    <main id="overview">
      <header className="topbar"><div className="breadcrumb"><button ref={menuTrigger} className="icon-button mobile-menu" aria-label="打开导航" onClick={()=>setNavigationOpen(true)}><Icon name="menu"/></button><span className="crumb">项目</span><span className="slash">/</span><strong>{workbench.project.name}</strong></div><div className="top-actions"><a className="public-blog-link" href="/about/">产品介绍</a><a className="public-blog-link" href="/blog/">博客</a></div></header>
      <div className="canvas">
        <div className="source-notice"><span className="preview-badge">模拟数据</span><div><strong>演示工作区</strong><p>{workbench.sourceLabel} · {workbench.sourceNote}</p><small>指标来自已加载观察；趋势、建议与活动摘要另行标注。页面不执行真实监测。</small></div></div>
        {workbench.loadError&&<div className="data-notice" role="status"><div><strong>API 数据暂时不可用</strong><span>{workbench.loadError.status??'网络错误'} {workbench.loadError.code??''}</span></div><small>{workbench.loadError.requestId?`请求 ID：${workbench.loadError.requestId}`:'已回退到本地 Fixture'}</small></div>}
        <section className="page-intro"><div><div className="eyebrow">示例周期 · {workbench.period.label}</div><h1>监测总览</h1><p>从任务进度到回答证据，复查每一个结果。</p></div><div className="intro-actions"><a className="primary" href="#runs">查看最近监测 <Icon name="arrow" size={16}/></a><button className="quiet planned-button" onClick={()=>planned('新建监测')}>新建监测 <span>规划中</span></button></div></section>
        <section className="metrics-section" aria-labelledby="metrics-title"><div className="section-heading"><div><h2 id="metrics-title">关键指标</h2><p>查看计算口径与对应样本。</p></div></div><div className="metric-grid">{workbench.metrics.map(metric=><button className={`metric-card ${metric.tone}`} onClick={event=>openDetail({kind:'metric',id:metric.id},event.currentTarget)} key={metric.id}><span className="metric-label">{metric.label}<Icon name="arrow" size={14}/></span><span className="metric-value">{metric.value}</span><small>{metric.note}</small><span className="metric-delta">{metric.id==='valid'?`有效比例 ${metric.delta}`:'查看支持样本'}</span></button>)}</div></section>
        <section className="runs-card" id="runs"><div className="section-heading compact"><div><h2>最近监测</h2><p>当前任务的完成情况。</p></div><span className="preview-badge">模拟任务</span></div>{workbench.runs.map(run=><div className="run-row" key={run.id}><span className={`run-status ${run.status}`}><Icon name={run.status==='success'?'check':'clock'}/></span><div><strong>{run.title}</strong><small>{run.detail}</small></div><span className="run-progress">{run.completed}</span><time>{run.time}</time></div>)}{analyzableRun&&<div className="partial-callout"><span>{analyzableRun.completed} 已完成，可查看已加载证据。</span><a href="#evidence">查看当前证据 →</a><button onClick={()=>planned('使用当前结果继续')}>继续执行 <em>规划中</em></button></div>}</section>
        <section className="evidence-preview" id="evidence"><div className="section-heading"><div><h2>最近证据</h2><p>{workbench.observations.length} 条有效观察 · 点击查看对应回答与来源。</p></div></div><div className="evidence-table"><div className="table-row table-head" aria-hidden="true"><span>问题</span><span>采集环境</span><span>品牌</span><span>位置</span><span>检索来源</span></div><ul className="evidence-list">{workbench.observations.slice(0,5).map(item=><li key={item.id}><button className="table-row" onClick={event=>openDetail({kind:'observation',id:item.id},event.currentTarget)}><span className="query-cell"><strong>{item.query}</strong><small>查看回答与检索来源</small></span><span className="platform-cell">{item.platform}</span><span className={`brand-cell mention ${item.brand==='已提及'?'yes':'no'}`}>{item.brand}</span><span className="rank-cell">{item.rank}</span><span className="reference-cell">{item.source}<Icon name="arrow" size={14}/></span></button></li>)}</ul>{workbench.observations.length===0&&<p className="empty-state">暂无有效观察，指标显示为空。</p>}{workbench.observations.length>5&&<p className="list-note">总览展示前5条；完整支持样本可从指标详情查看。</p>}</div></section>
        <details className="secondary-panel demo-context"><summary>演示趋势与建议 <span>预设示例，不参与本次指标计算</span></summary><section className="signal-panel" aria-label="预设演示趋势"><div className="signal-chart"><div className="chart-head"><span>七次预设示例</span><strong>演示曲线</strong></div><svg viewBox="0 0 560 150" role="img" aria-label="演示趋势，不代表实际历史监测"><path className="grid" d="M0 30H560M0 75H560M0 120H560"/><path className="area" d="M0 116 C70 105 89 97 140 101 S230 90 280 89 S380 64 420 69 S500 37 560 35 L560 150H0Z"/><path className="line" d="M0 116 C70 105 89 97 140 101 S230 90 280 89 S380 64 420 69 S500 37 560 35"/></svg></div><div className="opportunity-note"><div><small>预设演示建议</small><strong>{workbench.opportunity.title}</strong><p>{workbench.opportunity.detail}</p></div></div></section></details>
        <details className="secondary-panel"><summary>优化流程 <span>内容、发布与复测尚未接入</span></summary><div className="workflow-rail">{workbench.workflow.map((step,index)=><div className={`workflow-step ${step.state}`} key={step.title}><span className="step-marker">{step.state==='done'?<Icon name="check" size={14}/>:index+1}</span><div><strong>{step.title}</strong><small>{step.detail}</small></div>{step.state==='current'&&<button onClick={event=>openDetail({kind:'metric',id:'mention'},event.currentTarget)}>查看依据</button>}{step.state==='planned'&&<em>规划中</em>}</div>)}</div></details>
        <details className="secondary-panel"><summary>最近活动 <span>{workbench.audit.source==='mock-api'?'只读摘要':'Fixture 示例'}</span></summary><p className="list-note">{workbench.audit.note}</p><ul className="audit-list">{workbench.audit.items.slice(0,4).map(item=><li className="audit-row" key={item.id}><span className="audit-event-dot"/><div><strong>{auditActionLabel(item.action)}</strong><details className="event-technical"><summary>技术标识</summary><small>{item.id} · {item.operationKey}</small></details></div><time dateTime={item.createdAt}>{auditTime(item.createdAt)}</time></li>)}</ul>{workbench.audit.items.length===0&&<p className="empty-state">当前没有活动记录。</p>}</details>
      </div>
    </main>
    {navigationOpen&&<SurfaceDialog title="工作台导航" kicker="OpenGEO Community" className="navigation-dialog" returnFocus={menuTrigger.current} onDismiss={()=>setNavigationOpen(false)}>{navigation(true)}<p className="drawer-footnote">演示工作区 · 仅使用模拟数据</p></SurfaceDialog>}
    {selection&&<SurfaceDialog title={selectedMetric?.label??(selectedObservation?'回答证据':'详情暂不可用')} kicker={selection.kind==='metric'?'指标依据':'观察详情'} returnFocus={detailTrigger.current} onDismiss={()=>setSelection(null)}>
      {selectedMetric?<><div className="drawer-score"><strong>{selectedMetric.value}</strong><span>{selectedMetric.note}</span></div><dl className="definition-list"><div><dt>指标含义</dt><dd>{selectedMetric.definition}</dd></div><div><dt>计算公式</dt><dd>{selectedMetric.formula}</dd></div><div><dt>样本范围</dt><dd>{selectedMetric.scope}</dd></div><div><dt>视图口径版本</dt><dd>{workbench.fixtureVersion}</dd></div></dl><section className="drawer-section"><h3>支持样本 · {support.length} 条</h3>{support.length?support.slice(0,20).map(item=><button className="sample-button" key={item.id} onClick={()=>setSelection({kind:'observation',id:item.id})}><strong>{item.query}</strong><span>{item.brand} · {item.rank} · {item.source}</span><small>查看这条回答 →</small></button>):<p className="empty-state">当前没有满足这个指标条件的有效样本。</p>}{support.length>20&&<p className="list-note">详情展示前20条，指标基于全部已加载观察计算。</p>}</section></>:selectedObservation?<ObservationContent item={selectedObservation}/>:<p className="empty-state">当前数据已变化，请关闭后重新选择。</p>}
      <p className="drawer-footnote">模拟数据 · 指标范围仅为本视图已加载观察。</p>
    </SurfaceDialog>}
    {toast&&<div className="toast" role="status">{toast}</div>}
  </div>;
}
