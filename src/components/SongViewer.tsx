'use client'

import { useMemo } from 'react'
import { transposeContent, getKeyFromSemitones } from '@/lib/chordUtils'

type Props = {
  content: string
  originalKey: string
  transposeSemitones: number
}

// Escapa HTML para evitar inyección
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/ /g, '&nbsp;')
}

// Renderiza acordes encima de las letras
function renderChordPro(content: string): string {
  const lines = content.split('\n')
  let html = '<div class="song-content">'
  let consecutiveEmpty = 0
  
  for (const line of lines) {
    // Líneas vacías = separación de párrafos
    if (line.trim() === '') {
      consecutiveEmpty++
      if (consecutiveEmpty <= 2) {
        html += '<div class="empty-line"></div>'
      }
      continue
    }
    consecutiveEmpty = 0
    
    // Detectar si es línea de sección [Coro], [Verso], etc.
    const sectionMatch = line.match(/^\{([^}]+)\}$/)
    if (sectionMatch) {
      html += `<div class="section-label">${escapeHtml(sectionMatch[1])}</div>`
      continue
    }
    
    // Extraer acordes y texto
    const parts: { chord: string; text: string }[] = []
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
    if (parts.length === 0) {
      html += `<div class="lyrics-line">${escapeHtml(line)}</div>`
      continue
    }
    
    const hasChords = parts.some(p => p.chord)
    if (!hasChords) {
      html += `<div class="lyrics-line">${escapeHtml(line)}</div>`
      continue
    }
    
    // Construir línea con acordes arriba
    let chordLine = '<div class="chord-line">'
    let textLine = '<div class="text-line">'
    
    for (const part of parts) {
      const chordLen = part.chord.length
      const textLen = part.text.length
      const minWidth = Math.max(chordLen + 1, textLen)
      
      const displayChord = escapeHtml(part.chord.padEnd(minWidth, ' '))
      const displayText = escapeHtml(part.text.padEnd(minWidth, ' '))
      
      chordLine += `<span class="chord-span">${displayChord}</span>`
      textLine += `<span class="text-span">${displayText}</span>`
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
        className="chord-sheet font-mono"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
      <style jsx global>{`
        .song-content { }
        .empty-line { height: 1.5rem; display: block; }
        .section-label { 
          font-weight: bold; 
          color: #6366f1; 
          font-size: 0.95em; 
          margin: 1.5rem 0 0.75rem 0;
          text-transform: uppercase;
          display: block;
        }
        .line-group { 
          margin-bottom: 0.75rem; 
          display: block;
        }
        .chord-line { 
          color: #4338ca; 
          font-weight: bold; 
          font-size: 1.05rem; 
          line-height: 1.4;
          display: block;
          min-height: 1.5rem;
        }
        .text-line { 
          color: #000000; 
          font-size: 1.2rem; 
          line-height: 1.5;
          display: block;
        }
        .lyrics-line { 
          color: #000000; 
          font-size: 1.2rem; 
          line-height: 1.5;
          margin-bottom: 0.5rem;
          display: block;
        }
        .chord-span, .text-span { 
          display: inline;
          white-space: pre;
          font-family: 'Courier New', Courier, monospace;
        }
      `}</style>
    </div>
  )
}
