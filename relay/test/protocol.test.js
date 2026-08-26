const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ERROR_CODES,
  MESSAGE_TYPES,
  envelope,
  validateInbound,
} = require('../src/protocol');

test('builds versioned envelopes', () => {
  const message = envelope(MESSAGE_TYPES.PONG, null, 0, 'instance', {});
  assert.deepEqual(Object.keys(message), [
    'v',
    'type',
    'roomCode',
    'seq',
    'ts',
    'instanceId',
    'payload',
  ]);
  assert.equal(message.v, 1);
});

test('validates known inbound messages and rejects bad shapes', () => {
  assert.equal(validateInbound({ v: 1, type: 'ping', payload: {} }).ok, true);
  assert.equal(
    validateInbound({ v: 1, type: 'join_room', payload: { code: 'ABCD' } }).ok,
    true
  );
  assert.equal(
    validateInbound({ v: 1, type: 'unknown', payload: {} }).code,
    ERROR_CODES.UNSUPPORTED_TYPE
  );
  assert.equal(
    validateInbound({ v: 2, type: 'ping', payload: {} }).code,
    ERROR_CODES.MALFORMED_MESSAGE
  );
  assert.equal(
    validateInbound({ v: 1, type: 'ping', payload: {}, extra: true }).code,
    ERROR_CODES.MALFORMED_MESSAGE
  );
  assert.equal(
    validateInbound({
      v: 1,
      type: 'join_room',
      payload: { code: 'ABCD', extra: 1 },
    }).code,
    ERROR_CODES.MALFORMED_MESSAGE
  );
});
