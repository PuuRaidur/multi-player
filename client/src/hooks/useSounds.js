import { useEffect, useRef } from 'react'
import socket from '../socket'

let audioCtx = null
let masterVolume = 0.3

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

export function setVolume(v) {
  masterVolume = Math.max(0, Math.min(1, v))
}

function playTone(frequency, duration, type = 'square', baseVolume = 0.15) {
  const volume = baseVolume * masterVolume
  if (volume < 0.01) return
  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Audio not available
  }
}

function playFood() {
  playTone(523, 0.1, 'square', 0.1)
  setTimeout(() => playTone(659, 0.1, 'square', 0.1), 50)
}

function playBonus() {
  playTone(784, 0.12, 'sine', 0.12)
  setTimeout(() => playTone(988, 0.12, 'sine', 0.12), 60)
  setTimeout(() => playTone(1175, 0.15, 'sine', 0.12), 120)
}

function playCrash() {
  playTone(220, 0.3, 'sawtooth', 0.15)
  setTimeout(() => playTone(165, 0.4, 'sawtooth', 0.12), 150)
}

function playStart() {
  playTone(262, 0.15, 'square', 0.1)
  setTimeout(() => playTone(330, 0.15, 'square', 0.1), 150)
  setTimeout(() => playTone(392, 0.15, 'square', 0.1), 300)
  setTimeout(() => playTone(523, 0.3, 'square', 0.12), 450)
}

function playEnd() {
  playTone(392, 0.3, 'sine', 0.12)
  setTimeout(() => playTone(330, 0.3, 'sine', 0.12), 200)
  setTimeout(() => playTone(262, 0.4, 'sine', 0.12), 400)
}

function playSpeedBoost() {
  playTone(660, 0.1, 'sine', 0.1)
  setTimeout(() => playTone(880, 0.1, 'sine', 0.1), 80)
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.1), 160)
}

function playExtraLife() {
  playTone(440, 0.15, 'triangle', 0.12)
  setTimeout(() => playTone(554, 0.15, 'triangle', 0.12), 100)
  setTimeout(() => playTone(659, 0.2, 'triangle', 0.12), 200)
}

function playPause() {
  playTone(400, 0.15, 'triangle', 0.1)
  setTimeout(() => playTone(300, 0.15, 'triangle', 0.1), 100)
}

function playResume() {
  playTone(300, 0.15, 'triangle', 0.1)
  setTimeout(() => playTone(400, 0.15, 'triangle', 0.1), 100)
}

function playTailBite() {
  playTone(600, 0.08, 'square', 0.1)
  setTimeout(() => playTone(750, 0.08, 'square', 0.1), 60)
  setTimeout(() => playTone(900, 0.12, 'square', 0.1), 120)
}

const SOUND_MAP = {
  food: playFood,
  bonus: playBonus,
  crash: playCrash,
  start: playStart,
  end: playEnd,
  speedBoost: playSpeedBoost,
  extraLife: playExtraLife,
  pause: playPause,
  resume: playResume,
  tailBite: playTailBite,
  out: () => playTone(180, 0.5, 'sawtooth', 0.12),
  quit: () => playTone(200, 0.3, 'sawtooth', 0.1),
}

export function useSounds() {
  const queuedRef = useRef([])

  useEffect(() => {
    function onSound(event) {
      queuedRef.current.push(event.name)
    }

    socket.on('sound', onSound)
    return () => socket.off('sound', onSound)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const names = queuedRef.current
      queuedRef.current = []
      for (const name of names) {
        const play = SOUND_MAP[name]
        if (play) play()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [])
}
