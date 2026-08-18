import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { WebSocket } from 'ws';
import { loadConfig } from '../src/config.js';
import { ERROR_CODES, SERVER_MESSAGES } from '../src/protocol.js';
import { createRelay } from '../src/relay.js';
import { RoomStore } from '../src/rooms.js';

const WORD = 'crane';

const startRelay = async ({ config: overrides = {} } = {}) => {
  const config = { ...loadConfig(), countdownMs: 0, ...overrides };
  const server = createServer();
  const relay = createRelay({
    server,
    config,
    store: new RoomStore({ config, selectWord: () => WORD }),
    logger: { warn: () => {}, error: () => {}, log: () => {} },
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  return {
    config,
    relay,
    url: `ws://127.0.0.1:${server.address().port}`,
    close: async () => {
      await relay.close();
      await new Promise(resolve => server.close(resolve));
    },
  };
};

// A test client that records every inbound message so tests can await one by type.
const connect = async (url, options) => {
  const socket = new WebSocket(url, options);
  const inbox = [];
  const waiters = [];

  socket.on('message', raw => {
    const message = JSON.parse(raw.toString());
    inbox.push(message);

    const index = waiters.findIndex(waiter => waiter.type === message.type);
    if (index > -1) waiters.splice(index, 1)[0].resolve(message);
  });

  await new Promise((resolve, reject) => {
    socket.once('open', resolve);
    socket.once('error', reject);
  });

  return {
    socket,
    inbox,
    send: (type, payload = {}) =>
      socket.send(JSON.stringify({ type, ...payload })),
    next: type => {
      const received = inbox.find(message => message.type === type);
      if (received) return Promise.resolve(received);

      return new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`timed out waiting for "${type}"`)),
          2000
        );
        waiters.push({
          type,
          resolve: message => {
            clearTimeout(timer);
            resolve(message);
          },
        });
      });
    },
    close: () =>
      new Promise(resolve => {
        socket.once('close', resolve);
        socket.close();
      }),
  };
};

test('two clients play a full match over websockets', async () => {
  const relay = await startRelay();
  const host = await connect(relay.url);
  const guest = await connect(relay.url);

  try {
    host.send('create_room', { name: 'Riley' });
    const created = await host.next(SERVER_MESSAGES.ROOM_CREATED);

    guest.send('join_room', { code: created.code, name: 'Sam' });
    const joined = await guest.next(SERVER_MESSAGES.ROOM_JOINED);
    assert.equal(joined.opponent.name, 'Riley');
    assert.ok(await host.next(SERVER_MESSAGES.OPPONENT_JOINED));
    assert.ok(await host.next(SERVER_MESSAGES.ASSIGN_WORD));
    assert.ok(await guest.next(SERVER_MESSAGES.ASSIGN_WORD));

    guest.send('guess_submitted', { guess: 'sepia' });
    const progress = await host.next(SERVER_MESSAGES.OPPONENT_PROGRESS);
    assert.equal(progress.guessCount, 1);
    assert.equal(
      JSON.stringify(progress).toLowerCase().includes('sepia'),
      false
    );

    host.send('guess_submitted', { guess: WORD });
    assert.equal((await host.next(SERVER_MESSAGES.PLAYER_WON)).word, WORD);
    assert.equal((await guest.next(SERVER_MESSAGES.PLAYER_LOST)).word, WORD);
  } finally {
    await host.close();
    await guest.close();
    await relay.close();
  }
});

test('a dropped client can resume with its session token', async () => {
  const relay = await startRelay();
  const host = await connect(relay.url);
  const guest = await connect(relay.url);

  try {
    host.send('create_room');
    const created = await host.next(SERVER_MESSAGES.ROOM_CREATED);
    guest.send('join_room', { code: created.code });
    await guest.next(SERVER_MESSAGES.ASSIGN_WORD);

    await host.close();
    assert.ok(await guest.next(SERVER_MESSAGES.OPPONENT_RECONNECTING));

    const resumed = await connect(relay.url);
    resumed.send('join_room', {
      code: created.code,
      sessionToken: created.sessionToken,
    });
    assert.equal(
      (await resumed.next(SERVER_MESSAGES.ROOM_JOINED)).resumed,
      true
    );
    assert.ok(await guest.next(SERVER_MESSAGES.OPPONENT_RECONNECTED));
    await resumed.close();
  } finally {
    await guest.close();
    await relay.close();
  }
});

test('protocol violations answer with a typed error and keep the socket open', async () => {
  const relay = await startRelay();
  const client = await connect(relay.url);

  try {
    client.socket.send('not json');
    client.send('guess_submitted', { guess: 'crane' });
    client.send('teleport_pawn');

    while (client.inbox.length < 3) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    assert.deepEqual(
      client.inbox.map(message => message.code),
      [
        ERROR_CODES.INVALID_MESSAGE,
        ERROR_CODES.NOT_IN_ROOM,
        ERROR_CODES.UNKNOWN_MESSAGE_TYPE,
      ]
    );
    assert.equal(client.socket.readyState, WebSocket.OPEN);
  } finally {
    await client.close();
    await relay.close();
  }
});

test('a flooding client is rate limited', async () => {
  const relay = await startRelay({ config: { maxMessagesPerMinute: 2 } });
  const client = await connect(relay.url);

  try {
    client.send('leave_room');
    client.send('leave_room');
    client.send('leave_room');

    while (client.inbox.length < 3) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    assert.deepEqual(
      client.inbox.map(message => message.code),
      [
        ERROR_CODES.NOT_IN_ROOM,
        ERROR_CODES.NOT_IN_ROOM,
        ERROR_CODES.RATE_LIMITED,
      ]
    );
  } finally {
    await client.close();
    await relay.close();
  }
});

test('upgrades from disallowed origins are refused', async () => {
  const relay = await startRelay({
    config: { allowedOrigins: ['https://wordle.example'] },
  });

  try {
    await assert.rejects(
      connect(relay.url, { origin: 'https://evil.example' }),
      /403/
    );
    const allowed = await connect(relay.url, {
      origin: 'https://wordle.example',
    });
    await allowed.close();
  } finally {
    await relay.close();
  }
});
