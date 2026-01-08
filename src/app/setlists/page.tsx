'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, Setlist } from '@/lib/supabase'

export default function SetlistsPage() {
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSetlists()
  }, [])

  async function loadSetlists() {
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .order('date', { ascending: false })
    
    if (!error && data) {
      setSetlists(data)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-10">Cargando setlists...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Listas de Servicio</h1>
        <Link
          href="/setlists/nuevo"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          + Nuevo Setlist
        </Link>
      </div>

      {setlists.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No hay setlists aún. ¡Crea el primero!
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
          {setlists.map(setlist => (
            <li key={setlist.id}>
              <Link
                href={`/setlists/${setlist.id}`}
                className="block px-4 py-3 hover:bg-gray-50 transition"
              >
                <div className="font-medium text-gray-800">{setlist.name}</div>
                <div className="text-sm text-gray-500">
                  {new Date(setlist.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
