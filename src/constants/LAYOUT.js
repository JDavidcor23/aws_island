// Geometría del canvas y posiciones clave de la escena.
// El canvas es 640x360 lógico, escalado por CSS con pixelado.
export const LAYOUT = {
  W: 640,
  H: 360,
  BOSS: { x: 320, y: 196, size: 192 },
  HERO: { x: 78, y: 292, size: 96 },
  // Punto de bloqueo frente al héroe: ahí hay que interceptar el ataque
  BLOCK: { x: 112, y: 276, radius: 26 },
  CARD: { w: 58, h: 81, gap: 16, x0: 200, y: 245 },
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
