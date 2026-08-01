import { CARD_INFO } from '../../constants/CARD_INFO'
import { COMBAT_PACING } from '../../constants/COMBAT_PACING'
import { LAYOUT } from '../../constants/LAYOUT'
import { phaseConfig } from '../../constants/PHASES'
import { drawText, wrapText } from './textHelpers'

// Tamaños de fuente y alturas de renglón del panel.
// Son locales porque no tienen significado fuera de esta pantalla —
// no hay otra pantalla que tenga que coincidir con ellas.
const FONT = {
  title:    16,
  label:     9,
  body:     11,
  why:      10,
  blocks:   10,
  meta:      9,
  hint:      8,
  timer:    18,  // tamaño del número de segundos superpuesto sobre el velo
}

// Interlineado por bloque. El panel es 268px de alto con 20px de padding arriba y
// abajo → 228px útiles. Medido con el texto más largo de CARDS.js (`ela`, 4 renglones
// de what) el contenido ocupa ~257px de los 268: queda poco aire, así que alargar un
// texto de carta obliga a mirar el panel corriendo. La distribución es:
//   título (16px)                + gap 4
//   subtítulo (9px)              + gap 10
//   separador (1px)              + gap 16
//   what   (11px × ≤4 líneas)    + gap 6
//   POR QUÉ label (9px) + texto  (10px × ≤3 líneas) + gap 6
//   BLOQUEA label (9px) + texto  (10px × ≤2 líneas)
//   hint, anclado al borde inferior del panel por dentro (GAP.hintInside)
const LINE = {
  title:   18,  // espacio que ocupa el título antes del siguiente elemento
  label:   12,
  sep:     16,  // gap desde la línea separadora al primer párrafo
  body:    14,  // interlineado de cada renglón de what
  meta:    12,
  blocks:  13,
}

// Margen interno del panel y gaps entre elementos.
// PAD acá y no dentro de la función: es una constante del módulo, no local al frame.
const PAD = 20
const GAP = {
  afterTitle:    4,   // espacio entre título y subtítulo (o separador si no hay)
  afterLabel:   10,   // espacio entre subtítulo y separador
  noLabel:       6,   // gap menor cuando no hay subtítulo
  afterWhat:     6,   // respiro entre descripción y bloque POR QUÉ
  afterWhy:      6,   // respiro entre POR QUÉ y BLOQUEA
  afterMetaLbl:  2,   // entre una etiqueta y su contenido
  // El hint va ADENTRO del panel, medido desde su borde inferior hacia arriba.
  // Antes iba 12px por DEBAJO del panel, y con el panel en 268 de alto eso lo dejaba en
  // y=326: justo encima de la fila de cartas (245..326) y de sus etiquetas. El hint de un
  // modal tiene que vivir dentro del modal.
  hintInside:   14,
}

// Posición del timer superpuesto sobre el velo.
// Y=18 queda en la franja superior libre: el panel centrado arranca en py=46, y el
// hint de cierre va debajo del panel. No choca con ninguno de los dos.
const TIMER_OVERLAY_X = Math.round(LAYOUT.W / 2)
const TIMER_OVERLAY_Y = 18

// Bloque con etiqueta arriba y texto envuelto abajo (POR QUÉ / BLOQUEA).
// Devuelve el cursorY donde terminó: el panel se dibuja de arriba hacia abajo y cada
// bloque necesita saber dónde cerró el anterior.
const drawLabeledBlock = (ctx, cx, cursorY, label, text, size, color) => {
  drawText(ctx, label, cx, Math.round(cursorY), FONT.meta, CARD_INFO.COLORS.subtitle, 'center', true)
  let y = cursorY + LINE.meta + GAP.afterMetaLbl
  for (const line of wrapText(text, CARD_INFO.WRAP_CHARS)) {
    drawText(ctx, line, cx, Math.round(y), size, color, 'center', true)
    y += LINE.blocks
  }
  return y
}

