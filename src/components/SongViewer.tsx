'use client'

import { useMemo } from 'react'
import { transposeContent, getKeyFromSemitones } from '@/lib/chordUtils'

type Props = {
  content: string
  originalKey: string
  transposeSemitones: number
}

// Renderiza acordes encima de las letras sin depender de ChordSheetJS
function renderChordPro(content: string): string {
  const lines = content.split('\n')
  let html = '<div class="song-content">'
  
  for (const line of lines) {
    if (line.trim() === '') {
      html += '<div class="h-4"></div>'
      continue
    }
    
    // Extraer acordes y texto
    const parts: { chord: string; text: string }[] = []
    let remaining = line
    let lastIndex = 0
    const regex = /\[([^\]]+)\]/g
    let match
    
    while ((match = regex.exec(line)) !== null) {
      // Texto antes del acorde
      if (match.index > lastIndex) {
        if (parts.length > 0) {
          parts[parts.length - 1].text += line.substring(lastIndex, match.index)
        } else {
          parts.push({ chord: '', text: line.substring(lastIndex, match.index) })
        }
      }
      parts.push({ chord: match[1], text: '' })
      lastIndex = match.index + match[0].length
    }
    
    // Texto restante
    if (lastIndex < line.length) {
      if (parts.length > 0) {
        parts[parts.length - 1].text += line.substring(lastIndex)
      } else {
        parts.push({ chord: '', text: line.substring(lastIndex) })
      }
    }
    
    // Si no hay acordes, mostrar como texto simple
    if (parts.length === 0 || (parts.length === 1 && !parts[0].chord)) {
      html += `<div class="lyrics-line">${line}</div>`
      continue
    }
    
    // Construir línea con acordes arriba
    let chordLine = '<div class="chord-line">'
    let textLine = '<div class="text-line">'
    
    for (const part of parts) {
      const textLen = Math.max(part.text.length, part.chord.length + 1)
      const paddedChord = part.chord.padEnd(textLen, ' ')
      const paddedText = part.text.padEnd(textLen, ' ')
      
      chordLine += `<span class="chord">${paddedChord}</span>`
      textLine += `<span class="lyric">${paddedText}</span>`
    }
    
    chordLine += '</div>'
    textLine += '</div>'
    
    html += `<div class="line-group">${chordLine}${textLine}</div>`
  }
  
  html += '</div>'
  return html
}

export default function SongViewer({ content, originalKey, transposeSemitones }: Props) {
  const renderedContent = useMemo(() => {
    const transposedContent = transposeContent(content, transposeSemitones)
    return renderChordPro(transposedContent)
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
      <div 
        className="chord-sheet font-mono text-lg leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
      <style jsx global>{`
        .song-content { white-space: pre-wrap; }
        .line-group { margin-bottom: 0.25rem; }
        .chord-line { color: #4338ca; font-weight: bold; font-size: 0.95em; height: 1.4em; }
        .text-line { color: #000000; font-size: 1.1em; }
        .lyrics-line { color: #000000; font-size: 1.1em; margin-bottom: 0.25rem; }
        .chord, .lyric { white-space: pre; }
      `}</style>
    </div>
  )
}
