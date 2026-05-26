import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useGame } from '../hooks/useGame'
import Button from '../components/Button'
import './PreGame.css'

export default function PreGame() {
  const { snapshot, myPlayer, isLead, error, clearError, join, setReady, startGame, connected } = useGame()
  const navigate = useNavigate()
  const [name, setName] = useState('')

  useEffect(() => {
    if (snapshot && snapshot.phase !== 'lobby') {
      navigate('/game')
    }
  }, [snapshot, navigate])

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
  const readyCount = snapshot?.players.filter(p => p.connected && p.ready).length || 0
  const canStart = isLead && totalConnected >= 2 && readyCount >= 2

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
            readyCount={readyCount}
            onReady={handleReadyToggle}
            onStart={handleStart}
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
      <input
        type="text"
        placeholder="Enter nickname..."
        value={name}
        onChange={e => { setName(e.target.value); if (error) clearError() }}
        className="join-input"
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

function Lobby({ myPlayer, snapshot, error, isLead, canStart, totalConnected, readyCount, onReady, onStart }) {

  return (
    <div className="lobby">

      <div className="lobby-header">
        <p className="sub">Logged in as</p>
        <p className="name">{myPlayer.name}</p>
      </div>

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
          text={myPlayer.ready ? 'Not Ready' : 'Ready'}
          hook={onReady}
          variant={myPlayer.ready ? 'yellow' : 'green'}
        />

        {isLead && (
          <Button
            text="Start Game"
            hook={onStart}
            variant="primary"
          />
        )}

        {isLead && !canStart && (
          <div className="waiting-hint">
            <div className="waiting-dot" />
            <p>
              {totalConnected < 2
                ? 'Waiting for more players to join...'
                : `Waiting for ${2 - readyCount} more player${2 - readyCount === 1 ? '' : 's'} to ready up...`}
            </p>
          </div>
        )}
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
