// Presión de tiempo en la fase CHOOSE.
// NO va en TIMING.js — es archivo compartido y la regla 4 lo prohíbe.
export const COMBAT_PACING = {
  // Segundos para elegir carta en la revancha (el tutorial no tiene timer).
  // Valor provisorio y a la baja: 3s no alcanzaban ni para leer las cuatro cartas, así
  // que se abrió a 15 para poder jugar la revancha completa y recién después apretar.
  CHOOSE_TIME_LIMIT: 15,
  FIRST_TIMED_ROUND: 1,       // 0-based: ronda 2 es la primera con timer
  TIMEOUT_WARN_THRESHOLD: 2,  // últimos 2 segundos → parpadeo rojo
}
