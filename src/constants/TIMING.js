// TODOS los números que definen el "feel" del combate viven acá.
// Para tunear la dificultad o el tempo, tocar SOLO este archivo.
export const TIMING = {
  // ataque del jefe
  WINDUP_DURATION: 0.45,
  ATK_BASE_SPEED: 250,
  ATK_SPEED_PER_ROUND: 25,
  ATK_SPEED_MAX_ROUNDS: 6,
  REFLECT_SPEED: 430,

  // ventanas de bloqueo (distancia del orbe al punto de bloqueo, en px)
  PERFECT_DIST: 16,
  GOOD_DIST: 42,

  // recompensas de la barra especial (0..100)
  PERFECT_GAIN: 25,
  GOOD_GAIN: 12,
  SPECIAL_MAX: 100,

  // duraciones de fases
  PROBLEM_MIN_WAIT: 0.5,
  RESOLVE_DURATION: 0.75,
  FINISH_BREAK_DURATION: 3.2,
  FINISH_TOTAL_DURATION: 3.6,

  // vida
  MAX_HEARTS: 4,
}
