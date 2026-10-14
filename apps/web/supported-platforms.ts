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
  const group = (duplicate: boolean) => `<ul class="platform-group"${duplicate ? ' aria-hidden="true"' : ''}>${SUPPORTED_PLATFORMS.map(p => `<li><img src="/platform-logos/${p.logo}.svg" width="32" height="32" alt="" decoding="async"><span>${localText(locale, p.name)}</span></li>`).join('')}</ul>`;
  return `<section class="platform-band" aria-labelledby="platform-title" data-platform-band><div class="platform-heading"><div><p class="home-eyebrow">AI ANSWERS, ACROSS PLATFORMS</p><h2 id="platform-title">${localText(locale, ['在不同 AI 平台，看见你的品牌。', 'See your brand across AI platforms.'])}</h2></div><button type="button" data-motion-toggle aria-pressed="false" hidden>${localText(locale, ['暂停轮播', 'Pause animation'])}</button></div><div class="platform-window"><div class="platform-track">${group(false)}${group(true)}</div></div><p class="platform-note">${localText(locale, ['覆盖 Web 与移动端平台，具体模式与证据能力以当前能力目录为准。', 'Coverage includes web and mobile surfaces. Available modes and evidence depend on the capability catalog.'])}</p></section>`;
}
