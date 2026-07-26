import { FINISHER, FINISHER_STEPS } from '../../constants/FINISHER'
import { LAYOUT } from '../../constants/LAYOUT'
import { UI_TEXTS } from '../../constants/UI_TEXTS'
import { beamOrigin, beamTravel, chargeProgress, orbCenter } from '../battle/finisher'
import { drawTextOutlined } from './textHelpers'

// Render del remate. El rayo es 100% procedural: cero assets, igual que el orbe del jefe
// en drawAttack. Se dibuja en espacio ROTADO (translate al origen + rotate al ángulo del
// jefe) para no tener que resolver a mano las perpendiculares de un rayo diagonal.

// Una barra de borde ondulado a lo largo del eje X, de x=0 a x=len.
// El adelgazamiento cerca del origen es lo que hace que el rayo parezca SALIR de las
// manos: sin él arranca con el grosor final y se ve como un tubo pegado al héroe.
const drawWobblyBar = (ctx, len, width, color, time, amp) => {
  const { BEAM_WOBBLE_STEP: step, BEAM_WOBBLE_FREQ: freq } = FINISHER
  const half = width / 2
  const taper = (x) => Math.min(1, 0.4 + x / 55)
  const wobbleAt = (x, dir) => Math.sin(x * 0.06 + dir * time * freq) * amp

  ctx.fillStyle = color
  ctx.beginPath()
  for (let x = 0; x <= len; x += step) {
    const y = -half * taper(x) + wobbleAt(x, 1)
    if (x === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  // El loop se queda corto cuando len no es múltiplo exacto de step, y ese resto es
  // justo la punta del rayo: sin esta línea la punta queda cortada en un ángulo raro.
  ctx.lineTo(len, -half * taper(len) + wobbleAt(len, 1))
  for (let x = len; x >= 0; x -= step) {
    ctx.lineTo(x, half * taper(x) + wobbleAt(x, -1))
  }
  ctx.closePath()
  ctx.fill()
}

const drawBeam = (engine, travel) => {
  const { ctx, IMG, G, effects } = engine
  const from = beamOrigin()
  const to = FINISHER.BEAM_TO
  const dx = to.x - from.x
  const dy = to.y - from.y
  const fullLen = Math.hypot(dx, dy)
  const len = fullLen * travel

  ctx.save()
  ctx.translate(from.x, from.y)
  ctx.rotate(Math.atan2(dy, dx))
  // De afuera hacia adentro. La amplitud de la ondulación baja con el grosor: si el
  // núcleo ondulara tanto como el halo, se saldría del halo y el rayo se vería roto.
  drawWobblyBar(ctx, len, FINISHER.BEAM_GLOW_WIDTH, 'rgba(125,224,255,0.28)', G.time, FINISHER.BEAM_WOBBLE_AMP)
  drawWobblyBar(ctx, len, FINISHER.BEAM_MID_WIDTH, FINISHER.PALETTE.MID, G.time, FINISHER.BEAM_WOBBLE_AMP * 0.55)
  drawWobblyBar(ctx, len, FINISHER.BEAM_CORE_WIDTH, FINISHER.PALETTE.CORE, G.time, FINISHER.BEAM_WOBBLE_AMP * 0.25)
  ctx.restore()

  // Cabeza del rayo: el halo pre-renderizado que ya usa el orbe del jefe
  const headX = from.x + (dx * travel)
  const headY = from.y + (dy * travel)
  if (IMG.glowCyan) {
    const size = travel < 1 ? 64 : 52
    ctx.drawImage(IMG.glowCyan, Math.round(headX - size / 2), Math.round(headY - size / 2), size, size)
  }
  ctx.fillStyle = FINISHER.PALETTE.CORE
  ctx.beginPath()
  ctx.arc(Math.round(headX), Math.round(headY), travel < 1 ? 13 : 10, 0, Math.PI * 2)
  ctx.fill()

  // Chispas salpicando desde un punto al azar del rayo, hacia afuera
  if (Math.random() < 0.8) {
    const at = Math.random() * travel
    effects.emit(from.x + dx * at, from.y + dy * at, 1, FINISHER.PALETTE.SPARK, 90, 0.4)
  }
}

const PUFFS = [
  [0, 0, 1],
  [-1.1, 0.25, 0.7],
  [1.1, 0.25, 0.75],
  [-0.5, -0.45, 0.65],
  [0.55, -0.5, 0.6],
]

const drawCloud = (engine, growth, alpha) => {
  const { ctx, IMG } = engine
  if (alpha <= 0) return
  const cx = LAYOUT.HERO.x + FINISHER.CLOUD_FROM.dx
  const cy = LAYOUT.HERO.y + FINISHER.CLOUD_FROM.dy - growth * 20
  const R = FINISHER.CLOUD_BASE_RADIUS + growth * FINISHER.CLOUD_GROWTH_RADIUS

  ctx.globalAlpha = alpha
  for (const [ox, oy, scale] of PUFFS) {
    const radius = R * scale
    const x = cx + ox * R
    const y = cy + oy * R
    if (IMG.glowWhite) {
      // El halo pre-renderizado ya trae el degradado a transparente, así que las volutas
      // se funden entre sí en vez de mostrar los cinco bordes. Se dibuja al DOBLE del
      // radio porque el gradiente del sprite muere en su borde: a radio nominal la nube
      // se ve la mitad de grande de lo que dicen las constantes.
      const size = radius * 4
      ctx.drawImage(IMG.glowWhite, Math.round(x - size / 2), Math.round(y - size / 2), size, size)
    } else {
      ctx.fillStyle = FINISHER.PALETTE.CORE
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}

const drawOrb = (engine, progress) => {
  const { ctx, IMG } = engine
  const { x, y } = orbCenter()
  const radius = FINISHER.ORB_MAX_RADIUS * progress
  if (radius < 1) return

  if (IMG.glowCyan) {
    const size = radius * 4
    ctx.drawImage(IMG.glowCyan, Math.round(x - size / 2), Math.round(y - size / 2), size, size)
  }
  ctx.fillStyle = FINISHER.PALETTE.MID
  ctx.beginPath()
  ctx.arc(Math.round(x), Math.round(y), radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = FINISHER.PALETTE.CORE
  ctx.beginPath()
  ctx.arc(Math.round(x), Math.round(y), radius * 0.5, 0, Math.PI * 2)
  ctx.fill()
}

export const drawFinisher = (engine) => {
  const { ctx, G } = engine
  const fin = G.finisher || FINISHER.INITIAL
  const charging = fin.step === FINISHER_STEPS.CHARGE
  const growth = chargeProgress(fin)

  // La nube va PRIMERO: es la fuente de lo que viene y tiene que quedar debajo del rayo.
  // Crece mientras carga y se DESCARGA mientras dispara — su energía se fue al rayo.
  // Dejarla llena durante el disparo la volvía un cartel blanco compitiendo con el rayo.
  const cloudAlpha = charging
    ? FINISHER.CLOUD_ALPHA * growth
    : FINISHER.CLOUD_ALPHA * Math.max(0, 1 - fin.t / FINISHER.BEAM_HOLD)
  drawCloud(engine, growth, cloudAlpha)

  if (charging) drawOrb(engine, growth)
  else drawBeam(engine, beamTravel(fin))

  drawTextOutlined(ctx, UI_TEXTS.FINISHER_BANNER, LAYOUT.W / 2, 40, 16, FINISHER.PALETTE.CORE)
}
