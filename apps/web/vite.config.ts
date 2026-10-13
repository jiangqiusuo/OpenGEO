import { defineConfig, type Plugin } from 'vite';
import { BLOG_POSTS } from './src/blog-content';
import { generateContentSite } from './content-site';

function contentSite(): Plugin {
  const assets = () => generateContentSite(BLOG_POSTS, new Date().toISOString().slice(0, 10));
  return {
    name: 'opengeo-static-content',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = (request.url || '/').split('?')[0];
        if (path === '/blog' || path === '/privacy') {
          response.statusCode = 301;
          response.setHeader('Location', `${path}/`);
          response.end();
          return;
        }
        const key = path.slice(1).replace(/\/$/, '/index.html');
        const html = assets().get(key);
        if (html !== undefined) {
          response.setHeader('Content-Type', path.endsWith('.xml') ? 'application/xml; charset=utf-8' : 'text/html; charset=utf-8');
          response.end(html);
        } else if (path.startsWith('/blog/') || path.startsWith('/privacy/')) {
          response.statusCode = 404;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(assets().get('404.html'));
        } else next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = (request.url || '/').split('?')[0];
        if ((path.startsWith('/blog/') || path.startsWith('/privacy/')) && !assets().has(path.slice(1).replace(/\/$/, '/index.html'))) {
          response.statusCode = 404;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(assets().get('404.html'));
        } else next();
      });
    },
    generateBundle() {
      for (const [fileName, source] of assets()) this.emitFile({ type: 'asset', fileName, source });
    }
  };
}

export default defineConfig({ appType: 'mpa', plugins: [contentSite()] });
