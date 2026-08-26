const test = require('node:test');
const assert = require('node:assert/strict');
const { ERROR_CODES } = require('../src/protocol');
const { InMemoryRoomStore, RelayError } = require('../src/rooms');

function player(role = 'host') {
  return {
    playerId: `${role}-id`,
    playerToken: `${role}-token`,
    role,
    connected: true,
  };
}

test('joins exactly two players and distinguishes failures', async () => {
  let now = 1000;
  const store = new InMemoryRoomStore({ clock: () => now });
  const room = await store.createRoom({ codeLength: 4 });
  await store.joinRoom(room.code, player('guest'));
  await assert.rejects(
    () => store.joinRoom(room.code, player('third')),
    error => error.code === ERROR_CODES.ROOM_FULL
  );
  await assert.rejects(
    () => store.joinRoom('ZZZZ'),
    error => error.code === ERROR_CODES.ROOM_NOT_FOUND
  );
  now += 1800001;
  const expired = await store.createRoom({ codeLength: 4 });
  now += 600000;
  await assert.rejects(
    () => store.joinRoom(expired.code),
    error => error.code === ERROR_CODES.ROOM_EXPIRED
  );
});

test('sweep classifies unjoined and idle rooms', async () => {
  let now = 0;
  const store = new InMemoryRoomStore({
    clock: () => now,
    unjoinedTtlMs: 10,
    idleTtlMs: 20,
  });
  const waiting = await store.createRoom({ codeLength: 4 });
  now = 1;
  const ready = await store.createRoom({ codeLength: 4 });
  await store.joinRoom(ready.code, player('guest'));
  now = 11;
  const first = await store.sweep(now);
  assert.deepEqual(first, [{ code: waiting.code, reason: 'expired_unjoined' }]);
  now = 22;
  const second = await store.sweep(now);
  assert.deepEqual(second, [{ code: ready.code, reason: 'expired_idle' }]);
});

test('a room that loses its guest uses idle TTL, not unjoined TTL', async () => {
  let now = 0;
  const store = new InMemoryRoomStore({
    clock: () => now,
    unjoinedTtlMs: 10,
    idleTtlMs: 20,
  });
  const room = await store.createRoom({ codeLength: 4 });
  const guest = await store.joinRoom(room.code, player('guest'));
  await store.removePlayer(room.code, guest.player.playerId);

  now = 11;
  assert.deepEqual(await store.sweep(now), []);
  now = 21;
  assert.deepEqual(await store.sweep(now), [
    { code: room.code, reason: 'expired_idle' },
  ]);
});

test('room cap and sequence are enforced', async () => {
  const store = new InMemoryRoomStore({ maxRooms: 1, codeLength: 4 });
  const room = await store.createRoom();
  await assert.rejects(
    () => store.createRoom(),
    error =>
      error instanceof RelayError &&
      error.code === ERROR_CODES.CAPACITY_EXCEEDED
  );
  assert.equal(await store.nextSeq(room.code), 1);
  assert.equal(await store.nextSeq(room.code), 2);
});
