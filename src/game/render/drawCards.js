import { CARD_INFO } from '../../constants/CARD_INFO'
import { CARDS } from '../../constants/CARDS'
import { COMBAT_PACING } from '../../constants/COMBAT_PACING'
import { LAYOUT } from '../../constants/LAYOUT'
import { PHASE_CONFIG } from '../../constants/PHASES'
import { currentRound, isCardLocked } from '../battle/battleLogic'
import { drawText, drawTextOutlined } from './textHelpers'

// Desplazamiento vertical de la carta seleccionada.
// Nombrado acá porque lo usan tanto drawCards() como cardInfoBadgeAt().
const SELECTED_LIFT = 10

// Brillo guía sobre la carta correcta. Vive durante todo el tutorial y se apaga en la
// revancha (lo decide highlightAnswer en PHASE_CONFIG, no la ronda).
// PULSE_SPEED y BOB_AMP son puramente visuales: no tienen significado fuera de esta pantalla.
const GUIDE_COLOR    = '#ffd94a'  // mismo dorado que el texto de carta seleccionada
const GUIDE_PULSE_SPEED = 4      // radianes por segundo del sin() de alpha
const GUIDE_BOB_AMP  = 5         // px de rebote de la flecha encima de la carta
const GUIDE_ARROW    = '▼'       // mismo caracter que drawScreens.js usa en su indicador

// Fila de cartas chicas abajo: la escena queda visible.
// La selección se marca con marco + fondo tintado (nada de shadowBlur).
export const cardIndexAt = (x, y) => {
  const { w, gap, x0, y: cy, h } = LAYOUT.CARD
  for (let i = 0; i < 4; i++) {
    const cx = x0 + i * (w + gap)
    if (x >= cx - 4 && x <= cx + w + 4 && y >= cy - 14 && y <= cy + h + 16) return i
  }
  return -1
}

// Hit-test del badge '?'. Replica el lift de la selección igual que el dibujo.
// Ignora el bobbing senoidal a propósito: el dibujo tampoco lo aplica al badge
// (un affordance clickeable que se mueve es un affordance que se falla).
// Margen de +2px sobre el radio: comodidad de puntería, no tapa ningún bug.
export const cardInfoBadgeAt = (x, y, selectedIndex) => {
  const { w, gap, x0, y: cy } = LAYOUT.CARD
  const { r, dx, dy } = CARD_INFO.BADGE
  const HIT_R = r + 2
  for (let i = 0; i < 4; i++) {
    const cx = x0 + i * (w + gap)
    const bx = cx + dx
    // Mismo cálculo que el dibujo: lift si está seleccionada, sin bobbing
    const by = cy - (i === selectedIndex ? SELECTED_LIFT : 0) + dy
    const dist = Math.sqrt((x - bx) ** 2 + (y - by) ** 2)
    if (dist <= HIT_R) return i
  }
  return -1
}

