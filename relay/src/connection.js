const WebSocket = require('ws');
const {
  MESSAGE_TYPES,
  ERROR_CODES,
  CLOSE_CODES,
  envelope,
  errorEnvelope,
  validateInbound,
} = require('./protocol');
const { RelayError } = require('./rooms');
const { createRateLimiter } = require('./rateLimit');
const { normalizeCode } = require('./codes');

function attachConnection(
  ws,
  { config, store, instanceId, ip, onDisconnect, log }
) {
  const session = {
    ip,
    connectedAt: Date.now(),
    playerId: null,
    playerToken: null,
    roomCode: null,
    limiter: createRateLimiter({
      limit: config.msgRateLimit,
      windowMs: config.msgRateWindowMs,
    }),
    strikes: 0,
    cleaned: false,
    roomPending: false,
    missedPongs: 0,
  };

  const send = async (type, roomCode, payload, roomScoped = true) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    let seq = 0;
    if (roomScoped && roomCode) {
      try {
        seq = await store.nextSeq(roomCode);
      } catch {
        seq = 0;
      }
    }
    ws.send(JSON.stringify(envelope(type, roomCode, seq, instanceId, payload)));
  };

  const sendError = async (code, roomCode = session.roomCode) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(errorEnvelope(code, instanceId, roomCode, 0)));
  };

  const fail = async code => {
    await sendError(code);
    if (code === ERROR_CODES.MESSAGE_TOO_LARGE) {
      ws.close(CLOSE_CODES.MESSAGE_TOO_LARGE);
    }
  };

  const createRoom = async () => {
    if (session.roomCode || session.roomPending) {
      await fail(ERROR_CODES.ALREADY_IN_ROOM);
      return;
    }
    session.roomPending = true;
    try {
      const room = await store.createRoom({
        codeLength: config.roomCodeLength,
      });
      const player = room.players.find(candidate => candidate.role === 'host');
      session.playerId = player.playerId;
      session.playerToken = player.playerToken;
      session.roomCode = room.code;
      await store.touch(room.code);
      log('room_created', session);
      await send(MESSAGE_TYPES.ROOM_CREATED, room.code, {
        code: room.code,
        joinUrl: `${config.publicAppOrigin}/versus/${room.code}`,
        playerId: player.playerId,
        playerToken: player.playerToken,
        role: player.role,
        expiresAt: room.createdAt + config.unjoinedTtlMs,
      });
    } finally {
      session.roomPending = false;
    }
  };

  const joinRoom = async codeInput => {
    if (session.roomCode || session.roomPending) {
      await fail(ERROR_CODES.ALREADY_IN_ROOM);
      return;
    }
    session.roomPending = true;
    try {
      const code = normalizeCode(codeInput);
      if (!code) {
        await fail(ERROR_CODES.ROOM_NOT_FOUND);
        return;
      }
      const result = await store.joinRoom(code);
      const player = result.player;
      session.playerId = player.playerId;
      session.playerToken = player.playerToken;
      session.roomCode = code;
      await store.touch(code);
      const host = result.room.players.find(
        candidate => candidate.role === 'host'
      );
      await send(MESSAGE_TYPES.ROOM_JOINED, code, {
        code,
        playerId: player.playerId,
        playerToken: player.playerToken,
        role: player.role,
        opponentPresent: Boolean(host),
        expiresAt: result.room.joinedAt + config.idleTtlMs,
      });
      if (host) {
        await onPeerMessage(
          code,
          host.playerId,
          MESSAGE_TYPES.OPPONENT_JOINED,
          {
            code,
          }
        );
      }
      log('room_joined', session);
    } finally {
      session.roomPending = false;
    }
  };

  const leave = async () => {
    if (!session.roomCode || !session.playerId) {
      await fail(ERROR_CODES.NOT_IN_ROOM);
      return;
    }
    session.cleaned = true;
    await onDisconnect(session, true);
    ws.close(1000);
  };

  const onPeerMessage = async (roomCode, playerId, type, payload) => {
    if (typeof onDisconnect.sendToPlayer === 'function') {
      await onDisconnect.sendToPlayer(roomCode, playerId, type, payload);
    }
  };

  ws.on('message', async (data, isBinary) => {
    try {
      if (!session.limiter.consume()) {
        session.strikes += 1;
        await fail(ERROR_CODES.RATE_LIMITED);
        if (session.strikes >= 3) ws.close(CLOSE_CODES.RATE_LIMITED);
        return;
      }
      if (isBinary) {
        await fail(ERROR_CODES.MALFORMED_MESSAGE);
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        await fail(ERROR_CODES.MALFORMED_MESSAGE);
        return;
      }
      const validation = validateInbound(parsed);
      if (!validation.ok) {
        await fail(validation.code);
        return;
      }
      if (session.roomCode) await store.touch(session.roomCode);
      switch (parsed.type) {
        case MESSAGE_TYPES.CREATE_ROOM:
          await createRoom();
          break;
        case MESSAGE_TYPES.JOIN_ROOM:
          await joinRoom(parsed.payload.code);
          break;
        case MESSAGE_TYPES.LEAVE_ROOM:
          await leave();
          break;
        case MESSAGE_TYPES.PING:
          await send(MESSAGE_TYPES.PONG, session.roomCode, {}, false);
          break;
        default:
          await fail(ERROR_CODES.UNSUPPORTED_TYPE);
      }
    } catch (error) {
      await fail(
        error instanceof RelayError ? error.code : ERROR_CODES.INTERNAL_ERROR
      );
    }
  });

  ws.on('error', async error => {
    if (
      error.code === 'WS_ERR_MESSAGE_TOO_BIG' ||
      /max payload/i.test(error.message || '')
    ) {
      await fail(ERROR_CODES.MESSAGE_TOO_LARGE);
      if (ws.readyState === WebSocket.OPEN)
        ws.close(CLOSE_CODES.MESSAGE_TOO_LARGE);
    }
  });
  ws.on('close', () => {
    if (!session.cleaned) {
      session.cleaned = true;
      void onDisconnect(session, false);
    }
  });
  ws.on('pong', () => {
    session.isAlive = true;
  });
  session.ws = ws;
  session.isAlive = true;
  return session;
}

module.exports = { attachConnection };
