import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';

const source = readFileSync(new URL('../../apps/web/public/public-site.js', import.meta.url), 'utf8');
it('copies reviewed code with consent denied and handles clipboard denial without measuring', async () => {
  for (const blocked of [false, true]) {
    let click: (() => Promise<void>) | undefined;
    const button = { textContent: '复制', getAttribute: () => 'code-1', addEventListener: (_: string, handler: () => Promise<void>) => { click = handler; } };
    const writeText = vi.fn(async () => { if (blocked) throw Error('blocked'); });
    const dispatch = vi.fn();
    runInNewContext(source, {
      window: { navigator: { clipboard: { writeText } }, location: { pathname: '/blog/mock-to-job-quickstart/', search: '', hash: '', hostname: 'localhost' }, localStorage: { getItem: () => 'denied' }, addEventListener: () => {}, dispatchEvent: dispatch },
      document: { querySelectorAll: (selector: string) => selector === 'button[data-copy-code]' ? [button] : [], querySelector: () => null, body: { dataset: { publicPage: 'blog_article' } }, getElementById: (id: string) => id === 'code-1' ? { textContent: 'node examples/mock-to-job.mjs' } : null }
    });
    await click!();
    expect(writeText).toHaveBeenCalledWith('node examples/mock-to-job.mjs');
    expect(button.textContent).toBe(blocked ? '无法复制，请手动选择' : '已复制');
    expect(dispatch).not.toHaveBeenCalled();
  }
});
