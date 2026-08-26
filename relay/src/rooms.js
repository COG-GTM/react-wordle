const { EventEmitter } = require('node:events');
const crypto = require('node:crypto');
const { generateCode, generateToken, normalizeCode } = require('./codes');
const { ERROR_CODES } = require('./protocol');

class RelayError extends Error {
  constructor(code) {
    super(code);
    this.name = 'RelayError';
    this.code = code;
  }
}

class InMemoryRoomStore {
  constructor({
    maxRooms = 1000,
    codeLength = 6,
    unjoinedTtlMs = 600000,
    idleTtlMs = 1800000,
    clock = () => Date.now(),
    codeGenerator = generateCode,
  } = {}) {
    this.rooms = new Map();
    this.maxRooms = maxRooms;
    this.codeLength = codeLength;
    this.unjoinedTtlMs = unjoinedTtlMs;
    this.idleTtlMs = idleTtlMs;
    this.clock = clock;
    this.codeGenerator = codeGenerator;
    this.events = new EventEmitter();
  }

  async createRoom({ codeLength = this.codeLength } = {}) {
    if (this.rooms.size >= this.maxRooms) {
      throw new RelayError(ERROR_CODES.CAPACITY_EXCEEDED);
    }
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = this.codeGenerator(codeLength);
      if (this.rooms.has(code)) continue;
      const now = this.clock();
      const room = {
        code,
        state: 'waiting',
        players: [
          {
            playerId: crypto.randomUUID(),
            playerToken: generateToken(),
            role: 'host',
          },
        ],
        seq: 0,
        createdAt: now,
        lastActivityAt: now,
        joinedAt: null,
      };
      this.rooms.set(code, room);
      return room;
    }
    throw new RelayError(ERROR_CODES.CAPACITY_EXCEEDED);
  }

  isExpired(room, now = this.clock()) {
    return (
      (room.joinedAt === null && now - room.createdAt >= this.unjoinedTtlMs) ||
      now - room.lastActivityAt >= this.idleTtlMs
    );
  }

  async addPlayer(code, player) {
    const room = await this.getRoom(code);
    if (!room) throw new RelayError(ERROR_CODES.ROOM_NOT_FOUND);
    if (room.players.length >= 2) throw new RelayError(ERROR_CODES.ROOM_FULL);
    room.players.push(player);
    room.lastActivityAt = this.clock();
    return room;
  }

  async joinRoom(inputCode, player = null) {
    const code = normalizeCode(inputCode);
    if (!code) throw new RelayError(ERROR_CODES.ROOM_NOT_FOUND);
    const room = this.rooms.get(code);
    if (!room) throw new RelayError(ERROR_CODES.ROOM_NOT_FOUND);
    if (this.isExpired(room)) throw new RelayError(ERROR_CODES.ROOM_EXPIRED);
    if (room.players.length >= 2) throw new RelayError(ERROR_CODES.ROOM_FULL);
    player ||= {
      playerId: crypto.randomUUID(),
      playerToken: generateToken(),
      role: 'guest',
    };
    room.players.push(player);
    room.state = 'ready';
    room.joinedAt = this.clock();
    room.lastActivityAt = room.joinedAt;
    return { room, player };
  }

  async getRoom(inputCode) {
    const code = normalizeCode(inputCode);
    if (!code) return null;
    return this.rooms.get(code) || null;
  }

  async touch(inputCode) {
    const room = await this.getRoom(inputCode);
    if (!room) throw new RelayError(ERROR_CODES.ROOM_NOT_FOUND);
    room.lastActivityAt = this.clock();
    return room;
  }

  async nextSeq(inputCode) {
    const room = await this.getRoom(inputCode);
    if (!room) throw new RelayError(ERROR_CODES.ROOM_NOT_FOUND);
    room.seq += 1;
    return room.seq;
  }

  async removePlayer(inputCode, playerId) {
    const room = await this.getRoom(inputCode);
    if (!room) return null;
    room.players = room.players.filter(player => player.playerId !== playerId);
    room.lastActivityAt = this.clock();
    if (room.players.length === 0) {
      this.rooms.delete(room.code);
      return null;
    }
    if (room.players.length === 1) {
      room.state = 'waiting';
    }
    return room;
  }

  async deleteRoom(inputCode) {
    const code = normalizeCode(inputCode);
    if (code) this.rooms.delete(code);
  }

  async size() {
    return this.rooms.size;
  }

  async sweep(now = this.clock()) {
    const evicted = [];
    for (const room of this.rooms.values()) {
      let reason = null;
      if (
        room.joinedAt === null &&
        now - room.createdAt >= this.unjoinedTtlMs
      ) {
        reason = 'expired_unjoined';
      } else if (now - room.lastActivityAt >= this.idleTtlMs) {
        reason = 'expired_idle';
      }
      if (reason) {
        room.seq += 1;
        const eviction = { code: room.code, reason, seq: room.seq };
        this.rooms.delete(room.code);
        evicted.push(eviction);
        this.events.emit('evicted', eviction);
      }
    }
    return evicted;
  }
}

module.exports = { RelayError, InMemoryRoomStore };
