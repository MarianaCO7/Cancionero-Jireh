'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface MetronomeProps {
  initialBpm?: number
  onSave?: (bpm: number) => void
  readOnly?: boolean
}

export default function Metronome({ initialBpm = 120, onSave, readOnly = false }: MetronomeProps) {
  const [bpm, setBpm] = useState(initialBpm)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(0)
  
  const audioContext = useRef<AudioContext | null>(null)
  const intervalRef = useRef<number | null>(null)
  const beatRef = useRef(0)
  const bpmRef = useRef(bpm)

  // Mantener bpmRef sincronizado con bpm para cambios en tiempo real
  useEffect(() => {
    bpmRef.current = bpm
  }, [bpm])

  const playClick = useCallback((isFirstBeat: boolean) => {
    if (!audioContext.current) return
    
    const osc = audioContext.current.createOscillator()
    const envelope = audioContext.current.createGain()

    osc.frequency.value = isFirstBeat ? 1000 : 800
    envelope.gain.value = 0.5
    envelope.gain.exponentialRampToValueAtTime(0.001, audioContext.current.currentTime + 0.1)

    osc.connect(envelope)
    envelope.connect(audioContext.current.destination)

    osc.start(audioContext.current.currentTime)
    osc.stop(audioContext.current.currentTime + 0.1)
  }, [])

  const startMetronome = useCallback(() => {
    if (!audioContext.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioContext.current = new AudioContextClass()
    }
    
    beatRef.current = 0
    setCurrentBeat(0)
    
    // Primer click inmediato
    playClick(true)
    setCurrentBeat(0)
    beatRef.current = 1

    // Función que calcula el intervalo dinámicamente usando bpmRef
    const tick = () => {
      const interval = 60000 / bpmRef.current
      playClick(beatRef.current % 4 === 0)
      setCurrentBeat(beatRef.current % 4)
      beatRef.current++
      intervalRef.current = window.setTimeout(tick, interval)
    }

    const initialInterval = 60000 / bpmRef.current
    intervalRef.current = window.setTimeout(tick, initialInterval)
  }, [playClick])

  const stopMetronome = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const toggleMetronome = () => {
    if (!isPlaying) {
      setIsPlaying(true)
      startMetronome()
    } else {
      setIsPlaying(false)
      stopMetronome()
    }
  }

  useEffect(() => {
    return () => {
      stopMetronome()
    }
  }, [stopMetronome])

  return (
    <div className={`bg-gray-100 p-4 rounded-xl border border-gray-200 ${readOnly ? 'shadow-inner' : ''}`}>
      {!readOnly && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-700">Metrónomo</h3>
          <button 
            onClick={() => onSave && onSave(bpm)}
            className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
          >
            Guardar BPM
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          {!readOnly && (
            <button 
              onClick={() => setBpm(b => Math.max(40, b - 5))}
              className="w-10 h-10 rounded-full bg-white shadow hover:bg-gray-50 flex items-center justify-center font-bold text-gray-600"
            >
              -5
            </button>
          )}
          <div className="text-center">
            <span className={`${readOnly ? 'text-3xl' : 'text-4xl'} font-black text-gray-800`}>{bpm}</span>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">BPM</p>
          </div>
          {!readOnly && (
            <button 
              onClick={() => setBpm(b => Math.min(250, b + 5))}
              className="w-10 h-10 rounded-full bg-white shadow hover:bg-gray-50 flex items-center justify-center font-bold text-gray-600"
            >
              +5
            </button>
          )}
        </div>

        {/* Visual Beats */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-75 ${
                isPlaying && (currentBeat - 1 + 4) % 4 === i 
                  ? (i === 0 ? 'bg-indigo-500 scale-125' : 'bg-indigo-400 scale-110') 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={toggleMetronome}
          className={`w-full py-3 rounded-lg font-bold transition-all ${
            isPlaying 
              ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
          }`}
        >
          {isPlaying ? 'DETENER' : 'INICIAR'}
        </button>

        {!readOnly && (
          <div className="flex gap-2 w-full">
            <button onClick={() => setBpm(b => Math.max(40, b - 1))} className="flex-1 py-1 bg-gray-200 rounded text-sm">-1</button>
            <button onClick={() => setBpm(b => Math.min(250, b + 1))} className="flex-1 py-1 bg-gray-200 rounded text-sm">+1</button>
          </div>
        )}
      </div>
    </div>
  )
}
