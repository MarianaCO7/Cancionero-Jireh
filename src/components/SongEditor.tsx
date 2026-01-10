'use client'

import { useState } from 'react'
import { Song, TEMPOS, DEFAULT_CATEGORIES } from '@/lib/supabase'

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

type Props = {
  song: Song
  onSave: (updates: Partial<Song>) => void
  onCancel: () => void
}

export default function SongEditor({ song, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    title: song.title,
    author: song.author || '',
    content: song.content,
    original_key: song.original_key,
    key_male: song.key_male,
    key_female: song.key_female,
    tempo: song.tempo || 'media',
    category: song.category || '',
  })
  const [customCategory, setCustomCategory] = useState('')

  return (
    <div className="space-y-4">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
        />
      </div>

      {/* Autor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Autor / Artista</label>
        <input
          type="text"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
        />
      </div>

      {/* Tempo y Categoría */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tempo</label>
          <select
            value={form.tempo}
            onChange={(e) => setForm({ ...form, tempo: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black bg-white"
          >
            {TEMPOS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            value={form.category}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setCustomCategory('')
                setForm({ ...form, category: '' })
              } else {
                setForm({ ...form, category: e.target.value })
                setCustomCategory('')
              }
            }}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black bg-white"
          >
            <option value="">Sin categoría</option>
            {DEFAULT_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="__custom__">+ Otra...</option>
          </select>
          {(form.category === '__custom__' || customCategory) && (
            <input
              type="text"
              value={customCategory}
              onChange={(e) => {
                setCustomCategory(e.target.value)
                setForm({ ...form, category: e.target.value })
              }}
              className="w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="Escribe la categoría..."
            />
          )}
        </div>
      </div>

      {/* Tonalidades */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tonalidad Original</label>
          <select
            value={form.original_key}
            onChange={(e) => setForm({ ...form, original_key: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black bg-white"
          >
            {KEYS.map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">♂ Hombre</label>
          <select
            value={form.key_male}
            onChange={(e) => setForm({ ...form, key_male: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black bg-white"
          >
            {KEYS.map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">♀ Mujer</label>
          <select
            value={form.key_female}
            onChange={(e) => setForm({ ...form, key_female: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black bg-white"
          >
            {KEYS.map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
        <p className="font-semibold text-yellow-800 mb-1">Formato ChordPro:</p>
        <p className="text-yellow-700">
          Escribe los acordes entre corchetes. Ejemplo:<br/>
          <code className="bg-yellow-100 px-1">[G]Grande es tu [C]fidelidad</code>
        </p>
      </div>
      
      {/* Contenido */}
      <textarea
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        className="w-full h-80 p-4 font-mono text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
        placeholder="[G]Escribe aquí la letra con [Am]acordes..."
      />
      
      {/* Botones */}
      <div className="flex gap-2">
        <button
          onClick={() => onSave(form)}
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
