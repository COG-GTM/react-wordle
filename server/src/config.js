const readNumber = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number, got "${raw}"`);
  }

  return parsed;
};

const readList = name =>
  (process.env[name] ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

export const loadConfig = () => ({
  host: process.env.RELAY_HOST ?? '0.0.0.0',
  port: readNumber('PORT', 8080),
  // Empty means "accept any origin", which is only appropriate for local development.
  allowedOrigins: readList('RELAY_ALLOWED_ORIGINS'),
  maxRooms: readNumber('RELAY_MAX_ROOMS', 1000),
  maxMessageBytes: readNumber('RELAY_MAX_MESSAGE_BYTES', 4096),
  maxMessagesPerMinute: readNumber('RELAY_MAX_MESSAGES_PER_MINUTE', 240),
  countdownMs: readNumber('RELAY_COUNTDOWN_MS', 3000),
  reconnectGraceMs: readNumber('RELAY_RECONNECT_GRACE_MS', 30000),
  unjoinedRoomTtlMs: readNumber('RELAY_UNJOINED_ROOM_TTL_MS', 10 * 60000),
  idleRoomTtlMs: readNumber('RELAY_IDLE_ROOM_TTL_MS', 30 * 60000),
  sweepIntervalMs: readNumber('RELAY_SWEEP_INTERVAL_MS', 1000),
  heartbeatIntervalMs: readNumber('RELAY_HEARTBEAT_INTERVAL_MS', 30000),
});