export const drawCardInfo = (engine) => {
  const { ctx, G } = engine

  // Guarda: sin carta seleccionada no hay nada que dibujar
  if (G.infoCard === null) return
  const card = G.level.cards[G.infoCard]
  if (!card) return

  // Fallback de título: si falta `es`, usamos `label`
  const titulo = card.es || card.label

  // ── 1. Velo sobre todo el canvas ────────────────────────────────────────
  ctx.save()
  ctx.fillStyle = CARD_INFO.VEIL
  ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)

  // ── 2. Recuadro centrado ────────────────────────────────────────────────
  const { w, h, radius } = CARD_INFO.PANEL
  const { COLORS } = CARD_INFO
  const px = Math.round((LAYOUT.W - w) / 2)
  const py = Math.round((LAYOUT.H - h) / 2)

  ctx.fillStyle = COLORS.panel
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(px, py, w, h, radius)
  ctx.fill()
  ctx.stroke()

  // ── 3. Contenido del panel ───────────────────────────────────────────────
  // Punto de arranque: margen interno de PAD desde el borde del panel
  const cx = Math.round(px + w / 2)  // centro horizontal para los textos centrados
  let cursorY = py + PAD

  // Título (es o label como fallback)
  cursorY += Math.round(FONT.title / 2)  // textBaseline = 'middle', compensamos la mitad
  drawText(ctx, titulo, cx, cursorY, FONT.title, COLORS.title)
  cursorY += Math.round(FONT.title / 2) + GAP.afterTitle

  // Subtítulo (label en inglés), solo si es distinto del título que mostramos
  if (card.label && card.label !== titulo) {
    cursorY += Math.round(FONT.label / 2)
    drawText(ctx, card.label, cx, cursorY, FONT.label, COLORS.subtitle, 'center', false)
    cursorY += Math.round(FONT.label / 2) + GAP.afterLabel
  } else {
    cursorY += GAP.noLabel  // gap menor si no hay subtítulo
  }

  // Línea separadora
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(px + PAD, Math.round(cursorY))
  ctx.lineTo(px + w - PAD, Math.round(cursorY))
  ctx.stroke()
  cursorY += LINE.sep

  // Descripción (what) con wrapText — se saltea si falta
  if (card.what) {
    const lines = wrapText(card.what, CARD_INFO.WRAP_CHARS)
    for (const line of lines) {
      drawText(ctx, line, cx, Math.round(cursorY), FONT.body, COLORS.body, 'center', false)
      cursorY += LINE.body
    }
    cursorY += GAP.afterWhat
  }

  // Bloque POR QUÉ FUNCIONA: el caso concreto. Es el que deja decidir entre las cuatro
  // cartas — `what` define la característica, pero no dice cuál juega contra ESTE ataque.
  if (card.why) {
    cursorY = drawLabeledBlock(ctx, cx, cursorY, CARD_INFO.WHY_LABEL, card.why, FONT.why, COLORS.why)
    cursorY += GAP.afterWhy
  }

  // Bloque BLOQUEA: etiqueta + texto — se saltea si falta
  if (card.blocks) {
    cursorY = drawLabeledBlock(ctx, cx, cursorY, CARD_INFO.BLOCKS_LABEL, card.blocks, FONT.blocks, COLORS.blocks)
  }

  // ── 4. Hint: anclado al borde inferior, ADENTRO del panel ───────────────
  // El texto cambia según lo que el panel HACE en esta fase. En el tutorial es el paso
  // de confirmación y tiene que decir que desde acá se juega la carta; en la revancha
  // es una consulta que solo se cierra. Un hint fijo mentiría en una de las dos.
  const hint = phaseConfig(G).openInfoOnPick ? CARD_INFO.CONFIRM_HINT : CARD_INFO.CLOSE_HINT
  const hintY = Math.round(py + h - GAP.hintInside)
  drawText(ctx, hint, cx, hintY, FONT.hint, COLORS.hint, 'center', false)

  ctx.restore()

  // ── 5. Timer superpuesto: encima del velo, sólo si la fase tiene límite ──
  // Se dibuja fuera del ctx.save/restore del velo para quedar encima de todo.
  // El jugador sigue corriendo contra el reloj mientras lee (req. 5.9),
  // así que tiene que poder verlo aunque el velo tape el arco de drawCards.
  const limit = phaseConfig(G).chooseTimeLimit
  if (limit !== null) {
    const secs = Math.max(0, Math.ceil(limit - G.t))
    const warn = G.t >= (limit - COMBAT_PACING.TIMEOUT_WARN_THRESHOLD)
    const visible = !warn || Math.floor(G.time * 4) % 2 === 0
    if (visible) {
      drawText(ctx, String(secs), TIMER_OVERLAY_X, TIMER_OVERLAY_Y, FONT.timer, warn ? '#ff5544' : '#ffd94a', 'center', true)
    }
  }
}
