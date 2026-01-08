const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord
  
  const match = chord.match(/^([A-G][#b]?)(.*)$/)
  if (!match) return chord
  
  const [, root, suffix] = match
  let noteIndex = NOTES.indexOf(root)
  if (noteIndex === -1) noteIndex = NOTES_FLAT.indexOf(root)
  if (noteIndex === -1) return chord
  
  const newIndex = (noteIndex + semitones + 12) % 12
  const useFlats = root.includes('b')
  const newRoot = useFlats ? NOTES_FLAT[newIndex] : NOTES[newIndex]
  
  return newRoot + suffix
}

export function transposeContent(content: string, semitones: number): string {
  if (semitones === 0) return content
  return content.replace(/\[([A-G][#b]?[^\]]*)\]/g, (_, chord) => {
    return `[${transposeChord(chord, semitones)}]`
  })
}

export function getSemitonesDifference(fromKey: string, toKey: string): number {
  let fromIndex = NOTES.indexOf(fromKey)
  if (fromIndex === -1) fromIndex = NOTES_FLAT.indexOf(fromKey)
  
  let toIndex = NOTES.indexOf(toKey)
  if (toIndex === -1) toIndex = NOTES_FLAT.indexOf(toKey)
  
  if (fromIndex === -1 || toIndex === -1) return 0
  
  return (toIndex - fromIndex + 12) % 12
}

export function getKeyFromSemitones(baseKey: string, semitones: number): string {
  let noteIndex = NOTES.indexOf(baseKey)
  if (noteIndex === -1) noteIndex = NOTES_FLAT.indexOf(baseKey)
  if (noteIndex === -1) return baseKey
  
  const newIndex = (noteIndex + semitones + 12) % 12
  const useFlats = baseKey.includes('b')
  return useFlats ? NOTES_FLAT[newIndex] : NOTES[newIndex]
}
