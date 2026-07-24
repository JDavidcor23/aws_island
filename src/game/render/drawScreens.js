import { GAME_STATES } from '../../constants/GAME_STATES'
import { LAYOUT } from '../../constants/LAYOUT'
import { UI_TEXTS } from '../../constants/UI_TEXTS'
import { currentRound } from '../battle/battleLogic'
import { drawBoss, drawHero } from './drawScene'
import { drawText, drawTextOutlined, wrapText } from './textHelpers'

// Pantallas y overlays: título, diálogos, remate, victoria y derrota.

export const drawDialogue = (engine, speaker, msg, blink = true) => {
  const { ctx, IMG, G } = engine
  const { w: dw, h: dh } = LAYOUT.DIALOGUE
  const dx = (LAYOUT.W - dw) / 2
  const dy = LAYOUT.H - dh - 6
  if (IMG.dlg) ctx.drawImage(IMG.dlg, dx, dy, dw, dh)
  drawText(ctx, speaker, dx + 80, dy + 16, 9, '#f5e6c8')
  wrapText(msg, 40).forEach((line, i) => {
    drawText(ctx, line, LAYOUT.W / 2, dy + 46 + i * 16, 12, '#4a3520')
  })
  if (blink && Math.floor(G.time * 2) % 2 === 0) {
    drawText(ctx, '▼ ESPACIO', dx + dw - 52, dy + dh - 14, 8, '#8a6d3f')
  }
}

const drawPenguin = (engine) => {
  const { ctx, IMG } = engine
  if (IMG.penguin) ctx.drawImage(IMG.penguin, LAYOUT.W - 120, LAYOUT.H - 196, 72, 72)
}

export const drawTitleScreen = (engine) => {
  const { ctx, G } = engine
  ctx.fillStyle = 'rgba(4,6,20,0.55)'
  ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
  drawBoss(engine)
  drawHero(engine)
  drawTextOutlined(ctx, 'CLOUD QUEST', LAYOUT.W / 2, 92, 40, '#7de0ff')
  drawTextOutlined(ctx, 'Isla 0 — Fundamentos de la Nube', LAYOUT.W / 2, 126, 13, '#ffffff')
  if (Math.floor(G.time * 2) % 2 === 0) {
    drawTextOutlined(ctx, 'ESPACIO para comenzar', LAYOUT.W / 2, LAYOUT.H - 44, 13, '#ffd94a')
  }
  if (engine.loadErrors.length) {
    drawText(ctx, '⚠ no cargó: ' + engine.loadErrors.join(', '), LAYOUT.W / 2, LAYOUT.H - 14, 8, '#ff8866')
  }
}

export const drawIntroScreen = (engine) => {
  drawPenguin(engine)
  drawDialogue(engine, 'MENTOR 🐧', UI_TEXTS.INTRO_MENTOR)
}

export const drawProblemScreen = (engine) => {
  const { ctx, G } = engine
  const intensity = Math.min(1, G.t * 3)
  ctx.fillStyle = `rgba(255,30,30,${0.18 * intensity * (0.5 + 0.5 * Math.sin(G.time * 6))})`
  ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
  drawTextOutlined(ctx, '!!', LAYOUT.BOSS.x + 70, LAYOUT.BOSS.y - 100, 26, '#ff5544')
  drawDialogue(engine, 'LEGACY SERVER', currentRound(G).prob)
}

export const drawExplainScreen = (engine) => {
  const { G } = engine
  drawPenguin(engine)
  const prefix = G.lastResult === 'miss' ? UI_TEXTS.EXPLAIN_MISS_PREFIX : UI_TEXTS.EXPLAIN_HIT_PREFIX
  drawDialogue(engine, 'MENTOR 🐧', prefix + currentRound(G).expl)
}

export const drawFinishLineScreen = (engine) => {
  const { ctx } = engine
  ctx.fillStyle = 'rgba(4,6,20,0.45)'
  ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
  drawHero(engine)
  drawDialogue(engine, 'HÉROE', UI_TEXTS.HERO_FINISHER)
}

