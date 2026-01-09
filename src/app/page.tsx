'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, Song, TEMPOS } from '@/lib/supabase'
import SearchBar from '@/components/SearchBar'

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([])
  const [search, setSearch] = useState('')
  const [filterTempo, setFilterTempo] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSongs()
  }, [])

  async function loadSongs() {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('title')
    
    if (!error && data) {
      setSongs(data)
      // Extraer categorías únicas
      const cats = data.map(s => s.category).filter(Boolean)
      const uniqueCategories = Array.from(new Set(cats)) as string[]
      setCategories(uniqueCategories)
    }
    setLoading(false)
  }

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(search.toLowerCase()) ||
      (song.author && song.author.toLowerCase().includes(search.toLowerCase()))
    const matchesTempo = !filterTempo || song.tempo === filterTempo
    const matchesCategory = !filterCategory || song.category === filterCategory
    return matchesSearch && matchesTempo && matchesCategory
  })

  if (loading) {
    return <div className="text-center py-10">Cargando canciones...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Canciones</h1>
        <Link
          href="/canciones/nueva"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          + Nueva Canción
        </Link>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterTempo}
          onChange={(e) => setFilterTempo(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-white text-black"
        >
          <option value="">Todos los tempos</option>
          {TEMPOS.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-white text-black"
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(filterTempo || filterCategory) && (
          <button
            onClick={() => { setFilterTempo(''); setFilterCategory(''); }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {filteredSongs.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {songs.length === 0 
            ? 'No hay canciones aún. ¡Agrega la primera!'
            : 'No se encontraron canciones'}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
          {filteredSongs.map(song => (
            <li key={song.id}>
              <Link
                href={`/canciones/${song.id}`}
                className="block px-4 py-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{song.title}</span>
                  {song.tempo && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      song.tempo === 'rapida' ? 'bg-orange-100 text-orange-700' :
                      song.tempo === 'lenta' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {song.tempo === 'rapida' ? '🏃' : song.tempo === 'lenta' ? '🧘' : '🚶'}
                    </span>
                  )}
                  {song.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      {song.category}
                    </span>
                  )}
                </div>
                {song.author && <div className="text-sm text-indigo-600">{song.author}</div>}
                <div className="text-sm text-gray-600">
                  Tonalidad: {song.original_key} | ♂{song.key_male} ♀{song.key_female}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
