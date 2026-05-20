import { useRef, useEffect, useState } from 'react';
import Grid from './Grid';
import Food from './Food';
import Snake from './Snake';
import EndScreen from './EndScreen';

function formatTime(/** @type {number} */ ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** @typedef {import('./types').Snapshot} Snapshot */

/**
 * @typedef {Object} BoardProps
 * @property {Snapshot} snapshot Game state snapshot
 * @property {number?} tickRate Server tick rate in milliseconds. Defaults to 150
 */

/**
 * @param {BoardProps} BoardProps
 */
export default function Board({ snapshot, tickRate = 150 }) {
  /** @type {import('react').RefObject<HTMLDivElement>} */
  const containerRef = useRef(null);
  const [logicalSize, setLogicalSize] = useState(800);

  useEffect(() => {
    const handleResize = () => {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      setLogicalSize(Math.max(200, Math.min(parent.clientWidth - 32, parent.clientHeight - 32)));
    };
    handleResize();

    // Fallback to ResizeObserver for robust layout updates
    const observer = new ResizeObserver(() => handleResize());
    if (containerRef.current?.parentElement) {
      observer.observe(containerRef.current.parentElement);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  if (!snapshot || !snapshot.grid) return null;

  const cellW = logicalSize / snapshot.grid.width;
  const cellH = logicalSize / snapshot.grid.height;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center font-sans p-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-neutral-900 via-black to-black -z-10" />

        <div className="w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-t-2xl shadow-2xl p-4 flex flex-col z-10 gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-wrap gap-4 flex-1">
              {snapshot.players.map((p) => (
                <div key={p.id} className="flex flex-col bg-black/50 px-4 py-3 rounded-lg border border-neutral-800 min-w-35">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="font-bold text-sm truncate" style={{ color: p.color }}>
                      {p.name} {p.out ? <span className="text-neutral-500 text-xs">(OUT)</span> : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-auto gap-4">
                    <span className="font-mono font-bold text-neutral-200 text-lg leading-none">{p.score}</span>
                    <div className="flex gap-1" title={`${p.lives} lives`}>
                      {Array.from({ length: Math.max(3, p.lives) }).map((_, i) => (
                        <span key={i}>{i < p.lives ? '❤️' : '🖤'}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-end whitespace-nowrap bg-black/50 px-5 py-3 rounded-lg border border-neutral-800">
              <span className="text-neutral-500 uppercase text-xs font-bold tracking-widest mb-1 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${snapshot.phase === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'}`} />
                Game Timer
              </span>
              <span className="font-mono text-3xl text-neutral-100 font-bold">
                {formatTime(snapshot.timeRemainingMs)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-5xl bg-neutral-950 border border-t-0 border-neutral-800 rounded-b-2xl shadow-2xl z-10 flex min-h-0 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center p-4">
            <div
              ref={containerRef}
              style={{ width: logicalSize, height: logicalSize }}
              className="relative bg-[#1e1e1e] rounded-xl shadow-2xl overflow-hidden"
            >
              <Grid cellW={cellW} cellH={cellH} />
              {snapshot.foods.map((food) =>
                <Food key={food.id} food={food} cellW={cellW} cellH={cellH} />
              )}
              {snapshot.players.map((player) =>
                <Snake key={player.id} player={player} grid={snapshot.grid} cellSize={cellW} tickRate={tickRate} />
              )}
            </div>
            {snapshot.phase === 'ended' && <EndScreen winner={snapshot.winner} />}
          </div>
        </div>
      </div>
    </div >
  );
}
