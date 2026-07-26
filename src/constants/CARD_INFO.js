// Geometría, colores y textos fijos para el panel de detalle de cartas y el badge '?'.
export const CARD_INFO = {
  // h subió de 200 a 268 para que entren los tres bloques de texto (what / why /
  // blocks). Centrado en un canvas de 360 deja py=46 y el hint de abajo en 326:
  // entra justo. Si vuelve a crecer, hay que bajar tamaños de fuente, no el margen.
  PANEL: { w: 440, h: 268, radius: 8 },
  VEIL: 'rgba(4,6,20,0.78)',
  BADGE: { r: 7, dx: 46, dy: 10 },
  WRAP_CHARS: 44,
  COLORS: {
    panel: '#040614',
    border: '#3d4763',
    title: '#7de0ff',
    subtitle: '#9fb6d8',
    body: '#cfd8ea',
    why: '#8fe3a8',
    blocks: '#ff9d7a',
    hint: '#ffd94a',
    badgeBg: '#040614',
    badgeBorder: '#7de0ff',
    badgeText: '#7de0ff',
  },
  WHY_LABEL: 'POR QUÉ FUNCIONA:',
  BLOCKS_LABEL: 'BLOQUEA:',
  // Dos hints porque el panel hace dos trabajos distintos según la fase.
  // En el tutorial ES el paso de confirmación: la carta que leés es la que se juega.
  // En la revancha es una consulta voluntaria contra el reloj y no confirma nada.
  CLOSE_HINT: 'I · ESC · clic para volver',
  CONFIRM_HINT: 'ESPACIO o clic para JUGAR esta carta · ESC para volver',
}
