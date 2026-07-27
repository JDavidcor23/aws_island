// Menú principal. Ver .kiro/specs/main-menu/
// Nada de texto ni de teclas hardcodeado en los componentes: todo sale de acá.
export const MENU_OPTIONS = {
  PLAY: 'PLAY',
  HOW_TO_PLAY: 'HOW_TO_PLAY',
  AUDIO: 'AUDIO',
  CREDITS: 'CREDITS',
}

// AUDIO va antes de CRÉDITOS: es un ajuste que el jugador puede querer TOCAR antes de
// empezar, y los créditos son lo último que se mira. Los textos de sus controles viven en
// constants/AUDIO_SETTINGS.js, no acá.
export const MENU_ITEMS = [
  { id: MENU_OPTIONS.PLAY, label: 'JUGAR' },
  { id: MENU_OPTIONS.HOW_TO_PLAY, label: 'CÓMO SE JUEGA' },
  { id: MENU_OPTIONS.AUDIO, label: 'AUDIO' },
  { id: MENU_OPTIONS.CREDITS, label: 'CRÉDITOS' },
]

export const MENU_TEXTS = {
  TITLE: 'CLOUD QUEST',
  // SUBTITLE se fue a constants/LEVEL_CARD.js. Vivía acá debajo del logo, y en la portada
  // era metadata sobre un lugar al que el jugador todavía no había entrado. Ahora es la
  // placa que aparece al apretar JUGAR.
  NAV_HINT: '↑↓ mover · ENTER elegir',
  BACK: '◀ VOLVER (ESC)',
  CARET: '▶',
}

export const HOW_TO_PLAY = {
  TITLE: 'CÓMO SE JUEGA',
  CONTROLS: [
    { keys: '1-4 o clic', action: 'Elegir carta' },
    { keys: 'ESPACIO', action: 'Avanzar diálogo · Bloquear' },
    { keys: 'I', action: 'Leer la ficha de la carta' },
    { keys: 'ESC', action: 'Pausa · reiniciar o salir' },
    { keys: 'M', action: 'Silenciar la música' },
    { keys: 'R', action: 'Reiniciar' },
  ],
  BODY:
    'El jefe grita un PROBLEMA. Elegí la carta de la nube que lo resuelve. ' +
    'Después bloqueá el ataque en el momento justo: cuanto más preciso, más carga tu especial.',
}

export const CREDITS = {
  TITLE: 'CRÉDITOS',
  LINES: [
    'Un juego para aprender Cloud Computing jugando.',
    'Equipo: 697',
    'Hackathon KIRO AWS — 2026',
  ],
  TEAM: ['Jorge', 'Nicolás', 'Jennifer', 'Osvaldo'],
}

// Los assets se sirven desde public/, así que las rutas empiezan en /assets/...
// NO los importes con `import`: son archivos estáticos, no módulos.
export const MENU_ASSETS = {
  BACKGROUND: '/assets/art/_gameready/scene_island_before.png',
  LOGO: '/assets/art/_gameready/logo_cloud_quest.png',   // 400x214
  BUTTON: '/assets/art/_gameready/menu_button.png',      // 240x44
  // El elenco de la portada. No es arte nuevo: son los mismos sprites que ya usa el
  // juego, a 128px nativos, puestos en las esquinas bajas donde el fondo tiene suelo
  // vacío. Van con aria-hidden porque no aportan información, decoran.
  HERO: '/assets/art/_gameready/hero_front_128.png',
  PENGUIN: '/assets/art/_gameready/penguin_128.png',
}

export const MENU_KEYS = {
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
}
