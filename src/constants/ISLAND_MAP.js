// Posición de cada nodo sobre la panorámica de la isla, en PORCENTAJE del contenedor.
// Porcentaje y no píxeles porque el fondo escala con la ventana: con píxeles fijos, los
// nodos se despegan del lugar del dibujo al que apuntan.
//
// La clave es el id del nivel. Un nivel sin entrada acá no se dibuja — es intencional:
// agregar contenido sin decidir dónde va en el mapa es un olvido, no un default.
export const ISLAND_MAP = {
  // La PANORÁMICA de la isla, no el nodo del mapa mundial. `island0_before.png` es el ícono
  // de 112×96 que representa la isla en el overworld: estirado a pantalla completa se ve como
  // una mancha de píxeles ilegible. `scene_island_before.png` es el encuadre "isla entera de
  // lejos" y es el único que aguanta este tamaño. Ver .kiro/specs/CONCEPTO_ISLA_0.md.
  BACKGROUND: '/assets/art/_gameready/scene_island_before.png',
  NODES: {
    'isla0-n1': { x: 28, y: 62, label: '1' },
    // Sobre el camino que sube al servidor, a la derecha del pueblo. Los nodos siguen el
    // recorrido del dibujo: se avanza hacia la máquina, no en cualquier dirección.
    'isla0-n2': { x: 58, y: 52, label: '2' },
  },
}
