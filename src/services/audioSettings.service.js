import { AUDIO_SETTINGS } from '../constants/AUDIO_SETTINGS'
import { musicService } from './music.service'
import { sfxService } from './sfx.service'

// Persistencia de los ajustes de audio y su aplicación a los dos servicios de sonido.
//
// Por qué existe como service aparte y no dentro de music.service: acá vive el I/O
// (localStorage) y la coordinación de LOS DOS canales. music.service no tiene por qué saber
// que existen los efectos, ni sfx.service que existe la música, y ninguno de los dos tiene
// por qué saber que hay algo que se guarda entre sesiones.
//
// Los componentes de React NO llaman a musicService/sfxService directamente para el volumen:
// entran por acá, y así "cambiar el volumen" y "guardarlo" no se pueden desincronizar.

// localStorage puede tirar excepción: modo privado de Safari, cookies bloqueadas, o cuota
// llena. Un juego no se cae porque no pudo guardar una preferencia — se sigue jugando con
// el valor en memoria y listo.
const readStored = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    const value = Number(raw)
    // Number('') es 0 y Number('abc') es NaN: hay que filtrar los dos, o un valor
    // corrupto en localStorage deja el juego muteado sin que se entienda por qué.
    if (Number.isNaN(value)) return fallback
    return Math.min(AUDIO_SETTINGS.MAX, Math.max(AUDIO_SETTINGS.MIN, value))
  } catch {
    return fallback
  }
}

const writeStored = (key, value) => {
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // sin persistencia el ajuste igual vale para esta sesión
  }
}

export const audioSettingsService = {
  // Se llama UNA vez al arrancar la app. Idempotente, así que llamarlo de más no rompe nada.
  load() {
    const music = readStored(AUDIO_SETTINGS.STORAGE.MUSIC, AUDIO_SETTINGS.DEFAULT_MUSIC)
    const sfx = readStored(AUDIO_SETTINGS.STORAGE.SFX, AUDIO_SETTINGS.DEFAULT_SFX)
    musicService.setVolume(music)
    sfxService.setVolume(sfx)
    return { music, sfx }
  },

  get() {
    return { music: musicService.getVolume(), sfx: sfxService.getVolume() }
  },

  setMusicVolume(value) {
    const applied = musicService.setVolume(value)
    writeStored(AUDIO_SETTINGS.STORAGE.MUSIC, applied)
    return applied
  },

  setSfxVolume(value) {
    const applied = sfxService.setVolume(value)
    writeStored(AUDIO_SETTINGS.STORAGE.SFX, applied)
    // Un blip al soltar: mover un control de volumen sin escuchar nada no dice si funcionó.
    // Va DESPUÉS de aplicar el valor, así que suena al volumen nuevo — es la muestra.
    sfxService.select()
    return applied
  },

  toggleMute() {
    return musicService.toggleMute()
  },

  isMuted() {
    return musicService.isMuted()
  },
}
