const { loadConfig } = require('./config');
const { createRelayServer } = require('./server');

const config = loadConfig();
const relay = createRelayServer(config);
relay.httpServer.listen(config.port, config.host, () => {
  process.stdout.write(
    `${JSON.stringify({
      event: 'listening',
      port: config.port,
      instanceId: config.instanceId,
    })}\n`
  );
});

let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  await relay.close();
  process.exitCode = 0;
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
