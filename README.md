# Snake Food Battle 🐍

Real-time multiplayer snake battle for 2–4 players. Compete in the same arena — eat food to grow, grab power-ups, dodge collisions, and hunt tails. The last snake standing (or the highest scorer) wins.

## Quick Start

### 1. Build the client

```bash
cd client
npm install
npm run build
```

### 2. Start the server

```bash
cd server
npm install
npm start
```

The server serves both the game API and the built client files on a single port.

### 3. Play

Open **`http://localhost:3100`** in your browser. Players on other devices (or different networks) can connect to the server's IP or URL — no separate client server needed.

During development, you can still run the client dev server separately (`cd client && npm run dev`) and set `VITE_SERVER_URL` to point at the game server.

## Game Rules

- 2–4 players join a lobby. Names must be unique.
- The first player to join becomes the **lead** — only they can start the match or change game mode.
- Each player starts with **3 lives** and a full-length snake.
- Matches last **180 seconds**.
- Crashing into a wall, your own body, or another snake costs **1 life**. Players with lives remaining respawn; players at 0 lives are out.
- Match ends when the timer runs out or only one player remains. The winner is the last player alive, or the highest scorer if time expires.

### Food & Pickups

| Emoji | Type | Effect |
|-------|------|--------|
| 🍊 | **Normal Food** | +10 points. Orange glow. |
| 🥝 | **Bonus Food** | +25 points. Green glow. Spawns periodically. |
| ❤️ | **Extra Life** | +1 life (up to max). Red glow. |
| 🛡️ | **Shield** | Blocks the next crash without losing a life. Cyan glow. |

### Game Modes

| Mode | Description |
|------|-------------|
| **Classic** | Standard snake — all collisions cost a life. |
| **Tail Hunt** 🎯 | Biting another player's tail gives **+20 points** and removes one tail segment from the defender. |

## Controls

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move your snake |
| `Escape` | Open / close the in-game menu |
| Menu button | Pause, resume, or quit the match |
| Chat button | Send messages to other players |

## Architecture

```
client/              React + Vite + Tailwind CSS
  src/
    components/      Shared UI (Button, InputField, Menu, Chat)
    components/game/ Game rendering (Board, Snake, Food, Grid, EndScreen)
    pages/           PreGame (lobby), Game (play field)
    hooks/           useGame, useKeyboardControls, useSounds
    GameProvider.jsx Socket.IO event wiring and shared state
    socket.js        Socket.IO client setup
    dist/            Built client (auto-served by the server in production)

server/              Node.js + Socket.IO
    server.js        Socket.IO event handlers, HTTP server, static file serving
    game/engine.js   Game state machine, collision, scoring, food spawning
    config.js        Tunable game parameters (grid size, duration, lives, etc.)

test/                Vitest engine tests
```

## Socket.IO Protocol

When running the server standalone (dev mode), connect from the browser:

```js
import { io } from 'socket.io-client'
const socket = io('http://localhost:3100')
```

In production the client is served from the same origin, so the URL is just the server address.

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ name }` | Join the lobby |
| `ready` | `{ ready: bool }` | Toggle ready status |
| `setGameMode` | `{ mode }` | Change game mode (`classic` / `tailHunt`) — lead only |
| `start` | — | Start the match — lead only |
| `input` | `{ direction }` | Move direction (`up`, `down`, `left`, `right`) |
| `pause` | — | Pause the match |
| `resume` | — | Resume the match |
| `quit` | — | Leave the match |
| `chat` | `{ text }` | Send a chat message |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `welcome` | `{ id, config }` | Sent on connection with player ID and server config |
| `state` | `snapshot` | Periodic game state snapshot (phase, players, foods, scores, lives, timer, messages) |
| `errorMessage` | `{ message }` | Action validation error |
| `sound` | `{ name, ... }` | Sound cue (`start`, `food`, `bonus`, `crash`, `tailBite`, `extraLife`, `shield`, `out`, `end`, etc.) |
| `chat` | `{ playerId, name, text, createdAt }` | Received chat message |

## Commands

### Server (`cd server`)

| Command | Description |
|---------|-------------|
| `npm start` | Start the game server (serves API + built client on `0.0.0.0:3100`) |

### Client (`cd client`)

| Command | Description |
|---------|-------------|
| `npm run build` | Build the client for production |
| `npm start` | Start the Vite dev server (network-accessible at `http://<your-ip>:5173`) |
| `npm run dev` | Start the Vite dev server (local-only at `http://localhost:5173`) |
| `npm run lint` | Run ESLint |

### Tests

| Command | Description |
|---------|-------------|
| `npm test` | Run server engine tests (from `cd server`) |

## Internet Access

The server listens on `0.0.0.0:3100` by default and serves the full game on a single port. Anyone with the URL can join.

To share the game over the internet without a public IP:

```bash
ngrok http 3100
# or
cloudflared tunnel --url http://localhost:3100
```

Share the generated HTTPS URL with players. No additional setup is needed — the client is served directly by the game server.
