import assert from "node:assert/strict";
import test from "node:test";
import { SnakeGame } from "../server/game/engine.js";
import { GAME_CONFIG } from "../server/config.js";

const testConfig = {
  ...GAME_CONFIG,
  gridWidth: 12,
  gridHeight: 12,
  roundDurationMs: 1000,
  normalFoodCount: 0,
  bonusFoodCount: 0,
  extraLifePowerUpCount: 0,
  speedBoostPowerUpCount: 0
};

test("requires unique player names", () => {
  const game = new SnakeGame(testConfig);

  assert.equal(game.addPlayer("a", "Alex").ok, true);
  const duplicate = game.addPlayer("b", " alex ");

  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.error, "Name is already taken.");
});

test("only lead player can start the match", () => {
  const game = new SnakeGame(testConfig);
  game.addPlayer("a", "Alex");
  game.addPlayer("b", "Berta");

  assert.equal(game.start("b").ok, false);
  assert.equal(game.start("a").ok, true);
  assert.equal(game.phase, "playing");
});

test("food increases score and snake length", () => {
  let now = 1000;
  const game = new SnakeGame(testConfig, () => now);
  game.addPlayer("a", "Alex");
  game.addPlayer("b", "Berta");
  game.start("a");

  const player = game.players.get("a");
  const head = player.snake[0];
  game.foods = [{ id: "f1", type: "normal", x: head.x + 1, y: head.y }];

  game.tick();

  assert.equal(player.score, testConfig.normalFoodScore);
  assert.equal(player.snake.length, testConfig.startingLength + 1);
  assert.equal(game.drainEvents().some((event) => event.type === "sound" && event.name === "food"), true);
});

test("extra life power-up increases lives without passing max lives", () => {
  let now = 1000;
  const game = new SnakeGame(testConfig, () => now);
  game.addPlayer("a", "Alex");
  game.addPlayer("b", "Berta");
  game.start("a");

  const player = game.players.get("a");
  player.lives = testConfig.maxLives - 1;
  const head = player.snake[0];
  game.foods = [{ id: "life1", type: "extraLife", x: head.x + 1, y: head.y }];

  game.tick();

  assert.equal(player.lives, testConfig.maxLives);
  assert.equal(player.score, 0);
  assert.equal(game.drainEvents().some((event) => event.type === "sound" && event.name === "extraLife"), true);

  const newHead = player.snake[0];
  game.foods = [{ id: "life2", type: "extraLife", x: newHead.x + 1, y: newHead.y }];
  game.tick();

  assert.equal(player.lives, testConfig.maxLives);
});

test("speed boost power-up makes player faster for ten seconds", () => {
  let now = 1000;
  const game = new SnakeGame(testConfig, () => now);
  game.addPlayer("a", "Alex");
  game.addPlayer("b", "Berta");
  game.start("a");

  const player = game.players.get("a");
  const head = player.snake[0];
  game.foods = [{ id: "speed1", type: "speedBoost", x: head.x + 1, y: head.y }];

  game.tick();

  assert.equal(player.speedBoostUntil, now + testConfig.speedBoostDurationMs);
  assert.equal(game.snapshot().players.find((entry) => entry.id === "a").speedBoostActive, true);
  assert.equal(game.drainEvents().some((event) => event.type === "sound" && event.name === "speedBoost"), true);

  now += testConfig.speedBoostDurationMs + 1;

  assert.equal(game.snapshot().players.find((entry) => entry.id === "a").speedBoostActive, false);
});

test("boosted player moves three cells over two ticks", () => {
  let now = 1000;
  const game = new SnakeGame(testConfig, () => now);
  game.addPlayer("a", "Alex");
  game.addPlayer("b", "Berta");
  game.start("a");

  const player = game.players.get("a");
  player.speedBoostUntil = now + testConfig.speedBoostDurationMs;
  const startingX = player.snake[0].x;

  game.tick();
  game.tick();

  assert.equal(player.snake[0].x, startingX + 3);
});

test("tail hunt mode rewards biting another snake tail", () => {
  const game = new SnakeGame(testConfig);
  game.addPlayer("a", "Alex");
  game.addPlayer("b", "Berta");
  game.start("a");

  const attacker = game.players.get("a");
  const defender = game.players.get("b");
  attacker.snake = [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }];
  attacker.direction = "right";
  attacker.queuedDirection = "right";
  defender.snake = [{ x: 6, y: 2 }, { x: 5, y: 2 }, { x: 4, y: 2 }, { x: 3, y: 2 }];

  game.tick();

  assert.equal(attacker.score, testConfig.tailBiteScore);
  assert.equal(defender.snake.length, 3);
  assert.equal(attacker.lives, testConfig.startingLives);
  assert.equal(game.drainEvents().some((event) => event.type === "sound" && event.name === "tailBite"), true);
});

