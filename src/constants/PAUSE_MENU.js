// Menú de pausa (ESC durante la partida).
//
// "REINICIAR" y no "REINICIAR NIVEL": reset() no vuelve al principio del juego, vuelve al
// principio de la FASE en la que estás — a la intro si todavía no pasaste el tutorial, o a
// la antesala de la revancha si ya lo pasaste. Prometer "nivel" sería mentir sobre a dónde
// te lleva.
export const PAUSE_MENU = {
  TITLE: 'PAUSA',
  RESUME: 'CONTINUAR',
  RESTART: 'REINICIAR',
  EXIT: 'VOLVER AL MENÚ',
  HINT: 'ESC para seguir jugando',
  CLOSE_KEY: 'Escape',
}
