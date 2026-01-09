'use client'

import { useMemo } from 'react'
import { transposeContent, getKeyFromSemitones } from '@/lib/chordUtils'

type Props = {
  content: string
  originalKey: string
  transposeSemitones: number
}

// Detectar si una línea es solo acordes
function isChordLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  const words = trimmed.split(/\s+/)
  const chordPattern = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13|6|5|2|4)?(\/[A-G][#b]?)?$/i
  const chordWords = words.filter(w => chordPattern.test(w) || /^\[.*\]$/.test(w))
  return chordWords.length > 0 && chordWords.length >= words.length * 0.5
}

// Transponer acordes en texto plano (sin corchetes)
function transposePlainChords(line: string, semitones: number): string {
  if (semitones === 0) return line
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  
  return line.replace(/\b([A-G][#b]?)(m|maj|min|dim|aug|sus|add|7|9|11|13|6|5|2|4)?(\/[A-G][#b]?)?\b/g, (match, root, suffix, bass) => {
    let noteIndex = NOTES.indexOf(root)
    if (noteIndex === -1) noteIndex = NOTES_FLAT.indexOf(root)
    if (noteIndex === -1) return match
    
    const newIndex = (noteIndex + semitones + 12) % 12
    const useFlats = root.includes('b')
    const newRoot = useFlats ? NOTES_FLAT[newIndex] : NOTES[newIndex]
    
    let result = newRoot + (suffix || '')
    
    if (bass) {
      const bassNote = bass.substring(1)
      let bassIndex = NOTES.indexOf(bassNote)
      if (bassIndex === -1) bassIndex = NOTES_FLAT.indexOf(bassNote)
      if (bassIndex !== -1) {
        const newBassIndex = (bassIndex + semitones + 12) % 12
        const newBass = useFlats ? NOTES_FLAT[newBassIndex] : NOTES[newBassIndex]
        result += '/' + newBass
      }
    }
    
    return result
  })
}

export default function SongViewer({ content, originalKey, transposeSemitones }: Props) {
  const renderedContent = useMemo(() => {
    // Primero transponer formato [G]texto
    const processed = transposeContent(content, transposeSemitones)
    
    const lines = processed.split('\n')
    const elements: JSX.Element[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]
      
      // Línea vacía = espacio entre párrafos
      if (line.trim() === '') {
        elements.push(<div key={`empty-${i}`} className="h-5" />)
        i++
        continue
      }
      
      // Línea con solo guiones o puntos = ignorar
      if (/^[\s\-_\.]+$/.test(line.trim())) {
        elements.push(<div key={`space-${i}`} className="h-3" />)
        i++
        continue
      }

      // Si tiene formato [G]texto, procesar ese formato
      if (line.includes('[') && line.includes(']')) {
        const chords: { chord: string; position: number }[] = []
        let cleanLine = ''
        const regex = /\[([^\]]+)\]/g
        let lastIndex = 0
        let match

        while ((match = regex.exec(line)) !== null) {
          cleanLine += line.substring(lastIndex, match.index)
          chords.push({ chord: match[1], position: cleanLine.length })
          lastIndex = match.index + match[0].length
        }
        cleanLine += line.substring(lastIndex)

        if (chords.length > 0) {
          let chordLine = ''
          chords.forEach(({ chord, position }) => {
            while (chordLine.length < position) chordLine += ' '
            chordLine += chord + ' '
          })

          elements.push(
            <div key={`inline-${i}`} className="mb-4">
              <div className="text-indigo-600 font-bold font-mono whitespace-pre text-base">{chordLine}</div>
              <div className="text-gray-900 font-mono whitespace-pre text-lg">{cleanLine}</div>
            </div>
          )
        } else {
          elements.push(<div key={`text-${i}`} className="text-gray-900 text-lg mb-1 whitespace-pre">{line}</div>)
        }
        i++
        continue
      }

      // Línea de acordes (formato tradicional arriba)
      if (isChordLine(line)) {
        const chordLine = transposePlainChords(line, transposeSemitones)
        const nextLine = lines[i + 1] || ''
        
        if (nextLine && !isChordLine(nextLine) && nextLine.trim() !== '') {
          elements.push(
            <div key={`pair-${i}`} className="mb-4">
              <div className="text-indigo-600 font-bold font-mono whitespace-pre text-base">{chordLine}</div>
              <div className="text-gray-900 font-mono whitespace-pre text-lg">{nextLine}</div>
            </div>
          )
          i += 2
        } else {
          elements.push(
            <div key={`chords-${i}`} className="text-indigo-600 font-bold font-mono whitespace-pre text-base mb-2">{chordLine}</div>
          )
          i++
        }
        continue
      }

      // Línea normal de texto
      elements.push(
        <div key={`line-${i}`} className="text-gray-900 text-lg mb-1 whitespace-pre font-mono">{line}</div>
      )
      i++
    }

    return elements
  }, [content, transposeSemitones])

  const currentKey = getKeyFromSemitones(originalKey, transposeSemitones)

  return (
    <div className="song-viewer">
      <div className="mb-4 text-sm text-gray-700">
        Tonalidad actual: <span className="font-bold text-indigo-700">{currentKey}</span>
        {transposeSemitones !== 0 && (
          <span className="ml-2 text-gray-500">(Original: {originalKey})</span>
        )}
      </div>
      <div className="leading-relaxed">
        {renderedContent}
      </div>
    </div>
  )
}
