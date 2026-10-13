import { useEffect, useState } from 'react';
import { BLOG_POSTS, findPost } from './blog-content';
import { getMeasurementConsent, setMeasurementConsent, trackPublicEvent, type MeasurementConsent } from './measurement';

function ConsentBar() {
  const [consent, setConsent] = useState<MeasurementConsent>('unknown');
  useEffect(() => setConsent(getMeasurementConsent()), []);
  if (consent !== 'unknown') return null;
  return <aside className="consent-bar" role="dialog" aria-label="测量设置">
    <div><strong>帮助我们改进公开页面</strong><p>OpenGEO 只在你同意后记录匿名访问和转化事件，不采集任务内容、API Key 或输入框内容。</p></div>
    <div className="consent-actions"><button onClick={() => { setMeasurementConsent('denied'); setConsent('denied'); }}>暂不允许</button><button className="consent-primary" onClick={() => { setMeasurementConsent('granted'); setConsent('granted'); trackPublicEvent('consent_granted'); }}>允许匿名测量</button></div>
  </aside>;
}

export function BlogApp() {
  const slug = window.location.pathname.match(/^\/blog\/(.+?)(?:\/)?$/)?.[1];
  const post = slug ? findPost(slug) : undefined;
  useEffect(() => {
    document.title = post ? `${post.title} · OpenGEO` : 'OpenGEO Blog · GEO 方法与工程';
    trackPublicEvent(post ? 'blog_article_view' : 'blog_index_view', post ? { slug: post.slug } : {});
  }, [post]);
  return <div className="blog-shell">
    <header className="blog-header"><a className="blog-brand" href="/"><img src="/logo-mark.svg" alt="" />OpenGEO</a><nav aria-label="公开导航"><a href="/blog">博客</a><a href="https://docs.open-geo.net" rel="noreferrer">开发者文档</a><a className="blog-cta" href="/">打开工作台</a></nav></header>
    <main className="blog-main">
      {post ? <article className="blog-article"><a className="back-link" href="/blog">← 返回博客</a><div className="blog-kicker">{post.category} · {post.readingMinutes} 分钟阅读</div><h1>{post.title}</h1><p className="blog-subtitle">{post.titleEn}</p><p className="blog-meta">发布于 {post.publishedAt} · 更新于 {post.updatedAt}</p><div className="article-body">{post.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><aside className="article-note"><strong>OpenGEO 的工作方式</strong><span>固定 Job、Evidence 和指标口径，让每次结果都能被复查。</span></aside></article> : <>
        <section className="blog-hero"><div className="blog-kicker">OpenGEO Journal</div><h1>把 AI 可见度<br /><em>变成可复查的工作。</em></h1><p>方法、证据与工程实践，帮助团队理解品牌在 AI 回答中的位置。</p></section>
        <section className="blog-grid" aria-label="文章列表">{BLOG_POSTS.map((item) => <a className="post-card" href={`/blog/${item.slug}`} key={item.slug}><span className="post-category">{item.category} · {item.readingMinutes} 分钟</span><h2>{item.title}</h2><p>{item.excerpt}</p><span className="post-link">阅读文章 ↗</span></a>)}</section>
        <section className="blog-subscribe"><div><span className="blog-kicker">Build in public</span><h2>从一次可复查的监测开始。</h2><p>OpenGEO Community 提供公开契约、客户端和 Mock，适合先在本地验证工作流。</p></div><a href="https://github.com/jiangqiusuo/OpenGEO" rel="noreferrer">查看 GitHub ↗</a></section>
      </>}
    </main>
    <footer className="blog-footer"><span>© 2026 OpenGEO</span><span>公开内容不包含客户、供应商或任务数据。</span></footer>
    <ConsentBar />
  </div>;
}
