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
  //
  // ⚠️ SIN USO desde que la economía pasó a ser por COMBO. La recompensa ya no se paga por
  // golpe: se paga una vez al cerrar la ronda, con la tabla de COMBO.OUTCOMES
  // (25 / 18 / 10 / 5 / 0). Estas dos constantes quedan acá a propósito y se borran en un
  // commit aparte: TIMING.js es archivo compartido y meter su limpieza dentro del feature
  // del combo garantiza un conflicto de merge por una línea que no aporta nada.
  //
  // Lo que SÍ se conserva es el invariante que documentaban: el máximo por ronda sigue
  // siendo 25, así que la barra nunca se llena en menos de 4 rondas y el remate no se come
  // contenido del juego.
  PERFECT_GAIN: 25,
  GOOD_GAIN: 20,
  SPECIAL_MAX: 100,

  // duraciones de fases
  PROBLEM_MIN_WAIT: 0.5,
  RESOLVE_DURATION: 0.75,
  // Las duraciones del remate se fueron a constants/FINISHER.js: ahora el remate es una
  // sub-máquina de tres tiempos y sus números sólo tienen sentido juntos.

  // vida
  MAX_HEARTS: 4,
}
