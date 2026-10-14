
export const HOME = 'https://open-geo.net';
const REPO = 'https://github.com/jiangqiusuo/OpenGEO';

export const homeTitle = '开源 GEO 工具与 AI 搜索可见度工作台 · OpenGEO';
export const homeDescription = 'OpenGEO 是开源 GEO 工具，用问题、品牌提及、排名与回答证据理解 AI 搜索可见度。查看工作台示例，使用 Client、CLI 和本地 Mock 跑通观察流程，再按公开 API 契约接入。';
export const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${HOME}/#organization`, name: 'OpenGEO', url: `${HOME}/`, logo: `${HOME}/logo-mark.svg`, sameAs: [REPO] },
    { '@type': 'WebSite', '@id': `${HOME}/#website`, name: 'OpenGEO', url: `${HOME}/`, inLanguage: 'zh-CN', publisher: { '@id': `${HOME}/#organization` } },
    { '@type': 'WebPage', '@id': `${HOME}/#webpage`, name: homeTitle, description: homeDescription, url: `${HOME}/`, inLanguage: 'zh-CN', isPartOf: { '@id': `${HOME}/#website` }, about: { '@id': `${HOME}/#source` } },
    { '@type': 'SoftwareSourceCode', '@id': `${HOME}/#source`, name: 'OpenGEO Community', codeRepository: REPO, url: REPO, license: 'https://www.apache.org/licenses/LICENSE-2.0', programmingLanguage: 'TypeScript', description: '开源公共契约、指标、Client、CLI、本地 Mock 与只读工作台预览。' },
  ],
};
