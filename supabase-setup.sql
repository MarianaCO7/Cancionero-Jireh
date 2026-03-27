-- Ejecutar este SQL en Supabase SQL Editor
-- Ve a: supabase.com → Tu proyecto → SQL Editor → New Query

-- Tabla de canciones
CREATE TABLE songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  content TEXT NOT NULL,
  original_key TEXT NOT NULL DEFAULT 'G',
  key_male TEXT NOT NULL DEFAULT 'G',
  key_female TEXT NOT NULL DEFAULT 'B',
  tempo TEXT DEFAULT 'media',
  category TEXT DEFAULT '',
  bpm INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de setlists
CREATE TABLE setlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación setlist-canciones
CREATE TABLE setlist_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setlist_id UUID REFERENCES setlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  linked_to_next BOOLEAN DEFAULT FALSE,
  notes TEXT DEFAULT '',
  selected_key TEXT DEFAULT 'original',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (permitir lectura, controlar escritura, bloquear borrado)
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS para SONGS - Lectura abierta, escritura controlada, DELETE bloqueado
CREATE POLICY "Leer canciones (público)" ON songs FOR SELECT USING (true);
CREATE POLICY "Crear canciones (público)" ON songs FOR INSERT WITH CHECK (true);
CREATE POLICY "Editar canciones (público)" ON songs FOR UPDATE WITH CHECK (true);
-- Comentado: No se puede borrar canciones (protección contra eliminación accidental)
-- CREATE POLICY "Borrar canciones" ON songs FOR DELETE USING (false);

-- POLÍTICAS para SETLISTS - Lectura abierta, escritura controlada, DELETE bloqueado
CREATE POLICY "Leer setlists (público)" ON setlists FOR SELECT USING (true);
CREATE POLICY "Crear setlists (público)" ON setlists FOR INSERT WITH CHECK (true);
CREATE POLICY "Editar setlists (público)" ON setlists FOR UPDATE WITH CHECK (true);
-- Comentado: No se puede borrar setlists (protección contra eliminación accidental)
-- CREATE POLICY "Borrar setlists" ON setlists FOR DELETE USING (false);

-- POLÍTICAS para SETLIST_SONGS - Lectura abierta, escritura controlada, DELETE bloqueado
CREATE POLICY "Leer setlist_songs (público)" ON setlist_songs FOR SELECT USING (true);
CREATE POLICY "Crear setlist_songs (público)" ON setlist_songs FOR INSERT WITH CHECK (true);
CREATE POLICY "Editar setlist_songs (público)" ON setlist_songs FOR UPDATE WITH CHECK (true);
-- Comentado: No se puede borrar relaciones (protección contra eliminación accidental)
-- CREATE POLICY "Borrar setlist_songs" ON setlist_songs FOR DELETE USING (false);

-- Canción de ejemplo
INSERT INTO songs (title, content, original_key, key_male, key_female) VALUES (
  'Grande es tu fidelidad',
  '[G]Grande es tu fidelidad, [C]oh Dios mi [G]Padre
[D]No hay sombra de [G]variación en [D]Ti
[G]Tú no cambias, tu com[C]pasión no [G]falla
[Am]Grande, [D]grande es tu fideli[G]dad

[C]Grande es tu [G]fidelidad
[C]Grande es tu [G]fidelidad
[Em]Cada ma[Am]ñana [D]veo
[G]Nuevas las [C]misericor[G]dias son
[Am]Grande, [D]grande es tu fideli[G]dad',
  'G',
  'G',
  'B'
);
