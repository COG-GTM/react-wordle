const crypto = require('node:crypto');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(length = 6) {
  if (!Number.isInteger(length) || length < 4 || length > 6) {
    throw new RangeError('Room code length must be from 4 to 6');
  }
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function normalizeCode(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim().toUpperCase().replace(/[-\s]/g, '');
  if (!/^[A-Z2-9]{4,6}$/.test(value)) return null;
  return [...value].every(character => CODE_ALPHABET.includes(character))
    ? value
    : null;
}

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = { CODE_ALPHABET, generateCode, normalizeCode, generateToken };
