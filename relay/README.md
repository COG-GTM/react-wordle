# Wordle versus relay

This is the independently deployable WebSocket service for creating and joining
two-player versus rooms. It deliberately contains no word assignment or guess
scoring; those are client/server features for later tickets.

## Run and configure

```bash
npm ci
npm start
```

Copy `.env.example` to the environment used by the process. Secure deployments
must set `ALLOWED_ORIGINS` and use in-process TLS or an HTTPS reverse proxy.
`RELAY_ALLOW_INSECURE=true` is only for local development and tests.

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `8080` | Listen port |
| `HOST` | `0.0.0.0` | Bind address |
| `ALLOWED_ORIGINS` | required in secure mode | Comma-separated exact origins |
| `PUBLIC_APP_ORIGIN` | first allowed origin | Base URL for room links |
| `RELAY_ALLOW_INSECURE` | `false` | Permit `ws://` and skip origin checks |
| `TLS_CERT_PATH` / `TLS_KEY_PATH` | unset | In-process TLS certificate and key |
| `TRUST_PROXY_PROTO` | `true` | Trust `x-forwarded-proto` |
| `ROOM_CODE_LENGTH` | `6` | Four to six characters |
| `UNJOINED_TTL_MS` | `600000` | Waiting-room TTL |
| `IDLE_TTL_MS` | `1800000` | Idle-room TTL |
| `SWEEP_INTERVAL_MS` | `15000` | Eviction sweep period |
| `MAX_ROOMS` / `MAX_SOCKETS` | `1000` / `2000` | Per-instance caps |
| `MAX_MESSAGE_BYTES` | `2048` | WebSocket message cap |
| `MSG_RATE_LIMIT` / `MSG_RATE_WINDOW_MS` | `40` / `10000` | Per-connection message bucket |
| `JOIN_RATE_LIMIT` / `JOIN_RATE_WINDOW_MS` | `10` / `60000` | Per-IP join/create bucket |
| `INSTANCE_ID` | hostname + random suffix | Emitter identity |

`GET /healthz` returns service health. `GET /stats` returns room/socket counts,
instance ID, and uptime without room codes or personal data. WebSockets use
`/ws` and must use WSS outside insecure development mode. Application-level
`ping` messages count as room activity; protocol-level WebSocket pings do not.

## Protocol

Every relay message is an envelope:

```json
{
  "v": 1,
  "type": "room_created",
  "roomCode": "ABC234",
  "seq": 1,
  "ts": 1700000000000,
  "instanceId": "relay-a1b2c3d4",
  "payload": {}
}
```

Client messages have `type` `create_room`, `join_room`, `leave_room`, or `ping`.
Their payloads are respectively `{}`, `{ "code": "ABC234" }`, `{}`, and `{}`.
Relay messages are `room_created`, `room_joined`, `opponent_joined`,
`opponent_left`, `room_closed`, `error`, and `pong`.

Room creation returns a CSPRNG-generated code from
`ABCDEFGHJKLMNPQRSTUVWXYZ23456789` and a share URL at
`/versus/<code>`. There are exactly two seats. Join failures distinguish
`ROOM_FULL`, `ROOM_NOT_FOUND`, and `ROOM_EXPIRED`.

Error codes are `ROOM_FULL`, `ROOM_NOT_FOUND`, `ROOM_EXPIRED`,
`CAPACITY_EXCEEDED`, `RATE_LIMITED`, `MESSAGE_TOO_LARGE`,
`MALFORMED_MESSAGE`, `UNSUPPORTED_TYPE`, `NOT_IN_ROOM`, `FORBIDDEN_ORIGIN`,
`INSECURE_TRANSPORT`, and `INTERNAL_ERROR`. Error messages are static and
never echo input.

## Scaling and lifecycle

Rooms are evicted after ten minutes without a second player or after 30 minutes
of inactivity. Capacity is approximately 1,000 rooms and 2,000 sockets per
instance. Room addressing is explicit in every room-scoped event, each room
owns its monotonic sequence, and envelopes identify their emitting instance.
The store is asynchronous by interface, so a Redis room/pub-sub adapter can
replace `InMemoryRoomStore` in `rooms.js`; no event contract depends on a
process-local socket identity. This avoids single-instance assumptions while
leaving the adapter insertion point clear.
