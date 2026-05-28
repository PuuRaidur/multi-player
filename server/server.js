import http from "node:http";
import { Server } from "socket.io";
import { GAME_CONFIG } from "./config.js";
import { SnakeGame } from "./game/engine.js";

const game = new SnakeGame();

// HTTP is only used for simple status checks; gameplay traffic uses Socket.IO.
const server = http.createServer(async (request, response) => {
  if (request.url === "/health") {
    sendJson(response, 200, { ok: true, phase: game.phase, players: game.players.size });
    return;
  }

  if (request.url === "/state") {
    sendJson(response, 200, game.snapshot());
    return;
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
