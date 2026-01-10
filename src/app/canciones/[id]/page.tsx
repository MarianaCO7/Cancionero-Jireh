'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase, Song, SetlistSong } from '@/lib/supabase'
import SongViewer from '@/components/SongViewer'
import SongEditor from '@/components/SongEditor'
import Transposer from '@/components/Transposer'
import Metronome from '@/components/Metronome'
import { useReactToPrint } from 'react-to-print'

export default function SongPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromSetlist = searchParams.get('from') === 'setlist'
  const setlistId = searchParams.get('setlistId')
  
  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showMetronome, setShowMetronome] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [transposeSemitones, setTransposeSemitones] = useState(0)
  const printRef = useRef<HTMLDivElement>(null)
  
  // Estado para navegación del setlist
  const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>([])
  const [currentSetlistSong, setCurrentSetlistSong] = useState<SetlistSong | null>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: song?.title || 'Canción',
  })

  const loadSong = useCallback(async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (!error && data) {
      setSong(data)
    }
    setLoading(false)
  }, [params.id])

  const loadSetlistSongs = useCallback(async () => {
    if (!setlistId) return
    const { data } = await supabase
      .from('setlist_songs')
      .select('*, song:songs(*)')
      .eq('setlist_id', setlistId)
      .order('position')
    if (data) {
      setSetlistSongs(data)
    }
  }, [setlistId])

  useEffect(() => {
    loadSong()
    if (fromSetlist && setlistId) {
      loadSetlistSongs()
    }
  }, [loadSong, loadSetlistSongs, fromSetlist, setlistId])

  // Encontrar la canción actual en el setlist
  useEffect(() => {
    if (setlistSongs.length > 0) {
      const current = setlistSongs.find(ss => ss.song_id === params.id)
      setCurrentSetlistSong(current || null)
    }
  }, [setlistSongs, params.id])

  // Cerrar pantalla completa con Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  function handleBack() {
    if (fromSetlist && setlistId) {
      router.push(`/setlists/${setlistId}`)
    } else {
      router.push('/')
    }
  }

  function navigateTo(direction: 'prev' | 'next') {
    if (!fromSetlist || !setlistId || setlistSongs.length === 0) return
    
    const currentIdx = setlistSongs.findIndex(ss => ss.song_id === params.id)
    if (currentIdx === -1) return
    
    const newIdx = direction === 'prev' ? currentIdx - 1 : currentIdx + 1
    if (newIdx < 0 || newIdx >= setlistSongs.length) return
    
    const nextSong = setlistSongs[newIdx]
    router.push(`/canciones/${nextSong.song_id}?from=setlist&setlistId=${setlistId}&position=${newIdx}`)
  }

  const canNavigatePrev = useMemo(() => fromSetlist && setlistSongs.length > 0 && 
    setlistSongs.findIndex(ss => ss.song_id === params.id) > 0, [fromSetlist, setlistSongs, params.id])

  const canNavigateNext = useMemo(() => fromSetlist && setlistSongs.length > 0 && 
    setlistSongs.findIndex(ss => ss.song_id === params.id) < setlistSongs.length - 1, [fromSetlist, setlistSongs, params.id])
  
  // Verificar si la canción anterior está enganchada con esta
  const prevSong = useMemo(() => {
    const idx = setlistSongs.findIndex(ss => ss.song_id === params.id)
    return idx > 0 ? setlistSongs[idx - 1] : null
  }, [setlistSongs, params.id])

  const isLinkedFromPrev = useMemo(() => prevSong?.linked_to_next === true, [prevSong])
  
  // Verificar si esta canción está enganchada con la siguiente
  const isLinkedToNext = useMemo(() => currentSetlistSong?.linked_to_next === true, [currentSetlistSong])

  const nextSong = useMemo(() => {
    const idx = setlistSongs.findIndex(ss => ss.song_id === params.id)
    return (idx !== -1 && idx < setlistSongs.length - 1) ? setlistSongs[idx + 1] : null
  }, [setlistSongs, params.id])

  async function handleSave(updates: Partial<Song>) {
    if (!song) return
    
    const { error } = await supabase
      .from('songs')
      .update(updates)
      .eq('id', song.id)
    
    if (!error) {
      setSong({ ...song, ...updates })
      setEditing(false)
    } else {
      alert('Error al guardar: ' + error.message)
    }
  }

  async function handleDelete() {
    if (!song || !confirm('¿Estás seguro de eliminar esta canción?')) return
    
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', song.id)
    
    if (!error) {
      router.push('/')
    }
  }

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>
  }

  if (!song) {
    return <div className="text-center py-10 text-red-500">Canción no encontrada</div>
  }

  // Modo pantalla completa
  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        {/* Barra de controles */}
        <div className="sticky top-0 bg-white border-b shadow-sm p-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFullscreen(false)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              ✕
            </button>
            {fromSetlist && canNavigatePrev && (
              <button
                onClick={() => navigateTo('prev')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                title={prevSong?.song?.title}
              >
                ◀
              </button>
            )}
            <span className="font-bold text-gray-800 truncate max-w-[150px]">{song.title}</span>
            {fromSetlist && canNavigateNext && (
              <button
                onClick={() => navigateTo('next')}
                className={`p-2 rounded-lg hover:bg-gray-200 ${
                  isLinkedToNext ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100'
                }`}
                title={isLinkedToNext ? `🔗 ${nextSong?.song?.title}` : nextSong?.song?.title}
              >
                ▶ {isLinkedToNext && '🔗'}
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-lg font-bold"
            >
              A-
            </button>
            <span className="w-10 text-center text-sm text-gray-600">{fontSize}</span>
            <button
              onClick={() => setFontSize(Math.min(32, fontSize + 2))}
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-lg font-bold"
            >
              A+
            </button>
          </div>
          
          <Transposer
            originalKey={song.original_key}
            keyMale={song.key_male}
            keyFemale={song.key_female}
            currentSemitones={transposeSemitones}
            onChange={setTransposeSemitones}
            compact
          />
        </div>
        
        {/* Indicador de enganche */}
        {isLinkedFromPrev && (
          <div className="bg-indigo-100 text-indigo-700 text-sm py-2 px-4 text-center">
            🔗 Viene enganchada de &quot;{prevSong?.song?.title}&quot;
          </div>
        )}
        {isLinkedToNext && (
          <div className="bg-indigo-100 text-indigo-700 text-sm py-2 px-4 text-center">
            🔗 Continúa con &quot;{nextSong?.song?.title}&quot; (sin parar)
          </div>
        )}
        
        {/* Notas del setlist */}
        {currentSetlistSong?.notes && (
          <div className="bg-yellow-50 text-yellow-800 text-sm py-2 px-4">
            📝 {currentSetlistSong.notes}
          </div>
        )}
        
        {/* Contenido */}
        <div className="p-4" style={{ fontSize: `${fontSize}px` }}>
          <SongViewer
            content={song.content}
            originalKey={song.original_key}
            transposeSemitones={transposeSemitones}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Barra de navegación del setlist */}
      {fromSetlist && setlistSongs.length > 0 && (
        <div className="bg-indigo-50 rounded-lg p-3 flex items-center justify-between">
          <button
            onClick={() => navigateTo('prev')}
            disabled={!canNavigatePrev}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              canNavigatePrev 
                ? 'bg-white hover:bg-indigo-100 text-indigo-600' 
                : 'opacity-30 cursor-not-allowed'
            }`}
          >
            ◀ {canNavigatePrev && <span className="text-sm truncate max-w-[100px]">{prevSong?.song?.title}</span>}
          </button>
          
          <div className="text-center">
            <span className="text-sm text-indigo-600">
              {setlistSongs.findIndex(ss => ss.song_id === params.id) + 1} / {setlistSongs.length}
            </span>
          </div>
          
          <button
            onClick={() => navigateTo('next')}
            disabled={!canNavigateNext}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              canNavigateNext 
                ? isLinkedToNext 
                  ? 'bg-indigo-200 hover:bg-indigo-300 text-indigo-700' 
                  : 'bg-white hover:bg-indigo-100 text-indigo-600'
                : 'opacity-30 cursor-not-allowed'
            }`}
          >
            {canNavigateNext && (
              <>
                {isLinkedToNext && <span className="text-lg">🔗</span>}
                <span className="text-sm truncate max-w-[100px]">{nextSong?.song?.title}</span>
              </>
            )}
            ▶
          </button>
        </div>
      )}

      {/* Indicadores de enganche */}
      {fromSetlist && isLinkedFromPrev && (
        <div className="bg-indigo-100 text-indigo-700 text-sm py-2 px-4 rounded-lg text-center">
          🔗 Viene enganchada de &quot;{prevSong?.song?.title}&quot;
        </div>
      )}
      {fromSetlist && isLinkedToNext && (
        <div className="bg-indigo-100 text-indigo-700 text-sm py-2 px-4 rounded-lg text-center">
          🔗 Continúa con &quot;{nextSong?.song?.title}&quot; sin parar
        </div>
      )}
      
      {/* Notas del setlist */}
      {fromSetlist && currentSetlistSong?.notes && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 py-3 px-4 rounded-lg">
          📝 <strong>Notas:</strong> {currentSetlistSong.notes}
        </div>
      )}

      {/* Botón volver */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition"
      >
        ← {fromSetlist ? 'Volver al Setlist' : 'Volver a Canciones'}
      </button>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{song.title}</h1>
          {song.author && <p className="text-indigo-600 font-medium">{song.author}</p>}
          <div className="flex gap-2 mt-1">
            {song.tempo && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                song.tempo === 'rapida' ? 'bg-orange-100 text-orange-700' :
                song.tempo === 'lenta' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {song.tempo === 'rapida' ? '🏃 Rápida' : song.tempo === 'lenta' ? '🧘 Lenta' : '🚶 Media'}
              </span>
            )}
            {song.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {song.category}
              </span>
            )}
            {song.bpm && (
              <button
                onClick={() => setShowMetronome(!showMetronome)}
                className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full transition-all ${
                  showMetronome 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
                title={showMetronome ? 'Detener metrónomo' : 'Iniciar metrónomo'}
              >
                🥁 {song.bpm} BPM 
                <span className="ml-1 w-4 h-4 flex items-center justify-center bg-white/20 rounded-full">
                  {showMetronome ? '✕' : '▶'}
                </span>
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!editing && (
            <>
              <button
                onClick={() => setFullscreen(true)}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                📱 Pantalla Completa
              </button>
              <button
                onClick={() => handlePrint()}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition"
              >
                🖨️ PDF
              </button>
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
              >
                ✏️ Editar
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                🗑️ Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {!editing && (
        <>
          {/* Metrónomo compacto */}
          {showMetronome && song.bpm && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <Metronome initialBpm={song.bpm} readOnly />
            </div>
          )}

          <Transposer
            originalKey={song.original_key}
            keyMale={song.key_male}
            keyFemale={song.key_female}
            currentSemitones={transposeSemitones}
            onChange={setTransposeSemitones}
          />
          
          {/* Controles de zoom */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Tamaño:</span>
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 font-bold"
            >
              -
            </button>
            <span className="w-8 text-center">{fontSize}</span>
            <button
              onClick={() => setFontSize(Math.min(32, fontSize + 2))}
              className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 font-bold"
            >
              +
            </button>
          </div>
        </>
      )}

      <div ref={printRef} className="bg-white p-6 rounded-lg shadow" style={{ fontSize: `${fontSize}px` }}>
        {editing ? (
          <SongEditor
            song={song}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <SongViewer
            content={song.content}
            originalKey={song.original_key}
            transposeSemitones={transposeSemitones}
          />
        )}
      </div>
    </div>
  )
}
