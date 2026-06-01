/**
 * @typedef {Object} EndScreenProps
 * @property {import('./types').Winner[]} winners Player that won the game
 * @property {() => void} onPlayAgain Callback to start a new game
 * @property {() => void} onLeave Callback to leave the lobby
 */

/**
 * @param {EndScreenProps} EndScreenProps
 */
export default function EndScreen({ winners, onPlayAgain, onLeave }) {
  let message;

  if (!winners || winners.length == 0) {
    message = "No winner...";
  } else if (winners.length > 1) {
    const winnerNames = winners.map(w => w.name).join(", ");
    message = `It's a tie between ${winnerNames}!`
  } else if (winners.length == 1) {
    message = `Winner is ${winners[0].name}!`
  }

  return (
    <div className="absolute inset-0 z-20 bg-black/60 flex flex-col items-center justify-center">
      <div className="text-white font-bold text-5xl font-sans tracking-widest">GAME OVER</div>
      {winners && (
        <div className="text-green-400 font-sans text-2xl mt-4 font-bold">
          {message}
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
