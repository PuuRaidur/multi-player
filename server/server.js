import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { Server } from "socket.io";
import { GAME_CONFIG } from "./config.js";
import { SnakeGame } from "./game/engine.js";

const game = new SnakeGame();

const clientDist = path.resolve("../client/dist");
const hasClient = fs.existsSync(clientDist);

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/health") {
    sendJson(response, 200, { ok: true, phase: game.phase, players: game.players.size });
    return;
  }

  if (url.pathname === "/state") {
    sendJson(response, 200, game.snapshot());
    return;
  }

  if (hasClient) {
    const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    const diskPath = path.join(clientDist, filePath);

    try {
      const content = await fs.promises.readFile(diskPath);
      const ext = path.extname(diskPath);
      response.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
      response.end(content);
      return;
    } catch {
      // SPA fallback — serve index.html so client-side routing works
      try {
        const index = await fs.promises.readFile(path.join(clientDist, "index.html"));
        response.writeHead(200, { "content-type": "text/html" });
        response.end(index);
        return;
      } catch {
        // fall through to 404
      }
    }
  }

  sendJson(response, 404, { error: "Not found" });
});

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  socket.emit("welcome", {
    id: socket.id,
    config: {
      minPlayers: GAME_CONFIG.minPlayers,
      maxPlayers: GAME_CONFIG.maxPlayers,
      gridWidth: GAME_CONFIG.gridWidth,
      gridHeight: GAME_CONFIG.gridHeight,
      roundDurationMs: GAME_CONFIG.roundDurationMs
    }
  });
  socket.emit("state", game.snapshot());

  socket.on("join", (payload) => {
    const result = game.addPlayer(socket.id, payload?.name);
    if (!result.ok) {
      socket.emit("errorMessage", { message: result.error });
      return;
    }
    broadcastState();
  });

  socket.on("ready", (payload) => {
    game.setReady(socket.id, payload?.ready);
    broadcastState();
  });

  socket.on("setGameMode", (payload) => {
    const result = game.setGameMode(socket.id, payload?.mode);
    if (!result.ok) {
      socket.emit("errorMessage", { message: result.error });
      return;
    }
    broadcastState();
  });

  socket.on("start", () => {
    const result = game.start(socket.id);
    if (!result.ok) {
      socket.emit("errorMessage", { message: result.error });
      return;
    }
    broadcastGameEvents();
    broadcastState();
  });

  socket.on("newRound", () => {
    const result = game.newRound(socket.id);
    if (!result.ok) {
      socket.emit("errorMessage", { message: result.error });
      return;
    }
    broadcastState();
  });

  socket.on("input", (payload) => {
    game.setDirection(socket.id, payload?.direction);
  });

  socket.on("pause", () => {
    game.pause(socket.id);
    broadcastGameEvents();
    broadcastState();
  });

  socket.on("resume", () => {
    game.resume(socket.id);
    broadcastGameEvents();
    broadcastState();
  });

  socket.on("quit", () => {
    game.quit(socket.id);
    broadcastGameEvents();
    broadcastState();
  });

  socket.on("chat", (payload) => {
    handleChat(socket.id, payload?.text);
  });

  socket.on("disconnect", () => {
    game.removePlayer(socket.id);
    broadcastState();
  });
});

// The server updates game rules at a fixed rate, while the client handles smooth rendering.
setInterval(() => {
  game.tick(GAME_CONFIG.simulationTickMs);
  broadcastGameEvents();
}, GAME_CONFIG.simulationTickMs);

// Frequent snapshots keep scores, lives, timer, and positions synced for all players.
setInterval(() => {
  broadcastState();
}, GAME_CONFIG.broadcastMs);

server.listen(GAME_CONFIG.port, GAME_CONFIG.host, () => {
  console.log(`Snake Food Battle server running at http://${GAME_CONFIG.host}:${GAME_CONFIG.port}`);
});

function handleChat(clientId, rawText) {
  const player = game.players.get(clientId);
  const text = typeof rawText === "string" ? rawText.trim().slice(0, 120) : "";
  if (!player || !text) {
    return;
  }

  io.emit("chat", {
    playerId: player.id,
    name: player.name,
    text,
    createdAt: Date.now()
  });
}

function broadcastState() {
  io.emit("state", game.snapshot());
}

// One-time events, such as sound cues, are separate from recurring state snapshots.
function broadcastGameEvents() {
  for (const event of game.drainEvents()) {
    io.emit(event.type, event);
  }
}

function sendJson(response, status, data) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}
