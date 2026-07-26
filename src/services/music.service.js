import { MUSIC, MUSIC_BY_STATE, MUSIC_FILES } from '../constants/MUSIC'

// Música de fondo con crossfade. Un <audio> por pista, en loop, y se cruzan los volúmenes.
//
// Por qué HTMLAudioElement y no WebAudio como sfx.service: los efectos son tonos de 80 ms
// generados en el momento, y para eso WebAudio es lo correcto. Esto son tres MP3 de 31 s
// en loop, o sea streaming — decodificarlos enteros a un AudioBuffer serían ~16 MB de RAM
// por pista para ganar un control que acá no hace falta.
//
// LA TRAMPA GRANDE de esto es la política de autoplay: ningún navegador deja arrancar audio
// antes de que el usuario interactúe con la página, y play() rechaza una promesa sin tirar
// error visible. Por eso existe `pending` + unlock(): si el navegador rechaza, la pista
// queda anotada y arranca en el primer gesto real del jugador.
const elements = new Map()
let currentTrack = null
let pendingTrack = null
let muted = false
let fadeTimer = null

const targetVolume = () => (muted ? 0 : MUSIC.VOLUME)

const element = (track) => {
  if (elements.has(track)) return elements.get(track)
  const audio = new Audio(MUSIC_FILES[track])
  audio.loop = true
  audio.preload = 'auto'
  audio.volume = 0
  elements.set(track, audio)
  return audio
}

// Precarga las pistas que todavía no se pidieron. Se llama recién cuando la primera ya
// suena: crear los tres elementos de entrada serían 2,2 MB antes de que el jugador vea
// nada, y la pista de batalla no se necesita hasta después de la intro.
const prefetchOthers = () => {
  for (const track of Object.keys(MUSIC_FILES)) {
    if (!elements.has(track)) element(track).load()
  }
}

// Cruza los volúmenes de `from` y `to` en CROSSFADE_MS y pausa la que sale.
// Un solo timer vivo a la vez: si llega otro cambio de pista en pleno cruce, el anterior se
// cancela. Sin eso, dos intervalos escriben el mismo .volume y la mezcla queda a medias.
const crossfade = (from, to) => {
  if (fadeTimer) clearInterval(fadeTimer)
  const steps = Math.max(1, Math.round(MUSIC.CROSSFADE_MS / MUSIC.FADE_STEP_MS))
  const startFrom = from ? from.volume : 0
  let step = 0
  fadeTimer = setInterval(() => {
    step++
    const progress = Math.min(1, step / steps)
    if (from) from.volume = Math.max(0, startFrom * (1 - progress))
    if (to) to.volume = Math.min(1, targetVolume() * progress)
    if (progress >= 1) {
      clearInterval(fadeTimer)
      fadeTimer = null
      if (from) {
        from.pause()
        from.currentTime = 0
      }
    }
  }, MUSIC.FADE_STEP_MS)
}

export const musicService = {
  // Pone la pista `track`. Si ya es la que suena, no hace nada — llamarlo por cada cambio
  // de estado es lo normal, y reiniciar la pista en cada ronda sería el bug obvio.
  play(track) {
    if (!track || !MUSIC_FILES[track]) return
    if (track === currentTrack) return

    const next = element(track)
    const previous = currentTrack ? elements.get(currentTrack) : null

    next.play()
      .then(() => {
        pendingTrack = null
        currentTrack = track
        crossfade(previous, next)
        prefetchOthers()
      })
      .catch(() => {
        // Autoplay bloqueado: queda anotada para el primer gesto del jugador.
        pendingTrack = track
      })
  },

  // Traduce un GAME_STATES a su pista. Lo llama el shell de React desde onScreenChange,
  // NO el motor: el motor no sabe nada de audio de fondo y así sigue.
  playForState(state) {
    this.play(MUSIC_BY_STATE[state])
  },

  // Se llama en el primer gesto real del jugador. Idempotente a propósito: se le puede
  // colgar a varios listeners sin coordinarlos.
  unlock() {
    if (pendingTrack) this.play(pendingTrack)
  },

  toggleMute() {
    muted = !muted
    // Aplicado directo y no por crossfade: silenciar tiene que ser instantáneo.
    // Sólo a la pista que suena; las otras están en 0 y pausadas.
    const active = currentTrack ? elements.get(currentTrack) : null
    if (active) active.volume = targetVolume()
    return muted
  },

  isMuted() {
    return muted
  },
}
