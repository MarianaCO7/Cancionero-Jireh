#!/usr/bin/env node

/**
 * Script para importar canciones desde CSV o XLSX a Supabase
 * Convierte formato de acordes tradicional a ChordPro [ACORDE]
 * 
 * Uso:
 *   node scripts/import-songs.js canciones.csv
 *   node scripts/import-songs.js canciones.xlsx
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Intentar usar xlsx si está disponible, sino usar CSV simple
let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.warn('⚠️  npm install xlsx para leer archivos .xlsx');
  console.warn('   Continuando con CSV...\n');
}

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
 * Lee archivos CSV o XLSX
 */
function leerArchivo(ruta) {
  const ext = path.extname(ruta).toLowerCase();
  
  if (ext === '.xlsx' && XLSX) {
    console.log('📊 Leyendo archivo Excel (.xlsx)...');
    const workbook = XLSX.readFile(ruta);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return data;
  } else if (ext === '.csv') {
    console.log('📄 Leyendo archivo CSV...');
    const contenido = fs.readFileSync(ruta, 'utf-8');
    const lineas = contenido.split('\n').filter(l => l.trim());
    
    if (lineas.length < 2) {
      throw new Error('Archivo CSV vacío');
    }
    
    const headers = parseLine(lineas[0]);
    const data = [];
    
    for (let i = 1; i < lineas.length; i++) {
      const valores = parseLine(lineas[i]);
      if (valores.length !== headers.length) continue;
      
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h.toLowerCase().trim()] = valores[idx];
      });
      data.push(obj);
    }
    
    return data;
  } else {
    throw new Error('Formato no soportado. Usa .xlsx o .csv');
  }
}

/**
 * Lee y importa canciones del CSV o XLSX
 */
async function importarCanciones(archivo) {
  console.log(`📖 Leyendo archivo: ${archivo}\n`);
  
  let canciones;
  try {
    canciones = leerArchivo(archivo);
  } catch (err) {
    console.error(`❌ Error al leer: ${err.message}`);
    process.exit(1);
  }
  
  if (!canciones || canciones.length === 0) {
    console.error('❌ Archivo vacío o sin datos válidos');
    process.exit(1);
  }
  
  console.log(`✅ ${canciones.length} canciones parsed del archivo\n`);
  
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
        key_male: cancion.tono_hombre || cancion.tono_male || 'G',
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
const archivo = process.argv[2];

if (!archivo) {
  console.error('❌ Uso: node scripts/import-songs.js [archivo.xlsx o archivo.csv]');
  console.error('\nEjemplos:');
  console.error('  node scripts/import-songs.js canciones.xlsx');
  console.error('  node scripts/import-songs.js canciones.csv');
  process.exit(1);
}

if (!fs.existsSync(archivo)) {
  console.error(`❌ Archivo no encontrado: ${archivo}`);
  process.exit(1);
}

importarCanciones(archivo).catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
