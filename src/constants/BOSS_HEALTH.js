import { GAME_STATES } from './GAME_STATES'

// Barra de vida del Legacy Server. Es un espejo de solo lectura del progreso
// de rondas (G.round). NO es una condición de victoria: ver CLOUD_QUEST.md §5.
export const BOSS_HEALTH = {
  // geometría en el espacio lógico del canvas (640x360)
  x: 216,
  y: 66,
  w: 208,
  h: 12,
  borderWidth: 2,
  labelY: 58,
  labelSize: 9,

  // 4 segmentos = los 4 problemas del jefe
  SEGMENTS: 4,

  // velocidad de la animación (factor de lerp por frame)
  LERP: 0.12,

  // umbral para el pulso de "el remate está cerca"
  PULSE_THRESHOLD: 0.3,
  PULSE_FREQ: 6,

  LABEL: 'LEGACY SERVER',

  // fracción del ancho/alto del PNG donde va el gauge, dentro del marco
  INNER: { x0: 0.075, x1: 0.925, y0: 0.30, y1: 0.70 },

  COLORS: {
    frame: '#3d4763',
    empty: 'rgba(8,10,28,0.82)',
    fill: '#ff5544',
    fillPulse: '#ffd94a',
    label: '#ffffff',
    divider: '#0b0b12',
  },
}

// Fases en las que la barra se dibuja. Fuera de estas, el jefe no está en pantalla.
export const BOSS_HEALTH_VISIBLE_STATES = [
  GAME_STATES.PROBLEM,
  GAME_STATES.CHOOSE,
  GAME_STATES.TIMING,
  GAME_STATES.RESOLVE,
  GAME_STATES.EXPLAIN,
  GAME_STATES.FINISH_LINE,
  GAME_STATES.FINISH_ANIM,
]
