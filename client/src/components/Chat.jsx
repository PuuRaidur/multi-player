import { useState, useRef, useEffect } from 'react'
import { useGame } from '../hooks/useGame'
import './Chat.css'

export default function Chat() {
  const { chatMessages, myId, sendChat } = useGame()
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [chatMessages])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    sendChat(trimmed)
    setText('')
  }

  if (!open) {
    return (
      <button className="chat-toggle" onClick={() => setOpen(true)}>
        Chat
      </button>
    )
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span className="chat-header-title">Chat</span>
        <button className="chat-header-close" onClick={() => setOpen(false)}>✕</button>
      </div>

      <MessageList messages={chatMessages} myId={myId} listRef={listRef} />

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          maxLength={120}
          className="chat-input"
        />
        <button type="submit" className="chat-send">Send</button>
      </form>
    </div>
  )
}

function MessageList({ messages, myId, listRef }) {
  if (messages.length === 0) {
    return (
      <div ref={listRef} className="chat-messages">
        <p className="chat-empty">No messages yet</p>
      </div>
    )
  }

  return (
    <div ref={listRef} className="chat-messages">
      {messages.map((msg, i) => (
        <p key={i} className={`chat-msg${msg.playerId === myId ? ' own' : ''}`}>
          <span className="chat-msg-name">{msg.name}: </span>
          <span className="chat-msg-text">{msg.text}</span>
        </p>
      ))}
    </div>
  )
}
