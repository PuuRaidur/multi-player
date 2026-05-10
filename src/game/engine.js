import { DIRECTIONS, GAME_CONFIG, PLAYER_COLORS } from "../config.js";

const PHASES = Object.freeze({
  lobby: "lobby",
  playing: "playing",
  paused: "paused",
  ended: "ended"
});

export class SnakeGame {
  constructor(config = GAME_CONFIG, now = () => Date.now()) {
    this.config = config;
    this.now = now;
    this.phase = PHASES.lobby;
    this.players = new Map();
    this.foods = [];
    this.messages = [];
    this.leadPlayerId = null;
    this.startedAt = null;
    this.pausedAt = null;
    this.totalPausedMs = 0;
    this.endedAt = null;
    this.winner = null;
    this.nextPlayerNumber = 1;
    this.spawnInitialFood();
  }

  addPlayer(clientId, rawName) {
    if (this.phase !== PHASES.lobby) {
      return { ok: false, error: "Match already started." };
    }

    if (this.players.size >= this.config.maxPlayers) {
      return { ok: false, error: "Match is full." };
    }

    const name = normalizeName(rawName);
    if (!name) {
      return { ok: false, error: "Name must be 2-16 characters." };
    }

    if ([...this.players.values()].some((player) => player.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: "Name is already taken." };
    }

    const player = {
      id: clientId,
      name,
      color: PLAYER_COLORS[this.players.size % PLAYER_COLORS.length],
      number: this.nextPlayerNumber++,
      ready: false,
      connected: true,
      lead: this.leadPlayerId === null,
      score: 0,
      lives: this.config.startingLives,
      out: false,
      direction: "right",
      queuedDirection: "right",
      snake: [],
      invulnerableUntil: 0
    };

    if (this.leadPlayerId === null) {
      this.leadPlayerId = clientId;
    }

    this.players.set(clientId, player);
    this.respawnPlayer(player, true);
    this.addSystemMessage(`${name} joined the lobby.`);
    return { ok: true, player };
  }

  removePlayer(clientId) {
    const player = this.players.get(clientId);
    if (!player) {
      return;
    }

    if (this.phase === PHASES.lobby) {
      this.players.delete(clientId);
      this.addSystemMessage(`${player.name} left the lobby.`);
      this.assignLeadIfNeeded();
      return;
    }

    player.connected = false;
    player.out = true;
    player.lives = 0;
    this.addSystemMessage(`${player.name} disconnected and is out.`);
    this.finishIfOnlyOneRemaining();
  }

  setReady(clientId, ready) {
    const player = this.players.get(clientId);
    if (!player || this.phase !== PHASES.lobby) {
      return false;
    }

    player.ready = Boolean(ready);
    this.addSystemMessage(`${player.name} is ${player.ready ? "ready" : "not ready"}.`);
    return true;
  }

  start(clientId) {
    if (this.phase !== PHASES.lobby) {
      return { ok: false, error: "Match is not in lobby." };
    }

    if (clientId !== this.leadPlayerId) {
      return { ok: false, error: "Only the lead player can start the match." };
    }

    if (this.players.size < this.config.minPlayers) {
      return { ok: false, error: `Need at least ${this.config.minPlayers} players.` };
    }

    this.phase = PHASES.playing;
    this.startedAt = this.now();
    this.pausedAt = null;
    this.totalPausedMs = 0;
    this.endedAt = null;
    this.winner = null;
    this.foods = [];
    this.spawnInitialFood();

    for (const player of this.players.values()) {
      player.score = 0;
      player.lives = this.config.startingLives;
      player.out = false;
      player.invulnerableUntil = 0;
      this.respawnPlayer(player, true);
    }

    this.addSystemMessage("The match started.");
    return { ok: true };
  }

  pause(clientId) {
    const player = this.players.get(clientId);
    if (!player || this.phase !== PHASES.playing) {
      return false;
    }

    this.phase = PHASES.paused;
    this.pausedAt = this.now();
    this.addSystemMessage(`${player.name} paused the game.`);
    return true;
  }

  resume(clientId) {
    const player = this.players.get(clientId);
    if (!player || this.phase !== PHASES.paused) {
      return false;
    }

    this.totalPausedMs += this.now() - this.pausedAt;
    this.pausedAt = null;
    this.phase = PHASES.playing;
    this.addSystemMessage(`${player.name} resumed the game.`);
    return true;
  }

  quit(clientId) {
    const player = this.players.get(clientId);
    if (!player) {
      return false;
    }

    player.out = true;
    player.lives = 0;
    player.snake = [];
    player.connected = false;
    this.addSystemMessage(`${player.name} quit the game.`);
    this.finishIfOnlyOneRemaining();
    return true;
  }

