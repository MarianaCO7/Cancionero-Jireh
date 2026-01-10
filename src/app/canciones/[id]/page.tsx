'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase, Song } from '@/lib/supabase'
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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: song?.title || 'Canción',
  })

  useEffect(() => {
    loadSong()
  }, [params.id])

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

  async function loadSong() {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (!error && data) {
      setSong(data)
    }
    setLoading(false)
  }

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
            <span className="font-bold text-gray-800 truncate max-w-[150px]">{song.title}</span>
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
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-white">
                🥁 {song.bpm} BPM
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!editing && (
            <>
              {song.bpm && (
                <button
                  onClick={() => setShowMetronome(!showMetronome)}
                  className={`px-3 py-1 text-sm rounded transition ${
                    showMetronome 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  🥁 Metrónomo
                </button>
              )}
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
          <Transposer
            originalKey={song.original_key}
            keyMale={song.key_male}
            keyFemale={song.key_female}
            currentSemitones={transposeSemitones}
            onChange={setTransposeSemitones}
          />
          
          {/* Metrónomo */}
          {showMetronome && song.bpm && (
            <Metronome initialBpm={song.bpm} readOnly />
          )}
          
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
