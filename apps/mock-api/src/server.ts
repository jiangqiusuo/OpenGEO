import { createServer } from 'node:http';
import { CAPABILITIES, jobFixtures, observationFixtures } from '@opengeo/contracts';

const port = Number(process.env.OPEN_GEO_PORT ?? 8787);
const json = (res: import('node:http').ServerResponse, status: number, body: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/v1/capabilities') return json(res, 200, { object: 'list', data: CAPABILITIES });
  if (req.method === 'GET' && url.pathname.match(/^\/v1\/jobs\/[^/]+\/items$/)) return json(res, 200, { object: 'list', data: observationFixtures });
  if (req.method === 'GET' && url.pathname.startsWith('/v1/jobs/')) {
    const id = decodeURIComponent(url.pathname.slice('/v1/jobs/'.length));
    const key = id.replace('job_demo_', '');
    const job = jobFixtures[key] ?? jobFixtures.queued;
    return json(res, 200, job);
  }
  if (req.method === 'POST' && ['/v1/monitor-runs', '/v1/generation-jobs', '/v1/publications', '/v1/verification-runs'].includes(url.pathname)) { res.setHeader('location', '/v1/jobs/job_demo_queued'); return json(res, 202, jobFixtures.queued); }
  if (req.method === 'POST' && url.pathname.includes('/finalize-partial')) return json(res, 200, jobFixtures.finalized_partial);
  if (req.method === 'POST' && url.pathname.includes('/cancel')) return json(res, 200, { ...jobFixtures.queued, status: 'cancelled', result_state: 'none' });
  json(res, 404, { error: { code: 'not_found', message: 'Route not found' } });
});
server.listen(port, () => console.log(`OpenGEO mock API listening on http://localhost:${port}`));
