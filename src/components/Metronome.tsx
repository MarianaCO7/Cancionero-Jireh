'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type Props = {
  initialBpm?: number | null
  onSave?: (bpm: number) => void
  readOnly?: boolean
}

export default function Metronome({ initialBpm, onSave, readOnly = false }: Props) {
  const [bpm, setBpm] = useState(initialBpm || 120)
  const [isPlaying, setIsPlaying] = useState(false)
  const [beat, setBeat] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Crear sonido del metrónomo
  const playClick = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Sonido de "tick" - frecuencia alta para el primer beat
    oscillator.frequency.value = beat % 4 === 0 ? 1000 : 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
    
    setBeat(b => (b + 1) % 4)
  }, [beat])

  // Iniciar/detener metrónomo
  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000
      playClick()
      intervalRef.current = setInterval(playClick, interval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setBeat(0)
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, bpm, playClick])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const handleBpmChange = (newBpm: number) => {
    const clampedBpm = Math.min(240, Math.max(40, newBpm))
    setBpm(clampedBpm)
  }

  const handleSave = () => {
    if (onSave) {
      onSave(bpm)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-300">🥁 Metrónomo</span>
        {!readOnly && onSave && (
          <button
            onClick={handleSave}
            className="px-3 py-1 text-xs bg-green-600 rounded hover:bg-green-700 transition"
          >
            💾 Guardar BPM
          </button>
        )}
      </div>
      
      {/* Display BPM */}
      <div className="text-center mb-4">
        <div className="text-5xl font-bold tabular-nums">{bpm}</div>
        <div className="text-sm text-gray-400">BPM</div>
      </div>
      
      {/* Beat indicator */}
      <div className="flex justify-center gap-2 mb-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              isPlaying && beat === i 
                ? i === 0 ? 'bg-red-500 scale-125' : 'bg-indigo-400 scale-125'
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
      
      {/* Controls */}
      {!readOnly && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={() => handleBpmChange(bpm - 10)}
            className="w-10 h-10 bg-gray-700 rounded-lg hover:bg-gray-600 font-bold"
          >
            -10
          </button>
          <button
            onClick={() => handleBpmChange(bpm - 1)}
            className="w-10 h-10 bg-gray-700 rounded-lg hover:bg-gray-600 font-bold"
          >
            -1
          </button>
          <input
            type="number"
            value={bpm}
            onChange={(e) => handleBpmChange(parseInt(e.target.value) || 120)}
            className="w-20 h-10 text-center bg-gray-700 rounded-lg text-white font-bold text-lg"
            min={40}
            max={240}
          />
          <button
            onClick={() => handleBpmChange(bpm + 1)}
            className="w-10 h-10 bg-gray-700 rounded-lg hover:bg-gray-600 font-bold"
          >
            +1
          </button>
          <button
            onClick={() => handleBpmChange(bpm + 10)}
            className="w-10 h-10 bg-gray-700 rounded-lg hover:bg-gray-600 font-bold"
          >
            +10
          </button>
        </div>
      )}
      
      {/* Play/Stop button */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`w-full py-3 rounded-lg font-bold text-lg transition ${
          isPlaying 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isPlaying ? '⏹️ Detener' : '▶️ Reproducir'}
      </button>
      
      {/* Saved BPM indicator */}
      {initialBpm && (
        <div className="mt-3 text-center text-sm text-gray-400">
          BPM guardado: <span className="text-white font-bold">{initialBpm}</span>
        </div>
      )}
    </div>
  )
}
