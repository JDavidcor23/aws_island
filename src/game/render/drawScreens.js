import { GAME_STATES } from '../../constants/GAME_STATES'
import { LAYOUT } from '../../constants/LAYOUT'
import { PHASES } from '../../constants/PHASES'
import { PROBLEM_STAGING } from '../../constants/PROBLEM_STAGING'
import { UI_TEXTS } from '../../constants/UI_TEXTS'
import { currentRound } from '../battle/battleLogic'
import { drawBoss, drawHero } from './drawScene'
import { drawBossSpeech } from './drawBossSpeech'
import { drawDialogue } from './drawDialogue'
import { drawText, drawTextOutlined } from './textHelpers'
import { drawIntroScene } from './drawIntroScene'
import { drawBriefing } from './drawBriefing'
import { drawFinisher } from './drawFinisher'
import { drawRematchIntroScreen, drawTutorialClearScreen } from './drawPhaseScreens'

// Pantallas y overlays: título, diálogos, remate, victoria y derrota.

// drawDialogue se mudó a su propio módulo para no cerrar un ciclo con
// drawPhaseScreens. Se re-exporta porque era parte de la API de este archivo.
export { drawDialogue }

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

export const drawProblemScreen = (engine) => {
  const { ctx, G } = engine
  const intensity = Math.min(1, G.t * 3)
  ctx.fillStyle = `rgba(255,30,30,${0.18 * intensity * (0.5 + 0.5 * Math.sin(G.time * 6))})`
  ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
  const { BANG } = PROBLEM_STAGING
  drawTextOutlined(ctx, BANG.char, LAYOUT.BOSS.x + BANG.dx, LAYOUT.BOSS.y + BANG.dy, BANG.size, BANG.color)
  // El grito ya no va en la caja de diálogo de abajo: es un bocadillo anclado al jefe que se
  // tipea acá y SIGUE en pantalla durante CHOOSE (lo dibuja GameEngine.draw). La caja de
  // abajo duraba medio segundo en la revancha y el problema no se alcanzaba a leer.
  drawBossSpeech(engine)
}

export const drawExplainScreen = (engine) => {
  const { G } = engine
  drawPenguin(engine)
  const prefix = G.lastResult === 'miss' ? UI_TEXTS.EXPLAIN_MISS_PREFIX : UI_TEXTS.EXPLAIN_HIT_PREFIX
  // El primer EXPLAIN del tutorial es el único momento del juego en que el jugador acaba
  // de sentir que la ayuda vino de AFUERA de la isla: ahí se nombra la nube en lugar de
  // explicar la característica. Un concepto por momento.
  //
  // G.round todavía vale 0 acá y no hay off-by-one: endRound incrementa la ronda DESPUÉS
  // de este EXPLAIN (advance -> case EXPLAIN -> endRound -> G.round++).
  //
  // Y los dos prefijos de arriba alcanzan porque en el tutorial esta pantalla solo se
  // llega con la carta CORRECTA: pickCard únicamente pasa a TIMING si acertaste, y el
  // tutorial no tiene timeout. Lo único que pudo fallar es el timing.
  const isFirstTutorialExplain = G.phase === PHASES.TUTORIAL && G.round === 0
  const body = isFirstTutorialExplain ? UI_TEXTS.TUTORIAL_CLOUD_REVEAL : currentRound(G).expl
  drawDialogue(engine, 'MENTOR 🐧', prefix + body)
}

export const drawFinishLineScreen = (engine) => {
  const { ctx } = engine
  ctx.fillStyle = 'rgba(4,6,20,0.45)'
  ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
  drawHero(engine)
  drawDialogue(engine, 'HÉROE', UI_TEXTS.HERO_FINISHER)
}

export const drawVictoryScreen = (engine) => {
  const { ctx, IMG, G, effects } = engine
  drawHero(engine)
  if (IMG.penguin) ctx.drawImage(IMG.penguin, LAYOUT.HERO.x + 50, LAYOUT.HERO.y - 26, 56, 56)
  if (Math.random() < 0.3) {
    effects.emit(Math.random() * LAYOUT.W, -5, 1, ['#ffd94a', '#7de0ff', '#7dff7d', '#ff9d7a'], 10, 2.5)
  }
  drawTextOutlined(ctx, '¡LA ISLA REVIVE!', LAYOUT.W / 2, 60, 28, '#ffd94a')
  drawTextOutlined(ctx, UI_TEXTS.VICTORY_PAYOFF, LAYOUT.W / 2, 92, 13, '#ffffff')
  drawTextOutlined(ctx, `Perfects: ${G.perfects}   Corazones: ${G.hearts}/4`, LAYOUT.W / 2, 120, 11, '#ffffff')
  // Acá se nombra Amazon por primera y única vez fuera de la intro. AWS NO se dice en la
  // Isla 0: entra en la Isla 1, junto con el primer servicio con nombre propio.
  drawTextOutlined(ctx, UI_TEXTS.VICTORY_NEXT_ISLAND, LAYOUT.W / 2, LAYOUT.H - 60, 13, '#9fb6d8')
  if (Math.floor(G.time * 2) % 2 === 0) {
    drawTextOutlined(ctx, 'R para jugar de nuevo', LAYOUT.W / 2, LAYOUT.H - 32, 10, '#ffd94a')
  }
}

export const drawDefeatScreen = (engine) => {
  const { ctx, G } = engine
  // 0.62 y no 0.72: el héroe caído es lo que hay que VER en esta pantalla, y el velo lo
  // dejaba al 28%. Igual se lo vuelve a dibujar encima del velo — GameEngine ya lo pintó
  // debajo, y ese orden lo tapa. Es el mismo criterio que el panel de carta, que va al
  // final de todo justamente para que nada le caiga encima.
  ctx.fillStyle = 'rgba(10,4,4,0.62)'
  ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
  drawHero(engine)
  drawTextOutlined(ctx, UI_TEXTS.DEFEAT_TITLE, LAYOUT.W / 2, 140, 18, '#ff8866')
  drawTextOutlined(ctx, UI_TEXTS.DEFEAT_STAKE, LAYOUT.W / 2, 168, 12, '#ffffff')
  if (Math.floor(G.time * 2) % 2 === 0) {
    drawTextOutlined(ctx, 'R para reintentar', LAYOUT.W / 2, 220, 12, '#ffd94a')
  }
}

export const drawLoadScreen = (engine) => {
  drawText(engine.ctx, 'Cargando...', LAYOUT.W / 2, LAYOUT.H / 2, 14)
}

export const SCREEN_DRAWERS = {
  [GAME_STATES.TITLE]: drawTitleScreen,
  [GAME_STATES.INTRO]: drawIntroScene,
  [GAME_STATES.BRIEFING]: drawBriefing,
  [GAME_STATES.PROBLEM]: drawProblemScreen,
  [GAME_STATES.EXPLAIN]: drawExplainScreen,
  [GAME_STATES.TUTORIAL_CLEAR]: drawTutorialClearScreen,
  [GAME_STATES.REMATCH_INTRO]: drawRematchIntroScreen,
  [GAME_STATES.FINISH_LINE]: drawFinishLineScreen,
  [GAME_STATES.FINISH_ANIM]: drawFinisher,
  [GAME_STATES.VICTORY]: drawVictoryScreen,
  [GAME_STATES.DEFEAT]: drawDefeatScreen,
}
