import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useGame } from '../hooks/useGame'
import Board from '../components/game/Board'
import Menu from '../components/Menu'
import Chat from '../components/Chat'
import Button from '../components/Button'
import { useKeyboardControls } from '../hooks/useKeyboardControls'
import { useSounds } from '../hooks/useSounds'
import './Game.css'

export default function GamePage() {
  const { snapshot, pause, resume, quit } = useGame()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

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
      <div className="game-header">
        <span className="game-title">🐍 Snake Food Battle</span>
        <div className="game-header-actions">
          <Button onClick={() => setChatOpen(true)}>Chat</Button>
          <Button onClick={() => setMenuOpen(prev => !prev)}>Menu</Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Board snapshot={snapshot} tickRate={100} />
      </div>

      <Chat open={chatOpen} onClose={() => setChatOpen(false)} />

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
