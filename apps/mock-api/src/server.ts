import { createMockServer } from './mock-server.js';

const port = Number(process.env.OPEN_GEO_PORT ?? 8787);
const server = createMockServer();
server.listen(port, '127.0.0.1', () => console.log(`OpenGEO mock API listening on http://127.0.0.1:${port}`));
