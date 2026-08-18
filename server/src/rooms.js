import { MAX_CHALLENGES, MAX_WORD_LENGTH } from './clientConstants.js';
import {
  DISCONNECT_REASONS,
  ERROR_CODES,
  EXPIRY_REASONS,
  LOSS_REASONS,
  MAX_PLAYERS_PER_ROOM,
  PLAYER_STATES,
  ROOM_STATES,
  RelayError,
  SERVER_MESSAGES,
  generateId,
  generateRoomCode,
  normalizeDisplayName,
  normalizeRoomCode,
} from './protocol.js';
import { isGuessAccepted, isSolved, pickWord, scoreGuess } from './scoring.js';

const TERMINAL_STATES = [
  ROOM_STATES.RESOLVED,
  ROOM_STATES.ABANDONED,
  ROOM_STATES.EXPIRED,
];

const publicPlayer = player => ({
  playerId: player.id,
  seat: player.seat,
  name: player.name,
  state: player.state,
  guessCount: player.guesses.length,
  solved: player.solved,
});

// Only per-cell statuses are ever exposed for a board that is not the recipient's
// own, so no payload can leak a letter or the word (FR-P0-6, NFR-6).
const opponentView = player => ({
  ...publicPlayer(player),
  cellStatuses: player.guesses,
});

export class RoomStore {
  constructor({ config, clock = () => Date.now(), selectWord = pickWord }) {
    this.config = config;
    this.clock = clock;
    this.selectWord = selectWord;
    this.rooms = new Map();
    this.playerIndex = new Map();
    this.draining = false;
  }

  get stats() {
    let activeMatches = 0;
    for (const room of this.rooms.values()) {
      if (room.state === ROOM_STATES.IN_PROGRESS) activeMatches += 1;
    }

    return {
      draining: this.draining,
      rooms: this.rooms.size,
      players: this.playerIndex.size,
      activeMatches,
    };
  }

  startDraining() {
    this.draining = true;
  }

  createRoom({ name } = {}) {
    if (this.draining) {
      throw new RelayError(
        ERROR_CODES.RELAY_DRAINING,
        'Relay is shutting down and is not accepting new rooms'
      );
    }

    if (this.rooms.size >= this.config.maxRooms) {
      throw new RelayError(
        ERROR_CODES.RELAY_AT_CAPACITY,
        'Relay is at room capacity, try again shortly'
      );
    }

    const now = this.clock();
    const room = {
      code: this.#allocateRoomCode(),
      createdAt: now,
      lastActivityAt: now,
      state: ROOM_STATES.WAITING_FOR_OPPONENT,
      matchId: null,
      word: null,
      startsAt: null,
      players: [],
    };
    const player = this.#addPlayer(room, name, 1);

    this.rooms.set(room.code, room);

    return {
      room,
      player,
      messages: [
        {
          to: player.id,
          type: SERVER_MESSAGES.ROOM_CREATED,
          payload: {
            ...this.#snapshot(room, player),
            sessionToken: player.sessionToken,
            expiresAt: now + this.config.unjoinedRoomTtlMs,
          },
        },
      ],
    };
  }

  joinRoom({ code, name, sessionToken } = {}) {
    const room = this.rooms.get(normalizeRoomCode(code));
    if (!room) {
      throw new RelayError(ERROR_CODES.ROOM_NOT_FOUND, 'No such room code');
    }

    if (TERMINAL_STATES.includes(room.state)) {
      throw new RelayError(ERROR_CODES.ROOM_EXPIRED, 'This match is over');
    }

    if (sessionToken !== undefined && sessionToken !== null) {
      return this.#reconnect(room, sessionToken);
    }

    if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
      throw new RelayError(
        ERROR_CODES.ROOM_FULL,
        'This room already has two players'
      );
    }

    const player = this.#addPlayer(room, name, room.players.length + 1);
    const opponent = this.#opponentOf(room, player);
    room.lastActivityAt = this.clock();

    const messages = [
      {
        to: player.id,
        type: SERVER_MESSAGES.ROOM_JOINED,
        payload: {
          ...this.#snapshot(room, player),
          sessionToken: player.sessionToken,
        },
      },
      {
        to: opponent.id,
        type: SERVER_MESSAGES.OPPONENT_JOINED,
        payload: { code: room.code, opponent: publicPlayer(player) },
      },
      ...this.#startMatch(room),
    ];

