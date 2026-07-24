import { GAME_STATES } from '../constants/GAME_STATES'
import { LAYOUT } from '../constants/LAYOUT'
import { TIMING } from '../constants/TIMING'
import { assetsService } from '../services/assets.service'
import { sfxService } from '../services/sfx.service'
import { advance, pickCard, timingPress } from './battle/battleLogic'
import { updateAttack } from './battle/attack'
import { createEffects } from './fx/effects'
import { drawBackground, drawBoss, drawHero, drawParticles } from './render/drawScene'
import { drawHUD } from './render/drawHUD'
import { cardIndexAt, drawCards, drawChosenCard } from './render/drawCards'
import { drawAttack } from './render/drawAttack'
import { drawLoadScreen, SCREEN_DRAWERS } from './render/drawScreens'

// Motor del juego: corre con requestAnimationFrame y muta su propio estado.
// NUNCA toca React por frame. Los cambios de pantalla se notifican con
// onScreenChange (evento discreto) para que el shell React reaccione.
const MAX_DT = 0.05
const NO_HUD_STATES = [GAME_STATES.TITLE, GAME_STATES.DEFEAT, GAME_STATES.VICTORY]
const REACT_SCREENS = {
  [GAME_STATES.LOAD]: 'LOAD',
  [GAME_STATES.TITLE]: 'TITLE',
  [GAME_STATES.VICTORY]: 'VICTORY',
  [GAME_STATES.DEFEAT]: 'DEFEAT',
}

const createInitialState = () => ({
  state: GAME_STATES.LOAD,
  t: 0,
  time: 0,
  round: 0,
  extraRound: false,
  hearts: TIMING.MAX_HEARTS,
  special: 0,
  perfects: 0,
  cards: [],
  wrong: new Set(),
  sel: 0,
  chosen: null,
  atk: null,
  lastResult: null,
  shake: 0,
  flashColor: null,
  flashAlpha: 0,
  bossHit: 0,
  bossGone: 0,
})

export class GameEngine {
  constructor(canvas, { onScreenChange } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.ctx.imageSmoothingEnabled = false
    this.onScreenChange = onScreenChange
    this.G = createInitialState()
    this.IMG = {}
    this.loadErrors = []
    this.effects = createEffects()
    this.rafId = null
    this.lastTs = 0
    this.destroyed = false
  }

  async init() {
    const { images, errors } = await assetsService.loadAll()
    this.IMG = images
    this.loadErrors = errors
    // pre-render de efectos costosos (una sola vez)
    if (images.boss) this.IMG.bossWhite = assetsService.makeWhiteSprite(images.boss)
    this.IMG.glowRed = assetsService.makeGlowSprite('rgb(255,68,51)', 24)
    this.IMG.glowCyan = assetsService.makeGlowSprite('rgb(125,224,255)', 24)
    this.setState(GAME_STATES.TITLE)
    this.lastTs = performance.now()
    this.rafId = requestAnimationFrame(this.frame)
  }

  destroy() {
    this.destroyed = true
    if (this.rafId) cancelAnimationFrame(this.rafId)
  }

  setState(state) {
    this.G.state = state
    this.G.t = 0
    if (this.onScreenChange) {
      this.onScreenChange(REACT_SCREENS[state] ?? 'BATTLE', {
        perfects: this.G.perfects,
        hearts: this.G.hearts,
      })
    }
  }

  flash(color, alpha = 0.6) {
    this.G.flashColor = color
    this.G.flashAlpha = alpha
  }

  reset() {
    this.G = createInitialState()
    this.effects.clear()
    this.setState(GAME_STATES.TITLE)
  }

  // ---------- Input (lo conecta el hook de React) ----------
  handleKeyDown = (e) => {
    const { G } = this
    if (G.state === GAME_STATES.LOAD) return
    const key = e.key
    if (key === 'r' || key === 'R') {
      this.reset()
      return
    }
    if (G.state === GAME_STATES.CHOOSE) {
      if (key >= '1' && key <= '4') {
        G.sel = Number(key) - 1
        pickCard(this, G.sel)
      } else if (key === 'ArrowLeft') {
        G.sel = (G.sel + 3) % 4
        sfxService.select()
      } else if (key === 'ArrowRight') {
        G.sel = (G.sel + 1) % 4
        sfxService.select()
      } else if (key === 'Enter' || key === ' ') {
        pickCard(this, G.sel)
      }
      return
    }
    if (G.state === GAME_STATES.TIMING) {
      if (key === ' ' || key === 'Enter') timingPress(this)
      return
    }
    if (key === ' ' || key === 'Enter') advance(this)
  }

