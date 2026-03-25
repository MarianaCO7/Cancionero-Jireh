#!/usr/bin/env node

/**
 * Script para importar canciones desde CSV a Supabase
 * Convierte formato de acordes tradicional a ChordPro [ACORDE]
 * 
 * Uso:
 *   node scripts/import-songs.js canciones.csv
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnohwobyxmdirnydabbs.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada');
  console.error('Configura la variable de entorno o crea un archivo .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Expresión regular para detectar acordes (A, B, C, D, E, F, G + modificadores)
const CHORD_PATTERN = /^([A-G](?:b|#)?(?:m|maj|min|dim|aug|add|sus)?(?:\d+)?(?:\/[A-G])?(?:b|#)?)\s*$/;

/**
 * Detecta si una línea es SOLO acordes
 */
function isChordLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  
  // Dividir por espacios/tabs
  const tokens = trimmed.split(/\s+/);
  
  // Si todos los tokens son acordes válidos
  return tokens.every(token => CHORD_PATTERN.test(token));
}

/**
 * Convierte formato tradicional a ChordPro
 * 
 * Input:
 *        G
 *   Grande es tu fidelidad
 *        D
 *   Oh Dios mi Padre
 * 
 * Output:
 *   [G]Grande es tu fidelidad
 *   [D]Oh Dios mi Padre
 */
function convertirAFormatoChordPro(contenido) {
  const lineas = contenido.split('\n');
  const resultado = [];
  
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    const siguiente = lineas[i + 1] || '';
    
    // Si esta línea tiene SOLO acordes Y la siguiente tiene texto
    if (isChordLine(linea) && siguiente.trim() && !isChordLine(siguiente)) {
      const acordes = linea.trim().split(/\s+/);
      const texto = siguiente;
      
      // Insertar acordes al principio de la línea de texto
      let lineaConAcordes = '[' + acordes[0] + ']' + texto;
      
      // Si hay más acordes, buscar dónde insertarlos (aproximadamente)
      for (let j = 1; j < acordes.length; j++) {
        // Calcular posición aproximada (muy simple - mejorará con entrada real)
        const posEstimada = Math.floor((j / acordes.length) * texto.length) + (j - 1) * 3;
        lineaConAcordes = lineaConAcordes.slice(0, posEstimada) + 
                         ' [' + acordes[j] + ']' + 
                         lineaConAcordes.slice(posEstimada);
      }
      
      resultado.push(lineaConAcordes);
      i++; // Saltar la siguiente linea porque ya la procesamos
    } else if (!isChordLine(linea)) {
      resultado.push(linea);
    }
  }
  
  return resultado.join('\n').trim();
}

/**
 * Procesa línea CSV (compatibilidad mejorada)
 */
function parseLine(line) {
  // Simple CSV parser que maneja comillas
  const regex = /(?:[^,"]+|"[^"]*")+/g;
  const matches = line.match(regex) || [];
  return matches.map(m => m.replace(/^"(.*)"$/, '$1').trim());
}

/**
 * Lee y importa canciones del CSV
 */
async function importarCanciones(archivoCSV) {
  console.log(`📖 Leyendo archivo: ${archivoCSV}`);
  
  const contenido = fs.readFileSync(archivoCSV, 'utf-8');
  const lineas = contenido.split('\n').filter(l => l.trim());
  
  if (lineas.length < 2) {
    console.error('❌ Archivo CSV vacío o inválido');
    process.exit(1);
  }
  
  // Leer encabezados
  const headers = parseLine(lineas[0]);
  console.log(`📋 Encabezados encontrados: ${headers.join(', ')}`);
  
  const canciones = [];
  
  // Procesar cada línea
  for (let i = 1; i < lineas.length; i++) {
    const valores = parseLine(lineas[i]);
    if (valores.length !== headers.length) continue;
    
    const cancion = {};
    headers.forEach((header, idx) => {
      cancion[header.toLowerCase().trim()] = valores[idx];
    });
    
    canciones.push(cancion);
  }
  
  console.log(`✅ ${canciones.length} canciones parsed del CSV\n`);
  
  // Convertir y subir a Supabase
  let exitosas = 0;
  let errores = 0;
  
  for (const [idx, cancion] of canciones.entries()) {
    try {
      console.log(`[${idx + 1}/${canciones.length}] Procesando: ${cancion.titulo}...`);
      
      // Convertir acordes al formato ChordPro
      const contenidoConvertido = convertirAFormatoChordPro(cancion.contenido || '');
      
      // Preparar datos para Supabase
      const datosCancion = {
        title: cancion.titulo || 'Sin título',
        author: cancion.autor || '',
        content: contenidoConvertido,
        original_key: cancion.tono_original || 'G',
        key_male: cancion.tono_original || 'G',
        key_female: cancion.tono_mujer || 'B',
        tempo: cancion.tempo || 'media',
        category: cancion.categoria || '',
        bpm: cancion.bpm ? parseInt(cancion.bpm) : null
      };
      
      // Insertar en Supabase
      const { error } = await supabase
        .from('songs')
        .insert([datosCancion]);
      
      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errores++;
      } else {
        console.log(`   ✅ Insertada correctamente`);
        exitosas++;
      }
    } catch (err) {
      console.error(`   ❌ Error inesperado: ${err.message}`);
      errores++;
    }
  }
  
  console.log(`\n═════════════════════════════════════`);
  console.log(`🎉 Importación completada:`);
  console.log(`   ✅ Exitosas: ${exitosas}`);
  console.log(`   ❌ Errores: ${errores}`);
  console.log(`═════════════════════════════════════`);
}

// Ejecutar
const archivoCSV = process.argv[2];

if (!archivoCSV) {
  console.error('❌ Uso: node scripts/import-songs.js [archivo.csv]');
  console.error('\nEjemplo:');
  console.error('  node scripts/import-songs.js canciones.csv');
  process.exit(1);
}

if (!fs.existsSync(archivoCSV)) {
  console.error(`❌ Archivo no encontrado: ${archivoCSV}`);
  process.exit(1);
}

importarCanciones(archivoCSV).catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
