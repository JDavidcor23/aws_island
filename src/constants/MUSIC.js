import { GAME_STATES } from './GAME_STATES'

// Música de fondo. Son los tres primeros archivos de audio del proyecto: hasta ahora TODO
// el sonido se generaba con WebAudio en sfx.service, sin un solo archivo.
export const MUSIC_TRACKS = {
  MENU: 'MENU',
  MENTOR: 'MENTOR',
  BATTLE: 'BATTLE',
}

// Se sirven desde public/, así que las rutas empiezan en /assets/...
// Los nombres se limpiaron al copiarlos: el original traía espacios y un doble guión bajo
// ("navigation__conversations with the mentor.mp3"), y un espacio en la URL es un problema
// que no se ve hasta que falla en producción.
export const MUSIC_FILES = {
  [MUSIC_TRACKS.MENU]: '/assets/audio/music_menu.mp3',
  [MUSIC_TRACKS.MENTOR]: '/assets/audio/music_mentor.mp3',
  [MUSIC_TRACKS.BATTLE]: '/assets/audio/music_battle.mp3',
}

// Qué pista suena en cada estado.
//
// INTRO comparte pista con el menú a propósito: el archivo se llama
// "main_menu_and_introduction" y además así la música NO se corta cuando apretás JUGAR.
// El corte de pantalla es seco, pero el audio sigue, y eso cose las dos escenas.
//
// EXPLAIN se queda en la pista de batalla aunque hable el pingüino: es una pantalla de un
// solo beat en el medio de la pelea, y cambiar de pista para volver dos segundos después
// deja el audio haciendo zigzag.
export const MUSIC_BY_STATE = {
  [GAME_STATES.LOAD]: MUSIC_TRACKS.MENU,
  [GAME_STATES.TITLE]: MUSIC_TRACKS.MENU,
  [GAME_STATES.INTRO]: MUSIC_TRACKS.MENU,
  // El briefing se queda en la pista de la intro y NO pasa a MENTOR ni a BATTLE.
  // Declarado explícito aunque el efecto sea el mismo que omitirlo (play(undefined) sale
  // temprano y no cruza nada): dejarlo sin entrada parece un olvido, y el que agregue la
  // próxima pantalla no tiene forma de saber si fue a propósito.
  // El corte a BATTLE entra recién con el primer PROBLEM, o sea junto con el primer grito
  // del jefe. Cruzar a MENTOR acá para volver a BATTLE dos líneas después deja el audio
  // haciendo zigzag, que es lo mismo que ya se decidió para EXPLAIN.
  [GAME_STATES.BRIEFING]: MUSIC_TRACKS.MENU,

  [GAME_STATES.PROBLEM]: MUSIC_TRACKS.BATTLE,
  [GAME_STATES.CHOOSE]: MUSIC_TRACKS.BATTLE,
  [GAME_STATES.TIMING]: MUSIC_TRACKS.BATTLE,
  [GAME_STATES.RESOLVE]: MUSIC_TRACKS.BATTLE,
  [GAME_STATES.EXPLAIN]: MUSIC_TRACKS.BATTLE,
  [GAME_STATES.FINISH_LINE]: MUSIC_TRACKS.BATTLE,
  [GAME_STATES.FINISH_ANIM]: MUSIC_TRACKS.BATTLE,

  [GAME_STATES.TUTORIAL_CLEAR]: MUSIC_TRACKS.MENTOR,
  [GAME_STATES.REMATCH_INTRO]: MUSIC_TRACKS.MENTOR,
  [GAME_STATES.VICTORY]: MUSIC_TRACKS.MENTOR,
  [GAME_STATES.DEFEAT]: MUSIC_TRACKS.MENTOR,
}

export const MUSIC = {
  // ⚠️ EL VOLUMEN YA NO VIVE ACÁ. Se mudó a constants/AUDIO_SETTINGS.js (DEFAULT_MUSIC),
  // porque dejó de ser una constante: ahora el jugador lo mueve con un slider y queda
  // guardado en localStorage. El default bajó de 0.3 a 0.18 — el 0.3 estaba puesto sin
  // haberlo escuchado (decía "SIN VERIFICAR DE OÍDO") y jugándolo tapa los efectos.
  //
  // No dejar un VOLUME acá es a propósito: un default duplicado en dos archivos es cómo
  // terminan desincronizados.
  // Corte seco entre pistas suena a error. 700 ms alcanza para que no se note el empalme
  // sin que se escuchen las dos pistas peleando.
  CROSSFADE_MS: 700,
  FADE_STEP_MS: 40,
  MUTE_KEY: 'm',
}
