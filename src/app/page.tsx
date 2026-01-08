'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, Song } from '@/lib/supabase'
import SearchBar from '@/components/SearchBar'

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([])
  const [search, setSearch] = useState('')
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
    }
    setLoading(false)
  }

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(search.toLowerCase()) ||
    (song.author && song.author.toLowerCase().includes(search.toLowerCase()))
  )

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
                <div className="font-medium text-gray-900">{song.title}</div>
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
