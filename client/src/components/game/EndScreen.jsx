/**
 * @typedef {Object} EndScreenProps
 * @property {import('./types').Winner} winner Player that won the game
 * @property {() => void} onPlayAgain Callback to start a new game
 * @property {() => void} onLeave Callback to leave the lobby
 */

/**
 * @param {EndScreenProps} EndScreenProps
 */
export default function EndScreen({ winner, onPlayAgain, onLeave }) {
  return (
    <div className="absolute inset-0 z-20 bg-black/60 flex flex-col items-center justify-center">
      <div className="text-white font-bold text-5xl font-sans tracking-widest">GAME OVER</div>
      {winner && (
        <div className="text-green-400 font-sans text-2xl mt-4 font-bold">
          Winner: {winner.name}
        </div>
      )}
      <div className="mt-8 flex gap-4">
        <button
          onClick={onPlayAgain}
          className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-lg cursor-pointer transition-colors text-lg"
        >
          Play Again
        </button>
        <button
          onClick={onLeave}
          className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold px-6 py-3 rounded-lg cursor-pointer transition-colors text-lg"
        >
          Leave
        </button>
      </div>
    </div>
  )
}
