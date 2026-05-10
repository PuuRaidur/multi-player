# Snake Food Battle - Backend

Real-time multiplayer backend for a DOM-rendered browser game. This part owns player joining, WebSocket networking, match state, scoring, timer, lives, food spawning, collisions, pause/resume/quit messages, and winner selection.

## Setup

Requirements:

- Node.js 18 or newer

Install dependencies:

```bash
npm install
```

This project currently uses only built-in Node.js modules, so installation is mainly for normal npm workflow.

Run the server:

```bash
npm start
```

Default URL:

```text
http://localhost:3100
```

Health check:

```text
GET /health
```

WebSocket endpoint:

```text
ws://localhost:3100/ws
```

## Internet Access For Other Players

The server listens on `0.0.0.0`, so it can accept traffic from outside your computer if the port is exposed.

For a simple review/demo, run one of these in a separate terminal:

```bash
ngrok http 3100
```

or:

```bash
cloudflared tunnel --url http://localhost:3100
```

Share the generated HTTPS URL with players. The frontend can convert it to `wss://.../ws` for WebSocket connections.

## Game Rules Implemented

- 2-4 players can join a lobby.
- Player names must be unique.
- The first player is the lead player.
- Only the lead player can start the match.
- Every player starts with 3 lives.
- Match duration is 180 seconds.
- Food gives 10 points.
- Bonus food gives 25 points.
- Collision with a wall, own body, or another snake costs 1 life.
- A player with lives remaining respawns.
- A player with 0 lives is out.
- The match ends when the timer reaches 0 or only one player remains alive.
- Winner is the remaining player, or the highest score when time expires.
- Pause, resume, and quit broadcast a system message naming the player who did it.

## WebSocket Protocol

All messages are JSON.

### Client To Server

Join:

```json
{ "type": "join", "name": "Mia" }
```

Ready/unready:

```json
{ "type": "ready", "ready": true }
```

Lead starts match:

```json
{ "type": "start" }
```

Move:

```json
{ "type": "input", "direction": "up" }
```

Menu actions:

```json
{ "type": "pause" }
{ "type": "resume" }
{ "type": "quit" }
```

Chat bonus:

```json
{ "type": "chat", "text": "Nice dodge!" }
```

### Server To Client

Welcome:

```json
{ "type": "welcome", "id": "p_...", "config": { "...": "..." } }
```

State snapshot:

```json
{
  "type": "state",
  "phase": "playing",
  "players": [],
  "foods": [],
  "timeRemainingMs": 180000,
  "winner": null
}
```

System message:

```json
{ "type": "system", "text": "Mia paused the game.", "createdAt": 1778432400000 }
```

Error:

```json
{ "type": "error", "message": "Name is already taken." }
```

## Frontend Notes

The frontend should render with DOM elements only. Use `requestAnimationFrame` for 60 FPS visual updates and interpolate between server snapshots if desired.

The server sends authoritative snapshots regularly. Frontend movement keys should send `input` messages immediately on keydown and avoid sending repeated identical directions every frame.

## Tests

```bash
npm test
```