  canvasCoords = (e) => {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) * LAYOUT.W) / rect.width,
      y: ((e.clientY - rect.top) * LAYOUT.H) / rect.height,
    }
  }

  handleMouseDown = (e) => {
    const { G } = this
    if (G.state === GAME_STATES.LOAD) return
    if (G.state === GAME_STATES.CHOOSE) {
      const { x, y } = this.canvasCoords(e)
      const index = cardIndexAt(x, y)
      if (index >= 0) {
        G.sel = index
        pickCard(this, index)
      }
    } else if (G.state === GAME_STATES.TIMING) {
      timingPress(this)
    } else {
      advance(this)
    }
  }

  handleMouseMove = (e) => {
    const { G } = this
    if (G.state !== GAME_STATES.CHOOSE) return
    const { x, y } = this.canvasCoords(e)
    const index = cardIndexAt(x, y)
    if (index >= 0 && index !== G.sel) {
      G.sel = index
      sfxService.select()
    }
  }

  // ---------- Loop ----------
  frame = (ts) => {
    if (this.destroyed) return
    const dt = Math.min(MAX_DT, (ts - this.lastTs) / 1000 || 0.016)
    this.lastTs = ts
    this.update(dt)
    this.draw()
    this.rafId = requestAnimationFrame(this.frame)
  }

  update(dt) {
    const { G, effects } = this
    G.t += dt
    G.time += dt
    G.shake = Math.max(0, G.shake - dt * 30)
    G.bossHit = Math.max(0, G.bossHit - dt)
    if (G.flashAlpha > 0) G.flashAlpha = Math.max(0, G.flashAlpha - dt * 1.8)

    effects.update(dt)
    updateAttack(this, dt)

    if (G.state === GAME_STATES.RESOLVE && G.t > TIMING.RESOLVE_DURATION) {
      this.setState(GAME_STATES.EXPLAIN)
    }

    if (G.state === GAME_STATES.FINISH_ANIM) {
      G.bossGone = Math.min(1, G.t / TIMING.FINISH_BREAK_DURATION)
      if (G.t % 0.28 < dt && G.bossGone < 0.9) {
        effects.emit(
          LAYOUT.BOSS.x + (Math.random() - 0.5) * 140,
          LAYOUT.BOSS.y + (Math.random() - 0.5) * 120,
          18,
          ['#ff9d3b', '#ffdd55', '#888888', '#ff5533'],
          160,
          0.9,
        )
        G.shake = 9
        sfxService.boom()
      }
      if (G.t > TIMING.FINISH_TOTAL_DURATION) {
        this.flash('#ffffff', 1)
        this.setState(GAME_STATES.VICTORY)
        sfxService.perfect()
      }
    }
  }

  draw() {
    const { ctx, G } = this
    ctx.save()
    if (G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake)
    }

    drawBackground(this)

    if (G.state === GAME_STATES.LOAD) {
      drawLoadScreen(this)
      ctx.restore()
      return
    }

    if (G.state !== GAME_STATES.VICTORY && G.state !== GAME_STATES.TITLE) {
      drawBoss(this)
      drawHero(this)
    }

    if (G.state === GAME_STATES.CHOOSE) {
      drawCards(this)
    } else if (G.state === GAME_STATES.TIMING) {
      drawChosenCard(this)
      drawAttack(this)
    } else if (G.state === GAME_STATES.RESOLVE) {
      drawChosenCard(this)
    } else if (SCREEN_DRAWERS[G.state]) {
      SCREEN_DRAWERS[G.state](this)
    }

    drawParticles(this)
    if (!NO_HUD_STATES.includes(G.state)) drawHUD(this)
    ctx.restore()

    if (G.flashAlpha > 0) {
      ctx.globalAlpha = G.flashAlpha
      ctx.fillStyle = G.flashColor
      ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
      ctx.globalAlpha = 1
    }
  }
}
