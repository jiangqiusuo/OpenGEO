import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_WORKBENCH_VIEW, loadWorkbenchView } from './workbench-data';

type IconName = 'overview'|'project'|'prompt'|'pulse'|'evidence'|'content'|'publish'|'compare'|'usage'|'settings'|'arrow'|'search'|'bell'|'chevron'|'spark'|'check'|'clock'|'external'|'close';

const iconPaths:Record<IconName,ReactNode> = {
  overview:<><path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z"/></>,
  project:<><path d="M4 6.5h6l2 2h8v9.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5Z"/><path d="M4 9h16"/></>,
  prompt:<><path d="M5 5h14v11H9l-4 3V5Z"/><path d="M8 9h8M8 12h5"/></>,
  pulse:<><path d="M3 12h4l2-6 4 12 2-6h6"/></>,
  evidence:<><path d="M6 3h9l3 3v15H6V3Z"/><path d="M14 3v4h4M9 11h6M9 15h6"/></>,
  content:<><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  publish:<><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 14v6h14v-6"/></>,
  compare:<><path d="M7 4v16M17 4v16M3 8l4-4 4 4M13 16l4 4 4-4"/></>,
  usage:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  settings:<><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6a8 8 0 0 0-1.5.9l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2.2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.5.9l.3 2.6h4l.3-2.6a8 8 0 0 0 1.5-.9l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z"/></>,
  arrow:<><path d="M5 12h14M14 7l5 5-5 5"/></>,
  search:<><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></>,
  bell:<><path d="M6 17h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4L6 17Z"/><path d="M10 20h4"/></>,
  chevron:<><path d="m8 10 4 4 4-4"/></>,
  spark:<><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3Z"/><path d="m18 15 .7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7L18 15Z"/></>,
  check:<><path d="m5 12 4 4L19 6"/></>,
  clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  external:<><path d="M14 5h5v5M19 5l-8 8"/><path d="M18 13v6H5V6h6"/></>,
  close:<><path d="m6 6 12 12M18 6 6 18"/></>,
};

