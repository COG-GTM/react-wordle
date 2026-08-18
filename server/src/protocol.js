import { randomInt, randomUUID } from 'node:crypto';

// Messages a client may send to the relay.
export const CLIENT_MESSAGES = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  GUESS_SUBMITTED: 'guess_submitted',
  LEAVE_ROOM: 'leave_room',
};

// Messages the relay may send to a client.
export const SERVER_MESSAGES = {
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  OPPONENT_JOINED: 'opponent_joined',
  ASSIGN_WORD: 'assign_word',
  GUESS_RESULT: 'guess_result',
  OPPONENT_PROGRESS: 'opponent_progress',
  PLAYER_WON: 'player_won',
  PLAYER_LOST: 'player_lost',
  MATCH_DRAW: 'match_draw',
  OPPONENT_RECONNECTING: 'opponent_reconnecting',
  OPPONENT_RECONNECTED: 'opponent_reconnected',
  OPPONENT_DISCONNECTED: 'opponent_disconnected',
  ROOM_EXPIRED: 'room_expired',
  ERROR: 'error',
};

export const ERROR_CODES = {
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  UNKNOWN_MESSAGE_TYPE: 'UNKNOWN_MESSAGE_TYPE',
  RATE_LIMITED: 'RATE_LIMITED',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  ROOM_EXPIRED: 'ROOM_EXPIRED',
  RELAY_AT_CAPACITY: 'RELAY_AT_CAPACITY',
  RELAY_DRAINING: 'RELAY_DRAINING',
  ALREADY_IN_ROOM: 'ALREADY_IN_ROOM',
  NOT_IN_ROOM: 'NOT_IN_ROOM',
  INVALID_SESSION: 'INVALID_SESSION',
  MATCH_NOT_IN_PROGRESS: 'MATCH_NOT_IN_PROGRESS',
  INVALID_GUESS: 'INVALID_GUESS',
  GUESS_BUDGET_EXHAUSTED: 'GUESS_BUDGET_EXHAUSTED',
};

// Room lifecycle: waiting_for_opponent -> countdown -> in_progress -> resolved,
// with abandoned/expired as alternative terminal states.
export const ROOM_STATES = {
  WAITING_FOR_OPPONENT: 'waiting_for_opponent',
  COUNTDOWN: 'countdown',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  ABANDONED: 'abandoned',
  EXPIRED: 'expired',
};

export const PLAYER_STATES = {
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  GONE: 'gone',
};

export const LOSS_REASONS = {
  OPPONENT_SOLVED: 'opponent_solved',
};

export const DISCONNECT_REASONS = {
  GRACE_EXPIRED: 'grace_expired',
  LEFT: 'left',
};

export const EXPIRY_REASONS = {
  NEVER_JOINED: 'never_joined',
  IDLE: 'idle',
};

export const MAX_PLAYERS_PER_ROOM = 2;
export const MAX_DISPLAY_NAME_LENGTH = 16;
export const ROOM_CODE_LENGTH = 6;

// Unambiguous alphabet: no O/0 and no I/1 (FR-P0-1).
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class RelayError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RelayError';
    this.code = code;
  }
}

export const generateRoomCode = () => {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
  }

  return code;
};

export const generateId = () => randomUUID();

export const normalizeRoomCode = value =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';

export const normalizeDisplayName = value => {
  if (typeof value !== 'string') return null;

  const name = value.trim().slice(0, MAX_DISPLAY_NAME_LENGTH);

  return name === '' ? null : name;
};

export const decodeMessage = raw => {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new RelayError(ERROR_CODES.INVALID_MESSAGE, 'Message is not JSON');
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new RelayError(
      ERROR_CODES.INVALID_MESSAGE,
      'Message must be a JSON object'
    );
  }

  const { type, ...payload } = parsed;
  if (typeof type !== 'string' || type === '') {
    throw new RelayError(
      ERROR_CODES.INVALID_MESSAGE,
      'Message is missing a "type"'
    );
  }

  if (!Object.values(CLIENT_MESSAGES).includes(type)) {
    throw new RelayError(
      ERROR_CODES.UNKNOWN_MESSAGE_TYPE,
      `Unsupported message type "${type}"`
    );
  }

  return { type, payload };
};

export const encodeMessage = (type, payload = {}) =>
  JSON.stringify({ type, ...payload });
