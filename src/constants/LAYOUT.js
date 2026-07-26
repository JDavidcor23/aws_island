// Geometría del canvas y posiciones clave de la escena.
// El canvas es 640x360 lógico, escalado por CSS con pixelado.
export const LAYOUT = {
  W: 640,
  H: 360,
  BOSS: { x: 320, y: 196, size: 192 },
  HERO: { x: 78, y: 292, size: 96 },
  // Punto de bloqueo frente al héroe: ahí hay que interceptar el ataque
  BLOCK: { x: 112, y: 276, radius: 26 },
  // gap 24 y no 16: con 16 el paso entre cartas era 74 px y "Rapid Elasticity" a 8 px de
  // monospace bold mide 77, así que las etiquetas se pisaban. Eso es lo que obligaba a
  // escalonarlas de a una fila, que se leía como un accidente. Con 24 el paso es 82 y
  // entran todas alineadas.
  // x0 188 mantiene el centro de la fila en x=340, donde ya estaba: la fila se ensanchó
  // hacia los dos lados en vez de correrse, y sigue despejada del héroe (que llega a 126).
  CARD: {
    w: 58,
    h: 81,
    gap: 24,
    x0: 188,
    y: 245,
    // Centro de la placa del nombre, como fracción del alto de la carta. Medido sobre los
    // cuatro PNG: los centros caen entre 0.797 y 0.828, y las cuatro placas son claras
    // (luminancia 212-218) y están centradas horizontalmente. 0.81 es el promedio.
    plateY: 0.81,
    // Separación de la etiqueta respecto del borde inferior de la carta
    labelGap: 10,
  },
  DIALOGUE: { w: 384, h: 122 },
  HUD: {
    heartX: 12,
    heartY: 10,
    heartSize: 26,
    heartGap: 30,
    barX: 10,
    barY: 42,
    barW: 195,
    barH: 38,
    // área interna del gauge dentro del PNG de la barra (proporciones)
    barFill: { x0: 0.155, x1: 0.965, y0: 0.22, y1: 0.8 },
  },
}
