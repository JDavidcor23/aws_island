// Presión de tiempo en la fase CHOOSE.
// NO va en TIMING.js — es archivo compartido y la regla 4 lo prohíbe.
export const COMBAT_PACING = {
  CHOOSE_TIME_LIMIT: 5,        // segundos para elegir carta
  FIRST_TIMED_ROUND: 1,       // 0-based: ronda 2 es la primera con timer
  TIMEOUT_WARN_THRESHOLD: 2,  // últimos 2 segundos → parpadeo rojo
}
