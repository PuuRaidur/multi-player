import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useGame } from '../hooks/useGame'
import Button from '../components/Button'
import InputField from '../components/InputField'
import './PreGame.css'

export default function PreGame() {
  const { snapshot, myPlayer, isLead, error, clearError, join, setReady, setGameMode, startGame, leaveLobby, connected } = useGame()
  const navigate = useNavigate()
  const [name, setName] = useState('')

  useEffect(() => {
    if (snapshot && snapshot.phase !== 'lobby' && myPlayer) {
      navigate('/game')
    }
  }, [snapshot, navigate, myPlayer])

  function handleJoin(e) {
    e.preventDefault()
    clearError()
    const trimmed = name.trim()
    if (trimmed.length < 2 || trimmed.length > 16) return
    join(trimmed)
  }

  function handleReadyToggle() {
    setReady(!myPlayer?.ready)
  }

  function handleStart() {
    clearError()
    startGame()
  }

  const totalConnected = snapshot?.players.filter(p => p.connected).length || 0
  const allReady = snapshot?.players.filter(p => p.connected).every(p => p.ready) || false
  const canStart = isLead && totalConnected >= 2 && allReady

  if (!connected) {
    return (
      <div className="pregame-page">
        <div className="connecting">
          <div className="spinner" />
          <p className="connecting-text">Connecting to server...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pregame-page">
      <div className="pregame-card">

        <div className="pregame-title">
          <span className="emoji">🐍</span>
          <h1>Snake Food Battle</h1>
        </div>

        {!myPlayer ? (
          <JoinForm name={name} setName={setName} onSubmit={handleJoin} error={error} clearError={clearError} />
        ) : (
          <Lobby
            myPlayer={myPlayer}
            snapshot={snapshot}
            error={error}
            isLead={isLead}
            canStart={canStart}
            totalConnected={totalConnected}
            onReady={handleReadyToggle}
            onStart={handleStart}
            onSetGameMode={setGameMode}
            onLeave={() => { leaveLobby(); navigate('/') }}
          />
        )}

      </div>
    </div>
  )
}

function JoinForm({ name, setName, onSubmit, error, clearError }) {
  return (
    <form onSubmit={onSubmit} className="join-form">
      <label>Choose your nickname</label>
      <InputField
        type="text"
        placeholder="Enter nickname..."
        value={name}
        onChange={e => { setName(e.target.value); if (error) clearError() }}
        maxLength={16}
        autoFocus
      />

      {error && (
        <div className="error-box">
          <p>{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="join-button"
        disabled={name.trim().length < 2}
      >
        Join Lobby
      </Button>
    </form>
  )
}

function Lobby({ myPlayer, snapshot, error, isLead, canStart, totalConnected, onReady, onStart, onSetGameMode, onLeave }) {
  const currentMode = snapshot?.gameMode || 'classic'

  return (
    <div className="lobby">

      <div className="lobby-header">
        <p className="sub">Logged in as</p>
        <p className="name">{myPlayer.name}</p>
      </div>

      {isLead && (
        <div className="mode-selector">
          <label>Game Mode</label>
          <div className="mode-options">
            <Button
              className={currentMode === 'classic' ? 'mode-active' : ''}
              onClick={() => onSetGameMode('classic')}
            >
              Classic
            </Button>
            <Button
              className={currentMode === 'tailHunt' ? 'mode-active' : ''}
              onClick={() => onSetGameMode('tailHunt')}
            >
              Tail Hunt
            </Button>
          </div>
        </div>
      )}

      <section className="players-section">
        <div className="players-header">
          <h2>Players</h2>
          <span className="count">{totalConnected} / 4</span>
        </div>
        {snapshot?.players.filter(p => p.connected).map(p => (
          <PlayerRow key={p.id} player={p} isSelf={p.id === myPlayer.id} />
        ))}
      </section>

      {error && (
        <div className="error-box">
          <p>{error}</p>
        </div>
      )}

      <div className="actions">
        <Button
          onClick={onReady}
          variant={myPlayer.ready ? 'yellow' : 'green'}
          className='ready'
        >
          {myPlayer.ready ? 'Not Ready' : 'Ready'}
        </Button>

        {isLead && (
          <Button
            onClick={onStart}
            variant="primary"
            className='start'
            disabled={!canStart}
          >
            Start Game
          </Button>
        )}

        {isLead && !canStart && (
          <div className="waiting-hint">
            <div className="waiting-dot" />
            <p>{totalConnected < 2 ? 'Waiting for more players to join...' : 'Waiting for all players to ready up...'}</p>
          </div>
        )}
      </div>

      <div className="leave-section">
        <Button className="leave" onClick={onLeave}>
          Leave Lobby
        </Button>
      </div>

    </div>
  )
}

function PlayerRow({ player, isSelf }) {
  return (
    <div className={`player-row${isSelf ? ' self' : ''}`}>
      <div className="player-left">
        <span
          className={`player-dot${!player.connected ? ' disconnected' : ''}`}
          style={{ backgroundColor: player.color }}
        />
        <span className={`player-name${isSelf ? ' self' : ''}${!player.connected ? ' disconnected' : ''}`}>
          {player.name}
          {player.lead && <span className="player-crown">👑</span>}
        </span>
      </div>
      <span className={`player-status${player.ready ? ' ready' : ' not-ready'}`}>
        {player.ready ? 'Ready' : 'Not Ready'}
      </span>
    </div>
  )
}
