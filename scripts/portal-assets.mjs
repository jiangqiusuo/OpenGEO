import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { URL, pathToFileURL } from 'node:url';
import process from 'node:process';

/** Assemble the same public files for local preview and GitHub Pages. */
export function generatePortalAssets() {
  const assets = new Map();
  const names = {};
  const sources = {
    foundation: '../apps/web/design-tokens.css',
    theme: '../docs/portal/portal.css',
    logo: '../apps/web/public/logo-mark.svg',
  };
  for (const [key, path] of Object.entries(sources)) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    const hash = createHash('sha256').update(source).digest('hex').slice(0, 12);
    const name = `${key}.${hash}.${key === 'logo' ? 'svg' : 'css'}`;
    names[key] = name;
    assets.set(`docs/portal/${name}`, source);
  }
  for (const page of ['index.html', 'quickstart.html']) {
    let html = readFileSync(new URL(`../docs/portal/${page}`, import.meta.url), 'utf8');
    for (const [key, name] of Object.entries(names)) html = html.replaceAll(`{{${key}}}`, name);
    assets.set(`docs/portal/${page}`, html);
  }
  assets.set('openapi/openapi.json', readFileSync(new URL('../openapi/openapi.json', import.meta.url), 'utf8'));
  return assets;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/portal-assets.mjs <output-directory>');
  for (const [path, source] of generatePortalAssets()) {
    const target = resolve(process.argv[2], path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, source, 'utf8');
  }
}
