import { GAME_STATES } from '../../constants/GAME_STATES'
import { TIMING } from '../../constants/TIMING'
import { BOSS_HEALTH, BOSS_HEALTH_VISIBLE_STATES } from '../../constants/BOSS_HEALTH'
import { drawTextOutlined } from './textHelpers'

export const drawBossHealth = (engine) => {
  const { ctx, IMG, G } = engine

  // Guarda: si el sprite del jefe no cargó, no dibujamos nada
  if (!IMG.boss) return

  // Guarda: solo se dibuja en estados donde el jefe está en pantalla
  if (!BOSS_HEALTH_VISIBLE_STATES.includes(G.state)) return

  // --- Calcular targetHp desde G.round ---
  const chunksLost = Math.min(G.round, BOSS_HEALTH.SEGMENTS - 1)
  let targetHp = 1 - chunksLost / BOSS_HEALTH.SEGMENTS

  // --- Vaciado durante el remate ---
  if (G.state === GAME_STATES.FINISH_ANIM) {
    const progress = Math.min(1, G.t / TIMING.FINISH_BREAK_DURATION)
    targetHp = (1 - progress) * (1 / BOSS_HEALTH.SEGMENTS)
  }

  // --- Lerp con init perezoso (en G para sobrevivir reinicio) ---
  if (G.bossHpDisplay === undefined) G.bossHpDisplay = 1
  G.bossHpDisplay += (targetHp - G.bossHpDisplay) * BOSS_HEALTH.LERP

  // Si ya se vació, dejamos de dibujar
  if (G.bossHpDisplay <= 0.001) return

  // --- Geometría ---
  const { x, y, w, h, INNER, COLORS, LABEL, labelY, labelSize, borderWidth } = BOSS_HEALTH

  // Área interna del marco (donde va el relleno)
  const innerX = x + w * INNER.x0
  const innerY = y + h * INNER.y0
  const innerW = w * (INNER.x1 - INNER.x0)
  const innerH = h * (INNER.y1 - INNER.y0)

  // --- 1. Rótulo LEGACY SERVER ---
  drawTextOutlined(ctx, LABEL, x + w / 2, labelY, labelSize, COLORS.label)

  // --- 2. Fondo vacío (área interna) ---
  ctx.fillStyle = COLORS.empty
  ctx.fillRect(Math.round(innerX), Math.round(innerY), Math.round(innerW), Math.round(innerH))

  // --- 3. Relleno (ancho proporcional a bossHpDisplay) ---
  const fillW = innerW * G.bossHpDisplay

  // Pulso: si está por debajo del umbral, alternar color
  if (G.bossHpDisplay <= BOSS_HEALTH.PULSE_THRESHOLD) {
    const pulse = Math.floor(G.time * BOSS_HEALTH.PULSE_FREQ) % 2 === 0
    ctx.fillStyle = pulse ? COLORS.fill : COLORS.fillPulse
  } else {
    ctx.fillStyle = COLORS.fill
  }

  ctx.fillRect(Math.round(innerX), Math.round(innerY), Math.round(fillW), Math.round(innerH))

  // --- 4. Marco encima (PNG con fallback a rects) ---
  if (IMG.bossBar) {
    ctx.drawImage(IMG.bossBar, Math.round(x), Math.round(y), w, h)
  } else {
    // Fallback: marco dibujado con rects
    ctx.fillStyle = COLORS.frame
    ctx.fillRect(Math.round(x), Math.round(y), w, borderWidth)
    ctx.fillRect(Math.round(x), Math.round(y + h - borderWidth), w, borderWidth)
    ctx.fillRect(Math.round(x), Math.round(y), borderWidth, h)
    ctx.fillRect(Math.round(x + w - borderWidth), Math.round(y), borderWidth, h)
  }
}