export const drawFinishAnimScreen = (engine) => {
  const { ctx, G } = engine
  // nube gigante creciendo detrás del héroe
  const growth = Math.min(1, G.t / 1.2)
  ctx.globalAlpha = 0.85 * growth
  ctx.fillStyle = '#ffffff'
  const cx = LAYOUT.HERO.x + 40
  const cy = LAYOUT.HERO.y - 120 - growth * 30
  const R = 30 + growth * 55
  const puffs = [
    [0, 0, 1],
    [-1.1, 0.25, 0.7],
    [1.1, 0.25, 0.75],
    [-0.5, -0.45, 0.65],
    [0.55, -0.5, 0.6],
  ]
  for (const [ox, oy, scale] of puffs) {
    ctx.beginPath()
    ctx.arc(cx + ox * R, cy + oy * R, R * scale, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  drawTextOutlined(ctx, '☁ LA NUBE RESPONDE ☁', LAYOUT.W / 2, 40, 16, '#ffffff')
}

export const drawVictoryScreen = (engine) => {
  const { ctx, IMG, G, effects } = engine
  drawHero(engine)
  if (IMG.penguin) ctx.drawImage(IMG.penguin, LAYOUT.HERO.x + 50, LAYOUT.HERO.y - 26, 56, 56)
  if (Math.random() < 0.3) {
    effects.emit(Math.random() * LAYOUT.W, -5, 1, ['#ffd94a', '#7de0ff', '#7dff7d', '#ff9d7a'], 10, 2.5)
  }
  drawTextOutlined(ctx, '¡LA ISLA REVIVE!', LAYOUT.W / 2, 60, 28, '#ffd94a')
  drawTextOutlined(ctx, 'Bienvenido al mundo Cloud.', LAYOUT.W / 2, 92, 13, '#ffffff')
  drawTextOutlined(ctx, `Perfects: ${G.perfects}   Corazones: ${G.hearts}/4`, LAYOUT.W / 2, 120, 11, '#ffffff')
  drawTextOutlined(ctx, '🔒 Isla 1: EC2 — Próximamente...', LAYOUT.W / 2, LAYOUT.H - 60, 13, '#9fb6d8')
  if (Math.floor(G.time * 2) % 2 === 0) {
    drawTextOutlined(ctx, 'R para jugar de nuevo', LAYOUT.W / 2, LAYOUT.H - 32, 10, '#ffd94a')
  }
}

export const drawDefeatScreen = (engine) => {
  const { ctx, G } = engine
  ctx.fillStyle = 'rgba(10,4,4,0.72)'
  ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
  drawTextOutlined(ctx, 'El Legacy Server sigue en pie...', LAYOUT.W / 2, 140, 18, '#ff8866')
  drawTextOutlined(ctx, 'Pero ya sabés cómo vencerlo.', LAYOUT.W / 2, 168, 12, '#ffffff')
  if (Math.floor(G.time * 2) % 2 === 0) {
    drawTextOutlined(ctx, 'R para reintentar', LAYOUT.W / 2, 220, 12, '#ffd94a')
  }
}

export const drawLoadScreen = (engine) => {
  drawText(engine.ctx, 'Cargando...', LAYOUT.W / 2, LAYOUT.H / 2, 14)
}

export const SCREEN_DRAWERS = {
  [GAME_STATES.TITLE]: drawTitleScreen,
  [GAME_STATES.INTRO]: drawIntroScreen,
  [GAME_STATES.PROBLEM]: drawProblemScreen,
  [GAME_STATES.EXPLAIN]: drawExplainScreen,
  [GAME_STATES.FINISH_LINE]: drawFinishLineScreen,
  [GAME_STATES.FINISH_ANIM]: drawFinishAnimScreen,
  [GAME_STATES.VICTORY]: drawVictoryScreen,
  [GAME_STATES.DEFEAT]: drawDefeatScreen,
}
