/**
 * Snake.jsx
 *
 * Renders a single snake on the board.
 *
 * Props:
 *   segments    {x, y}[]  Grid-coordinate positions, head first. Updated each server tick.
 *   color       string    CSS color string for this snake (e.g. "#00ff88", "hsl(140 100% 55%)")
 *   cellSize    number    Pixels per grid cell (must match Board)
 *   name        string    Player label shown above the head
 *   transitionMs number   Should equal your server tick interval (ms) for butter-smooth motion
 *   alive       boolean   When false the snake fades out with a death shake
 */

import React, { useRef, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Determine which way the head is facing based on the first two segments. */
function headDirection(head, neck) {
  if (!neck) return "right";
  const dx = head.x - neck.x;
  const dy = head.y - neck.y;
  // Handle grid wrapping: if delta > 1 it wrapped the other way
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left";
  return dy >= 0 ? "down" : "up";
}

/** Determine which way the tail is facing based on the last two segments. */
function tailDirection(tail, ass) {
  return headDirection(ass, tail)
}

/** Eye positions (as fraction of cellSize) for each heading. */
const EYE_POSITIONS = {
  right: [{ x: 0.58, y: 0.22 }, { x: 0.58, y: 0.60 }],
  left:  [{ x: 0.22, y: 0.22 }, { x: 0.22, y: 0.60 }],
  up:    [{ x: 0.22, y: 0.22 }, { x: 0.60, y: 0.22 }],
  down:  [{ x: 0.22, y: 0.60 }, { x: 0.60, y: 0.60 }],
};

/** Which corners of a segment should be rounded based on its neighbours. */
function borderRadius(idx, total, dir) {
  const isHead = idx === 0;
  const isTail = idx === total - 1;
  const r = "35%";
  const flat = "8%";

  if (total === 1) return r;

  if (isHead) {
    if (dir === "right") return `${flat} ${r} ${r} ${flat}`;
    if (dir === "left")  return `${r} ${flat} ${flat} ${r}`;
    if (dir === "up")    return `${r} ${r} ${flat} ${flat}`;
    if (dir === "down")  return `${flat} ${flat} ${r} ${r}`;
  }
  if (isTail) {
    if (dir === "right") return `${r} ${flat} ${flat} ${r}`;
    if (dir === "left")  return `${flat} ${r} ${r} ${flat}`;
    if (dir === "up")    return `${flat} ${flat} ${r} ${r}`;
    if (dir === "down")  return `${r} ${r} ${flat} ${flat}`;
  }
  return flat;
}

// ---------------------------------------------------------------------------
// Sub-component: single segment
// ---------------------------------------------------------------------------

function Segment({ seg, idx, total, color, cellSize, dir, transitionMs, children }) {
  const size = cellSize - 2;
  const glow = idx === 0 ? `0 0 ${cellSize * 0.5}px ${color}99` : "none";
  // Slightly darken body segments for depth
  const bg =
    idx === 0
      ? color
      : `color-mix(in srgb, ${color} ${Math.max(55, 85 - idx * 2)}%, #000)`;

  return (
    <div
      style={{
        position: "absolute",
        // GPU-accelerated: use transform instead of left/top
        transform: `translate(${seg.x * cellSize + 1}px, ${seg.y * cellSize + 1}px)`,
        width: size,
        height: size,
        borderRadius: borderRadius(idx, total, dir),
        background: bg,
        boxShadow: glow,
        transition: `transform ${transitionMs}ms linear`,
        zIndex: total - idx,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Snake({
  segments = [],
  color = "#00ff88",
  cellSize = 32,
  name = "",
  transitionMs = 120,
  alive = true,
}) {
  const [dead, setDead] = useState(false);

  useEffect(() => {
    if (!alive) {
      // Brief delay then mark visually dead
      const t = setTimeout(() => setDead(true), 300);
      return () => clearTimeout(t);
    }
    setDead(false);
  }, [alive]);

  if (!segments || segments.length === 0) return null;

  const [head, ...rest] = segments;
  const tail = segments[segments.length - 1];
  const ass = segments[segments.length - 2];
  const headDir = headDirection(head, rest[0]);
  const tailDir = tailDirection(tail, ass);
  const eyes = EYE_POSITIONS[headDir];
  const eyeSize = Math.max(3, cellSize * 0.14);
  const pupilSize = eyeSize * 0.55;
  const segSize = cellSize - 2;

  return (
    <div
      style={{
        opacity: dead ? 0 : 1,
        transition: dead ? "opacity 400ms ease" : "none",
        animation: !alive && !dead ? `deathShake 280ms ease` : "none",
      }}
    >
      {/* Death shake keyframes injected inline once */}
      <style>{`
        @keyframes deathShake {
          0%   { transform: translate(0,0) rotate(0deg); }
          20%  { transform: translate(-2px,1px) rotate(-2deg); }
          40%  { transform: translate(2px,-1px) rotate(2deg); }
          60%  { transform: translate(-2px,2px) rotate(-1deg); }
          80%  { transform: translate(2px,-2px) rotate(1deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
      `}</style>

      {segments.map((seg, idx) => (
        <Segment
          key={idx}
          seg={seg}
          idx={idx}
          total={segments.length}
          color={color}
          cellSize={cellSize}
          dir={idx == 0 ? headDir : tailDir}
          transitionMs={transitionMs}
        >
          {/* Eyes on head */}
          {idx === 0 &&
            eyes.map((eye, ei) => (
              <React.Fragment key={ei}>
                {/* Sclera */}
                <div
                  style={{
                    position: "absolute",
                    left: eye.x * segSize - eyeSize / 2,
                    top: eye.y * segSize - eyeSize / 2,
                    width: eyeSize,
                    height: eyeSize,
                    borderRadius: "50%",
                    background: "#ffffffee",
                  }}
                />
                {/* Pupil */}
                <div
                  style={{
                    position: "absolute",
                    left: eye.x * segSize - pupilSize / 2,
                    top: eye.y * segSize - pupilSize / 2,
                    width: pupilSize,
                    height: pupilSize,
                    borderRadius: "50%",
                    background: "#111",
                  }}
                />
              </React.Fragment>
            ))}

          {/* Player name tag */}
          {idx === 0 && name && (
            <div
              style={{
                position: "absolute",
                top: -(cellSize * 0.65),
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: Math.max(9, cellSize * 0.38),
                color,
                whiteSpace: "nowrap",
                fontFamily: "'Courier New', monospace",
                fontWeight: "bold",
                letterSpacing: "0.05em",
                textShadow: `0 0 8px ${color}cc`,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {name}
            </div>
          )}
        </Segment>
      ))}
    </div>
  );
}