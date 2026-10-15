import { escapeHtml, localText, type SiteLocale } from './site-i18n';

export function projectEvaluation(locale: SiteLocale): string {
  const l = (pair: readonly [string, string]) => localText(locale, pair);
  const source = `https://github.com/jiangqiusuo/OpenGEO/blob/main/${locale === 'en' ? 'README.en.md' : 'README.md'}`;
  const prompt = l([
    `请阅读 OpenGEO 的公开 README：${source}\n用中文帮我判断它是否适合我的项目：\n1. 它解决什么问题，哪些人现在可以使用？\n2. 目前已实现和仍在规划的功能分别是什么？\n3. 如何在本地分析我已保存的 AI 回答？有哪些限制？\n请引用资料链接，区分事实和推断；无法访问资料时请明确说明，不要编造功能、用户反馈或推荐结论。`,
    `Read OpenGEO's public README: ${source}\nHelp me evaluate whether it fits my project:\n1. What problem does it solve, and who can use it today?\n2. Which features are implemented, and which are planned?\n3. How can I analyze my saved AI answers locally, and what are the limitations?\nCite source links and separate facts from inference. If you cannot access the source, say so. Do not invent features, testimonials or recommendations.`,
  ]);
  return `<section class="home-section"><div class="project-evaluation"><div><p class="home-eyebrow">${l(['按你的需求，判断是否适合', 'EVALUATE IT FOR YOUR WORKFLOW'])}</p><h2>${l(['让你的 AI 助手，先看懂 OpenGEO。', 'Ask your AI assistant about OpenGEO.'])}</h2><p>${l(['复制问题，让你常用的助手根据公开资料解释用途、开始方式与限制。', 'Copy a question and ask your assistant to explain the use cases, setup and limits from public sources.'])}</p><div class="home-actions"><button type="button" class="home-button primary" data-copy-code="project-evaluation-prompt" aria-live="polite">${l(['复制提问', 'Copy question'])}</button><a class="home-button" href="${source}">${l(['阅读项目说明', 'Read the README'])} ↗</a></div><p class="home-note">${l(['本页不发送模型请求，也不预设 AI 的评价。', 'This page sends no model requests and does not predetermine an AI assessment.'])}</p></div><details><summary>${l(['查看提问内容', 'Review the question'])}</summary><pre id="project-evaluation-prompt">${escapeHtml(prompt)}</pre></details></div></section>`;
}
