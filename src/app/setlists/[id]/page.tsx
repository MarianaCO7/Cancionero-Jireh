'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Setlist, SetlistSong, Song, Note } from '@/lib/supabase'
import { useReactToPrint } from 'react-to-print'
import NotesManager, { parseNotes, stringifyNotes } from '@/components/NotesManager'

export default function SetlistPage() {
  const params = useParams()
  const router = useRouter()
  const [setlist, setSetlist] = useState<Setlist | null>(null)
  const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>([])
  const [allSongs, setAllSongs] = useState<Song[]>([])
  const [showAddSong, setShowAddSong] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: setlist?.name || 'Setlist',
  })

  const loadData = useCallback(async () => {
    const [setlistRes, songsRes, allSongsRes] = await Promise.all([
      supabase.from('setlists').select('*').eq('id', params.id).single(),
      supabase.from('setlist_songs').select('*, song:songs(*)').eq('setlist_id', params.id).order('position'),
      supabase.from('songs').select('*').order('title')
    ])

    if (setlistRes.data) setSetlist(setlistRes.data)
    if (songsRes.data) setSetlistSongs(songsRes.data)
    if (allSongsRes.data) setAllSongs(allSongsRes.data)
    setLoading(false)
  }, [params.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function addSongToSetlist(songId: string) {
    const position = setlistSongs.length + 1
    const { error } = await supabase
      .from('setlist_songs')
      .insert([{ setlist_id: params.id, song_id: songId, position, linked_to_next: false, notes: '' }])

    if (!error) {
      loadData()
      setShowAddSong(false)
    }
  }

  async function removeSongFromSetlist(id: string) {
    const { error } = await supabase.from('setlist_songs').delete().eq('id', id)
    if (!error) loadData()
  }

  // Toggle enganche
  async function toggleLink(id: string, currentValue: boolean) {
    const { error } = await supabase
      .from('setlist_songs')
      .update({ linked_to_next: !currentValue })
      .eq('id', id)
    if (!error) {
      setSetlistSongs(prev => prev.map(ss => 
        ss.id === id ? { ...ss, linked_to_next: !currentValue } : ss
      ))
    }
  }

  // Actualizar notas (ahora recibe array de Notes)
  async function updateNotes(id: string, notes: Note[]) {
    const notesJson = stringifyNotes(notes)
    await supabase
      .from('setlist_songs')
      .update({ notes: notesJson })
      .eq('id', id)
    setSetlistSongs(prev => prev.map(ss => 
      ss.id === id ? { ...ss, notes: notesJson } : ss
    ))
  }

  // Drag and drop handlers
  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    // Reordenar visualmente mientras se arrastra
    const newSongs = [...setlistSongs]
    const draggedItem = newSongs[draggedIndex]
    newSongs.splice(draggedIndex, 1)
    newSongs.splice(index, 0, draggedItem)
    setSetlistSongs(newSongs)
    setDraggedIndex(index)
  }

  async function handleDragEnd() {
    if (draggedIndex === null) return
    setDraggedIndex(null)
    
    // Guardar nuevo orden en la base de datos
    const updates = setlistSongs.map((ss, index) => ({
      id: ss.id,
      position: index + 1
    }))
    
    for (const update of updates) {
      await supabase
        .from('setlist_songs')
        .update({ position: update.position })
        .eq('id', update.id)
    }
  }

  // Mover con botones (alternativa a drag)
  async function moveUp(index: number) {
    if (index === 0) return
    const newSongs = [...setlistSongs]
    const temp = newSongs[index]
    newSongs[index] = newSongs[index - 1]
    newSongs[index - 1] = temp
    setSetlistSongs(newSongs)
    
    // Guardar en DB
    await Promise.all([
      supabase.from('setlist_songs').update({ position: index }).eq('id', newSongs[index].id),
      supabase.from('setlist_songs').update({ position: index + 1 }).eq('id', newSongs[index - 1].id)
    ])
  }

  async function moveDown(index: number) {
    if (index === setlistSongs.length - 1) return
    const newSongs = [...setlistSongs]
    const temp = newSongs[index]
    newSongs[index] = newSongs[index + 1]
    newSongs[index + 1] = temp
    setSetlistSongs(newSongs)
    
    // Guardar en DB
    await Promise.all([
      supabase.from('setlist_songs').update({ position: index + 2 }).eq('id', newSongs[index + 1].id),
      supabase.from('setlist_songs').update({ position: index + 1 }).eq('id', newSongs[index].id)
    ])
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este setlist?')) return
    await supabase.from('setlist_songs').delete().eq('setlist_id', params.id)
    await supabase.from('setlists').delete().eq('id', params.id)
    router.push('/setlists')
  }

  const songsNotInSetlist = allSongs.filter(
    song => !setlistSongs.some(ss => ss.song_id === song.id)
  )

  if (loading) return <div className="text-center py-10">Cargando...</div>
  if (!setlist) return <div className="text-center py-10 text-red-500">Setlist no encontrado</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{setlist.name}</h1>
          <p className="text-gray-500">
            {new Date(setlist.date).toLocaleDateString('es-ES', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handlePrint()} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">
            🖨️ PDF
          </button>
          <button onClick={handleDelete} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">
            🗑️ Eliminar
          </button>
        </div>
      </div>

      <div ref={printRef} className="bg-white p-6 rounded-lg shadow">
        <h2 className="font-semibold text-lg mb-4">Canciones ({setlistSongs.length})</h2>
        
        {setlistSongs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay canciones en este setlist</p>
        ) : (
          <ol className="space-y-1">
            {setlistSongs.map((ss, index) => (
              <div key={ss.id}>
                <li 
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 bg-gray-50 rounded-lg cursor-move ${
                    draggedIndex === index ? 'opacity-50 border-2 border-indigo-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Botones de orden */}
                      <div className="flex flex-col gap-0.5 print:hidden">
                        <button
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="w-5 h-5 text-xs bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveDown(index)}
                          disabled={index === setlistSongs.length - 1}
                          className="w-5 h-5 text-xs bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <a 
                        href={`/canciones/${ss.song_id}?from=setlist&setlistId=${params.id}&position=${index}`}
                        className="font-medium hover:text-indigo-600"
                      >
                        {ss.song?.title}
                      </a>
                      <span className="text-sm text-gray-400">{ss.song?.original_key}</span>
                      {ss.song?.bpm && (
                        <span className="text-xs text-gray-400">🥁 {ss.song.bpm}</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeSongFromSetlist(ss.id)}
                      className="text-red-500 hover:text-red-700 print:hidden"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Campo de notas - ahora con NotesManager compacto */}
                  <div className="mt-2 ml-14 print:hidden">
                    <NotesManager
                      notes={parseNotes(ss.notes || '')}
                      onUpdate={(notes) => updateNotes(ss.id, notes)}
                      compact
                    />
                  </div>
                  {/* Mostrar notas en print si hay */}
                  {parseNotes(ss.notes || '').length > 0 && (
                    <div className="hidden print:block mt-1 ml-14 text-sm text-gray-600 italic">
                      {parseNotes(ss.notes || '').map((note, i) => (
                        <p key={i}>📝 {note.text}</p>
                      ))}
                    </div>
                  )}
                </li>
                
                {/* Botón de enganche - solo si no es la última canción */}
                {index < setlistSongs.length - 1 && (
                  <div className="flex justify-center py-1 print:hidden">
                    <button
                      onClick={() => toggleLink(ss.id, ss.linked_to_next || false)}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        ss.linked_to_next 
                          ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={ss.linked_to_next ? 'Canciones enganchadas' : 'Enganchar con la siguiente'}
                    >
                      🔗 {ss.linked_to_next ? 'Enganchada' : 'Enganchar'}
                    </button>
                  </div>
                )}
                {/* Mostrar visual de enganche en print */}
                {ss.linked_to_next && index < setlistSongs.length - 1 && (
                  <div className="hidden print:flex justify-center py-1">
                    <span className="text-indigo-600 text-sm">🔗 Enganche</span>
                  </div>
                )}
              </div>
            ))}
          </ol>
        )}
      </div>

      <div className="print:hidden">
        {showAddSong ? (
          <div className="bg-white p-4 rounded-lg shadow space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Agregar canción</h3>
              <button 
                onClick={() => { setShowAddSong(false); setSearchQuery(''); }} 
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Buscador */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Buscar canción..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              autoFocus
            />
            
            {songsNotInSetlist.length === 0 ? (
              <p className="text-gray-500">Todas las canciones ya están en el setlist</p>
            ) : (
              <>
                {/* Lista filtrada */}
                {(() => {
                  const filtered = songsNotInSetlist.filter(song => 
                    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (song.author && song.author.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  
                  if (filtered.length === 0) {
                    return <p className="text-gray-500 text-center py-2">No se encontraron canciones</p>
                  }
                  
                  return (
                    <ul className="max-h-60 overflow-y-auto divide-y border rounded-lg">
                      {filtered.map(song => (
                        <li key={song.id}>
                          <button
                            onClick={() => {
                              addSongToSetlist(song.id)
                              setSearchQuery('')
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex justify-between items-center"
                          >
                            <div>
                              <span className="font-medium">{song.title}</span>
                              {song.author && <span className="text-sm text-gray-500 ml-2">- {song.author}</span>}
                            </div>
                            <span className="text-sm text-gray-400">{song.original_key}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )
                })()}
                <p className="text-xs text-gray-400 text-center">
                  {songsNotInSetlist.length} canciones disponibles
                </p>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowAddSong(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition"
          >
            + Agregar canción
          </button>
        )}
      </div>
    </div>
  )
}
