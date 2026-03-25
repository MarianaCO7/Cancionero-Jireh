# 📚 Script de Importación de Canciones

Script para importar múltiples canciones desde CSV a Supabase automáticamente.

## ✨ Características

- ✅ Lee canciones desde CSV (Excel exportado)
- ✅ Convierte acordes tradicionales → Formato ChordPro `[ACORDE]`
- ✅ Sube todo a Supabase en segundos
- ✅ Manejo de errores robusto
- ✅ Muestra progreso en tiempo real

## 📋 Formato del CSV

El archivo debe tener estas columnas (en este orden):

```
titulo | autor | tono_original | tono_mujer | tempo | categoria | bpm | contenido
```

### Ejemplo CSV:

```
titulo,autor,tono_original,tono_mujer,tempo,categoria,bpm,contenido
"Grande es tu fidelidad","Thomas Chisholm","G","B","media","Himno",120,"    G
Grande es tu fidelidad,    C oh Dios mi    G Padre
    D
No hay sombra..."
```

## 📖 Cómo preparar el Excel

### Opción 1: Desde Excel
1. Abre Excel (o Google Sheets)
2. Crea columnas: `titulo`, `autor`, `tono_original`, `tono_mujer`, `tempo`, `categoria`, `bpm`, `contenido`
3. Rellena cada fila con una canción
4. **En la columna `contenido`:** Pega el contenido WITH acordes encima de las líneas:
   ```
       G
   Grande es tu fidelidad
       C
   Oh Dios mi Padre
   ```
5. Guarda como CSV (Archivo → Guardar como → Formato CSV)

### Opción 2: Desde Google Sheets
1. Crea la hoja con las mismas columnas
2. Descarga como CSV (Archivo → Descargar → CSV)

## 🚀 Cómo usar

### Paso 1: Instalar dependencias
```bash
npm install
```

(Ya están en package.json: supabase-js)

### Paso 2: Crear el CSV
- Usa el template: `scripts/ejemplo-canciones.csv`
- Reemplaza con tus 100 canciones
- Guarda como: `misCanciones.csv`

### Paso 3: Ejecutar el script
```bash
node scripts/import-songs.js misCanciones.csv
```

### Ejemplo:
```bash
node scripts/import-songs.js canciones-jireh.csv
```

## 📝 Descripción de columnas

| Columna | Requerido | Ejemplo | Notas |
|---------|-----------|---------|-------|
| `titulo` | ✅ | "Grande es tu fidelidad" | Nombre de la canción |
| `autor` | ✅ | "Thomas Chisholm / Marcos Witt" | Compositor/Artista |
| `tono_original` | ✅ | "G" | Tonalidad original (A-G con #/b si aplica) |
| `tono_mujer` | ❌ | "B" | Tonalidad recomendada para mujer (default: B) |
| `tempo` | ❌ | "media" | Opciones: "lenta", "media", "rápida" |
| `categoria` | ❌ | "Himno" | Para clasificar canciones |
| `bpm` | ❌ | "120" | Pulsos por minuto (número) |
| `contenido` | ✅ | Ver ejemplo | **IMPORTANTE:** Acordes encima de la línea |

## ⚡ Formato del contenido (IMPORTANTE)

**DEBE ser así:**
```
    G
Grande es tu fidelidad
    C
Oh Dios mi Padre
    D
No hay sombra de variación
```

**Los acordes DEBEN estar:**
- En línea separada ARRIBA del texto
- Solo con espacios antes (indentación)
- Cada acorde en su línea o separados por espacios

## ✅ Validaciones automáticas

El script valida:
- ✅ Que exista el archivo CSV
- ✅ Que tenga al menos las columnas requeridas
- ✅ Que el contenido no esté vacío
- ✅ Que se pueda conectar a Supabase

## 🔍 Ejemplo de ejecución

```
📖 Leyendo archivo: canciones.csv
📋 Encabezados encontrados: titulo, autor, tono_original, ...
✅ 100 canciones parsed del CSV

[1/100] Procesando: Grande es tu fidelidad...
   ✅ Insertada correctamente
[2/100] Procesando: Digno de Adorar...
   ✅ Insertada correctamente
...

═════════════════════════════════════
🎉 Importación completada:
   ✅ Exitosas: 100
   ❌ Errores: 0
═════════════════════════════════════
```

## 🐛 Solución de problemas

### Error: "NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada"
**Solución:** 
- Asegúrate que `.env.local` existe en la carpeta raíz
- Contiene: `NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_aqui`

### Error: "Archivo no encontrado"
**Solución:**
- Verifica que el CSV esté en la carpeta correcta
- Usa ruta relativa: `node scripts/import-songs.js ./misCanciones.csv`

### Error: "Formato CSV inválido"
**Solución:**
- Abre el CSV con un editor de texto
- Verifica que todas las filas tengan 8 columnas
- Los datos con comas deben estar entre comillas: `"texto, con, comas"`

## 📞 Notas

- El script convierte automáticamente acordes tradicionales al formato ChordPro
- Después de importar, puedes editar desde la app
- Si falla una canción, continúa con las demás
- El contenido se puede editar después en la app

## 🎯 Próximos pasos

1. Prepara el CSV con tus 100 canciones
2. Ejecuta: `node scripts/import-songs.js tuArchivo.csv`
3. ¡Listo! Todas aparecerán en https://cancionero-jireh.vercel.app

---

**¿Necesitas ayuda?** Revisa el archivo `ejemplo-canciones.csv` como referencia.
