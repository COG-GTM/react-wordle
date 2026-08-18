import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ERROR_CODES,
  ROOM_STATES,
  SERVER_MESSAGES,
  ROOM_CODE_LENGTH,
} from '../src/protocol.js';
import { RoomStore } from '../src/rooms.js';

const WORD = 'crane';

const testConfig = {
  maxRooms: 10,
  countdownMs: 1000,
  reconnectGraceMs: 30000,
  unjoinedRoomTtlMs: 600000,
  idleRoomTtlMs: 1800000,
};

const setup = ({ config = {}, word = WORD } = {}) => {
  const clock = { now: 0 };
  const store = new RoomStore({
    config: { ...testConfig, ...config },
    clock: () => clock.now,
    selectWord: () => word,
  });

  const start = ({ names = [] } = {}) => {
    const host = store.createRoom({ name: names[0] });
    const guest = store.joinRoom({ code: host.room.code, name: names[1] });
    clock.now += testConfig.countdownMs;

    return { room: host.room, host: host.player, guest: guest.player };
  };

  return { clock, store, start };
};

const messagesOfType = (messages, type) =>
  messages.filter(message => message.type === type);

const messageFor = (messages, playerId, type) =>
  messages.find(message => message.to === playerId && message.type === type);

test('create_room issues an unambiguous code and a waiting snapshot', () => {
  const { store } = setup();
  const { room, player, messages } = store.createRoom({ name: 'Riley' });

  assert.equal(room.code.length, ROOM_CODE_LENGTH);
  assert.match(room.code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ2-9]+$/);
  assert.equal(room.state, ROOM_STATES.WAITING_FOR_OPPONENT);
  assert.equal(room.word, null);

  const created = messageFor(messages, player.id, SERVER_MESSAGES.ROOM_CREATED);
  assert.equal(created.payload.code, room.code);
  assert.equal(created.payload.you.name, 'Riley');
  assert.equal(created.payload.opponent, null);
  assert.equal(created.payload.maxGuesses, 6);
  assert.ok(created.payload.sessionToken);
});

test('join_room starts a countdown and assigns one word to both players', () => {
  const { store } = setup();
  const { room: created, player: host } = store.createRoom();
  const {
    room,
    player: guest,
    messages,
  } = store.joinRoom({
    code: created.code.toLowerCase(),
    name: 'Sam',
  });

  assert.equal(room.state, ROOM_STATES.COUNTDOWN);
  assert.equal(room.word, WORD);
  assert.ok(messageFor(messages, host.id, SERVER_MESSAGES.OPPONENT_JOINED));

  const assigned = messagesOfType(messages, SERVER_MESSAGES.ASSIGN_WORD);
  assert.equal(assigned.length, 2);
  assert.deepEqual(
    assigned.map(message => message.to).sort(),
    [host.id, guest.id].sort()
  );

  for (const message of assigned) {
    assert.equal(message.payload.wordLength, 5);
    assert.equal(message.payload.startsAt, testConfig.countdownMs);
    assert.equal(
      JSON.stringify(message.payload).toLowerCase().includes(WORD),
      false
    );
  }
});

test('join_room rejects unknown codes and third players', () => {
  const { store, start } = setup();
  const { room } = start();

  assert.throws(() => store.joinRoom({ code: 'NOPE12' }), {
    code: ERROR_CODES.ROOM_NOT_FOUND,
  });
  assert.throws(() => store.joinRoom({ code: room.code }), {
    code: ERROR_CODES.ROOM_FULL,
  });
});

test('guesses are rejected until the countdown elapses', () => {
  const { clock, store } = setup();
  const { room } = store.createRoom();
  const { player: guest } = store.joinRoom({ code: room.code });

  assert.throws(
    () => store.submitGuess({ playerId: guest.id, guess: 'crane' }),
    {
      code: ERROR_CODES.MATCH_NOT_IN_PROGRESS,
    }
  );

  clock.now += testConfig.countdownMs;
  assert.doesNotThrow(() =>
    store.submitGuess({ playerId: guest.id, guess: 'sepia' })
  );
  assert.equal(room.state, ROOM_STATES.IN_PROGRESS);
});

