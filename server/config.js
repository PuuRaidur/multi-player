export const GAME_CONFIG = Object.freeze({
  port: Number.parseInt(process.env.PORT || "3100", 10),
  host: process.env.HOST || "0.0.0.0",
  maxPlayers: 4,
  minPlayers: 2,
  gameMode: "tailHunt",
  gridWidth: 32,
  gridHeight: 24,
  startingLives: 3,
  maxLives: 5,
  startingLength: 4,
  roundDurationMs: 180_000,
  simulationTickMs: 50,
  tickMs: 100,
  broadcastMs: 50,
  respawnInvulnerableMs: 1500,
  normalFoodScore: 10,
  bonusFoodScore: 25,
  tailBiteScore: 20,
  minimumTailBiteLength: 3,
  maxShieldCount: 1,
  normalFoodCount: 5,
  bonusFoodCount: 1,
  bonusFoodChance: 0.18,
  extraLifePowerUpCount: 1,
  shieldPowerUpCount: 1
});

export const DIRECTIONS = Object.freeze({
  up: Object.freeze({ x: 0, y: -1 }),
  down: Object.freeze({ x: 0, y: 1 }),
  left: Object.freeze({ x: -1, y: 0 }),
  right: Object.freeze({ x: 1, y: 0 })
});

export const PLAYER_COLORS = Object.freeze([
  "#24a148",
  "#0f62fe",
  "#da1e28",
  "#f1c21b"
]);
