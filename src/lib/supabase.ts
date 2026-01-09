import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Song = {
  id: string
  title: string
  author: string
  content: string
  original_key: string
  key_male: string
  key_female: string
  tempo: string
  category: string
  created_at: string
}

export const TEMPOS = [
  { value: 'rapida', label: '🏃 Rápida' },
  { value: 'media', label: '🚶 Media' },
  { value: 'lenta', label: '🧘 Lenta' },
]

export const DEFAULT_CATEGORIES = [
  'Alabanza',
  'Adoración', 
  'Himno',
  'Oración',
  'Especial',
]

export type Setlist = {
  id: string
  name: string
  date: string
  created_at: string
}

export type SetlistSong = {
  id: string
  setlist_id: string
  song_id: string
  position: number
  song?: Song
}
