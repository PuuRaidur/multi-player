import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useGame } from '../hooks/useGame'
import Board from '../components/game/Board'
import Menu from '../components/Menu'
import Chat from '../components/Chat'
import { useKeyboardControls } from '../hooks/useKeyboardControls'
import { useSounds } from '../hooks/useSounds'
import './Game.css'

export default function GamePage() {
  const { snapshot, pause, resume, quit } = useGame()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  useKeyboardControls()
  useSounds()

  useEffect(() => {
    if (!snapshot || snapshot.phase === 'lobby') {
      navigate('/')
    }
  }, [snapshot, navigate])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') setMenuOpen(prev => !prev)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!snapshot) {
    return <div className="game-loading">Loading...</div>
  }

  return (
    <div className="game-container">
      <Board snapshot={snapshot} tickRate={100} />

      <button
        className="overlay-btn top"
        onClick={() => setMenuOpen(prev => !prev)}
      >
        Menu
      </button>

      <Chat />

      {menuOpen && (
        <Menu
          phase={snapshot.phase}
          onPause={pause}
          onResume={resume}
          onQuit={() => { quit(); navigate('/') }}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}
