import { LAYOUT } from '../../constants/LAYOUT'
import { UI_TEXTS } from '../../constants/UI_TEXTS'
import { drawDialogue } from './drawDialogue'
import { drawTextOutlined } from './textHelpers'

// Las dos bisagras entre el tutorial y la revancha. Cero arte nuevo: draw() ya
// puso el jefe y el héroe atrás, acá solo van el velo y el texto encima.
// Los números son puramente visuales y no los comparte ninguna otra pantalla,
// así que viven acá arriba y no en constants/.
const CLEAR_VEIL = 'rgba(4,6,20,0.5)'   // suave: el jefe reiniciándose tiene que seguir viéndose
const INTRO_VEIL = 'rgba(24,4,8,0.7)'   // más cerrado y rojizo: esto es un cartel de pelea

const TITLE_Y = 118
const TITLE_SIZE = 30
const TITLE_COLOR = '#ff5544'

const CHANGES_Y = 154
const CHANGES_SIZE = 12
const CHANGES_COLOR = '#ffffff'

const HINT_Y = LAYOUT.H - 44   // misma altura que el hint de la pantalla de título
const HINT_SIZE = 11
const HINT_COLOR = '#ffd94a'
const BLINK_RATE = 2           // parpadeos por segundo, igual que el resto de las pantallas

// Velo de pantalla completa. El alpha va dentro del rgba() y no en globalAlpha:
// así no queda nada que devolver a 1 después.
const drawVeil = (ctx, color) => {
  ctx.save()
  ctx.fillStyle = color
  ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
  ctx.restore()
}

// El jefe cayó, pero se está reiniciando. Es el mentor hablando, así que reusa
// la misma caja de diálogo que EXPLAIN: su '▼ ESPACIO' ya avisa cómo seguir.
export const drawTutorialClearScreen = (engine) => {
  drawVeil(engine.ctx, CLEAR_VEIL)
  drawDialogue(engine, UI_TEXTS.TUTORIAL_CLEAR_SPEAKER, UI_TEXTS.TUTORIAL_CLEAR_MENTOR)
}

// Cartel de pelea, no diálogo: título grande y una línea con qué cambia.
export const drawRematchIntroScreen = (engine) => {
  const { ctx, G } = engine
  drawVeil(ctx, INTRO_VEIL)
  drawTextOutlined(ctx, UI_TEXTS.REMATCH_TITLE, LAYOUT.W / 2, TITLE_Y, TITLE_SIZE, TITLE_COLOR)
  drawTextOutlined(ctx, UI_TEXTS.REMATCH_CHANGES, LAYOUT.W / 2, CHANGES_Y, CHANGES_SIZE, CHANGES_COLOR)
  // Sin este hint la pantalla se queda esperando un input que nadie anunció:
  // REMATCH_INTRO no auto-avanza, solo sale por advance().
  if (Math.floor(G.time * BLINK_RATE) % 2 === 0) {
    drawTextOutlined(ctx, UI_TEXTS.REMATCH_HINT, LAYOUT.W / 2, HINT_Y, HINT_SIZE, HINT_COLOR)
  }
}
