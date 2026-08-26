const MESSAGE_TYPES = Object.freeze({
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PING: 'ping',
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  OPPONENT_JOINED: 'opponent_joined',
  OPPONENT_LEFT: 'opponent_left',
  ROOM_CLOSED: 'room_closed',
  ERROR: 'error',
  PONG: 'pong',
});

const INBOUND_TYPES = Object.freeze([
  MESSAGE_TYPES.CREATE_ROOM,
  MESSAGE_TYPES.JOIN_ROOM,
  MESSAGE_TYPES.LEAVE_ROOM,
  MESSAGE_TYPES.PING,
]);

const ERROR_CODES = Object.freeze({
  ROOM_FULL: 'ROOM_FULL',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_EXPIRED: 'ROOM_EXPIRED',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED',
  RATE_LIMITED: 'RATE_LIMITED',
  MESSAGE_TOO_LARGE: 'MESSAGE_TOO_LARGE',
  MALFORMED_MESSAGE: 'MALFORMED_MESSAGE',
  UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
  NOT_IN_ROOM: 'NOT_IN_ROOM',
  FORBIDDEN_ORIGIN: 'FORBIDDEN_ORIGIN',
  INSECURE_TRANSPORT: 'INSECURE_TRANSPORT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});

const CLOSE_CODES = Object.freeze({
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_LARGE: 1009,
  CAPACITY_EXCEEDED: 4000,
  RATE_LIMITED: 4001,
});

const CLOSE_REASONS = Object.freeze({
  PEER_LEFT: 'peer_left',
  EXPIRED_UNJOINED: 'expired_unjoined',
  EXPIRED_IDLE: 'expired_idle',
  HOST_LEFT: 'host_left',
  SHUTDOWN: 'shutdown',
});

const inboundPayloadKeys = Object.freeze({
  [MESSAGE_TYPES.CREATE_ROOM]: [],
  [MESSAGE_TYPES.JOIN_ROOM]: ['code'],
  [MESSAGE_TYPES.LEAVE_ROOM]: [],
  [MESSAGE_TYPES.PING]: [],
});

const errorMessages = Object.freeze({
  ROOM_FULL: 'Room is full.',
  ROOM_NOT_FOUND: 'Room was not found.',
  ROOM_EXPIRED: 'Room has expired.',
  CAPACITY_EXCEEDED: 'Relay capacity has been reached.',
  RATE_LIMITED: 'Too many requests.',
  MESSAGE_TOO_LARGE: 'Message is too large.',
  MALFORMED_MESSAGE: 'Message is malformed.',
  UNSUPPORTED_TYPE: 'Message type is not supported.',
  NOT_IN_ROOM: 'You are not in a room.',
  FORBIDDEN_ORIGIN: 'Origin is not allowed.',
  INSECURE_TRANSPORT: 'Secure transport is required.',
  INTERNAL_ERROR: 'An internal error occurred.',
});

function envelope(type, roomCode, seq, instanceId, payload) {
  return {
    v: 1,
    type,
    roomCode: roomCode || null,
    seq,
    ts: Date.now(),
    instanceId,
    payload,
  };
}

function errorEnvelope(code, instanceId, roomCode = null, seq = 0) {
  return envelope(MESSAGE_TYPES.ERROR, roomCode, seq, instanceId, {
    code,
    message: errorMessages[code] || errorMessages.INTERNAL_ERROR,
  });
}

function validateInbound(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, code: ERROR_CODES.MALFORMED_MESSAGE };
  }
  const allowedTopLevel = [
    'v',
    'type',
    'roomCode',
    'seq',
    'ts',
    'instanceId',
    'payload',
  ];
  if (Object.keys(raw).some(key => !allowedTopLevel.includes(key))) {
    return { ok: false, code: ERROR_CODES.MALFORMED_MESSAGE };
  }
  if (
    raw.v !== 1 ||
    typeof raw.type !== 'string' ||
    !raw.payload ||
    typeof raw.payload !== 'object' ||
    Array.isArray(raw.payload)
  ) {
    return { ok: false, code: ERROR_CODES.MALFORMED_MESSAGE };
  }
  if (!INBOUND_TYPES.includes(raw.type)) {
    return { ok: false, code: ERROR_CODES.UNSUPPORTED_TYPE };
  }
  const keys = inboundPayloadKeys[raw.type];
  if (Object.keys(raw.payload).some(key => !keys.includes(key))) {
    return { ok: false, code: ERROR_CODES.MALFORMED_MESSAGE };
  }
  if (
    raw.type === MESSAGE_TYPES.JOIN_ROOM &&
    typeof raw.payload.code !== 'string'
  ) {
    return { ok: false, code: ERROR_CODES.MALFORMED_MESSAGE };
  }
  return { ok: true, message: raw };
}

module.exports = {
  MESSAGE_TYPES,
  INBOUND_TYPES,
  ERROR_CODES,
  CLOSE_CODES,
  CLOSE_REASONS,
  envelope,
  errorEnvelope,
  validateInbound,
};
