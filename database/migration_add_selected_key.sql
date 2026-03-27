-- Migración: Agregar columna selected_key a setlist_songs
-- Ejecutar en: Supabase SQL Editor
-- Fecha: 2026-03-27

-- Agregar columna si no existe
ALTER TABLE setlist_songs 
ADD COLUMN selected_key TEXT DEFAULT 'original';

-- Verificar que se agregó correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'setlist_songs'
ORDER BY ordinal_position;

-- Comentario: La columna almacena los valores:
-- 'original' (tonalidad original de la canción)
-- 'hombre' (tonalidad para hombre, si existe)
-- 'mujer' (tonalidad para mujer, si existe)
-- '+2', '-3', etc. (transposición personalizada en semitonos)
