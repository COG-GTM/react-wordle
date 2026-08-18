import { createServer } from 'node:http';
import { loadConfig } from './config.js';
import { createRelay } from './relay.js';

const config = loadConfig();

const httpServer = createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/healthz') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ status: 'ok', ...relay.store.stats }));
    return;
  }

  response.writeHead(404, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ error: 'not_found' }));
});

const relay = createRelay({ server: httpServer, config });

httpServer.listen(config.port, config.host, () => {
  console.log(`relay: listening on ${config.host}:${config.port}`);

  if (config.allowedOrigins.length === 0) {
    console.warn(
      'relay: RELAY_ALLOWED_ORIGINS is empty, every origin may connect'
    );
  }
});

const shutdown = async signal => {
  console.log(`relay: received ${signal}, draining`);
  relay.drain();
  await relay.close();
  httpServer.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
