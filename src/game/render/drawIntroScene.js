import { LAYOUT } from '../../constants/LAYOUT'
import { INTRO_SCENE, INTRO_STEPS, INTRO_LINES } from '../../constants/INTRO_SCENE'
import { drawText, drawTextOutlined, wrapText } from './textHelpers'

// Helper: ancla sprites por los PIES, no por el centro.
// La esquina superior va en GROUND_Y - size (los pies tocan GROUND_Y).
const drawGrounded = (ctx, img, centerX, size) => {
  ctx.drawImage(
    img,
    Math.round(centerX - size / 2),
    Math.round(INTRO_SCENE.GROUND_Y - size),
    size,
    size,
  )
}

export const drawIntroScene = (engine) => {
  const { ctx, IMG, G } = engine
  const intro = G.intro || INTRO_SCENE.INITIAL

  // 1. Fondo (o fallback)
  if (IMG.islandPath) {
    ctx.drawImage(IMG.islandPath, 0, 0, LAYOUT.W, LAYOUT.H)
  } else {
    ctx.fillStyle = INTRO_SCENE.FALLBACK_BG
    ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
  }

  // 2. Pingüino — alterna frames si está hablando
  const talking = intro.step === INTRO_STEPS.TALK
  const mouthOpen = Math.floor(G.time / INTRO_SCENE.PENGUIN_TALK_FRAME_DURATION) % 2 === 0
  const penguinImg = talking && mouthOpen ? IMG.penguinTalk1 : IMG.penguinTalk2
  if (penguinImg) {
    drawGrounded(ctx, penguinImg, INTRO_SCENE.PENGUIN_X, INTRO_SCENE.PENGUIN_SIZE)
  }

  // 3. Héroe — frame de caminata si camina, heroSide si quieto
  let heroImg = IMG.heroSide
  if (intro.step === INTRO_STEPS.WALK_IN || intro.step === INTRO_STEPS.WALK_OUT) {
    const frameIndex = Math.floor(intro.walkTime / INTRO_SCENE.WALK_FRAME_DURATION) % INTRO_SCENE.WALK_FRAME_COUNT
    const walkKey = `walk${frameIndex + 1}`
    heroImg = IMG[walkKey] || IMG.heroSide
  }
  if (heroImg) {
    drawGrounded(ctx, heroImg, intro.heroX, INTRO_SCENE.HERO_SIZE)
  }

  // 4. Hint de saltear (esquina superior derecha, no tapa personajes)
  drawTextOutlined(ctx, INTRO_SCENE.SKIP_HINT, LAYOUT.W - 70, 20, 9, '#9fb6d8')

  // 5. Caja de diálogo ARRIBA con efecto typewriter
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
}
