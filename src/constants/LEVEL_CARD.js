// Placa de nivel: pantalla en negro con el nombre de la isla, entre el menú y la partida.
//
// El subtítulo "Fundamentos de la Nube" vivía en el menú principal, debajo del logo, y ahí
// no tenía sentido: en la portada es metadata, y el jugador todavía no entró a ningún lado.
// Como placa al ENTRAR es narrativa — es la convención de Mario y de medio género: la
// pantalla se va a negro y te dice dónde estás parado antes de soltarte.
//
// Sólo aparece al entrar desde el menú. REINICIAR de la pausa NO la vuelve a mostrar: en un
// reintento la placa deja de ser información y pasa a ser una espera.
export const LEVEL_CARD = {
  NAME: 'ISLA 0',
  SUBTITLE: 'Fundamentos de la Nube',
  // Suficiente para leer dos líneas cortas sin que se vuelva una pausa. Se puede saltear.
  DURATION_MS: 2200,
  SKIP_HINT: 'ESPACIO para continuar',
}