test('a guess returns statuses to the guesser and letter-free progress to the opponent', () => {
  const { store, start } = setup();
  const { host, guest } = start();

  const { messages } = store.submitGuess({ playerId: host.id, guess: 'sepia' });

  const result = messageFor(messages, host.id, SERVER_MESSAGES.GUESS_RESULT);
  assert.deepEqual(result.payload.cellStatuses, [
    'absent',
    'present',
    'absent',
    'absent',
    'present',
  ]);
  assert.equal(result.payload.guessCount, 1);
  assert.equal(result.payload.solved, false);

  const progress = messageFor(
    messages,
    guest.id,
    SERVER_MESSAGES.OPPONENT_PROGRESS
  );
  assert.deepEqual(Object.keys(progress.payload).sort(), [
    'cellStatuses',
    'guessCount',
    'state',
  ]);
});

test('invalid guesses and spent budgets are rejected', () => {
  const { store, start } = setup();
  const { host } = start();

  assert.throws(
    () => store.submitGuess({ playerId: host.id, guess: 'zzzzz' }),
    {
      code: ERROR_CODES.INVALID_GUESS,
    }
  );

  for (let i = 0; i < 6; i += 1) {
    store.submitGuess({ playerId: host.id, guess: 'sepia' });
  }

  assert.throws(
    () => store.submitGuess({ playerId: host.id, guess: 'sepia' }),
    {
      code: ERROR_CODES.GUESS_BUDGET_EXHAUSTED,
    }
  );
  assert.throws(
    () => store.submitGuess({ playerId: 'nobody', guess: 'sepia' }),
    {
      code: ERROR_CODES.NOT_IN_ROOM,
    }
  );
});

test('the first solver wins, the opponent loses and the word is revealed', () => {
  const { store, start } = setup();
  const { room, host, guest } = start();

  store.submitGuess({ playerId: guest.id, guess: 'sepia' });
  const { messages } = store.submitGuess({ playerId: host.id, guess: 'crane' });

  const won = messageFor(messages, host.id, SERVER_MESSAGES.PLAYER_WON);
  const lost = messageFor(messages, guest.id, SERVER_MESSAGES.PLAYER_LOST);
  assert.equal(won.payload.word, WORD);
  assert.equal(won.payload.guessCount, 1);
  assert.equal(lost.payload.word, WORD);
  assert.equal(lost.payload.reason, 'opponent_solved');
  assert.equal(lost.payload.opponent.guessCount, 1);
  assert.equal(room.state, ROOM_STATES.RESOLVED);

  assert.throws(
    () => store.submitGuess({ playerId: guest.id, guess: 'sepia' }),
    {
      code: ERROR_CODES.MATCH_NOT_IN_PROGRESS,
    }
  );
});

test('both boards exhausted resolves as a draw', () => {
  const { store, start } = setup();
  const { room, host, guest } = start();

  for (let i = 0; i < 5; i += 1) {
    store.submitGuess({ playerId: host.id, guess: 'sepia' });
    store.submitGuess({ playerId: guest.id, guess: 'sepia' });
  }

  store.submitGuess({ playerId: host.id, guess: 'sepia' });
  assert.equal(room.state, ROOM_STATES.IN_PROGRESS);

  const { messages } = store.submitGuess({
    playerId: guest.id,
    guess: 'sepia',
  });
  const draws = messagesOfType(messages, SERVER_MESSAGES.MATCH_DRAW);
  assert.equal(draws.length, 2);
  assert.equal(draws[0].payload.word, WORD);
  assert.equal(room.state, ROOM_STATES.RESOLVED);
});

