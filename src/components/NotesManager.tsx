'use client'

import { useState } from 'react'
import { Note } from '@/lib/supabase'

interface NotesManagerProps {
  notes: Note[]
  onUpdate: (notes: Note[]) => void
  compact?: boolean
  readOnly?: boolean
}

export default function NotesManager({ notes, onUpdate, compact = false, readOnly = false }: NotesManagerProps) {
  const [newNote, setNewNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  function addNote() {
    if (!newNote.trim()) return
    const note: Note = {
      id: Date.now().toString(),
      text: newNote.trim()
    }
    onUpdate([...notes, note])
    setNewNote('')
  }

  function deleteNote(id: string) {
    onUpdate(notes.filter(n => n.id !== id))
  }

  function startEdit(note: Note) {
    setEditingId(note.id)
    setEditText(note.text)
  }

  function saveEdit() {
    if (!editText.trim() || !editingId) return
    onUpdate(notes.map(n => n.id === editingId ? { ...n, text: editText.trim() } : n))
    setEditingId(null)
    setEditText('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Lista compacta de notas existentes */}
        {notes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {notes.map((note) => (
              <span 
                key={note.id} 
                className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full"
                title={note.text}
              >
                📝 {note.text.length > 20 ? note.text.slice(0, 20) + '...' : note.text}
              </span>
            ))}
          </div>
        )}
        
        {/* Input para agregar nota */}
        {!readOnly && (
          <div className="flex gap-1">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
              placeholder="Agregar nota..."
              className="flex-1 text-sm px-2 py-1 bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-yellow-400"
            />
            <button
              onClick={addNote}
              disabled={!newNote.trim()}
              className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✓
            </button>
          </div>
        )}
      </div>
    )
  }

  // Vista completa (para dentro de la canción)
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
        📝 Notas para esta canción
        {notes.length > 0 && (
          <span className="text-xs bg-yellow-200 px-2 py-0.5 rounded-full">
            {notes.length}
          </span>
        )}
      </h3>
      
      {/* Lista de notas */}
      {notes.length === 0 ? (
        <p className="text-sm text-yellow-600 italic">No hay notas agregadas</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li 
              key={note.id} 
              className="flex items-start gap-2 bg-white rounded-lg p-2 border border-yellow-100"
            >
              {editingId === note.id ? (
                // Modo edición
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    autoFocus
                  />
                  <button
                    onClick={saveEdit}
                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    ✓
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                // Modo visualización
                <>
                  <span className="flex-1 text-gray-800">{note.text}</span>
                  {!readOnly && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(note)}
                        className="p-1 text-xs text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 rounded"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-100 rounded"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      
      {/* Agregar nueva nota */}
      {!readOnly && (
        <div className="flex gap-2 pt-2 border-t border-yellow-200">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNote()}
            placeholder="Escribe una nueva nota..."
            className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={addNote}
            disabled={!newNote.trim()}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            + Agregar
          </button>
        </div>
      )}
    </div>
  )
}

// Función helper para parsear notas desde string JSON
export function parseNotes(notesString: string): Note[] {
  if (!notesString) return []
  try {
    const parsed = JSON.parse(notesString)
    if (Array.isArray(parsed)) return parsed
    // Si es el formato viejo (string simple), convertir
    if (typeof notesString === 'string' && notesString.trim()) {
      return [{ id: '1', text: notesString }]
    }
    return []
  } catch {
    // Si no es JSON válido, es el formato viejo (string simple)
    if (notesString.trim()) {
      return [{ id: '1', text: notesString }]
    }
    return []
  }
}

// Función helper para convertir notas a string JSON
export function stringifyNotes(notes: Note[]): string {
  return JSON.stringify(notes)
}
