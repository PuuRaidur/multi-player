/**
 * Food.jsx
 *
 * Renders a single food item with spawn and eat animations.
 *
 * Props:
 *   food       {id, x, y, type?}  The food to render. Stable `id` is required for animation.
 *   cellSize   number             Pixels per grid cell (must match Board)
 *   isEating   boolean            Triggers the eat animation
 *
 * Food types (optional `type` field):
 *   "normal"  — classic glowing orb (default)
 *   "bonus"   — larger, golden, pulsing ring
 *   "speed"   — cyan teardrop
 */

import { useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Per-food color palette keyed by type
// ---------------------------------------------------------------------------

const TYPE_STYLES = {
  normal: {
    colors: ["#ff8c00", "#ff44dd", "#44ddff", "#aaff44"],
    sizeRatio: 0.48,
    glowMult: 1,
  },
  bonus: {
    colors: ["#00eeff"],
    sizeRatio: 0.64,
    glowMult: 1.6,
  },
  speed: {
    colors: ["#ffd700"],
    sizeRatio: 0.64,
    glowMult: 1.2,
  },
  life: {
    colors: ["#ff4466"],
    sizeRatio: 0.92,
    glowMult: 2.2,
  },
};

/** Pick a stable color from the palette using the food id. */
function colorForFood(food) {
  const palette = (TYPE_STYLES[food.type] ?? TYPE_STYLES.normal).colors;
  // Hash the id string to an index
  let hash = 0;
  for (let i = 0; i < food.id.length; i++) hash = (hash * 31 + food.id.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

export default function Food({ food, cellSize = 32, isEating = false }) {
  const [phase, setPhase] = useState("spawning");
  useEffect(() => {
    setPhase("spawning");
    const t = setTimeout(() => {
      setPhase("idle")
    }, 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isEating) setPhase("eating");
  }, [isEating]);

  const ts = TYPE_STYLES[food.type] ?? TYPE_STYLES.normal;
  const color = colorForFood(food);
  const sz = cellSize * ts.sizeRatio;
  const offset = (cellSize - sz) / 2;
  const glowR = cellSize * 0.45 * ts.glowMult;

  const scale = phase === "spawning" ? 0 : phase === "eating" ? 0.1 : 1;
  const opacity = phase === "eating" ? 0 : 1;
  const transition =
    phase === "spawning" ? "transform 350ms cubic-bezier(.175,.885,.32,1.6), opacity 200ms" :
      phase === "eating" ? "transform 160ms ease-in, opacity 160ms ease-in" : "transform .2s";

  return (
    <div style={{ position: "absolute", transform: `translate(${food.x * cellSize + offset}px, ${food.y * cellSize + offset}px)`, width: sz, height: sz, willChange: "transform" }}>
      {/* Bonus food: pulsing ring */}
      {food.type === "bonus" && phase === "idle" && (
        <div style={{ position: "absolute", inset: -sz * 0.25, borderRadius: "50%", border: `2px solid ${color}77`, animation: "foodPulse 1.4s ease-out infinite" }} />
      )}

      {/* Food body */}
      <div style={{
        width: sz, height: sz,
        borderRadius: food.type === "speed" ? "50% 50% 38% 38% / 60% 60% 40% 40%" : "50%",
        background: `radial-gradient(circle at 36% 36%, ${color}ee, ${color}66 80%)`,
        boxShadow: `0 0 ${glowR * 0.6}px ${color}bb, 0 0 ${glowR}px ${color}44`,
        transform: `scale(${scale})`,
        opacity,
        transition,
      }} />
    </div>
  );
}