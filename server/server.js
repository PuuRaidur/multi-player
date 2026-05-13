import http from "node:http";
import { GAME_CONFIG } from "./config.js";
import { SnakeGame } from "./game/engine.js";
import { acceptWebSocket, isWebSocketRequest } from "./net/websocket.js";

const game = new SnakeGame();
const clients = new Map();

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

server.on("upgrade", (request, socket) => {
  if (!isWebSocketRequest(request) || new URL(request.url, "http://localhost").pathname !== "/ws") {
    socket.destroy();
    return;
  }

  const connection = acceptWebSocket(request, socket);
  if (!connection) {
    return;
  }

  const id = `p_${Date.now().toString(36)}_${Math.random().toString(16).slice(2)}`;
  clients.set(id, connection);

  connection.sendJson({
    type: "welcome",
    id,
    config: {
      minPlayers: GAME_CONFIG.minPlayers,
      maxPlayers: GAME_CONFIG.maxPlayers,
      gridWidth: GAME_CONFIG.gridWidth,
      gridHeight: GAME_CONFIG.gridHeight,
      roundDurationMs: GAME_CONFIG.roundDurationMs
    }
  });
  connection.sendJson(game.snapshot());

  connection.on("message", (text) => handleClientMessage(id, connection, text));
  connection.on("close", () => {
    clients.delete(id);
    game.removePlayer(id);
    broadcast(game.snapshot());
  });
  connection.on("error", () => {
    clients.delete(id);
    game.removePlayer(id);
    broadcast(game.snapshot());
  });
});

setInterval(() => {
  game.tick();
  broadcastGameEvents();
}, GAME_CONFIG.tickMs);

setInterval(() => {
  broadcast(game.snapshot());
}, GAME_CONFIG.broadcastMs);

setInterval(() => {
  for (const [id, client] of clients.entries()) {
    if (!client.alive) {
      client.close();
      clients.delete(id);
      game.removePlayer(id);
      continue;
    }

    client.alive = false;
    client.ping();
  }
}, 30_000);

server.listen(GAME_CONFIG.port, GAME_CONFIG.host, () => {
  console.log(`Snake Food Battle server running at http://${GAME_CONFIG.host}:${GAME_CONFIG.port}`);
});

function handleClientMessage(clientId, connection, text) {
  let message;
  try {
    message = JSON.parse(text);
  } catch {
    connection.sendJson({ type: "error", message: "Invalid JSON." });
    return;
  }

  switch (message.type) {
    case "join": {
      const result = game.addPlayer(clientId, message.name);
      if (!result.ok) {
        connection.sendJson({ type: "error", message: result.error });
        return;
      }
      broadcast(game.snapshot());
      return;
    }

    case "ready":
      game.setReady(clientId, message.ready);
      broadcast(game.snapshot());
      return;

    case "start": {
      const result = game.start(clientId);
      if (!result.ok) {
        connection.sendJson({ type: "error", message: result.error });
        return;
      }
      broadcastGameEvents();
      broadcast(game.snapshot());
      return;
    }

    case "input":
      game.setDirection(clientId, message.direction);
      return;

    case "pause":
      game.pause(clientId);
      broadcastGameEvents();
      broadcast(game.snapshot());
      return;

    case "resume":
      game.resume(clientId);
      broadcastGameEvents();
      broadcast(game.snapshot());
      return;

    case "quit":
      game.quit(clientId);
      broadcastGameEvents();
      broadcast(game.snapshot());
      return;

    case "chat":
      handleChat(clientId, message.text);
      return;

    default:
      connection.sendJson({ type: "error", message: "Unknown message type." });
  }
}

function handleChat(clientId, rawText) {
  const player = game.players.get(clientId);
  const text = typeof rawText === "string" ? rawText.trim().slice(0, 120) : "";
  if (!player || !text) {
    return;
  }

  broadcast({
    type: "chat",
    playerId: player.id,
    name: player.name,
    text,
    createdAt: Date.now()
  });
}

function broadcast(payload) {
  for (const client of clients.values()) {
    client.sendJson(payload);
  }
}

function broadcastGameEvents() {
  for (const event of game.drainEvents()) {
    broadcast(event);
  }
}

function sendJson(response, status, data) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}