    return { room, player, messages };
  }

  submitGuess({ playerId, guess } = {}) {
    const { room, player } = this.#locate(playerId);

    this.#promoteCountdown(room);

    if (room.state !== ROOM_STATES.IN_PROGRESS) {
      throw new RelayError(
        ERROR_CODES.MATCH_NOT_IN_PROGRESS,
        `Match is ${room.state}, guesses are not accepted`
      );
    }

    if (player.solved) {
      throw new RelayError(
        ERROR_CODES.MATCH_NOT_IN_PROGRESS,
        'You already solved this word'
      );
    }

    if (player.guesses.length >= MAX_CHALLENGES) {
      throw new RelayError(
        ERROR_CODES.GUESS_BUDGET_EXHAUSTED,
        'No guesses left'
      );
    }

    if (!isGuessAccepted(guess)) {
      throw new RelayError(
        ERROR_CODES.INVALID_GUESS,
        'Guess is not in the accepted word list'
      );
    }

    const cellStatuses = scoreGuess(guess, room.word);
    player.guesses.push(cellStatuses);
    player.solved = isSolved(cellStatuses);
    room.lastActivityAt = this.clock();

    const opponent = this.#opponentOf(room, player);
    const messages = [
      {
        to: player.id,
        type: SERVER_MESSAGES.GUESS_RESULT,
        payload: {
          guess: guess.toUpperCase(),
          cellStatuses,
          guessCount: player.guesses.length,
          solved: player.solved,
        },
      },
    ];

    if (opponent) {
      messages.push({
        to: opponent.id,
        type: SERVER_MESSAGES.OPPONENT_PROGRESS,
        payload: {
          cellStatuses,
          guessCount: player.guesses.length,
          state: room.state,
        },
      });
    }

    if (player.solved) {
      messages.push(...this.#resolveWin(room, player));
    } else if (this.#isBoardExhausted(room)) {
      messages.push(...this.#resolveDraw(room));
    }

    return { room, player, messages };
  }

  leaveRoom({ playerId } = {}) {
    const { room, player } = this.#locate(playerId);
    const opponent = this.#opponentOf(room, player);
    const messages = [];

    if (opponent && !TERMINAL_STATES.includes(room.state)) {
      room.state = ROOM_STATES.ABANDONED;
      messages.push({
        to: opponent.id,
        type: SERVER_MESSAGES.OPPONENT_DISCONNECTED,
        payload: {
          reason: DISCONNECT_REASONS.LEFT,
          outcome: 'no_result',
          word: room.word,
        },
      });
    }

    this.#discardRoom(room);

    return { messages };
  }

  handleDisconnect({ playerId } = {}) {
    const room = this.playerIndex.get(playerId);
    if (!room) return { messages: [] };

    const player = room.players.find(candidate => candidate.id === playerId);
    const opponent = this.#opponentOf(room, player);

    if (
      TERMINAL_STATES.includes(room.state) ||
      room.state === ROOM_STATES.WAITING_FOR_OPPONENT
    ) {
      player.state = PLAYER_STATES.GONE;
      this.playerIndex.delete(playerId);

      if (
        room.players.every(candidate => candidate.state === PLAYER_STATES.GONE)
      ) {
        this.#discardRoom(room);
      }

      return { messages: [] };
    }

    player.state = PLAYER_STATES.RECONNECTING;
    player.graceDeadline = this.clock() + this.config.reconnectGraceMs;

    return {
      messages: opponent
        ? [
            {
              to: opponent.id,
              type: SERVER_MESSAGES.OPPONENT_RECONNECTING,
              payload: {
                graceMs: this.config.reconnectGraceMs,
                opponent: publicPlayer(player),
              },
            },
          ]
        : [],
    };
  }

  // Drives every time-based transition: countdown completion, reconnect grace
  // expiry and room TTL eviction. Called on an interval by the relay.
  sweep() {
    const now = this.clock();
    const messages = [];

    for (const room of [...this.rooms.values()]) {
      this.#promoteCountdown(room);

      const abandoning = room.players.find(
        player =>
          player.state === PLAYER_STATES.RECONNECTING &&
          player.graceDeadline <= now
      );

      if (abandoning) {
        const opponent = this.#opponentOf(room, abandoning);
        room.state = ROOM_STATES.ABANDONED;

        if (opponent) {
          messages.push({
            to: opponent.id,
            type: SERVER_MESSAGES.OPPONENT_DISCONNECTED,
            payload: {
              reason: DISCONNECT_REASONS.GRACE_EXPIRED,
              outcome: 'no_result',
              word: room.word,
            },
          });
        }

        this.#discardRoom(room);
        continue;
      }

      const unjoinedTooLong =
        room.state === ROOM_STATES.WAITING_FOR_OPPONENT &&
        now - room.createdAt > this.config.unjoinedRoomTtlMs;
      const idleTooLong = now - room.lastActivityAt > this.config.idleRoomTtlMs;

      if (unjoinedTooLong || idleTooLong) {
        room.state = ROOM_STATES.EXPIRED;

        for (const player of room.players) {
          if (player.state !== PLAYER_STATES.CONNECTED) continue;

          messages.push({
            to: player.id,
            type: SERVER_MESSAGES.ROOM_EXPIRED,
            payload: {
              code: room.code,
              reason: unjoinedTooLong
                ? EXPIRY_REASONS.NEVER_JOINED
                : EXPIRY_REASONS.IDLE,
            },
          });
        }

        this.#discardRoom(room);
      }
    }

    return { messages };
  }

  #allocateRoomCode() {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const code = generateRoomCode();
      if (!this.rooms.has(code)) return code;
    }

    throw new RelayError(
      ERROR_CODES.RELAY_AT_CAPACITY,
      'Could not allocate a free room code'
    );
  }

  #addPlayer(room, name, seat) {
    const player = {
      id: generateId(),
      sessionToken: generateId(),
      seat,
      name: normalizeDisplayName(name) ?? `Player ${seat}`,
      state: PLAYER_STATES.CONNECTED,
      guesses: [],
      solved: false,
      graceDeadline: null,
    };

    room.players.push(player);
    this.playerIndex.set(player.id, room);

    return player;
  }

  #locate(playerId) {
    const room = this.playerIndex.get(playerId);
    if (!room) {
      throw new RelayError(ERROR_CODES.NOT_IN_ROOM, 'You are not in a room');
    }

    return {
      room,
      player: room.players.find(player => player.id === playerId),
    };
  }

  #opponentOf(room, player) {
    return room.players.find(candidate => candidate !== player) ?? null;
  }

  #snapshot(room, player) {
    const opponent = this.#opponentOf(room, player);

    return {
      code: room.code,
      state: room.state,
      matchId: room.matchId,
      startsAt: room.startsAt,
      maxGuesses: MAX_CHALLENGES,
      wordLength: MAX_WORD_LENGTH,
      you: { ...publicPlayer(player), cellStatuses: player.guesses },
      opponent: opponent ? opponentView(opponent) : null,
    };
  }

  #startMatch(room) {
    room.matchId = generateId();
    room.word = this.selectWord();
    room.state = ROOM_STATES.COUNTDOWN;
    room.startsAt = this.clock() + this.config.countdownMs;

    // The word itself stays in relay memory until the match resolves (NFR-5);
    // assign_word tells both clients that they are racing the same word and when.
    return room.players.map(player => ({
      to: player.id,
      type: SERVER_MESSAGES.ASSIGN_WORD,
      payload: {
        code: room.code,
        matchId: room.matchId,
        startsAt: room.startsAt,
        state: room.state,
        maxGuesses: MAX_CHALLENGES,
        wordLength: MAX_WORD_LENGTH,
        opponent: publicPlayer(this.#opponentOf(room, player)),
      },
    }));
  }

  #reconnect(room, sessionToken) {
    const player = room.players.find(
      candidate => candidate.sessionToken === sessionToken
    );

    if (!player) {
      throw new RelayError(
        ERROR_CODES.INVALID_SESSION,
        'Session token does not belong to this room'
      );
    }

    player.state = PLAYER_STATES.CONNECTED;
    player.graceDeadline = null;
    this.playerIndex.set(player.id, room);
    room.lastActivityAt = this.clock();

    const opponent = this.#opponentOf(room, player);
    const messages = [
      {
        to: player.id,
        type: SERVER_MESSAGES.ROOM_JOINED,
        payload: {
          ...this.#snapshot(room, player),
          sessionToken: player.sessionToken,
          resumed: true,
        },
      },
    ];

    if (opponent) {
      messages.push({
        to: opponent.id,
        type: SERVER_MESSAGES.OPPONENT_RECONNECTED,
        payload: { code: room.code, opponent: publicPlayer(player) },
      });
    }

    return { room, player, messages };
  }

  #promoteCountdown(room) {
    if (room.state === ROOM_STATES.COUNTDOWN && this.clock() >= room.startsAt) {
      room.state = ROOM_STATES.IN_PROGRESS;
    }
  }

  #isBoardExhausted(room) {
    return (
      room.players.length === MAX_PLAYERS_PER_ROOM &&
      room.players.every(player => player.guesses.length >= MAX_CHALLENGES)
    );
  }

  #resolveWin(room, winner) {
    room.state = ROOM_STATES.RESOLVED;
    const loser = this.#opponentOf(room, winner);
    const messages = [
      {
        to: winner.id,
        type: SERVER_MESSAGES.PLAYER_WON,
        payload: {
          word: room.word,
          guessCount: winner.guesses.length,
          opponent: loser ? opponentView(loser) : null,
        },
      },
    ];

    if (loser) {
      messages.push({
        to: loser.id,
        type: SERVER_MESSAGES.PLAYER_LOST,
        payload: {
          word: room.word,
          reason: LOSS_REASONS.OPPONENT_SOLVED,
          guessCount: loser.guesses.length,
          opponent: opponentView(winner),
        },
      });
    }

    return messages;
  }

  #resolveDraw(room) {
    room.state = ROOM_STATES.RESOLVED;

    return room.players.map(player => ({
      to: player.id,
      type: SERVER_MESSAGES.MATCH_DRAW,
      payload: {
        word: room.word,
        guessCount: player.guesses.length,
        opponent: opponentView(this.#opponentOf(room, player)),
      },
    }));
  }

  #discardRoom(room) {
    for (const player of room.players) {
      this.playerIndex.delete(player.id);
    }

    this.rooms.delete(room.code);
  }
}
