import { useEffect, useRef } from 'react';

/** @typedef {import('./types').Player} Player */
/** @typedef {import('./types').Grid} Grid */

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

  /** @type {import('react').RefObject<SnakeProps>} */
  const dataRef = useRef({ player, grid, cellSize, tickRate });

  useEffect(() => {
    dataRef.current = { player, grid, cellSize, tickRate };
  }, [player, grid, cellSize, tickRate]);

  /** @type {import('react').RefObject<{ x: number, y: number, el: HTMLDivElement }[]>} */
  const segmentsRef = useRef([]);

  /** @type {import('react').RefObject<HTMLDivElement>} */
  const nameRef = useRef(null);

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
        let r = segmentsRef.current[i];
        if (!r) return;
        let dx = segment.x - r.x;
        let dy = segment.y - r.y;

        if (Math.abs(dx) > grid.width / 2) { r.x = segment.x; dx = 0; }
        if (Math.abs(dy) > grid.height / 2) { r.y = segment.y; dy = 0; }

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1.5) {
          r.x = segment.x;
          r.y = segment.y;
        } else if (dist > 0.001) {
          if (Math.abs(dx) > 0) r.x += Math.sign(dx) * Math.min(Math.abs(dx), linearSpeed);
          if (Math.abs(dy) > 0) r.y += Math.sign(dy) * Math.min(Math.abs(dy), linearSpeed);
        } else {
          r.x = segment.x;
          r.y = segment.y;
        }

        const min = '15%';
        const max = '40%';
        let borderRadius = '0px';

        if (player.snake.length === 1) {
          borderRadius = max;
        } else if (i === 0) {
          const d = player.direction;
          if (d === 'up') borderRadius = `${max} ${max} ${min} ${min}`;
          else if (d === 'down') borderRadius = `${min} ${min} ${max} ${max}`;
          else if (d === 'left') borderRadius = `${max} ${min} ${min} ${max}`;
          else if (d === 'right') borderRadius = `${min} ${max} ${max} ${min}`;
        } else if (i === player.snake.length - 1) {
          const prev = player.snake[i - 1];
          let ddx = prev.x - segment.x;
          let ddy = prev.y - segment.y;
          if (Math.abs(ddx) > grid.width / 2) ddx = -Math.sign(ddx);
          if (Math.abs(ddy) > grid.height / 2) ddy = -Math.sign(ddy);

          if (ddy < 0) borderRadius = `${min} ${min} ${max} ${max}`;
          else if (ddy > 0) borderRadius = `${max} ${max} ${min} ${min}`;
          else if (ddx < 0) borderRadius = `${min} ${max} ${max} ${min}`;
          else if (ddx > 0) borderRadius = `${max} ${min} ${min} ${max}`;
          else borderRadius = max;
        } else {
          borderRadius = min;
        }

        const ss = cellSize * 0.9;

        r.el.style.left = `${r.x * cellSize + (cellSize - ss) / 2 - 0.5}px`;
        r.el.style.top = `${r.y * cellSize + (cellSize - ss) / 2 - 0.5}px`;
        r.el.style.width = `${ss + 1}px`;
        r.el.style.height = `${ss + 1}px`;
        r.el.style.backgroundColor = color;
        r.el.style.filter = i == 0 ? 'brightness(120%)' : 'none';
        r.el.style.opacity = opacity;
        r.el.style.boxShadow = boxShadow;
        r.el.style.borderRadius = borderRadius;
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
