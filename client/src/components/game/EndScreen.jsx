/**
 * @typedef {Object} EndScreenProps
 * @property {import('./types').Winner} winner Player that won the game
 */

/**
 * @param {EndScreenProps} EndScreenProps
 */
export default function EndScreen({ winner }) {
  return (
    <div className="absolute inset-0 z-20 bg-black/60 flex flex-col items-center justify-center pointer-events-none">
      <div className="text-white font-bold text-5xl font-sans tracking-widest">'GAME OVER'</div>
      {winner && (
        <div className="text-green-400 font-sans text-2xl mt-4 font-bold">
          Winner: {winner.name}
        </div>
      )}
    </div>
  )
}
