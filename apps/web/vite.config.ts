import { defineConfig, type Plugin } from 'vite';
import { BLOG_POSTS } from './src/blog-content';
import { generateContentSite } from './content-site';

function contentSite(enableDeploymentConfig: boolean): Plugin {
  const assets = () => generateContentSite(BLOG_POSTS, new Date().toISOString().slice(0, 10), enableDeploymentConfig ? {
    ...(process.env.OPENGEO_PUBLIC_GA4_ID ? { ga4Id: process.env.OPENGEO_PUBLIC_GA4_ID } : {}),
    ...(process.env.OPENGEO_PUBLIC_CLARITY_ID ? { clarityId: process.env.OPENGEO_PUBLIC_CLARITY_ID, clarityUpload: process.env.OPENGEO_PUBLIC_CLARITY_UPLOAD } : {})
  } : {});
  return {
    name: 'opengeo-static-content',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = (request.url || '/').split('?')[0];
        if (path === '/blog' || path === '/privacy' || path === '/about') {
          response.statusCode = 301;
          response.setHeader('Location', `${path}/`);
          response.end();
          return;
        }
        const key = path.slice(1).replace(/\/$/, '/index.html');
        const html = assets().get(key);
        if (html !== undefined) {
          response.setHeader('Content-Type', path.endsWith('.xml') ? 'application/xml; charset=utf-8' : /\.(?:mjs|js)$/.test(path) ? 'text/javascript; charset=utf-8' : path.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8');
          response.end(html);
        } else if (path.startsWith('/blog/') || path.startsWith('/privacy/') || path.startsWith('/about/')) {
          response.statusCode = 404;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(assets().get('404.html'));
        } else next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = (request.url || '/').split('?')[0];
        if ((path.startsWith('/blog/') || path.startsWith('/privacy/') || path.startsWith('/about/')) && !assets().has(path.slice(1).replace(/\/$/, '/index.html'))) {
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

export default defineConfig(({ command }) => ({ appType: 'mpa', plugins: [contentSite(command === 'build')] }));
