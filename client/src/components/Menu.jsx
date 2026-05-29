import { useState } from 'react'
import { useGame } from '../hooks/useGame'
import { setVolume } from '../hooks/useSounds'
import Button from './Button'
import './Menu.css'

export default function Menu({ phase, onPause, onResume, onQuit, onPlayAgain, onLeave, onClose }) {
  const { snapshot } = useGame()
  const [vol, setVol] = useState(0.3)
  const isPaused = phase === 'paused'
  const isEnded = phase === 'ended'
  const messages = snapshot?.messages || []

  function handleVolume(e) {
    const v = parseFloat(e.target.value)
    setVol(v)
    setVolume(v)
  }

  return (
    <div className="menu-overlay">
      <div className="menu-card">
        <h2 className="menu-title">
          {isPaused ? 'Game Paused' : isEnded ? 'Game Over' : 'Menu'}
        </h2>

        <div className="menu-buttons">
          {isEnded ? (
            <>
              <Button className="menu-btn" onClick={() => { onPlayAgain(); onClose() }}>
                Play Again
              </Button>
              <Button className="menu-btn" onClick={() => { onLeave(); onClose() }}>
                Leave
              </Button>
            </>
          ) : isPaused ? (
            <Button className="menu-btn resume" onClick={() => { onResume(); onClose() }}>
              Resume Game
            </Button>
          ) : (
            <Button className="menu-btn pause" onClick={() => { onPause(); onClose() }}>
              Pause Game
            </Button>
          )}

          <Button className="menu-btn quit" onClick={() => { onQuit(); onClose() }}>
            Quit Game
          </Button>

          <Button className="menu-btn close" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="menu-volume">
          <label>Volume: {Math.round(vol * 100)}%</label>
          <input type="range" min="0" max="1" step="0.05" value={vol} onChange={handleVolume} />
        </div>

        {messages.length > 0 && (
          <div className="menu-messages">
            {messages.slice(-8).map((msg) => (
              <div key={msg.id} className="menu-message">
                {msg.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
