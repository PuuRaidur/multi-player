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
  bonusFoodCount: 0
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
