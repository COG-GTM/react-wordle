const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const WebSocket = require('ws');
const { attachConnection } = require('./connection');
const { InMemoryRoomStore, RelayError } = require('./rooms');
const { createRateLimiter } = require('./rateLimit');
const {
  MESSAGE_TYPES,
  ERROR_CODES,
  CLOSE_CODES,
  CLOSE_REASONS,
  envelope,
} = require('./protocol');

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function originAllowed(origin, allowedOrigins) {
  if (!origin) return false;
  try {
    const candidate = new URL(origin);
    return allowedOrigins.some(value => {
      const allowed = new URL(value);
      return (
        candidate.protocol.toLowerCase() === allowed.protocol.toLowerCase() &&
        candidate.hostname.toLowerCase() === allowed.hostname.toLowerCase() &&
        candidate.port === allowed.port
      );
    });
  } catch {
    return false;
  }
}

function clientIp(req, trustProxy) {
  const forwarded = req.headers['x-forwarded-for'];
  if (trustProxy && forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function safeIp(ip) {
  if (ip.includes(':')) return `${ip.split(':').slice(0, 4).join(':')}::`;
  return `${ip.split('.').slice(0, 3).join('.')}.*`;
}

function log(
  event,
  { config, roomCode = null, playerId = null, ip = null } = {}
) {
  process.stdout.write(
    `${JSON.stringify({
      event,
      roomCode,
      playerId,
      instanceId: config.instanceId,
      ...(ip ? { ip: safeIp(ip) } : {}),
    })}\n`
  );
}

function createRelayServer(
  config,
  { store = new InMemoryRoomStore(config) } = {}
) {
  const tls = config.tlsCertPath && config.tlsKeyPath;
  const httpServer = tls
    ? https.createServer({
        cert: fs.readFileSync(config.tlsCertPath),
        key: fs.readFileSync(config.tlsKeyPath),
      })
    : http.createServer();
  const wss = new WebSocket.WebSocketServer({
    noServer: true,
    maxPayload: config.maxMessageBytes,
  });
  const joinLimiters = new Map();
  const sessions = new Set();
  let shuttingDown = false;

  const sendToPlayer = async (
    roomCode,
    playerId,
    type,
    payload,
    seq = null
  ) => {
    for (const session of sessions) {
      if (session.roomCode !== roomCode || session.playerId !== playerId)
        continue;
      if (session.ws.readyState !== WebSocket.OPEN) continue;
      const sequence =
        seq === null ? await store.nextSeq(roomCode).catch(() => 0) : seq;
      session.ws.send(
        JSON.stringify(
          envelope(type, roomCode, sequence, config.instanceId, payload)
        )
      );
    }
  };

  const broadcastRoom = async (
    roomCode,
    type,
    payload,
    close = false,
    seq = null
  ) => {
    for (const session of [...sessions]) {
      if (
        session.roomCode !== roomCode ||
        session.ws.readyState !== WebSocket.OPEN
      )
        continue;
      const sequence =
        seq === null ? await store.nextSeq(roomCode).catch(() => 0) : seq;
      session.ws.send(
        JSON.stringify(
          envelope(type, roomCode, sequence, config.instanceId, payload)
        )
      );
      if (close) session.ws.close(1000);
    }
  };

  const onDisconnect = async (session, explicit) => {
    if (!session.roomCode || !session.playerId) return;
    const room = await store.getRoom(session.roomCode);
    if (!room) return;
    const player = room.players.find(
      candidate => candidate.playerId === session.playerId
    );
    if (!player) return;
    if (shuttingDown) return;
    if (player.role === 'host') {
      const guest = room.players.find(candidate => candidate.role === 'guest');
      if (guest) {
        await sendToPlayer(
          room.code,
          guest.playerId,
          MESSAGE_TYPES.ROOM_CLOSED,
          {
            code: room.code,
            reason: CLOSE_REASONS.HOST_LEFT,
          }
        );
        for (const other of sessions) {
          if (other.playerId === guest.playerId) other.ws.close(1000);
        }
      }
      await store.deleteRoom(room.code);
    } else {
      await store.removePlayer(room.code, session.playerId);
      const host = room.players.find(candidate => candidate.role === 'host');
      if (host) {
        await sendToPlayer(
          room.code,
          host.playerId,
          MESSAGE_TYPES.OPPONENT_LEFT,
          {
            code: room.code,
            reason: CLOSE_REASONS.PEER_LEFT,
          }
        );
      }
    }
    log(explicit ? 'player_left' : 'player_disconnected', {
      config,
      ...session,
    });
  };
  onDisconnect.sendToPlayer = sendToPlayer;

  httpServer.on('request', async (req, res) => {
    if (req.method !== 'GET') {
      json(res, 404, { error: 'not_found' });
      return;
    }
    const path = new URL(req.url, 'http://relay.local').pathname;
    if (path === '/healthz') {
      json(res, 200, { status: 'ok' });
    } else if (path === '/stats') {
      json(res, 200, {
        rooms: await store.size(),
        sockets: wss.clients.size,
        instanceId: config.instanceId,
        uptimeMs: Math.round(process.uptime() * 1000),
      });
    } else {
      json(res, 404, { error: 'not_found' });
    }
  });

  function rejectUpgrade(socket, status, code) {
    const reason =
      {
        400: 'Bad Request',
        403: 'Forbidden',
        404: 'Not Found',
        429: 'Too Many Requests',
        503: 'Service Unavailable',
      }[status] || 'Bad Request';
    socket.write(
      `HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`
    );
    socket.destroy();
    log(`upgrade_rejected_${code}`, { config });
  }

  httpServer.on('upgrade', (req, socket, head) => {
    const path = new URL(req.url, 'http://relay.local').pathname;
    if (path !== '/ws') {
      rejectUpgrade(socket, 404, 'NOT_FOUND');
      return;
    }
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
      .split(',')[0]
      .trim()
      .toLowerCase();
    const secure =
      Boolean(req.socket.encrypted) ||
      (config.trustProxyProto && forwardedProto === 'https');
    if (!config.allowInsecure && !secure) {
      rejectUpgrade(socket, 400, ERROR_CODES.INSECURE_TRANSPORT);
      return;
    }
    if (
      !config.allowInsecure &&
      !originAllowed(req.headers.origin, config.allowedOrigins)
    ) {
      rejectUpgrade(socket, 403, ERROR_CODES.FORBIDDEN_ORIGIN);
      return;
    }
    if (wss.clients.size >= config.maxSockets) {
      rejectUpgrade(socket, 503, ERROR_CODES.CAPACITY_EXCEEDED);
      return;
    }
    const ip = clientIp(req, config.trustProxyProto);
    let limiter = joinLimiters.get(ip);
    if (!limiter) {
      limiter = createRateLimiter({
        limit: config.joinRateLimit,
        windowMs: config.joinRateWindowMs,
      });
      joinLimiters.set(ip, limiter);
    }
    if (!limiter.consume()) {
      rejectUpgrade(socket, 429, ERROR_CODES.RATE_LIMITED);
      return;
    }
    wss.handleUpgrade(req, socket, head, ws => {
      wss.emit('connection', ws, req, { ip });
    });
  });

  wss.on('connection', (ws, req, metadata) => {
    const session = attachConnection(ws, {
      config,
      store,
      instanceId: config.instanceId,
      ip: metadata.ip,
      onDisconnect,
      log: (event, current) => log(event, { config, ...current }),
    });
    sessions.add(session);
    ws.on('close', () => sessions.delete(session));
  });

  const sweepTimer = setInterval(async () => {
    await store.sweep();
  }, config.sweepIntervalMs);
  sweepTimer.unref();

  const heartbeatTimer = setInterval(() => {
    for (const session of sessions) {
      if (!session.isAlive) {
        session.missedPongs += 1;
        if (session.missedPongs >= 2) {
          session.ws.terminate();
          continue;
        }
      } else {
        session.missedPongs = 0;
      }
      session.isAlive = false;
      session.ws.ping();
    }
  }, 30000);
  heartbeatTimer.unref();

  if (store.events && typeof store.events.on === 'function') {
    store.events.on('evicted', item => {
      void broadcastRoom(
        item.code,
        MESSAGE_TYPES.ROOM_CLOSED,
        { code: item.code, reason: item.reason },
        true
      );
    });
  }

  async function close() {
    shuttingDown = true;
    clearInterval(sweepTimer);
    clearInterval(heartbeatTimer);
    for (const session of sessions) {
      if (session.roomCode && session.ws.readyState === WebSocket.OPEN) {
        const seq = await store.nextSeq(session.roomCode).catch(() => 0);
        session.ws.send(
          JSON.stringify(
            envelope(
              MESSAGE_TYPES.ROOM_CLOSED,
              session.roomCode,
              seq,
              config.instanceId,
              { code: session.roomCode, reason: CLOSE_REASONS.SHUTDOWN }
            )
          )
        );
      }
      session.ws.close(1000);
    }
    await new Promise(resolve => wss.close(resolve));
    if (httpServer.listening) {
      await new Promise(resolve => httpServer.close(resolve));
    }
  }

  return { httpServer, wss, close };
}

module.exports = { createRelayServer, originAllowed };
