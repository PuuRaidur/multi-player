# Snake Food Battle - Backend

Real-time multiplayer backend for a DOM-rendered browser game. This part owns player joining, Socket.IO networking, match state, scoring, timer, lives, food spawning, collisions, pause/resume/quit messages, and winner selection.

## Setup

Requirements:

- Node.js 18 or newer

Install dependencies:

```bash
npm install
```

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

Socket.IO endpoint:

```text
http://localhost:3100
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

Share the generated HTTPS URL with players. The frontend can connect to that URL with the Socket.IO client.

## Game Rules Implemented

- 2-4 players can join a lobby.
- Player names must be unique.
- The first player is the lead player.
- Only the lead player can start the match.
- Every player starts with 3 lives.
- Match duration is 180 seconds.
- Food gives 10 points.
- Bonus food gives 25 points.
- Extra life power-up gives +1 life up to the maximum lives limit.
- Shield power-up blocks the next crash without losing a life.
- Collision with a wall, own body, or another snake costs 1 life.
- A player with lives remaining respawns.
- A player with 0 lives is out.
- The match ends when the timer reaches 0 or only one player remains alive.
- Winner is the remaining player, or the highest score when time expires.
- Pause, resume, and quit broadcast a system message naming the player who did it.
- Tail Hunt mode is enabled by default: biting another player's tail gives 20 points and removes one tail segment.

## Socket.IO Protocol

Install the client package in the frontend project:

```bash
npm install socket.io-client
```

Connect from the browser:

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3100");
```

### Client To Server

Join:

```js
socket.emit("join", { name: "Mia" });
```

Ready/unready:

```js
socket.emit("ready", { ready: true });
```

Change game mode:

```js
socket.emit("setGameMode", { mode: "classic" });
```

Lead starts match:

```js
socket.emit("start");
```

Move:

```js
socket.emit("input", { direction: "up" });
```

Menu actions:

```js
socket.emit("pause");
socket.emit("resume");
socket.emit("quit");
```

Chat bonus:

```js
socket.emit("chat", { text: "Nice dodge!" });
```

### Server To Client

Welcome:

```js
socket.on("welcome", ({ id, config }) => {});
```

State snapshot:

```js
socket.on("state", (state) => {
  // render phase, players, foods, scores, lives, timer, and winner
});
```

System messages are included in each `state.messages` array:

```json
{ "type": "system", "text": "Mia paused the game.", "createdAt": 1778432400000 }
```

Sound cue:

```js
socket.on("sound", ({ name, playerId, playerName }) => {});
```

Possible sound names:

- `start`
- `pause`
- `resume`
- `quit`
- `food`
- `bonus`
- `extraLife`
- `shield`
- `shieldBlock`
- `tailBite`
- `crash`
- `out`
- `end`

Error:

```js
socket.on("errorMessage", ({ message }) => {});
```

## Frontend Notes

The frontend should render with DOM elements only. Use `requestAnimationFrame` for 60 FPS visual updates and interpolate between server snapshots if desired.

The server sends authoritative snapshots regularly. Frontend movement keys should emit `input` immediately on keydown and avoid sending repeated identical directions every frame.

## Tests

```bash
npm test
```
