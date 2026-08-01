export const PROGRESS = {
  STORAGE_KEY: 'cq.progress.v1',
  // El primer nivel arranca desbloqueado siempre: sin esto, un localStorage vacío deja al
  // jugador sin nada que jugar.
  FIRST_LEVEL: 'isla0-n1',
  // Clave de la llave maestra de desarrollo. Se guarda aparte del progreso a propósito: así
  // prenderla o apagarla NO toca lo que el jugador realmente completó, y se puede alternar
  // entre "quiero probar el nivel 4 ya" y "quiero ver si el desbloqueo funciona de verdad"
  // sin perder la partida.
  DEV_UNLOCK_KEY: 'cq.dev.unlockAll',
}
