import { useState, useEffect } from 'react';
import Board from '../game/Board';

/**
 * Create a fake snaphost of the game state
 * @returns {import('../game/types').Snapshot}
 */
function generateMockSnapshot() {
  const randomColor = (idx) => [
    "#24a148",
    "#0f62fe",
    "#da1e28",
    "#f1c21b"
  ].splice(idx)[Date.now() % 4]

  return {
    type: "state",
    phase: "playing",
    gameMode: "classic",
    grid: {
      width: 24,
      height: 16
    },
    minPlayers: 2,
    maxPlayers: 4,
    leadPlayerId: "p1",
    timeRemainingMs: 300000,
    players: [
      {
        id: "p1",
        name: "Alice",
        color: randomColor(0),
        number: 1,
        ready: true,
        connected: true,
        lead: true,
        score: 150,
        lives: 3,
        out: false,
        direction: "right",
        invulnerable: false,
        speedBoostActive: false,
        speedBoostRemainingMs: 0,
        snake: [
          { x: 10, y: 15 },
          { x: 9, y: 15 },
          { x: 8, y: 15 },
          { x: 8, y: 14 },
          { x: 8, y: 13 }
        ]
      },
      {
        id: "p2",
        name: "Bob",
        color: randomColor(1),
        number: 2,
        ready: true,
        connected: true,
        lead: false,
        score: 80,
        lives: 2,
        out: false,
        direction: "down",
        invulnerable: true,
        speedBoostActive: true,
        speedBoostRemainingMs: 4000,
        snake: [
          { x: 20, y: 5 },
          { x: 20, y: 4 },
          { x: 20, y: 3 },
          { x: 21, y: 3 }
        ]
      }
    ],
    foods: [
      { id: "f1", type: "normal", x: 10, y: 5 },
      { id: "f2", type: "bonus", x: 4, y: 9 },
      { id: "f3", type: "extraLife", x: 5, y: 5 },
      { id: "f4", type: "speedBoost", x: 8, y: 8 }
    ],
    messages: [
      { id: "m1", type: "system", text: "Alice joined the lobby.", createdAt: Date.now() - 10000 }
    ],
    winner: null
  };
}

export default function SnakeDemo() {
  const [snapshot, setSnapshot] = useState(generateMockSnapshot());
  const tickRate = 200;

  useEffect(() => {
    // A simulation loop to demonstrate the "fluent movement" interpolation
    // without stutters inside the Board component.
    const interval = setInterval(() => {
      setSnapshot((prev) => {
        /** @type {import('../game/types').Snapshot} */
        const next = JSON.parse(JSON.stringify(prev)); // Deep copy state

        // Decrement game time
        next.timeRemainingMs = Math.max(0, next.timeRemainingMs - tickRate);

        next.players.forEach((p) => {
          if (p.out || p.snake.length === 0) return;

          const head = p.snake[0];
          let nx = head.x;
          let ny = head.y;

          // Simple AI logic to make snakes move randomly
          if (Math.random() < 0.1) {
            const dirs = ['up', 'down', 'left', 'right'];
            const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
            const valid = dirs.filter(d => d !== p.direction && d !== opposites[p.direction]);
            p.direction = valid[Math.floor(Math.random() * valid.length)];
          }

          if (p.direction === 'right') nx++;
          if (p.direction === 'left') nx--;
          if (p.direction === 'up') ny--;
          if (p.direction === 'down') ny++;

          // Wrap-around logic
          if (nx >= next.grid.width) nx = 0;
          if (nx < 0) nx = next.grid.width - 1;
          if (ny >= next.grid.height) ny = 0;
          if (ny < 0) ny = next.grid.height - 1;

          // Move forward by prepending a new head
          p.snake.unshift({ x: nx, y: ny });

          // Random chance to "eat food" and grow
          if (Math.random() > 0.05) {
            p.snake.pop(); // Remove tail unless growing
          }
        });

        next.foods = next.foods.map(food =>
          Math.random() < 0.05
            ? null
            : food
        ).filter(el => el != null);

        if (Math.random() < 0.2) {
          const x = Math.floor(Math.random() * next.grid.width);
          const y = Math.floor(Math.random() * next.grid.height);
          /** @type {import('../game/types').Food[]} */
          const types = ["normal", "bonus", "extraLife", "speedBoost"];
          const type = types[Math.floor(Math.random() * 4)]
          next.foods.push({ x, y, type })
        }

        return next;
      });
    }, tickRate); // Server ticks every ~150ms

    return () => clearInterval(interval);
  }, []);

  return (
    <Board snapshot={snapshot} tickRate={tickRate} />
  );
}
