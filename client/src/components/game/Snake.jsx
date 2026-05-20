import { useEffect, useRef } from 'react';

/** @typedef {import('./types').Player} Player */
/** @typedef {import('./types').Grid} Grid */
/** @typedef {import('./types').Direction} Direction */

/**
 * @typedef {Object} SnakeProps
 * @property {Player} player Player info
 * @property {Grid} grid Grid
 * @property {number} cellSize Grid cell size
 * @property {number?} tickRate Server tick rate in milliseconds. Defaults to 150
 */

/**
 * @param {SnakeProps} SnakeProps 
 */
export default function Snake({ player, grid, cellSize, tickRate = 150 }) {
  /** @type {import('react').RefObject<HTMLDivElement>} */
  const containerRef = useRef(null);

  /** @type {import('react').RefObject<{ x: number, y: number, el: HTMLDivElement }[]>} */
  const segmentsRef = useRef([]);

  /** @type {import('react').RefObject<HTMLDivElement>} */
  const nameRef = useRef(null);

  /** @type {import('react').RefObject<SnakeProps>} */
  const dataRef = useRef({ player, grid, cellSize, tickRate });

  useEffect(() => {
    dataRef.current = { player, grid, cellSize, tickRate };
  }, [player, grid, cellSize, tickRate]);

  /**
   * Calculates `border-radius` for a snake segment.
   * @param {number} segmentIdx segment index (0 is snake's head)
   * @param {Player} player player
   * @returns {string} `border-radius` CSS value
   */
  const calculateBorderRadius = (segmentIdx, player) => {
    const min = '15%';
    const max = '40%';

    /** @type {{ [x in Direction]: string }} */
    const rounded = {
      up: `${max} ${max} ${min} ${min}`,
      down: `${min} ${min} ${max} ${max}`,
      left: `${max} ${min} ${min} ${max}`,
      right: `${min} ${max} ${max} ${min}`,
    };

    // Snake head
    if (player.snake.length === 1 || segmentIdx === 0) {
      return rounded[player.direction];
    }

    // Snake tail
    if (segmentIdx === player.snake.length - 1) {
      const current = segmentsRef.current[segmentIdx];
      const next = player.snake[segmentIdx];
      let moveX = next.x - current.x;
      let moveY = next.y - current.y;
      if (Math.abs(moveX) > grid.width / 2) moveX = -Math.sign(moveX);
      if (Math.abs(moveY) > grid.height / 2) moveY = -Math.sign(moveY);

      // If tail is not moving, use diff with previous segment
      if (Math.abs(moveX) < 0.05 && Math.abs(moveY) < 0.05) {
        const prev = player.snake[segmentIdx - 1];
        moveX = prev.x - current.x;
        moveY = prev.y - current.y;
      }

      if (moveY < 0) return rounded.down;
      else if (moveY > 0) return rounded.up;
      else if (moveX < 0) return rounded.right;
      else if (moveX > 0) return rounded.left;
      else return max;
    }

    // Snake body
    return min;
  }

  useEffect(() => {
    let animationId = 0;
    let lastTime = performance.now();

    const animate = (time) => {
      const dt = Math.min(time - lastTime, 100);
      lastTime = time;

      const { player, grid, cellSize, tickRate } = dataRef.current;
      if (!player || !player.snake || player.snake.length === 0 || !containerRef.current) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      // Sync segments array size
      while (segmentsRef.current.length < player.snake.length) {
        const el = document.createElement('div');
        el.style.position = 'absolute';
        containerRef.current.appendChild(el);
        const lastRendered = segmentsRef.current[segmentsRef.current.length - 1];
        if (lastRendered) {
          segmentsRef.current.push({ x: lastRendered.x, y: lastRendered.y, el });
        } else {
          segmentsRef.current.push({ x: player.snake[0].x, y: player.snake[0].y, el });
        }
      }

      while (segmentsRef.current.length > player.snake.length) {
        const popped = segmentsRef.current.pop();
        if (popped) {
          containerRef.current.removeChild(popped.el);
        }
      }

      const color = player.color || '#ffffff';
      const opacity = player.out ? '0.3' : '1';
      const isInvulnerable = player.invulnerable && !player.out;
      const glowStr = (Math.sin(time / 20) + 1) / 2;
      const boxShadow = isInvulnerable
        ? `0 0 ${cellSize * 0.5 * glowStr}px ${color}`
        : `0 0 ${cellSize * 0.5}px ${color}60`;

      const linearSpeed = (1 / tickRate) * dt;

      player.snake.forEach((segment, i) => {
        let s = segmentsRef.current[i];
        if (!s) return;
        let dx = segment.x - s.x;
        let dy = segment.y - s.y;

        if (Math.abs(dx) > grid.width / 2) { s.x = segment.x; dx = 0; }
        if (Math.abs(dy) > grid.height / 2) { s.y = segment.y; dy = 0; }

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1.5) {
          s.x = segment.x;
          s.y = segment.y;
        } else if (dist > 0.001) {
          if (Math.abs(dx) > 0) s.x += Math.sign(dx) * Math.min(Math.abs(dx), linearSpeed);
          if (Math.abs(dy) > 0) s.y += Math.sign(dy) * Math.min(Math.abs(dy), linearSpeed);
        } else {
          s.x = segment.x;
          s.y = segment.y;
        }

        const borderRadius = calculateBorderRadius(i, player);
        const ss = cellSize * 0.9;

        s.el.style.left = `${s.x * cellSize + (cellSize - ss) / 2 - 0.5}px`;
        s.el.style.top = `${s.y * cellSize + (cellSize - ss) / 2 - 0.5}px`;
        s.el.style.width = `${ss + 1}px`;
        s.el.style.height = `${ss + 1}px`;
        s.el.style.backgroundColor = color;
        s.el.style.filter = i == 0 ? 'brightness(120%)' : 'none';
        s.el.style.opacity = opacity;
        s.el.style.boxShadow = boxShadow;
        s.el.style.borderRadius = borderRadius;
      });

      // Render Head Setup
      if (segmentsRef.current.length > 0) {
        if (!nameRef.current) {
          const nameEl = document.createElement('div');
          nameEl.style.position = 'absolute';
          nameEl.style.fontFamily = 'Inter, sans-serif';
          nameEl.style.fontWeight = 'bold';
          nameEl.style.fontSize = '14px';
          nameEl.style.textAlign = 'center';
          nameEl.style.width = '100px';
          nameEl.style.pointerEvents = 'none';
          containerRef.current.appendChild(nameEl);
          nameRef.current = nameEl;
        }

        const head = segmentsRef.current[0];

        nameRef.current.innerText = player.name;
        nameRef.current.style.color = player.out ? '#888888' : '#ffffff';
        nameRef.current.style.left = `${head.x * cellSize + cellSize / 2 - 50}px`;
        nameRef.current.style.top = `${head.y * cellSize - 22}px`;
        nameRef.current.style.opacity = opacity;
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  if (!player.snake || player.snake.length === 0) return null;

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }} />
  );
}
