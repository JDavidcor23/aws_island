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
  // 4 bloqueos PERFECT llenan la barra exactamente: la revancha son 4 problemas, así
  // que jugarla limpia = remate. Con GOOD en 12 hacían falta 9 bloqueos y el jugador
  // quedaba dando vueltas en rondas extra sin entender qué se esperaba de él.
  // GOOD en 20 pide 5 bloqueos: alcanzable, y PERFECT sigue siendo estrictamente mejor.
  // Ninguna combinación llena la barra en menos de 4 rondas (el máximo por ronda es 25),
  // así que el remate nunca se come contenido del juego.
  PERFECT_GAIN: 25,
  GOOD_GAIN: 20,
  SPECIAL_MAX: 100,

  // duraciones de fases
  PROBLEM_MIN_WAIT: 0.5,
  RESOLVE_DURATION: 0.75,
  FINISH_BREAK_DURATION: 3.2,
  FINISH_TOTAL_DURATION: 3.6,

  // vida
  MAX_HEARTS: 4,
}
