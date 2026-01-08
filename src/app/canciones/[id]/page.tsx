'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Song } from '@/lib/supabase'
import SongViewer from '@/components/SongViewer'
import SongEditor from '@/components/SongEditor'
import Transposer from '@/components/Transposer'
import { useReactToPrint } from 'react-to-print'

export default function SongPage() {
  const params = useParams()
  const router = useRouter()
  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [transposeSemitones, setTransposeSemitones] = useState(0)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: song?.title || 'Canción',
  })

  useEffect(() => {
    loadSong()
  }, [params.id])

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

  async function handleSave(content: string) {
    if (!song) return
    
    const { error } = await supabase
      .from('songs')
      .update({ content })
      .eq('id', song.id)
    
    if (!error) {
      setSong({ ...song, content })
      setEditing(false)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{song.title}</h1>
          {song.author && <p className="text-indigo-600 font-medium">{song.author}</p>}
        </div>
        <div className="flex gap-2">
          {!editing && (
            <>
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
        <Transposer
          originalKey={song.original_key}
          keyMale={song.key_male}
          keyFemale={song.key_female}
          currentSemitones={transposeSemitones}
          onChange={setTransposeSemitones}
        />
      )}

      <div ref={printRef} className="bg-white p-6 rounded-lg shadow">
        {editing ? (
          <SongEditor
            initialContent={song.content}
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
