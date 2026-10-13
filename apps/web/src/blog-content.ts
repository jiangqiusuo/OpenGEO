export type BlogPost = {
  slug: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
  status: 'draft' | 'published';
  reviewedBy?: string;
  body: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'geo-visibility-and-evidence',
    title: 'GEO 可见度为什么必须和证据一起看',
    titleEn: 'Why GEO visibility needs evidence',
    excerpt: '一次 AI 回答中的提及，并不等于稳定的品牌可见度。先固定问题、样本和证据，再谈优化。',
    excerptEn: 'A single mention in an AI answer is not stable visibility. Fix the query, sample and evidence before optimizing.',
    publishedAt: '2026-10-13',
    updatedAt: '2026-10-13',
    category: '方法',
    status: 'published',
    reviewedBy: 'OpenGEO maintainers',
    body: [
      'GEO 的难点不在于得到一条看起来不错的回答，而在于知道这条回答是否可以复查。相同的问题在不同时间、平台和上下文中可能产生不同结果。',
      'OpenGEO 把每次监测建模为 Job，并保存问题、回答、引用和样本范围。这样一次“被提及”才有机会变成可以对比的观察，而不是一张孤立的截图。',
      '开始优化前，先固定三件事：问题集合、观察窗口和证据等级。随后再比较提及率、排名位置和引用质量的变化。',
      '这套顺序也让团队可以安全地停止任务、处理部分结果，并解释一次结果为什么暂时不可用。可验证性是优化流程的起点。',
    ],
  },
];