test('a disconnect holds the seat, notifies the opponent and allows a resume', () => {
  const { clock, store, start } = setup();
  const { room, host, guest } = start();
  store.submitGuess({ playerId: host.id, guess: 'sepia' });

  const dropped = store.handleDisconnect({ playerId: host.id });
  const reconnecting = messageFor(
    dropped.messages,
    guest.id,
    SERVER_MESSAGES.OPPONENT_RECONNECTING
  );
  assert.equal(reconnecting.payload.graceMs, testConfig.reconnectGraceMs);

  clock.now += testConfig.reconnectGraceMs - 1;
  assert.deepEqual(store.sweep().messages, []);

  const resumed = store.joinRoom({
    code: room.code,
    sessionToken: host.sessionToken,
  });
  const rejoined = messageFor(
    resumed.messages,
    host.id,
    SERVER_MESSAGES.ROOM_JOINED
  );
  assert.equal(rejoined.payload.resumed, true);
  assert.equal(rejoined.payload.you.cellStatuses.length, 1);
  assert.ok(
    messageFor(resumed.messages, guest.id, SERVER_MESSAGES.OPPONENT_RECONNECTED)
  );

  clock.now += testConfig.reconnectGraceMs;
  assert.deepEqual(store.sweep().messages, []);
  assert.equal(room.state, ROOM_STATES.IN_PROGRESS);
});

test('an unknown session token cannot resume a room', () => {
  const { store, start } = setup();
  const { room } = start();

  assert.throws(
    () => store.joinRoom({ code: room.code, sessionToken: 'not-a-token' }),
    { code: ERROR_CODES.INVALID_SESSION }
  );
});

test('the match ends as opponent_disconnected once the grace window lapses', () => {
  const { clock, store, start } = setup();
  const { room, host, guest } = start();

  store.handleDisconnect({ playerId: host.id });
  clock.now += testConfig.reconnectGraceMs;

  const { messages } = store.sweep();
  const ended = messageFor(
    messages,
    guest.id,
    SERVER_MESSAGES.OPPONENT_DISCONNECTED
  );
  assert.equal(ended.payload.reason, 'grace_expired');
  assert.equal(ended.payload.outcome, 'no_result');
  assert.equal(ended.payload.word, WORD);
  assert.equal(store.rooms.has(room.code), false);
});

test('leaving explicitly ends the match for the opponent', () => {
  const { store, start } = setup();
  const { room, host, guest } = start();

  const { messages } = store.leaveRoom({ playerId: host.id });
  assert.equal(
    messageFor(messages, guest.id, SERVER_MESSAGES.OPPONENT_DISCONNECTED)
      .payload.reason,
    'left'
  );
  assert.equal(store.rooms.has(room.code), false);
});

test('a host who leaves before anyone joins drops the room silently', () => {
  const { store } = setup();
  const { room, player } = store.createRoom();

  assert.deepEqual(
    store.handleDisconnect({ playerId: player.id }).messages,
    []
  );
  assert.equal(store.rooms.has(room.code), false);
});

test('rooms expire when never joined and when idle', () => {
  const { clock, store, start } = setup();
  const unjoined = store.createRoom();

  clock.now += testConfig.unjoinedRoomTtlMs + 1;
  const expired = store.sweep();
  assert.equal(
    messageFor(
      expired.messages,
      unjoined.player.id,
      SERVER_MESSAGES.ROOM_EXPIRED
    ).payload.reason,
    'never_joined'
  );
  assert.equal(store.rooms.size, 0);

  const { room, host } = start();
  clock.now += testConfig.idleRoomTtlMs + 1;
  const idle = store.sweep();
  assert.equal(
    messageFor(idle.messages, host.id, SERVER_MESSAGES.ROOM_EXPIRED).payload
      .reason,
    'idle'
  );
  assert.equal(store.rooms.has(room.code), false);
});

test('room creation is capped and stops entirely while draining', () => {
  const { store } = setup({ config: { maxRooms: 1 } });
  store.createRoom();

  assert.throws(() => store.createRoom(), {
    code: ERROR_CODES.RELAY_AT_CAPACITY,
  });

  store.startDraining();
  assert.throws(() => store.createRoom(), { code: ERROR_CODES.RELAY_DRAINING });
  assert.equal(store.stats.draining, true);
});
