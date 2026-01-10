'use client'

import { getSemitonesDifference } from '@/lib/chordUtils'

type Props = {
  originalKey: string
  keyMale: string
  keyFemale: string
  currentSemitones: number
  onChange: (semitones: number) => void
  compact?: boolean
}

export default function Transposer({ originalKey, keyMale, keyFemale, currentSemitones, onChange, compact }: Props) {
  const handleMaleKey = () => {
    const semitones = getSemitonesDifference(originalKey, keyMale)
    onChange(semitones)
  }

  const handleFemaleKey = () => {
    const semitones = getSemitonesDifference(originalKey, keyFemale)
    onChange(semitones)
  }

  // Modo compacto para pantalla completa
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(currentSemitones - 1)}
          className="w-8 h-8 bg-gray-100 rounded hover:bg-gray-200 font-bold"
        >
          −
        </button>
        <button
          onClick={() => onChange(currentSemitones + 1)}
          className="w-8 h-8 bg-gray-100 rounded hover:bg-gray-200 font-bold"
        >
          +
        </button>
        {currentSemitones !== 0 && (
          <button
            onClick={() => onChange(0)}
            className="px-2 py-1 text-xs bg-gray-200 rounded"
          >
            Reset
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-100 rounded-lg">
      <span className="text-sm text-gray-600 mr-2">Tonalidad:</span>
      
      <button
        onClick={handleMaleKey}
        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        ♂ Hombre ({keyMale})
      </button>
      
      <button
        onClick={handleFemaleKey}
        className="px-3 py-1 text-sm bg-pink-500 text-white rounded hover:bg-pink-600 transition"
      >
        ♀ Mujer ({keyFemale})
      </button>
      
      <div className="flex items-center gap-1 ml-2">
        <button
          onClick={() => onChange(currentSemitones - 1)}
          className="w-8 h-8 bg-gray-300 rounded hover:bg-gray-400 transition font-bold"
        >
          −
        </button>
        <button
          onClick={() => onChange(currentSemitones + 1)}
          className="w-8 h-8 bg-gray-300 rounded hover:bg-gray-400 transition font-bold"
        >
          +
        </button>
      </div>
      
      {currentSemitones !== 0 && (
        <button
          onClick={() => onChange(0)}
          className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition ml-2"
        >
          Original
        </button>
      )}
    </div>
  )
}
