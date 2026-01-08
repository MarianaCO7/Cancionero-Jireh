'use client'

import { useState } from 'react'

type Props = {
  initialContent: string
  onSave: (content: string) => void
  onCancel: () => void
}

export default function SongEditor({ initialContent, onSave, onCancel }: Props) {
  const [content, setContent] = useState(initialContent)

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
        <p className="font-semibold text-yellow-800 mb-1">Formato ChordPro:</p>
        <p className="text-yellow-700">
          Escribe los acordes entre corchetes antes de la sílaba. Ejemplo:<br/>
          <code className="bg-yellow-100 px-1">[G]Grande es tu [C]fidelidad</code>
        </p>
      </div>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-96 p-4 font-mono text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
        placeholder="[G]Escribe aquí la letra con [Am]acordes..."
      />
      
      <div className="flex gap-2">
        <button
          onClick={() => onSave(content)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          💾 Guardar
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
        >
          ✕ Cancelar
        </button>
      </div>
    </div>
  )
}
