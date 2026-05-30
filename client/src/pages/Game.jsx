import { useState, useEffect, useRef } from 'react'
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
  const { snapshot, pause, resume, quit, playAgain, leaveLobby, myId } = useGame()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const [pendingLeave, setPendingLeave] = useState(false)
  const seenIds = useRef(new Set())
  const [fps, setFps] = useState(0)
  const frameTimes = useRef([])

  const myPlayer = snapshot?.players?.find(p => p.id === myId) || null

  useKeyboardControls()
  useSounds()

  useEffect(() => {
    let raf
    function tick() {
      const now = performance.now()
      const times = frameTimes.current
      times.push(now)
      while (times.length > 0 && times[0] <= now - 1000) {
        times.shift()
      }
      if (times.length > 1) {
        setFps(times.length - 1)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!snapshot || snapshot.phase === 'lobby') {
      navigate('/')
    }
  }, [snapshot, navigate])

  useEffect(() => {
    if (pendingLeave && myPlayer === null) {
      navigate('/')
    }
  }, [pendingLeave, myPlayer, navigate])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') setMenuOpen(prev => !prev)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!snapshot?.messages) return
    for (const msg of snapshot.messages) {
      if (seenIds.current.has(msg.id)) continue
      seenIds.current.add(msg.id)
      const id = msg.id
      setToasts(prev => [...prev, { id, text: msg.text }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 4000)
    }
  }, [snapshot?.messages])

  if (!snapshot) {
    return <div className="game-loading">Loading...</div>
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <span className="game-title">🐍 Snake Food Battle</span>
        <div className="game-header-actions">
          <span className="fps-counter">{fps} FPS</span>
          <Button onClick={() => setChatOpen(true)}>Chat</Button>
          <Button onClick={() => setMenuOpen(prev => !prev)}>Menu</Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Board snapshot={snapshot} tickRate={100} onPlayAgain={playAgain} onLeave={() => { setPendingLeave(true); leaveLobby() }} />
      </div>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">{t.text}</div>
        ))}
      </div>

      <Chat open={chatOpen} onClose={() => setChatOpen(false)} />

      {menuOpen && (
        <Menu
          phase={snapshot.phase}
          onPause={pause}
          onResume={resume}
          onQuit={quit}
          onPlayAgain={playAgain}
          onLeave={() => { setPendingLeave(true); leaveLobby() }}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}
