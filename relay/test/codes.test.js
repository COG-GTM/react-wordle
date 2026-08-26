const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CODE_ALPHABET,
  generateCode,
  generateToken,
  normalizeCode,
} = require('../src/codes');

test('room alphabet excludes ambiguous characters', () => {
  assert.equal(CODE_ALPHABET, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
  assert.ok(!/[OI01]/.test(CODE_ALPHABET));
});

test('codes are bounded and use the alphabet', () => {
  assert.equal(generateCode(4).length, 4);
  assert.equal(generateCode(6).length, 6);
  assert.throws(() => generateCode(3));
  assert.throws(() => generateCode(7));
  for (let index = 0; index < 100; index += 1) {
    assert.match(generateCode(6), /^[A-Z2-9]{6}$/);
  }
});

test('generated codes and tokens are not repeated in a sample', () => {
  const codes = new Set(Array.from({ length: 100 }, () => generateCode(6)));
  assert.equal(codes.size, 100);
  assert.match(generateToken(), /^[a-f0-9]{32}$/);
});

test('normalization accepts case, dashes, and whitespace but rejects ambiguity', () => {
  assert.equal(normalizeCode(' ab-c 2 3 '), 'ABC23');
  assert.equal(normalizeCode('O234'), null);
  assert.equal(normalizeCode('0ABC'), null);
  assert.equal(normalizeCode('I234'), null);
  assert.equal(normalizeCode('l234'), null);
  assert.equal(normalizeCode('ABC'), null);
});
