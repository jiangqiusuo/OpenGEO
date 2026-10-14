import { localText, type SiteLocale } from './site-i18n';

// Marketing coverage confirmed by the project owner. No execution/provider identifiers.
export const SUPPORTED_PLATFORMS = [
  { logo: 'deepseek', name: ['DeepSeek', 'DeepSeek'] },
  { logo: 'doubao', name: ['豆包', 'Doubao'] },
  { logo: 'qwen', name: ['千问', 'Qwen'] },
  { logo: 'yuanbao', name: ['元宝', 'Yuanbao'] },
  { logo: 'kimi', name: ['Kimi', 'Kimi'] },
  { logo: 'quark', name: ['夸克', 'Quark'] },
  { logo: 'baidu', name: ['百度文心', 'Baidu AI'] },
  { logo: 'weibo', name: ['微博智搜', 'Weibo AI'] },
  { logo: 'antafu', name: ['蚂蚁阿福', 'Ant Afu'] },
  { logo: 'douyinai', name: ['抖音 AI', 'Douyin AI'] },
  { logo: 'openai', name: ['ChatGPT', 'ChatGPT'] },
  { logo: 'googleai', name: ['Google AI', 'Google AI'] },
  { logo: 'bing', name: ['Bing AI', 'Bing AI'] },
  { logo: 'xiaohongshu-dian', name: ['小红书点点 AI', 'Rednote DianDian AI'] },
] as const;
export function platformBand(locale: SiteLocale): string {
  const t = (zh: string, en: string) => localText(locale, [zh, en]);
  const icon = (logo: string) => `<img src="/platform-logos/${logo}.svg" width="28" height="28" alt="" decoding="async">`;
  const group = () => `<span class="platform-group" aria-hidden="true">${SUPPORTED_PLATFORMS.map(p => `<span>${icon(p.logo)}</span>`).join('')}</span>`;
  return `<section class="platform-band" aria-label="${t('支持的 AI 平台', 'Supported AI platforms')}" data-platform-band><details class="platform-disclosure"><summary aria-label="${t('查看全部 14 个平台', 'View all 14 platforms')}"><span class="platform-caption">${t('支持的平台', 'AI platforms')}</span><span class="platform-window" aria-hidden="true"><span class="platform-track">${group()}${group()}</span></span><span class="platform-more" aria-hidden="true">14 <span>⌄</span></span></summary><div class="platform-catalog"><ul>${SUPPORTED_PLATFORMS.map(p => `<li>${icon(p.logo)}<span>${localText(locale, p.name)}</span></li>`).join('')}</ul><p>${t('覆盖 Web 与移动端；具体模式与证据能力以当前能力目录为准。', 'Web and mobile coverage. Available modes and evidence depend on the capability catalog.')}</p></div></details></section>`;
}
