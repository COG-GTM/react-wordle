import { WebSocketServer } from 'ws';
import {
  CLIENT_MESSAGES,
  ERROR_CODES,
  RelayError,
  SERVER_MESSAGES,
  decodeMessage,
  encodeMessage,
} from './protocol.js';
import { RoomStore } from './rooms.js';

const RATE_WINDOW_MS = 60000;

const isOriginAllowed = (origin, allowedOrigins) =>
  allowedOrigins.length === 0 || allowedOrigins.includes(origin);

class RateLimiter {
  constructor(limit, clock) {
    this.limit = limit;
    this.clock = clock;
    this.hits = [];
  }

  allow() {
    const now = this.clock();
    this.hits = this.hits.filter(hit => now - hit < RATE_WINDOW_MS);

    if (this.hits.length >= this.limit) return false;

    this.hits.push(now);
    return true;
  }
}

export const createRelay = ({
  server,
  config,
  clock = () => Date.now(),
  store = new RoomStore({ config, clock }),
  logger = console,
}) => {
  const sockets = new Map();
  const wss = new WebSocketServer({
    server,
    maxPayload: config.maxMessageBytes,
    verifyClient: ({ origin }, done) => {
      if (isOriginAllowed(origin, config.allowedOrigins)) return done(true);

      logger.warn(`relay: rejected upgrade from origin "${origin ?? ''}"`);
      return done(false, 403, 'Forbidden origin');
    },
  });

  const send = (socket, type, payload) => {
    if (!socket || socket.readyState !== socket.OPEN) return;
    socket.send(encodeMessage(type, payload));
  };

  const sendError = (socket, code, message) =>
    send(socket, SERVER_MESSAGES.ERROR, { code, message });

  const dispatch = messages => {
    for (const { to, type, payload } of messages) {
      send(sockets.get(to), type, payload);
    }
  };

  const bindPlayer = (socket, playerId) => {
    if (socket.playerId && socket.playerId !== playerId) {
      sockets.delete(socket.playerId);
    }

    // A reconnect reuses the player id, so drop the socket it was bound to before.
    const previous = sockets.get(playerId);
    if (previous && previous !== socket)
      previous.close(1000, 'Session resumed');

    socket.playerId = playerId;
    sockets.set(playerId, socket);
  };

  const handleMessage = (socket, raw) => {
    if (!socket.rateLimiter.allow()) {
      sendError(
        socket,
        ERROR_CODES.RATE_LIMITED,
        'Too many messages, slow down'
      );
      return;
    }

    const { type, payload } = decodeMessage(raw);

    switch (type) {
      case CLIENT_MESSAGES.CREATE_ROOM: {
        if (socket.playerId) {
          throw new RelayError(
            ERROR_CODES.ALREADY_IN_ROOM,
            'This connection already belongs to a room'
          );
        }

        const { player, messages } = store.createRoom({ name: payload.name });
        bindPlayer(socket, player.id);
        dispatch(messages);
        return;
      }

      case CLIENT_MESSAGES.JOIN_ROOM: {
        if (socket.playerId) {
          throw new RelayError(
            ERROR_CODES.ALREADY_IN_ROOM,
            'This connection already belongs to a room'
          );
        }

        const { player, messages } = store.joinRoom({
          code: payload.code,
          name: payload.name,
          sessionToken: payload.sessionToken,
        });
        bindPlayer(socket, player.id);
        dispatch(messages);
        return;
      }

      case CLIENT_MESSAGES.GUESS_SUBMITTED: {
        const { messages } = store.submitGuess({
          playerId: socket.playerId,
          guess: payload.guess,
        });
        dispatch(messages);
        return;
      }

      case CLIENT_MESSAGES.LEAVE_ROOM: {
        const { messages } = store.leaveRoom({ playerId: socket.playerId });
        sockets.delete(socket.playerId);
        socket.playerId = null;
        dispatch(messages);
        return;
      }

      default:
        throw new RelayError(
          ERROR_CODES.UNKNOWN_MESSAGE_TYPE,
          `Unsupported message type "${type}"`
        );
    }
  };

  wss.on('connection', socket => {
    socket.playerId = null;
    socket.isAlive = true;
    socket.rateLimiter = new RateLimiter(config.maxMessagesPerMinute, clock);

    socket.on('pong', () => {
      socket.isAlive = true;
    });

    socket.on('message', raw => {
      try {
        handleMessage(socket, raw.toString());
      } catch (error) {
        if (error instanceof RelayError) {
          sendError(socket, error.code, error.message);
          return;
        }

        logger.error('relay: failed to handle message', error);
        sendError(
          socket,
          ERROR_CODES.INVALID_MESSAGE,
          'Message could not be processed'
        );
      }
    });

    socket.on('close', () => {
      if (!socket.playerId) return;
      if (sockets.get(socket.playerId) !== socket) return;

      sockets.delete(socket.playerId);
      dispatch(store.handleDisconnect({ playerId: socket.playerId }).messages);
    });

    socket.on('error', error => logger.error('relay: socket error', error));
  });

  const sweepTimer = setInterval(
    () => dispatch(store.sweep().messages),
    config.sweepIntervalMs
  );

  const heartbeatTimer = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.isAlive) {
        socket.terminate();
        continue;
      }

      socket.isAlive = false;
      socket.ping();
    }
  }, config.heartbeatIntervalMs);

  sweepTimer.unref();
  heartbeatTimer.unref();

  return {
    store,
    wss,
    // Stop accepting new rooms so in-flight matches can drain before shutdown.
    drain: () => store.startDraining(),
    close: () =>
      new Promise(resolve => {
        clearInterval(sweepTimer);
        clearInterval(heartbeatTimer);
        for (const socket of wss.clients)
          socket.close(1001, 'Relay shutting down');
        wss.close(() => resolve());
      }),
  };
};
