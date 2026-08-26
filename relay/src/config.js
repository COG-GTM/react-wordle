const os = require('node:os');
const crypto = require('node:crypto');

function positiveNumber(env, name, fallback) {
  const value = env[name] ?? fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return number;
}

function booleanValue(env, name, fallback) {
  const value = env[name];
  if (value === undefined) return fallback;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  throw new Error(`${name} must be true or false`);
}

function loadConfig(env = process.env) {
  const allowInsecure = booleanValue(env, 'RELAY_ALLOW_INSECURE', false);
  const allowedOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  if (!allowInsecure && allowedOrigins.length === 0) {
    throw new Error('ALLOWED_ORIGINS is required in secure mode');
  }

  const tlsCertPath = env.TLS_CERT_PATH || null;
  const tlsKeyPath = env.TLS_KEY_PATH || null;
  if ((tlsCertPath && !tlsKeyPath) || (!tlsCertPath && tlsKeyPath)) {
    throw new Error('TLS_CERT_PATH and TLS_KEY_PATH must be set together');
  }

  const roomCodeLength = positiveNumber(env, 'ROOM_CODE_LENGTH', 6);
  if (
    !Number.isInteger(roomCodeLength) ||
    roomCodeLength < 4 ||
    roomCodeLength > 6
  ) {
    throw new Error('ROOM_CODE_LENGTH must be an integer from 4 to 6');
  }

  const config = {
    port: positiveNumber(env, 'PORT', 8080),
    host: env.HOST || '0.0.0.0',
    allowedOrigins,
    publicAppOrigin:
      env.PUBLIC_APP_ORIGIN ||
      allowedOrigins[0] ||
      (allowInsecure ? 'http://localhost:3000' : null),
    allowInsecure,
    tlsCertPath,
    tlsKeyPath,
    trustProxyProto: booleanValue(env, 'TRUST_PROXY_PROTO', false),
    roomCodeLength,
    unjoinedTtlMs: positiveNumber(env, 'UNJOINED_TTL_MS', 600000),
    idleTtlMs: positiveNumber(env, 'IDLE_TTL_MS', 1800000),
    sweepIntervalMs: positiveNumber(env, 'SWEEP_INTERVAL_MS', 15000),
    maxRooms: positiveNumber(env, 'MAX_ROOMS', 1000),
    maxSockets: positiveNumber(env, 'MAX_SOCKETS', 2000),
    maxMessageBytes: positiveNumber(env, 'MAX_MESSAGE_BYTES', 2048),
    msgRateLimit: positiveNumber(env, 'MSG_RATE_LIMIT', 40),
    msgRateWindowMs: positiveNumber(env, 'MSG_RATE_WINDOW_MS', 10000),
    joinRateLimit: positiveNumber(env, 'JOIN_RATE_LIMIT', 10),
    joinRateWindowMs: positiveNumber(env, 'JOIN_RATE_WINDOW_MS', 60000),
    instanceId:
      env.INSTANCE_ID ||
      `${os.hostname()}-${crypto.randomBytes(4).toString('hex')}`,
  };
  return Object.freeze(config);
}

module.exports = { loadConfig };
