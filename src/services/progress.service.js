import { PROGRESS } from '../constants/PROGRESS'

// Progreso del jugador: qué niveles completó y cuáles tiene desbloqueados.
//
// Por qué es un service y no estado de Zustand: esto sobrevive a la sesión, y el store se
// reconstruye en cada carga. El store puede LEER de acá, pero el dueño del dato es el
// localStorage.
//
// localStorage puede tirar excepción: modo privado de Safari, cookies bloqueadas, cuota
// llena. Un juego no se cae porque no pudo guardar el progreso — se sigue jugando con el
// valor en memoria y listo. Misma decisión que audioSettings.service.
const EMPTY = { completed: [], unlocked: [PROGRESS.FIRST_LEVEL], seenIntros: [] }

// Cache en memoria: es el fallback cuando localStorage no está, y evita parsear JSON en
// cada consulta del mapa de isla.
let cache = null

const read = () => {
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(PROGRESS.STORAGE_KEY)
    if (!raw) {
      cache = { ...EMPTY }
      return cache
    }
    const parsed = JSON.parse(raw)
    // Un localStorage corrupto o de una versión vieja no puede dejar el juego sin niveles
    // desbloqueados: si los campos no son arrays, se descarta todo y se arranca de cero.
    if (!Array.isArray(parsed.completed) || !Array.isArray(parsed.unlocked)) {
      cache = { ...EMPTY }
      return cache
    }
    // El primer nivel se fuerza siempre: un guardado sin él dejaría el mapa entero cerrado.
    const unlocked = parsed.unlocked.includes(PROGRESS.FIRST_LEVEL)
      ? parsed.unlocked
      : [...parsed.unlocked, PROGRESS.FIRST_LEVEL]
    // Migración silenciosa: los guardados de la versión anterior no tienen seenIntros. Tratar
    // eso como "corrupto" le borraría el progreso a quien ya jugó.
    const seenIntros = Array.isArray(parsed.seenIntros) ? parsed.seenIntros : []
    cache = { completed: parsed.completed, unlocked, seenIntros }
    return cache
  } catch {
    cache = { ...EMPTY }
    return cache
  }
}

const write = (value) => {
  cache = value
  try {
    window.localStorage.setItem(PROGRESS.STORAGE_KEY, JSON.stringify(value))
  } catch {
    // sin persistencia el progreso igual vale para esta sesión
  }
}

export const progressService = {
  load: () => read(),
  isCompleted: (id) => read().completed.includes(id),
  isUnlocked: (id) => read().unlocked.includes(id),
  hasSeenIntro: (islandId) => read().seenIntros.includes(islandId),

  // Marca una intro de isla como vista para que no vuelva a correr en subsiguientes niveles.
  markIntroSeen: (islandId) => {
    const current = read()
    if (current.seenIntros.includes(islandId)) return
    write({ ...current, seenIntros: [...current.seenIntros, islandId] })
  },

  // Marca un nivel como completado y desbloquea el siguiente. `nextId` puede ser undefined
  // (último nivel de la isla) y entonces sólo marca el completado.
  complete: (id, nextId) => {
    const current = read()
    const completed = current.completed.includes(id) ? current.completed : [...current.completed, id]
    const unlocked = nextId && !current.unlocked.includes(nextId)
      ? [...current.unlocked, nextId]
      : current.unlocked
    write({ ...current, completed, unlocked })
  },

  reset: () => write({ ...EMPTY }),
}
