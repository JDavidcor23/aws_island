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

// Llave maestra de desarrollo: con esto prendido, TODOS los niveles se pueden jugar sin
// haberlos desbloqueado. Es para probar el nivel 4 sin jugarse los tres anteriores cada vez.
//
// Dos candados para que nunca llegue a un jugador real:
//   1. `import.meta.env.DEV` es false en cualquier build de producción, así que la rama entera
//      la borra el bundler. No es una comprobación en runtime: el código no existe.
//   2. Aun en dev hay que prenderla explícitamente. Arranca APAGADA a propósito — si el
//      default fuera "todo abierto", un bug en el desbloqueo real no se notaría nunca,
//      que es justamente lo que este flag no tiene que tapar.
const devUnlockAll = () => {
  if (!import.meta.env.DEV) return false
  try {
    return window.localStorage.getItem(PROGRESS.DEV_UNLOCK_KEY) === '1'
  } catch {
    return false
  }
}

export const progressService = {
  load: () => read(),
  isCompleted: (id) => read().completed.includes(id),
  isUnlocked: (id) => devUnlockAll() || read().unlocked.includes(id),
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

  // --- Llave maestra de desarrollo ---
  // No tocan el progreso: prenden y apagan el bypass de `isUnlocked`. Los expone `main.jsx`
  // en `window.cq` para poder usarlos desde la consola del navegador sin recompilar.
  isDevUnlockOn: () => devUnlockAll(),

  setDevUnlock: (on) => {
    try {
      if (on) window.localStorage.setItem(PROGRESS.DEV_UNLOCK_KEY, '1')
      else window.localStorage.removeItem(PROGRESS.DEV_UNLOCK_KEY)
    } catch {
      // sin localStorage no hay llave maestra, y no es motivo para romper nada
    }
  },
}
