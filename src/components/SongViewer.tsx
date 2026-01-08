'use client'

import { useMemo } from 'react'
import ChordSheetJS from 'chordsheetjs'
import { transposeContent, getKeyFromSemitones } from '@/lib/chordUtils'

type Props = {
  content: string
  originalKey: string
  transposeSemitones: number
}

export default function SongViewer({ content, originalKey, transposeSemitones }: Props) {
  const renderedContent = useMemo(() => {
    try {
      const transposedContent = transposeContent(content, transposeSemitones)
      const parser = new ChordSheetJS.ChordProParser()
      const song = parser.parse(transposedContent)
      const formatter = new ChordSheetJS.HtmlTableFormatter()
      return formatter.format(song)
    } catch {
      return '<p class="text-red-500">Error al procesar la canción</p>'
    }
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
        .chord-sheet table { border-collapse: collapse; }
        .chord-sheet td { padding: 0 2px; vertical-align: bottom; }
        .chord-sheet .chord { color: #4338ca; font-weight: bold; font-size: 1em; }
        .chord-sheet .lyrics { color: #111827; font-size: 1.1em; }
        .chord-sheet tr:first-child td { padding-bottom: 0; }
        .chord-sheet tr:last-child td { padding-top: 0; }
      `}</style>
    </div>
  )
}
