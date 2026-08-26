const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const WebSocket = require('ws');
const { loadConfig } = require('../src/config');
const { createRelayServer, pruneJoinLimiters } = require('../src/server');
const { createRateLimiter } = require('../src/rateLimit');
const { InMemoryRoomStore } = require('../src/rooms');

function config(overrides = {}) {
  return loadConfig({
    RELAY_ALLOW_INSECURE: 'true',
    PUBLIC_APP_ORIGIN: 'http://localhost:3000',
    ...overrides,
  });
}

function startServer(server) {
  return new Promise(resolve => {
    server.httpServer.listen(0, '127.0.0.1', () => {
      resolve(server.httpServer.address().port);
    });
  });
}

function nextMessage(ws) {
  return new Promise((resolve, reject) => {
    ws.once('message', data => resolve(JSON.parse(data.toString())));
    ws.once('error', reject);
  });
}

function connect(port, origin = 'http://localhost:3000') {
  return new WebSocket(`ws://127.0.0.1:${port}/ws`, { origin });
}

function waitOpen(ws) {
  return new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
}

async function closeSocket(ws) {
  if (ws.readyState === WebSocket.CLOSED) return;
  ws.close();
  await new Promise(resolve => ws.once('close', resolve));
}

test('insecure config defaults proxy trust off and app origin locally', () => {
  const parsed = loadConfig({ RELAY_ALLOW_INSECURE: 'true' });
  assert.equal(parsed.trustProxyProto, false);
  assert.equal(parsed.publicAppOrigin, 'http://localhost:3000');
});

test('blank numeric config values use defaults but invalid values throw', () => {
  const parsed = loadConfig({
    RELAY_ALLOW_INSECURE: 'true',
    PORT: '  ',
  });
  assert.equal(parsed.port, 8080);
  assert.throws(
    () =>
      loadConfig({
        RELAY_ALLOW_INSECURE: 'true',
        PORT: 'abc',
      }),
    /PORT must be a positive number/
  );
});

