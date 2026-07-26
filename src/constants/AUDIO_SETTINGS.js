// Ajustes de audio del jugador. Existen porque la música salía a un volumen fijo y no había
// forma de bajarla: la única perilla era la M, que es todo o nada.
//
// Van DOS controles y no uno. La música son MP3 masterizados y los efectos son tonos
// generados con WebAudio a ganancias de 0.03 a 0.12 — o sea que son dos escalas distintas y
// un control maestro único haría que bajar la música te apague los efectos antes de que la
// música se note más baja.
//
// ⚠️ Archivo propio, no agregado a MUSIC.js: MUSIC.js es del feature de música y esto lo
// consumen también sfx.service y los componentes de React.
export const AUDIO_SETTINGS = {
  // Claves de localStorage. Prefijo del juego para no chocar con nada más servido del mismo
  // origen (Vercel sirve una sola app, pero el prefijo es gratis).
  STORAGE: {
    MUSIC: 'cloudquest.volume.music',
    SFX: 'cloudquest.volume.sfx',
  },

  // Defaults. El de música baja de 0.30 a 0.18: 0.30 se eligió sin escucharlo (está escrito
  // en MUSIC.js: "SIN VERIFICAR DE OÍDO") y jugándolo tapa los efectos y las voces del
  // mentor. Igual ahora es sólo un punto de partida — el jugador lo mueve y queda guardado.
  DEFAULT_MUSIC: 0.18,
  DEFAULT_SFX: 1,

  MIN: 0,
  MAX: 1,
  // Paso del slider y de las flechas. 0.05 da 20 posiciones: suficiente resolución para
  // encontrar el punto justo sin que haya que arrastrar veinte veces.
  STEP: 0.05,

  LABELS: {
    TITLE: 'AUDIO',
    MUSIC: 'MÚSICA',
    SFX: 'EFECTOS',
    MUTED: 'SILENCIADO',
    // El mute por M sigue existiendo y hay que decirlo acá, o el jugador mueve el slider,
    // no escucha nada porque está muteado, y cree que el control está roto.
    MUTE_HINT: 'M silencia todo',
  },
}
