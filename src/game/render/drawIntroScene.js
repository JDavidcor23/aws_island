import { LAYOUT } from '../../constants/LAYOUT'
import { INTRO_SCENE, INTRO_STEPS, INTRO_LINES } from '../../constants/INTRO_SCENE'
import { boatX, fadeAlpha, fadePastMidpoint, heroBoatPos } from '../scenes/introScene'
import { drawText, drawTextOutlined, wrapText } from './textHelpers'

// Helper: ancla sprites por los PIES, no por el centro.
// La esquina superior va en groundY - size (los pies tocan groundY).
// `mirror` invierte el sprite en X: se traslada al borde DERECHO del destino antes
// de escalar en -1, porque scale(-1) sin ese translate dibuja fuera del canvas.
const drawGrounded = (ctx, img, centerX, size, mirror = false, groundY = INTRO_SCENE.GROUND_Y) => {
  const x = Math.round(centerX - size / 2)
  const y = Math.round(groundY - size)
  if (!mirror) {
    ctx.drawImage(img, x, y, size, size)
    return
  }
  ctx.save()
  ctx.translate(x + size, y)
  ctx.scale(-1, 1)
  ctx.drawImage(img, 0, 0, size, size)
  ctx.restore()
}

// La llegada pasa en el mar; del fade en adelante, en la aldea.
// El punto medio del fade es donde cambia, con la pantalla en negro.
const isAtSea = (intro) =>
  intro.step === INTRO_STEPS.BOAT_IN ||
  (intro.step === INTRO_STEPS.FADE && !fadePastMidpoint(intro))

const drawSeaScene = (engine, intro) => {
  const { ctx, IMG, G } = engine
  const { BOAT } = INTRO_SCENE

  // El cabeceo se aplica al bote Y al héroe con el mismo valor: son un solo objeto.
  // Sigue cabeceando durante el fade a propósito — un bote amarrado se mueve con el agua,
  // y congelarlo justo cuando la pantalla se va a negro se lee como que el juego se trabó.
  const bob = Math.sin(G.time * BOAT.BOB_FREQ) * BOAT.BOB_AMP

  if (IMG.boat) {
    ctx.drawImage(
      IMG.boat,
      Math.round(boatX(intro) - BOAT.WIDTH / 2),
      Math.round(BOAT.WATERLINE_Y + bob - BOAT.HEIGHT),
      BOAT.WIDTH,
      BOAT.HEIGHT,
    )
  }

  const hero = heroBoatPos(intro)
  if (IMG.heroSide) {
    drawGrounded(ctx, IMG.heroSide, hero.x, INTRO_SCENE.HERO_SIZE, false, hero.y + bob)
  }
}

const drawVillageScene = (engine, intro) => {
  const { ctx, IMG, G } = engine

  // Pingüino — alterna frames si está hablando
  const talking = intro.step === INTRO_STEPS.TALK
  const mouthOpen = Math.floor(G.time / INTRO_SCENE.PENGUIN_TALK_FRAME_DURATION) % 2 === 0
  const penguinImg = talking && mouthOpen ? IMG.penguinTalk1 : IMG.penguinTalk2
  if (penguinImg) {
    drawGrounded(
      ctx,
      penguinImg,
      INTRO_SCENE.PENGUIN_X,
      INTRO_SCENE.PENGUIN_SIZE,
      INTRO_SCENE.PENGUIN_FACES_HERO,
    )
  }

  // Héroe — frame de caminata si camina, heroSide si quieto
  let heroImg = IMG.heroSide
  if (intro.step === INTRO_STEPS.WALK_IN || intro.step === INTRO_STEPS.WALK_OUT) {
    const frameIndex = Math.floor(intro.walkTime / INTRO_SCENE.WALK_FRAME_DURATION) % INTRO_SCENE.WALK_FRAME_COUNT
    const walkKey = `walk${frameIndex + 1}`
    heroImg = IMG[walkKey] || IMG.heroSide
  }
  if (heroImg) {
    drawGrounded(ctx, heroImg, intro.heroX, INTRO_SCENE.HERO_SIZE)
  }
}

export const drawIntroScene = (engine) => {
  const { ctx, IMG, G } = engine
  const intro = G.intro || INTRO_SCENE.INITIAL
  const atSea = isAtSea(intro)

  // 1. Fondo (o fallback)
  const bg = atSea ? IMG.islandShore : IMG.islandPath
  if (bg) {
    ctx.drawImage(bg, 0, 0, LAYOUT.W, LAYOUT.H)
  } else {
    ctx.fillStyle = atSea ? INTRO_SCENE.FALLBACK_SEA : INTRO_SCENE.FALLBACK_BG
    ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
  }

  // 2. Personajes
  if (atSea) drawSeaScene(engine, intro)
  else drawVillageScene(engine, intro)

  // 3. Hint de saltear (esquina superior derecha, no tapa personajes)
  drawTextOutlined(ctx, INTRO_SCENE.SKIP_HINT, LAYOUT.W - 70, 20, 9, '#9fb6d8')

  // 4. Caja de diálogo ARRIBA con efecto typewriter
  if (intro.step === INTRO_STEPS.TALK && intro.line < INTRO_LINES.length) {
    const line = INTRO_LINES[intro.line]
    const { w: dw, h: dh } = LAYOUT.DIALOGUE
    const dx = (LAYOUT.W - dw) / 2
    const dy = 6
    if (IMG.dlg) ctx.drawImage(IMG.dlg, dx, dy, dw, dh)
    drawText(ctx, line.speaker, dx + 80, dy + 16, 9, '#f5e6c8')

    // Typewriter: envolver PRIMERO, revelar DESPUÉS sobre líneas ya envueltas
    const revealedChars = Math.floor(intro.revealTime * INTRO_SCENE.REVEAL_CHARS_PER_SEC)
    const wrappedLines = wrapText(line.text, 40)
    let charsLeft = revealedChars
    wrappedLines.forEach((ln, i) => {
      if (charsLeft <= 0) return
      const visible = ln.slice(0, charsLeft)
      charsLeft -= ln.length
      drawText(ctx, visible, LAYOUT.W / 2, dy + 46 + i * 16, 12, '#4a3520')
    })

    // Mostrar "▼ ESPACIO" solo cuando la línea está completa
    const isComplete = revealedChars >= line.text.length
    if (isComplete && Math.floor(G.time * 2) % 2 === 0) {
      drawText(ctx, '▼ ESPACIO', dx + dw - 52, dy + dh - 14, 8, '#8a6d3f')
    }
  }

  // 5. Negro del corte. Va ÚLTIMO y tapa todo, incluido el hint de saltear: es un corte
  // de escena, no un velo de ambiente.
  const alpha = fadeAlpha(intro)
  if (alpha > 0) {
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
    ctx.globalAlpha = 1
  }
}