export const drawCards = (engine) => {
  const { ctx, IMG, G } = engine
  const { w, h, gap, x0, y } = LAYOUT.CARD

  // franja de foco detrás de las cartas
  const grad = ctx.createLinearGradient(0, LAYOUT.H - 150, 0, LAYOUT.H)
  grad.addColorStop(0, 'rgba(4,6,20,0)')
  grad.addColorStop(1, 'rgba(4,6,20,0.75)')
  ctx.fillStyle = grad
  ctx.fillRect(0, LAYOUT.H - 150, LAYOUT.W, 150)

  drawTextOutlined(ctx, currentRound(G).prob, LAYOUT.W / 2, 26, 13, '#ff9d7a')
  drawTextOutlined(ctx, '¿Con qué característica de la nube lo bloqueás?', LAYOUT.W / 2, 48, 11, '#ffffff')

  for (let i = 0; i < 4; i++) {
    const id = G.cards[i]
    const isSelected = i === G.sel
    // Una carta descartada y una bloqueada por la fase se dibujan IGUAL: las dos son
    // "no la podés jugar", y darles dos aspectos distintos obligaría al jugador a aprender
    // dos vocabularios visuales para la misma cosa.
    const isUsed = G.wrong.has(id) || isCardLocked(G, id)
    const cx = x0 + i * (w + gap)
    const cy = y - (isSelected ? SELECTED_LIFT : 0) + Math.sin(G.time * 2 + i) * 1.5

    // Brillo guía: todo el tutorial, solo sobre la carta correcta.
    // Se dibuja ANTES del marco cyan para que la selección quede visible encima.
    const cfg = PHASE_CONFIG[G.phase]
    if (cfg.highlightAnswer && id === currentRound(G).ans) {
      const alpha = 0.45 + 0.45 * Math.sin(G.time * GUIDE_PULSE_SPEED)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = GUIDE_COLOR
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(Math.round(cx - 5), Math.round(cy - 5), w + 10, h + 10, 6)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.restore()
      // Flecha rebotante encima de la carta
      const arrowY = Math.round(cy - 18 + Math.sin(G.time * GUIDE_PULSE_SPEED) * GUIDE_BOB_AMP)
      drawTextOutlined(ctx, GUIDE_ARROW, Math.round(cx + w / 2), arrowY, 12, GUIDE_COLOR)
    }

    if (isSelected && !isUsed) {
      ctx.fillStyle = 'rgba(125,224,255,0.28)'
      ctx.strokeStyle = '#7de0ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(Math.round(cx - 5), Math.round(cy - 5), w + 10, h + 10, 6)
      ctx.fill()
      ctx.stroke()
    }
    ctx.globalAlpha = isUsed ? 0.3 : 1
    if (IMG[id]) ctx.drawImage(IMG[id], Math.round(cx), Math.round(cy), w, h)

    // El número va DENTRO de la placa del arte, que hasta ahora estaba vacía. Es lo único
    // que entra legible ahí (un carácter en ~48 px) y además es lo correcto: la placa
    // termina funcionando como la tecla impresa en la carta, que es lo que el jugador
    // aprieta. Antes flotaba arriba de la carta y la placa quedaba como un hueco.
    //
    // drawText y no drawTextOutlined: la placa es crema (luminancia ~215), así que el
    // número va oscuro y el contorno negro de 3 px sólo ensuciaría la placa.
    // Mismo marrón que el texto sobre la caja de diálogo, que es la otra superficie clara
    // del juego.
    // Va DENTRO del bloque de alpha: si la carta está descartada, su número también.
    drawText(ctx, String(i + 1), cx + w / 2, cy + h * LAYOUT.CARD.plateY, 9, '#4a3520')
    ctx.globalAlpha = 1

    // Nombre bajo la carta, todos a la MISMA altura. El escalonado `(i % 2) * 11` que
    // estaba acá era un parche a que el paso de carta (74 px) era menor que la etiqueta
    // más larga (77 px); con gap 24 el paso es 82 y ya no hace falta.
    //
    // La Y sale de LAYOUT.CARD.y y no de cy a propósito: cy trae el bobbing senoidal, que
    // está desfasado por carta. Sobre una línea compartida eso se lee como temblequeo. El
    // lift de selección SÍ se aplica, porque la etiqueta es parte de la carta.
    const labelColor = isUsed ? '#777' : isSelected ? '#ffd94a' : '#ffffff'
    const labelY = y - (isSelected ? SELECTED_LIFT : 0) + h + LAYOUT.CARD.labelGap
    drawTextOutlined(ctx, CARDS[id].label, cx + w / 2, labelY, 8, labelColor)

    // Badge '?' — encima de la imagen, atenuado si la carta está descartada.
    // Y del badge: aplica el lift de selección pero NO el bobbing senoidal,
    // para que el área de clic (cardInfoBadgeAt) y el dibujo siempre coincidan.
    const { r, dx: bdx, dy: bdy } = CARD_INFO.BADGE
    const { COLORS } = CARD_INFO
    const badgeCx = Math.round(cx + bdx)
    const badgeCy = Math.round(y - (isSelected ? SELECTED_LIFT : 0) + bdy)
    ctx.save()
    ctx.globalAlpha = isUsed ? 0.3 : 1
    ctx.beginPath()
    ctx.arc(badgeCx, badgeCy, r, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.badgeBg
    ctx.fill()
    ctx.strokeStyle = COLORS.badgeBorder
    ctx.lineWidth = 1
    ctx.stroke()
    drawText(ctx, '?', badgeCx, badgeCy + 1, 9, COLORS.badgeText, 'center', true)
    ctx.globalAlpha = 1
    ctx.restore()
  }

  // Timer visual: arco que se vacía.
  // Se dibuja SOLO si la fase tiene límite de tiempo (null = sin timer, como en TUTORIAL).
  const limit = PHASE_CONFIG[G.phase].chooseTimeLimit
  if (limit !== null) {
    const remaining = Math.max(0, 1 - G.t / limit)
    const cx = LAYOUT.W / 2
    const cy = y - 34
    const radius = 14
    const warn = G.t >= (limit - COMBAT_PACING.TIMEOUT_WARN_THRESHOLD)
    const visible = !warn || Math.floor(G.time * 4) % 2 === 0

    if (visible) {
      // Fondo del arco
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = '#3d4763'
      ctx.lineWidth = 4
      ctx.stroke()
      // Arco que se vacía
      ctx.beginPath()
      ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remaining)
      ctx.strokeStyle = warn ? '#ff5544' : '#7de0ff'
      ctx.lineWidth = 4
      ctx.stroke()
      // Número de segundos restantes
      const secs = Math.max(0, Math.ceil(limit - G.t))
      drawTextOutlined(ctx, String(secs), cx, cy + 1, 11, warn ? '#ff5544' : '#ffffff')
    }
  }
}

// La carta elegida flota frente al héroe como escudo durante el bloqueo
export const drawChosenCard = (engine) => {
  const { ctx, IMG, G } = engine
  if (!G.chosen || !IMG[G.chosen]) return
  const bob = Math.sin(G.time * 5) * 2
  const cw = 40
  const ch = 56
  const x = Math.round(LAYOUT.BLOCK.x - cw / 2 + 6)
  const y = Math.round(LAYOUT.BLOCK.y - ch / 2 + bob)
  if (IMG.glowCyan) {
    ctx.globalAlpha = 0.55
    ctx.drawImage(IMG.glowCyan, x + cw / 2 - 44, y + ch / 2 - 44, 88, 88)
    ctx.globalAlpha = 1
  }
  ctx.drawImage(IMG[G.chosen], x, y, cw, ch)
}