  setDirection(clientId, direction) {
    const player = this.players.get(clientId);
    if (!player || player.out || !DIRECTIONS[direction]) {
      return false;
    }

    if (isOpposite(player.direction, direction)) {
      return false;
    }

    player.queuedDirection = direction;
    return true;
  }

  tick() {
    if (this.phase !== PHASES.playing) {
      return;
    }

    if (this.getTimeRemainingMs() <= 0) {
      this.endGame("Time is up.");
      return;
    }

    const intendedMoves = new Map();
    for (const player of this.players.values()) {
      if (player.out || player.snake.length === 0) {
        continue;
      }

      if (!isOpposite(player.direction, player.queuedDirection)) {
        player.direction = player.queuedDirection;
      }

      const head = player.snake[0];
      const vector = DIRECTIONS[player.direction];
      intendedMoves.set(player.id, { x: head.x + vector.x, y: head.y + vector.y });
    }

    const collisions = new Set();
    const occupied = this.getOccupiedCells();
    const targetCounts = new Map();

    for (const target of intendedMoves.values()) {
      const key = cellKey(target);
      targetCounts.set(key, (targetCounts.get(key) || 0) + 1);
    }

    for (const [playerId, target] of intendedMoves.entries()) {
      const player = this.players.get(playerId);
      const targetKey = cellKey(target);
      const hitWall = target.x < 0 || target.x >= this.config.gridWidth || target.y < 0 || target.y >= this.config.gridHeight;
      const hitBody = occupied.has(targetKey);
      const headOn = targetCounts.get(targetKey) > 1;

      if ((hitWall || hitBody || headOn) && this.now() >= player.invulnerableUntil) {
        collisions.add(playerId);
      }
    }

    for (const [playerId, target] of intendedMoves.entries()) {
      const player = this.players.get(playerId);
      if (collisions.has(playerId)) {
        this.applyCollision(player);
        continue;
      }

      this.movePlayer(player, target);
    }

    this.ensureFoodCounts();
    this.finishIfOnlyOneRemaining();
  }

  movePlayer(player, target) {
    player.snake.unshift(target);

    const foodIndex = this.foods.findIndex((food) => food.x === target.x && food.y === target.y);
    if (foodIndex >= 0) {
      const [food] = this.foods.splice(foodIndex, 1);
      player.score += food.type === "bonus" ? this.config.bonusFoodScore : this.config.normalFoodScore;
      this.addSystemMessage(`${player.name} collected ${food.type === "bonus" ? "bonus food" : "food"}.`);
      return;
    }

    player.snake.pop();
  }

  applyCollision(player) {
    player.lives -= 1;
    this.addSystemMessage(`${player.name} crashed and lost a life.`);

    if (player.lives <= 0) {
      player.out = true;
      player.snake = [];
      this.addSystemMessage(`${player.name} is out.`);
      return;
    }

    this.respawnPlayer(player, false);
  }

  respawnPlayer(player, initialSpawn) {
    const spawn = this.findSpawnPoint();
    const direction = spawn.direction;
    const vector = DIRECTIONS[oppositeDirection(direction)];
    const snake = [];

    for (let i = 0; i < this.config.startingLength; i += 1) {
      snake.push({ x: spawn.x + vector.x * i, y: spawn.y + vector.y * i });
    }

    player.snake = snake;
    player.direction = direction;
    player.queuedDirection = direction;
    player.invulnerableUntil = initialSpawn ? 0 : this.now() + this.config.respawnInvulnerableMs;
  }

  findSpawnPoint() {
    const candidates = [
      { x: 5, y: 5, direction: "right" },
      { x: this.config.gridWidth - 6, y: this.config.gridHeight - 6, direction: "left" },
      { x: 5, y: this.config.gridHeight - 6, direction: "right" },
      { x: this.config.gridWidth - 6, y: 5, direction: "left" }
    ];

    const occupied = this.getOccupiedCells();
    for (const candidate of candidates) {
      if (!occupied.has(cellKey(candidate))) {
        return candidate;
      }
    }

    return this.randomEmptyCell("right");
  }

  spawnInitialFood() {
    this.foods = [];
    this.ensureFoodCounts();
  }

  ensureFoodCounts() {
    const normalCount = this.foods.filter((food) => food.type === "normal").length;
    const bonusCount = this.foods.filter((food) => food.type === "bonus").length;

    for (let i = normalCount; i < this.config.normalFoodCount; i += 1) {
      this.spawnFood("normal");
    }

    for (let i = bonusCount; i < this.config.bonusFoodCount; i += 1) {
      if (Math.random() <= this.config.bonusFoodChance || this.foods.length === this.config.normalFoodCount) {
        this.spawnFood("bonus");
      }
    }
  }