test('creates, joins, rejects full and unknown rooms, and exposes health', async () => {
  const relay = createRelayServer(config());
  const port = await startServer(relay);
  const host = connect(port);
  await waitOpen(host);
  const hostCreated = nextMessage(host);
  host.send(JSON.stringify({ v: 1, type: 'create_room', payload: {} }));
  const created = await hostCreated;
  assert.equal(created.type, 'room_created');
  assert.match(created.payload.joinUrl, /\/versus\/[A-Z2-9]{6}$/);
  assert.ok(!('word' in created.payload));
  const alreadyInRoom = nextMessage(host);
  host.send(JSON.stringify({ v: 1, type: 'create_room', payload: {} }));
  const alreadyMessage = await alreadyInRoom;
  assert.equal(alreadyMessage.payload.code, 'ALREADY_IN_ROOM');
  assert.equal(alreadyMessage.seq, 0);
  const pong = nextMessage(host);
  host.send(JSON.stringify({ v: 1, type: 'ping', payload: {} }));
  assert.equal((await pong).seq, 0);

  const guest = connect(port);
  await waitOpen(guest);
  const guestJoined = nextMessage(guest);
  const opponentJoined = nextMessage(host);
  guest.send(
    JSON.stringify({
      v: 1,
      type: 'join_room',
      payload: { code: created.payload.code },
    })
  );
  const joined = await guestJoined;
  assert.equal(joined.type, 'room_joined');
  assert.equal((await opponentJoined).type, 'opponent_joined');

  const third = connect(port);
  await waitOpen(third);
  const full = nextMessage(third);
  third.send(
    JSON.stringify({
      v: 1,
      type: 'join_room',
      payload: { code: created.payload.code },
    })
  );
  assert.equal((await full).payload.code, 'ROOM_FULL');

  const bad = connect(port);
  await waitOpen(bad);
  const notFound = nextMessage(bad);
  bad.send(
    JSON.stringify({ v: 1, type: 'join_room', payload: { code: 'ZZZZ' } })
  );
  assert.equal((await notFound).payload.code, 'ROOM_NOT_FOUND');

  const health = await new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${port}/healthz`, response => {
        let body = '';
        response.on('data', chunk => (body += chunk));
        response.on('end', () =>
          resolve({ status: response.statusCode, body })
        );
      })
      .on('error', reject);
  });
  assert.equal(health.status, 200);
  assert.deepEqual(JSON.parse(health.body), { status: 'ok' });

  await Promise.all([
    closeSocket(host),
    closeSocket(guest),
    closeSocket(third),
    closeSocket(bad),
  ]);
  await relay.close();
});

test('broadcasts one room sequence to every recipient', async () => {
  let now = 0;
  const store = new InMemoryRoomStore({
    clock: () => now,
    idleTtlMs: 10,
  });
  const relay = createRelayServer(config(), { store });
  const port = await startServer(relay);
  const host = connect(port);
  await waitOpen(host);
  const hostCreated = nextMessage(host);
  host.send(JSON.stringify({ v: 1, type: 'create_room', payload: {} }));
  const created = await hostCreated;

  const guest = connect(port);
  await waitOpen(guest);
  const guestJoined = nextMessage(guest);
  const opponentJoined = nextMessage(host);
  guest.send(
    JSON.stringify({
      v: 1,
      type: 'join_room',
      payload: { code: created.payload.code },
    })
  );
  await guestJoined;
  await opponentJoined;

  const hostClosed = nextMessage(host);
  const guestClosed = nextMessage(guest);
  now = 10;
  await store.sweep(now);
  const [hostMessage, guestMessage] = await Promise.all([
    hostClosed,
    guestClosed,
  ]);
  assert.equal(hostMessage.type, 'room_closed');
  assert.equal(guestMessage.type, 'room_closed');
  assert.equal(hostMessage.seq, guestMessage.seq);
  assert.ok(hostMessage.seq > 0);
  await relay.close();
});

test('prunes idle join limiters regardless of token balance', () => {
  let now = 0;
  const limiter = createRateLimiter({
    limit: 1,
    windowMs: 10,
    now: () => now,
  });
  assert.equal(limiter.consume(), true);
  const limiters = new Map([['127.0.0.1', limiter]]);
  now = 10;
  pruneJoinLimiters(limiters, now);
  assert.equal(limiters.size, 0);
});

test('rate-limits repeated malformed frames', async () => {
  const relay = createRelayServer(
    config({
      MSG_RATE_LIMIT: 1,
      MSG_RATE_WINDOW_MS: 60000,
    })
  );
  const port = await startServer(relay);
  const ws = connect(port);
  await waitOpen(ws);

  const malformed = nextMessage(ws);
  ws.send('{');
  assert.equal((await malformed).payload.code, 'MALFORMED_MESSAGE');

  const rateLimited = nextMessage(ws);
  ws.send('{');
  assert.equal((await rateLimited).payload.code, 'RATE_LIMITED');

  await closeSocket(ws);
  await relay.close();
});

test('enforces configured origins even in insecure mode', async () => {
  const relay = createRelayServer(
    config({
      RELAY_ALLOW_INSECURE: 'true',
      ALLOWED_ORIGINS: 'http://allowed.example',
    })
  );
  const port = await startServer(relay);
  await assert.rejects(
    () =>
      new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
          origin: 'http://denied.example',
        });
        ws.once('open', resolve);
        ws.once('error', reject);
      })
  );
  const allowed = connect(port, 'http://allowed.example');
  await waitOpen(allowed);
  await closeSocket(allowed);
  await relay.close();
});

test('oversize messages close with policy code', async () => {
  const relay = createRelayServer(config({ MAX_MESSAGE_BYTES: 32 }));
  const port = await startServer(relay);
  const ws = connect(port);
  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  const closeCode = new Promise(resolve =>
    ws.once('close', code => resolve(code))
  );
  ws.send(
    JSON.stringify({
      v: 1,
      type: 'ping',
      payload: {},
      padding: 'x'.repeat(100),
    })
  );
  assert.equal(await closeCode, 1009);
  await relay.close();
});
