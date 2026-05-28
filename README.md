# Snake Food Battle 🐍

Real-time multiplayer snake battle for 2–4 players. Eat food, grab power-ups, dodge collisions, and hunt tails. Last snake standing (or highest scorer) wins.

## Quick Start

Visit http://dovaogedot.online

Or if you want to set it up yourself:

```bash
# Setup
npm run setup
```

```bash
# Production — build client first, then start server
npm run serve
```

```bash
# Development — runs server + Vite dev server in parallel
npm run dev
```

Server listens on `0.0.0.0:3100`. To share without a public IP:

```bash
# Create URL
ngrok http 3100
# or
cloudflared tunnel --url http://localhost:3100
```

Share the generated URL — no extra setup needed.

## Game Rules

- 2–4 players join a lobby. First joiner is **lead** (starts match, changes game mode).
- Each player starts with **3 lives**. Crashes cost 1 life; 0 lives = out.
- Match lasts **180 seconds**. Winner is last alive, or highest score on timeout.

### Food & Pickups

| Emoji | Type | Effect |
|-------|------|--------|
| 🍊 | Normal Food | +10 points |
| 🥝 | Bonus Food | +25 points |
| ❤️ | Extra Life | +1 life (up to max) |
| 🛡️ | Shield | Blocks next crash |

### Game Modes

| Mode | Description |
|------|-------------|
| **Classic** | Standard snake — all collisions cost a life |
| **Tail Hunt** 🎯 | Biting a tail = +20 points + removes one tail segment |

## Controls

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move |
| Escape | Toggle menu |
| Menu / Chat buttons | Pause, quit, chat |

## Commands

| Directory | Command | Description |
|-----------|---------|-------------|
| root | `npm run serve` | Builds client & starts server (port 80) |
| root | `npm run dev` | Server (3100) + Vite dev server (5173) |
| `server/` | `npm start` | Start game server on `0.0.0.0:3100` |
| `server/` | `npm test` | Run engine tests |
| `client/` | `npm run build` | Build client for production |
| `client/` | `npm run dev` | Vite dev server (`localhost:5173`) |
| `client/` | `npm start` | Vite dev server (`network`) |

## Socket.IO Protocol

### Client → Server

| Event | Payload | Notes |
|-------|---------|-------|
| `join` | `{ name }` | Join lobby |
| `ready` | `{ ready: bool }` | Toggle ready |
| `setGameMode` | `{ mode }` | `classic` / `tailHunt` — lead only |
| `start` | — | Lead only |
| `input` | `{ direction }` | `up` / `down` / `left` / `right` |
| `pause` / `resume` / `quit` | — | Menu actions |
| `chat` | `{ text }` | Send message |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `welcome` | `{ id, config }` | On connection |
| `state` | `snapshot` | Periodic game state (phase, players, foods, scores, timer, messages) |
| `errorMessage` | `{ message }` | Validation error |
| `sound` | `{ name, ... }` | Cue: `start`, `food`, `crash`, `tailBite`, `end`, etc. |
| `chat` | `{ playerId, name, text, createdAt }` | Received message |
