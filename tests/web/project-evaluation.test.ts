import { expect, it } from 'vitest';
import { projectEvaluation } from '../../apps/web/project-evaluation';

it('lets visitors review the complete, sourced prompt without JavaScript in both languages', () => {
  for (const locale of ['zh-CN', 'en'] as const) {
    const html = projectEvaluation(locale);
    expect(html).toContain(`blob/main/${locale === 'en' ? 'README.en.md' : 'README.md'}`);
    expect(html).toContain('<details><summary>');
    expect(html).toContain('<pre id="project-evaluation-prompt">');
    expect(html).toContain('data-copy-code="project-evaluation-prompt"');
    expect(html).toContain(locale === 'en' ? 'If you cannot access the source' : '无法访问资料时');
    expect(html).not.toMatch(/<script|<iframe|chatgpt\.com|gemini\.google\.com|api\.openai\.com/);
  }
});
