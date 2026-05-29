import { useState, useEffect, useCallback } from 'react'
import { GameContext } from './GameContext'
import socket from './socket'

export function GameProvider({ children }) {
  const [myId, setMyId] = useState(null)
  const [config, setConfig] = useState(null)
  const [snapshot, setSnapshot] = useState(null)
  const [error, setError] = useState(null)
  const [chatMessages, setChatMessages] = useState([])

  useEffect(() => {
    socket.on('welcome', (data) => {
      setMyId(data.id)
      setConfig(data.config)
    })

    socket.on('state', setSnapshot)

    socket.on('errorMessage', (data) => {
      setError(data.message)
    })

    socket.on('chat', (data) => {
      setChatMessages(prev => [...prev, data])
    })

    return () => {
      socket.off('welcome')
      socket.off('state')
      socket.off('errorMessage')
      socket.off('chat')
    }
  }, [])

  const join = useCallback((name) => { socket.emit('join', { name }) }, [])
  const setReady = useCallback((ready) => { socket.emit('ready', { ready }) }, [])
  const setGameMode = useCallback((mode) => { socket.emit('setGameMode', { mode }) }, [])
  const startGame = useCallback(() => { socket.emit('start') }, [])
  const pause = useCallback(() => { socket.emit('pause') }, [])
  const resume = useCallback(() => { socket.emit('resume') }, [])
  const quit = useCallback(() => { socket.emit('quit') }, [])
  const sendChat = useCallback((text) => { socket.emit('chat', { text }) }, [])
  const playAgain = useCallback(() => { socket.emit('newRound') }, [])
  const leaveLobby = useCallback(() => { socket.emit('leave') }, [])
  const clearError = useCallback(() => { setError(null) }, [])

  const myPlayer = snapshot?.players?.find(p => p.id === myId) || null
  const isLead = myPlayer?.lead || false

  return (
    <GameContext.Provider value={{
      myId,
      config,
      snapshot,
      error,
      clearError,
      chatMessages,
      myPlayer,
      isLead,
      connected: socket.connected,
      join,
      setReady,
      setGameMode,
      startGame,
      playAgain,
      leaveLobby,
      pause,
      resume,
      quit,
      sendChat,
    }}>
      {children}
    </GameContext.Provider>
  )
}
