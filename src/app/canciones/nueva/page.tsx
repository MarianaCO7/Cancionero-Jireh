'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export default function NewSongPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    author: '',
    content: '',
    original_key: 'G',
    key_male: 'G',
    key_female: 'B',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      alert('Por favor completa el título y el contenido')
      return
    }

    setSaving(true)
    const { data, error } = await supabase
      .from('songs')
      .insert([form])
      .select()
      .single()

    if (error) {
      alert('Error al guardar: ' + error.message)
      setSaving(false)
      return
    }

    router.push(`/canciones/${data.id}`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Nueva Canción</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Grande es tu fidelidad"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Autor / Artista
          </label>
          <input
            type="text"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Thomas Chisholm / Marcos Witt"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tonalidad Original
            </label>
            <select
              value={form.original_key}
              onChange={(e) => setForm({ ...form, original_key: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {KEYS.map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ♂ Recomendada Hombre
            </label>
            <select
              value={form.key_male}
              onChange={(e) => setForm({ ...form, key_male: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {KEYS.map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ♀ Recomendada Mujer
            </label>
            <select
              value={form.key_female}
              onChange={(e) => setForm({ ...form, key_female: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {KEYS.map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Letra con Acordes (formato ChordPro)
          </label>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm mb-2">
            <p className="text-yellow-700">
              Escribe los acordes entre corchetes: <code className="bg-yellow-100 px-1">[G]Grande es tu [C]fidelidad</code>
            </p>
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full h-64 px-3 py-2 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="[G]Grande es tu fidelidad, [C]oh Dios mi Padre..."
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : '💾 Guardar Canción'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