function Icon({name,size=18}:{name:IconName;size?:number}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

const navGroups = [
  {label:'工作台',items:[['总览','overview',true],['项目','project'],['提示词','prompt'],['监测任务','pulse'],['证据库','evidence']]},
  {label:'行动',items:[['内容','content'],['发布','publish'],['复测与对比','compare']]},
  {label:'管理',items:[['用量与钱包','usage'],['设置','settings']]},
] as const;

export function App(){
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [toast,setToast]=useState('');
  const [workbench,setWorkbench]=useState(DEFAULT_WORKBENCH_VIEW);
  const drawerTitleId=useId();
  const closeButton=useRef<HTMLButtonElement>(null);

  useEffect(()=>{
    if(drawerOpen){closeButton.current?.focus();document.body.classList.add('drawer-open');}
    else document.body.classList.remove('drawer-open');
    return()=>document.body.classList.remove('drawer-open');
  },[drawerOpen]);

  useEffect(()=>{if(!toast)return;const timer=window.setTimeout(()=>setToast(''),2600);return()=>window.clearTimeout(timer);},[toast]);

  useEffect(()=>{let active=true;void loadWorkbenchView({baseUrl:import.meta.env.VITE_OPEN_GEO_API_URL}).then(value=>{if(active)setWorkbench(value);});return()=>{active=false;};},[]);

  const planned=(label:string)=>setToast(`${label}尚未接入，已标记为规划中。`);
  const {metrics,workflow,observations}=workbench;
  const analyzableRun=workbench.runs.find(run=>run.status==='waiting'&&run.canAnalyze);

  return <div className="shell">
    <aside className="sidebar">
      <a className="brand" href="#overview" aria-label="OpenGEO 总览">
        <span className="brand-mark"><span/><span/><span/></span>
        <span>OpenGEO</span>
        <small>Community</small>
      </a>
      <button className="project-switch" onClick={()=>planned('项目切换')}>
        <span className="project-monogram">{workbench.project.monogram}</span>
        <span><strong>{workbench.project.name}</strong><small>示例工作区</small></span>
        <Icon name="chevron" size={15}/>
      </button>
      <nav aria-label="主导航">
        {navGroups.map(group=><div className="nav-group" key={group.label}>
          <p>{group.label}</p>
          {group.items.map(([label,icon,active])=>active?
            <a className="nav-item active" href="#overview" key={label}><Icon name={icon}/><span>{label}</span></a>:
            <button className="nav-item" onClick={()=>planned(label)} key={label}><Icon name={icon}/><span>{label}</span><em>规划中</em></button>
          )}
        </div>)}
      </nav>
      <div className={`sidebar-note ${workbench.source}`}>
        <span className="status-dot"/>
        <div><strong>{workbench.sourceLabel}</strong><small>{workbench.sourceNote}</small></div>
      </div>
    </aside>

    <main id="overview">
      <header className="topbar">
        <div><span className="crumb">项目</span><span className="slash">/</span><strong>{workbench.project.name}</strong></div>
        <div className="top-actions">
          <button className="icon-button planned-icon" onClick={()=>planned('全局搜索')} aria-label="全局搜索，规划中"><Icon name="search"/><span>规划中</span></button>
          <button className="icon-button planned-icon" onClick={()=>planned('通知')} aria-label="通知，规划中"><Icon name="bell"/><span>规划中</span></button>
          <span className="avatar">王</span>
        </div>
      </header>

      <div className="canvas">
        <section className="page-intro">
          <div>
            <div className="eyebrow"><span>监测周期</span> {workbench.period.label} <button onClick={()=>planned('日期筛选')}>规划中 <Icon name="chevron" size={13}/></button></div>
            <h1>看清品牌在 AI 回答中的位置。</h1>
            <p>从一次监测出发，沿着证据、内容和复测完成一轮可验证的优化。</p>
          </div>
          <button className="primary planned-button" onClick={()=>planned('新建监测')}><Icon name="pulse"/>新建监测<span>规划中</span></button>
        </section>

        <section className="signal-panel" aria-label="本周期监测摘要">
          <div className="signal-lead">
            <span className="signal-kicker">本周期可见度</span>
            <strong>{workbench.visibility.value.replace('%','')}<small>%</small></strong>
            <span className="delta positive">{workbench.visibility.trend}</span>
            <p>品牌在当前样本中的提及情况为 {workbench.visibility.count}。</p>
            <button className="text-button" onClick={()=>setDrawerOpen(true)}>查看指标依据 <Icon name="arrow" size={15}/></button>
          </div>
          <div className="signal-chart" aria-label="七次演示监测的提及率趋势">
            <div className="chart-head"><span>近 7 次监测</span><strong>稳定上升</strong></div>
            <svg viewBox="0 0 560 150" role="img" aria-label="提及率趋势折线图">
              <path className="grid" d="M0 30H560M0 75H560M0 120H560"/>
              <path className="area" d="M0 116 C70 105 89 97 140 101 S230 90 280 89 S380 64 420 69 S500 37 560 35 L560 150H0Z"/>
              <path className="line" d="M0 116 C70 105 89 97 140 101 S230 90 280 89 S380 64 420 69 S500 37 560 35"/>
              <circle cx="560" cy="35" r="5"/>
            </svg>
            <div className="chart-labels"><span>08/11</span><span>08/18</span><span>08/25</span><span>09/01</span><span>09/08</span><span>09/15</span><span>09/21</span></div>
          </div>
          <div className="opportunity-note">
            <span className="note-icon"><Icon name="spark"/></span>
            <div><small>本周机会</small><strong>{workbench.opportunity.title}</strong><p>{workbench.opportunity.detail}</p></div>
            <button onClick={()=>planned('查看机会')}><Icon name="arrow"/></button>
          </div>
        </section>

        <section className="metrics-section">
          <div className="section-heading"><div><h2>关键指标</h2><p>点击指标查看计算口径与支持样本。</p></div><button className="quiet planned-button" onClick={()=>planned('管理指标')}>管理指标 <span>规划中</span></button></div>
          <div className="metric-grid">
            {metrics.map(metric=><button className={`metric-card ${metric.tone}`} onClick={()=>setDrawerOpen(true)} key={metric.label}>
              <span className="metric-label">{metric.label}<Icon name="arrow" size={14}/></span>
              <span className="metric-value">{metric.value}</span>
              <span className={metric.delta.startsWith('-')?'metric-delta negative':'metric-delta'}>{metric.delta}</span>
              <small>{metric.note}</small>
            </button>)}
          </div>
        </section>

        <div className="lower-grid">
          <section className="workflow-card">
            <div className="section-heading compact"><div><h2>优化工作流</h2><p>当前停在“理解表现”。</p></div><span className="stage-count">3 / 6</span></div>
            <div className="workflow-rail">
              {workflow.map((step,index)=><div className={`workflow-step ${step.state}`} key={step.title}>
                <span className="step-marker">{step.state==='done'?<Icon name="check" size={14}/>:index+1}</span>
                <div><strong>{step.title}</strong><small>{step.detail}</small></div>
                {step.state==='current'&&<button onClick={()=>setDrawerOpen(true)}>查看依据</button>}
                {step.state==='planned'&&<em>规划中</em>}
              </div>)}
            </div>
          </section>

          <section className="runs-card" id="runs">
            <div className="section-heading compact"><div><h2>最近监测</h2><p>任务状态来自统一 Job 模型。</p></div><button className="text-button" onClick={()=>planned('查看全部任务')}>查看全部 <span>规划中</span></button></div>
            {workbench.runs.map(run=><div className="run-row" key={run.id}>
              <span className={`run-status ${run.status}`}><Icon name={run.status==='success'?'check':'clock'}/></span>
              <div><strong>{run.title}</strong><small>{run.detail}</small></div>
              <span className="run-progress">{run.completed}</span><time>{run.time}</time>
            </div>)}
            {analyzableRun&&<div className="partial-callout"><span>{analyzableRun.completed} 已完成，已达到可分析阈值。</span><button onClick={()=>planned('使用当前结果继续')}>使用当前结果继续 <em>规划中</em></button></div>}
          </section>
        </div>

        <section className="evidence-preview">
          <div className="section-heading"><div><h2>最近证据</h2><p>回答、引用和样本范围保持可追溯。</p></div><button className="text-button" onClick={()=>setDrawerOpen(true)}>打开证据库 <Icon name="external" size={15}/></button></div>
          <div className="evidence-table" role="table" aria-label="最近证据样本">
            <div className="table-row table-head" role="row"><span>问题</span><span>采集环境</span><span>品牌</span><span>位置</span><span>引用</span></div>
            {observations.map(item=><button className="table-row" role="row" onClick={()=>setDrawerOpen(true)} key={item.id}>
              <span><strong>{item.query}</strong><small>有效回答 · 完整证据</small></span><span>{item.platform}</span><span className={item.brand==='已提及'?'mention yes':'mention no'}>{item.brand}</span><span>{item.rank}</span><span>{item.source}<Icon name="arrow" size={14}/></span>
            </button>)}
          </div>
        </section>

        <section className="agent-strip">
          <div className="agent-symbol"><Icon name="spark"/></div>
          <div><span>OpenGEO Agent</span><strong>让 Agent 解释变化、查找证据并建议下一步。</strong><p>Agent 将作为工作台内的辅助入口，所有动作仍保留确认和证据。</p></div>
          <button className="planned-button" onClick={()=>planned('Agent 助手')}>打开 Agent <span>规划中</span></button>
        </section>
      </div>
    </main>

    {drawerOpen&&<div className="drawer-layer" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setDrawerOpen(false);}}>
      <aside className="evidence-drawer" role="dialog" aria-modal="true" aria-labelledby={drawerTitleId}>
        <div className="drawer-head"><div><span>指标依据</span><h2 id={drawerTitleId}>品牌提及率</h2></div><button ref={closeButton} onClick={()=>setDrawerOpen(false)} aria-label="关闭指标依据"><Icon name="close"/></button></div>
        <div className="drawer-score"><strong>{metrics[0]?.value??'—'}</strong><span>{metrics[0]?.note??'暂无有效样本'}</span></div>
        <dl className="definition-list"><div><dt>指标含义</dt><dd>包含品牌名称或已确认别名的有效回答占比。</dd></div><div><dt>计算公式</dt><dd><code>提及品牌的有效回答 ÷ 全部有效回答</code></dd></div><div><dt>样本范围</dt><dd>{observations.length} 个问题 · 桌面端与移动端</dd></div><div><dt>数据完整度</dt><dd><span className="completeness">{metrics[3]?.delta??'—'}</span> {metrics[3]?.note??'暂无样本说明'}</dd></div></dl>
        <div className="drawer-section"><div><h3>支持样本</h3><span>{observations.filter(item=>item.brand==='已提及').length} 条</span></div>{observations.filter(item=>item.brand==='已提及').slice(0,2).map(item=><article key={item.id}><span className="sample-index">回答样本</span><strong>{item.query}</strong><p>{item.answer}</p><footer><span>{item.platform}</span><button onClick={()=>planned('完整回答')}>查看完整回答 <em>规划中</em></button></footer></article>)}</div>
        <p className="drawer-footnote">原型使用虚构数据，只用于验证信息架构和交互。</p>
      </aside>
    </div>}
    {toast&&<div className="toast" role="status"><span><Icon name="clock" size={16}/></span>{toast}</div>}
  </div>;
}