  spawnFood(type) {
    const cell = this.randomEmptyCell();
    this.foods.push({ id: `${type}_${this.now()}_${Math.random().toString(16).slice(2)}`, type, x: cell.x, y: cell.y });
  }

  randomEmptyCell(direction = "right") {
    const occupied = this.getOccupiedCells();
    for (let attempts = 0; attempts < 500; attempts += 1) {
      const cell = {
        x: Math.floor(Math.random() * this.config.gridWidth),
        y: Math.floor(Math.random() * this.config.gridHeight),
        direction
      };

      if (!occupied.has(cellKey(cell))) {
        return cell;
      }
    }

    return { x: 1, y: 1, direction };
  }

  getOccupiedCells() {
    const occupied = new Set();
    for (const player of this.players.values()) {
      for (const segment of player.snake) {
        occupied.add(cellKey(segment));
      }
    }
    return occupied;
  }

  getTimeRemainingMs() {
    if (!this.startedAt) {
      return this.config.roundDurationMs;
    }

    const now = this.phase === PHASES.paused ? this.pausedAt : this.now();
    const elapsed = now - this.startedAt - this.totalPausedMs;
    return Math.max(0, this.config.roundDurationMs - elapsed);
  }

  finishIfOnlyOneRemaining() {
    if (this.phase !== PHASES.playing && this.phase !== PHASES.paused) {
      return;
    }

    const alive = [...this.players.values()].filter((player) => !player.out && player.connected);
    if (alive.length <= 1) {
      this.endGame(alive.length === 1 ? `${alive[0].name} is the last snake standing.` : "No players remain.");
    }
  }

  endGame(reason) {
    if (this.phase === PHASES.ended) {
      return;
    }

    this.phase = PHASES.ended;
    this.endedAt = this.now();
    this.winner = this.pickWinner();
    this.addSystemMessage(`${reason} Winner: ${this.winner ? this.winner.name : "No winner"}.`);
  }

  pickWinner() {
    const players = [...this.players.values()];
    if (players.length === 0) {
      return null;
    }

    return players.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.lives !== a.lives) return b.lives - a.lives;
      return a.number - b.number;
    })[0];
  }

  addSystemMessage(text) {
    const message = { id: `m_${this.now()}_${this.messages.length}`, type: "system", text, createdAt: this.now() };
    this.messages.push(message);
    if (this.messages.length > 40) {
      this.messages.shift();
    }
    return message;
  }

  assignLeadIfNeeded() {
    if (this.players.has(this.leadPlayerId)) {
      return;
    }

    const nextLead = this.players.values().next().value;
    this.leadPlayerId = nextLead ? nextLead.id : null;
    if (nextLead) {
      nextLead.lead = true;
      this.addSystemMessage(`${nextLead.name} is now the lead player.`);
    }
  }

  snapshot() {
    return {
      type: "state",
      phase: this.phase,
      grid: {
        width: this.config.gridWidth,
        height: this.config.gridHeight
      },
      minPlayers: this.config.minPlayers,
      maxPlayers: this.config.maxPlayers,
      leadPlayerId: this.leadPlayerId,
      timeRemainingMs: this.getTimeRemainingMs(),
      players: [...this.players.values()].map((player) => ({
        id: player.id,
        name: player.name,
        color: player.color,
        number: player.number,
        ready: player.ready,
        connected: player.connected,
        lead: player.id === this.leadPlayerId,
        score: player.score,
        lives: player.lives,
        out: player.out,
        direction: player.direction,
        invulnerable: this.now() < player.invulnerableUntil,
        snake: player.snake
      })),
      foods: this.foods,
      messages: this.messages.slice(-8),
      winner: this.winner
        ? {
            id: this.winner.id,
            name: this.winner.name,
            score: this.winner.score
          }
        : null
    };
  }
}

function normalizeName(rawName) {
  if (typeof rawName !== "string") {
    return "";
  }

  const name = rawName.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 16) {
    return "";
  }

  return name;
}

function cellKey(cell) {
  return `${cell.x},${cell.y}`;
}

function isOpposite(current, next) {
  return (
    (current === "up" && next === "down") ||
    (current === "down" && next === "up") ||
    (current === "left" && next === "right") ||
    (current === "right" && next === "left")
  );
}

function oppositeDirection(direction) {
  if (direction === "up") return "down";
  if (direction === "down") return "up";
  if (direction === "left") return "right";
  return "left";
}
