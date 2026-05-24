import { BrowserRouter, Routes, Route } from 'react-router'
import { GameProvider } from './GameProvider'
import PreGame from './pages/PreGame'
import GamePage from './pages/Game'
import './App.css'

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PreGame />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  )
}
