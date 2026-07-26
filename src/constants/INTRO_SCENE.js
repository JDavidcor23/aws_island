import { LAYOUT } from './LAYOUT'

// Escena de tutorial: el héroe entra caminando, el pingüino explica, el héroe se va.
// Sub-máquina de la fase INTRO. Ver .kiro/specs/intro-tutorial/
export const INTRO_STEPS = {
  WALK_IN: 'WALK_IN',
  TALK: 'TALK',
  WALK_OUT: 'WALK_OUT',
}

export const INTRO_SCENE = {
  INITIAL: {
    step: INTRO_STEPS.WALK_IN,
    heroX: -40,
    line: 0,
    walkTime: 0,
    revealTime: 0,
  },

  // geometría en el espacio lógico del canvas (640x360)
  GROUND_Y: 295,        // línea de piso: los PIES del sprite se apoyan acá
  HERO_SIZE: 64,        // resolución NATIVA de walk1..6 y heroSide -> escala 1:1
  HERO_MEET_X: 150,     // dónde se detiene el héroe a hablar
  HERO_EXIT_X: 700,     // fuera del borde derecho (LAYOUT.W = 640)
  PENGUIN_X: 250,
  PENGUIN_SIZE: 64,     // penguinTalk1/2 son 128px -> 0.5x exacto, sin artefactos

  WALK_SPEED: 78,       // px por segundo
  WALK_FRAME_DURATION: 0.1,   // segundos por frame -> 10 fps
  WALK_FRAME_COUNT: 6,

  PENGUIN_TALK_FRAME_DURATION: 0.18,   // alterna penguinTalk1 / penguinTalk2

  SKIP_KEY: 't',
  SKIP_HINT: 'T para saltear',

  FALLBACK_BG: '#2b2333',   // si el fondo A-1 no cargó
  REVEAL_CHARS_PER_SEC: 30,   // caracteres revelados por segundo (efecto typewriter)
}

// Las 3 cosas que el jugador necesita saber, en orden.
export const INTRO_LINES = [
  {
    speaker: 'MENTOR 🐧',
    text: 'Al fin llegaste. ¿Ves esa torre al fondo? Es el Legacy Server, y ya no da abasto con la isla.',
  },
  {
    speaker: 'MENTOR 🐧',
    text: 'No lo vas a vencer a golpes. Cada vez que ataque va a gritar un PROBLEMA concreto.',
  },
  {
    speaker: 'MENTOR 🐧',
    text: 'Vos elegís la característica de la nube que resuelve ESE problema. Con 1-4 o con un clic.',
  },
  {
    speaker: 'MENTOR 🐧',
    text: 'Y cuando el ataque venga hacia vos, apretá ESPACIO en el momento justo para bloquearlo.',
  },
  {
    speaker: 'MENTOR 🐧',
    text: 'Mientras más preciso el bloqueo, más se carga tu especial. Cuando se llene, lo terminás. ¡Andá!',
  },
]
