# wordle-versus-relay

WebSocket relay for head-to-head Wordle (WOR-17). Rooms live in memory only — no database,
no accounts. Restarting the process drops every in-flight match by design.

The relay is authoritative: it picks the shared word, validates guesses against the client
word lists in `src/constants/`, scores them, and never sends the plaintext word to a client
before the match resolves. Opponents only ever see cell statuses, not letters.

## Run

```sh
cd server
npm install
npm start            # PORT=8080 by default
npm test
npm run check        # prettier
```

`GET /healthz` returns `{ status, rooms, draining }`.

### Configuration

| Variable                        | Default            | Purpose                                              |
| ------------------------------- | ------------------ | ---------------------------------------------------- |
| `RELAY_HOST` / `PORT`           | `0.0.0.0` / `8080` | Listen address                                       |
| `RELAY_ALLOWED_ORIGINS`         | _(empty)_          | Comma-separated origins; empty allows all (dev only) |
| `RELAY_MAX_ROOMS`               | `1000`             | Concurrent room cap (`relay_at_capacity`)            |
| `RELAY_MAX_MESSAGE_BYTES`       | `4096`             | Max frame size                                       |
| `RELAY_MAX_MESSAGES_PER_MINUTE` | `240`              | Per-connection rate limit                            |
| `RELAY_COUNTDOWN_MS`            | `3000`             | Countdown before guesses are accepted                |
| `RELAY_RECONNECT_GRACE_MS`      | `30000`            | Reconnect window after a drop                        |
| `RELAY_UNJOINED_ROOM_TTL_MS`    | `600000`           | TTL for rooms nobody joins                           |
| `RELAY_IDLE_ROOM_TTL_MS`        | `1800000`          | TTL for idle rooms                                   |
| `RELAY_SWEEP_INTERVAL_MS`       | `1000`             | Expiry sweep interval                                |
| `RELAY_HEARTBEAT_INTERVAL_MS`   | `30000`            | Ping interval                                        |

Terminate TLS in front of the relay (`wss://`) and set `RELAY_ALLOWED_ORIGINS` in production.

## Protocol

JSON frames shaped `{ "type": "...", ...payload }`.

### Client → server

| Type              | Payload                          | Notes                                               |
| ----------------- | -------------------------------- | --------------------------------------------------- |
| `create_room`     | `name?`                          | Answers `room_created` with `code` + `sessionToken` |
| `join_room`       | `code`, `name?`, `sessionToken?` | With a token it resumes the existing seat           |
| `guess_submitted` | `guess`                          | Validated and scored server-side                    |
| `leave_room`      | —                                | Ends the match for the opponent                     |

### Server → client

`room_created`, `room_joined`, `opponent_joined`, `assign_word` (metadata only: word length,
max guesses, `startsAt`), `guess_result` (own statuses), `opponent_progress`
(`{ cellStatuses, guessCount, state }`), `player_won`, `player_lost`, `match_draw`,
`opponent_reconnecting`, `opponent_reconnected`, `opponent_disconnected`, `room_expired`,
`error` (`{ code, message }`).

Error codes: `invalid_message`, `unknown_message_type`, `rate_limited`, `room_not_found`,
`room_full`, `room_expired`, `relay_at_capacity`, `relay_draining`, `already_in_room`,
`not_in_room`, `invalid_session`, `match_not_in_progress`, `invalid_guess`,
`guess_budget_exhausted`.

## Room lifecycle

```
waiting_for_opponent -> countdown -> in_progress -> resolved
                     \-> expired (TTL)     \-> abandoned (disconnect grace lapses / leave)
```

- Room codes are 6 CSPRNG characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no `O/0`, `I/1`).
- Exactly two players; a third join gets `room_full`.
- The word is chosen when the second player joins; both players get the same one.
- First exact solve wins: winner gets `player_won`, opponent `player_lost`, both with the word.
- Both boards exhausted resolves as `match_draw`.
- A drop moves the seat to `reconnecting` (`opponent_reconnecting`) for the grace window; a
  `join_room` with the seat's `sessionToken` resumes it, otherwise the match ends as
  `opponent_disconnected` with `outcome: no_result`.
- Guesses after resolution are rejected with `match_not_in_progress`.