test("classic mode treats tail cells as normal collision", () => {
  const classicConfig = { ...testConfig, gameMode: "classic" };
  const game = new SnakeGame(classicConfig);
  game.addPlayer("a", "Alex");
  game.addPlayer("b", "Berta");
  game.start("a");

  const attacker = game.players.get("a");
  const defender = game.players.get("b");
  attacker.snake = [{ x: 2, y: 2 }];
  attacker.direction = "right";
  attacker.queuedDirection = "right";
  defender.snake = [{ x: 6, y: 2 }, { x: 5, y: 2 }, { x: 4, y: 2 }, { x: 3, y: 2 }];

  game.tick();

  assert.equal(attacker.score, 0);
  assert.equal(attacker.lives, classicConfig.startingLives - 1);
  assert.equal(defender.snake.length, 4);
});

test("wall collision costs a life and respawns player", () => {
  let now = 1000;
  const game = new SnakeGame(testConfig, () => now);
  game.addPlayer("a", "Alex");
  game.addPlayer("b", "Berta");
  game.start("a");

  const player = game.players.get("a");
  player.snake = [{ x: 0, y: 0 }];
  player.direction = "left";
  player.queuedDirection = "left";

  game.tick();

  assert.equal(player.lives, testConfig.startingLives - 1);
  assert.equal(player.out, false);
  assert.equal(player.snake.length, testConfig.startingLength);
  assert.equal(game.drainEvents().some((event) => event.type === "sound" && event.name === "crash"), true);
});

test("game ends when timer reaches zero and highest score wins", () => {
  let now = 1000;
  const game = new SnakeGame(testConfig, () => now);
  game.addPlayer("a", "Alex");
  game.addPlayer("b", "Berta");
  game.start("a");

  game.players.get("b").score = 30;
  now += testConfig.roundDurationMs + 1;
  game.tick();

  assert.equal(game.phase, "ended");
  assert.equal(game.winner.name, "Berta");
  assert.equal(game.drainEvents().some((event) => event.type === "sound" && event.name === "end"), true);
});

test("lead player can prepare a new round after the game ends", () => {
  let now = 1000;
  const game = new SnakeGame(testConfig, () => now);
  game.addPlayer("a", "Alex");
  game.addPlayer("b", "Berta");
  game.start("a");

  game.players.get("b").score = 30;
  now += testConfig.roundDurationMs + 1;
  game.tick();

  const result = game.newRound("a");

  assert.equal(result.ok, true);
  assert.equal(game.phase, "lobby");
  assert.equal(game.winner, null);
  assert.equal(game.players.get("a").score, 0);
  assert.equal(game.players.get("a").lives, testConfig.startingLives);
  assert.equal(game.players.get("a").ready, false);
});

test("timer freezes when the game ends early", () => {
  let now = 1000;
  const game = new SnakeGame(testConfig, () => now);
  game.addPlayer("a", "Alex");
  game.addPlayer("b", "Berta");
  game.start("a");

  now += 200;
  game.players.get("b").out = true;
  game.finishIfOnlyOneRemaining();
  const remainingAtEnd = game.getTimeRemainingMs();

  now += 500;

  assert.equal(game.phase, "ended");
  assert.equal(game.getTimeRemainingMs(), remainingAtEnd);
});

test("match resets to empty lobby after all players disconnect", () => {
  const game = new SnakeGame(testConfig);
  game.addPlayer("a", "Alex");
  game.addPlayer("b", "Berta");
  game.start("a");

  game.removePlayer("a");
  game.removePlayer("b");

  assert.equal(game.phase, "lobby");
  assert.equal(game.players.size, 0);
  assert.equal(game.leadPlayerId, null);
  assert.equal(game.winner, null);
});

test("lead moves to a connected player when the old lead disconnects", () => {
  const game = new SnakeGame(testConfig);
  game.addPlayer("a", "Alex");
  game.addPlayer("b", "Berta");
  game.start("a");

  game.removePlayer("a");

  assert.equal(game.leadPlayerId, "b");
});
