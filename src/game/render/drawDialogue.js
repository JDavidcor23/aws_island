import { LAYOUT } from '../../constants/LAYOUT'
import { drawText, wrapText } from './textHelpers'

// La caja de diálogo vive sola acá porque la usan drawScreens.js Y
// drawPhaseScreens.js, y drawScreens ya importa a este último para armar
// SCREEN_DRAWERS. Dejándola en drawScreens los dos módulos se importaban entre
// sí, y en ese ciclo el orden de evaluación decide si SCREEN_DRAWERS explota.
// Como módulo hoja el ciclo desaparece: no hay orden que pueda fallar.

// Geometría y colores de la caja. Locales porque no hay otra pantalla que tenga que
// coincidir con ellos: la caja es un solo widget y se dibuja únicamente desde este archivo.
const MARGIN = 6            // separación al borde del canvas, arriba o abajo
const SPEAKER_DX = 80       // el PNG de la caja tiene el hueco del nombre acá
const SPEAKER_DY = 16
const FIRST_LINE_DY = 46
const LINE_HEIGHT = 16
const WRAP_CHARS = 40       // lo que entra en la caja a 12px; la caja aguanta 4 renglones
const HINT_DX = 52
const HINT_DY = 14
const COLORS = {
  speaker: '#f5e6c8',
  body: '#4a3520',   // marrón oscuro: la caja es clara, el texto va oscuro
  hint: '#8a6d3f',
}
const HINT = '▼ ESPACIO'

// Y del borde superior de la caja. Arriba o abajo según quién esté hablando y qué haya
// que dejar ver: la intro la pone arriba (el pingüino y el héroe están en el piso), el
// combate abajo (el jefe ocupa el centro y la parte alta del cuadro).
const boxY = (top) => (top ? MARGIN : LAYOUT.H - LAYOUT.DIALOGUE.h - MARGIN)

const drawBox = (engine, speaker, top) => {
  const { ctx, IMG } = engine
  const { w: dw, h: dh } = LAYOUT.DIALOGUE
  const dx = (LAYOUT.W - dw) / 2
  const dy = boxY(top)
  if (IMG.dlg) ctx.drawImage(IMG.dlg, dx, dy, dw, dh)
  drawText(ctx, speaker, dx + SPEAKER_DX, dy + SPEAKER_DY, 9, COLORS.speaker)
  return { dx, dy, dw, dh }
}

const drawHint = (engine, dx, dy, dw, dh) => {
  const { ctx, G } = engine
  if (Math.floor(G.time * 2) % 2 !== 0) return
  drawText(ctx, HINT, dx + dw - HINT_DX, dy + dh - HINT_DY, 8, COLORS.hint)
}

// Caja con el mensaje COMPLETO, sin tipeo. La usan el combate y las pantallas de fase.
export const drawDialogue = (engine, speaker, msg, blink = true) => {
  const { ctx } = engine
  const { dx, dy, dw, dh } = drawBox(engine, speaker, false)
  wrapText(msg, WRAP_CHARS).forEach((line, i) => {
    drawText(ctx, line, LAYOUT.W / 2, dy + FIRST_LINE_DY + i * LINE_HEIGHT, 12, COLORS.body)
  })
  if (blink) drawHint(engine, dx, dy, dw, dh)
}

// Caja con texto revelado carácter por carácter. Devuelve `true` si la línea ya terminó de
// revelarse, que es lo que el llamador necesita para decidir si muestra el "▼ ESPACIO".
//
// ⚠️ El wrap se calcula sobre el texto COMPLETO y recién después se recorta lo revelado.
// Al revés —envolver el prefijo que se va agrandando— el wrap se recalcula en cada frame y
// las palabras SALTAN de renglón mientras se tipean. Es el bug clásico del typewriter.
//
// Existe como helper compartido porque la intro y el briefing tenían que dibujar la MISMA
// caja tipeada, y con el código duplicado en los dos lados el día que se toque el
// interlineado en uno queda distinto en el otro.
export const drawTypedDialogue = (engine, { speaker, text, revealedChars, top = false }) => {
  const { ctx } = engine
  const { dx, dy, dw, dh } = drawBox(engine, speaker, top)

  let charsLeft = revealedChars
  wrapText(text, WRAP_CHARS).forEach((line, i) => {
    if (charsLeft <= 0) return
    const visible = line.slice(0, charsLeft)
    charsLeft -= line.length
    drawText(ctx, visible, LAYOUT.W / 2, dy + FIRST_LINE_DY + i * LINE_HEIGHT, 12, COLORS.body)
  })

  const complete = revealedChars >= text.length
  if (complete) drawHint(engine, dx, dy, dw, dh)
  return complete
}
