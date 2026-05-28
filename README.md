# Snake Food Battle 🐍

Real-time multiplayer snake battle for 2–4 players. Compete in the same arena — eat food to grow, grab power-ups, dodge collisions, and hunt tails. The last snake standing (or the highest scorer) wins.

## Quick Start

### Server

```bash
cd server
npm install
npm start
```

Default: `http://localhost:3100`

### Client

```bash
cd client
npm install
npm start
```

Default: `http://localhost:5173`

Open the client URL in multiple browser tabs to play. Players on other devices can connect to `http://<your-ip>:5173`.

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

server/              Node.js + Socket.IO
    server.js        Socket.IO event handlers, HTTP server
    game/engine.js   Game state machine, collision, scoring, food spawning
    config.js        Tunable game parameters (grid size, duration, lives, etc.)

test/                Vitest engine tests
```

## Socket.IO Protocol

Connect from the browser:

```js
import { io } from 'socket.io-client'
const socket = io('http://localhost:3100')
```

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

| Command | Description |
|---------|-------------|
| `npm start` | Start the server / client (client binds on all interfaces for LAN access) |
| `npm run dev` | Start the client in local-only mode |
| `npm run build` | Build the client for production |
| `npm test` | Run server engine tests |
| `npm run lint` | Run ESLint |

## Internet Access

The server listens on `0.0.0.0:3100` by default. To share the game over the internet:

```bash
ngrok http 3100
# or
cloudflared tunnel --url http://localhost:3100
```

Set the `VITE_SERVER_URL` environment variable in the client to the generated HTTPS URL before starting it.
