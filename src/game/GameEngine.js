import { GAME_STATES } from '../constants/GAME_STATES'
import { LAYOUT } from '../constants/LAYOUT'
import { PHASE_CONFIG, PHASES } from '../constants/PHASES'
import { TIMING } from '../constants/TIMING'
import { assetsService } from '../services/assets.service'
import { sfxService } from '../services/sfx.service'
import { advance, closeCardInfo, confirmCardInfo, endRound, needsExplain, openCardInfo, pickCard, timingPress, updateChooseTimer } from './battle/battleLogic'
import { updateAttack } from './battle/attack'
import { updateIntroScene, skipIntroScene } from './scenes/introScene'
import { createEffects } from './fx/effects'
import { drawBackground, drawBoss, drawHero, drawParticles } from './render/drawScene'
import { drawHUD } from './render/drawHUD'
import { cardIndexAt, cardInfoBadgeAt, drawCards, drawChosenCard } from './render/drawCards'
import { drawCardInfo } from './render/drawCardInfo'
import { drawAttack } from './render/drawAttack'
import { drawLoadScreen, SCREEN_DRAWERS } from './render/drawScreens'

// Motor del juego: corre con requestAnimationFrame y muta su propio estado.
// NUNCA toca React por frame. Los cambios de pantalla se notifican con
// onScreenChange (evento discreto) para que el shell React reaccione.
const MAX_DT = 0.05
// Las dos bisagras de fase van acá: en la antesala los corazones todavía no se
// repusieron (eso lo hace beginRematch) y mostrar la vida vieja confunde.
const NO_HUD_STATES = [
  GAME_STATES.TITLE,
  GAME_STATES.INTRO,
  GAME_STATES.TUTORIAL_CLEAR,
  GAME_STATES.REMATCH_INTRO,
  GAME_STATES.DEFEAT,
  GAME_STATES.VICTORY,
]
// Pantallas que pintan su propia escena completa de punta a punta.
// Poner el jefe y el héroe de la arena debajo no era solo trabajo perdido: drawBoss
// emite vapor ambiente en CADA frame, y drawParticles corre DESPUÉS de la escena, o
// sea encima. Con INTRO fuera de esta lista, el vapor del jefe caía sobre la isla del
// tutorial con gravedad y se leía como nieve — en el tutorial y en toda la intro.
const OWN_SCENE_STATES = [
  GAME_STATES.TITLE,
  GAME_STATES.INTRO,
  GAME_STATES.VICTORY,
]
const REACT_SCREENS = {
  [GAME_STATES.LOAD]: 'LOAD',
  [GAME_STATES.TITLE]: 'TITLE',
  [GAME_STATES.VICTORY]: 'VICTORY',
  [GAME_STATES.DEFEAT]: 'DEFEAT',
}

const createInitialState = () => ({
  state: GAME_STATES.LOAD,
  phase: PHASES.TUTORIAL,
  tutorialDone: false,
  order: [0, 1, 2, 3],
  infoCard: null,
  infoSeen: new Set(),
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
  constructor(canvas, { onScreenChange, initialState } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.ctx.imageSmoothingEnabled = false
    this.onScreenChange = onScreenChange
    // Pantalla en la que arranca el motor. El menú entra directo a INTRO para que
    // el jugador no vea dos pantallas de título seguidas.
    this.initialState = initialState ?? GAME_STATES.TITLE
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
    this.setState(this.initialState)
    this.lastTs = performance.now()
    this.rafId = requestAnimationFrame(this.frame)
  }

  destroy() {
    this.destroyed = true
    if (this.rafId) cancelAnimationFrame(this.rafId)
  }

  setState(state) {
    this.G.infoCard = null   // el panel es exclusivo de CHOOSE: cualquier transición lo descarta (trampa 6)
    this.G.state = state
    this.G.t = 0
    if (this.onScreenChange) {
      this.onScreenChange(
        REACT_SCREENS[state] ?? 'BATTLE',
        { perfects: this.G.perfects, hearts: this.G.hearts },
        state, // fase cruda: REACT_SCREENS colapsa las 12 fases en 5 pantallas
      )
    }
  }

  flash(color, alpha = 0.6) {
    this.G.flashColor = color
    this.G.flashAlpha = alpha
  }

  reset() {
    // tutorialDone es el ÚNICO bit que sobrevive al reset: el que ya superó el
    // tutorial no lo vuelve a jugar por apretar R (req 6.2).
    const tutorialDone = this.G.tutorialDone
    this.G = createInitialState()
    this.effects.clear()
    if (tutorialDone) {
      this.G.tutorialDone = true
      this.G.phase = PHASES.REMATCH
      // Cae en la antesala y NO en startRound ni beginRematch: así beginRematch
      // (el ESPACIO de esta pantalla) queda como el único lugar que inicializa
      // corazones, especial y orden de problemas.
      this.setState(GAME_STATES.REMATCH_INTRO)
      return
    }
    // Sin tutorial superado vuelve a donde arrancó, no a TITLE: si el jugador
    // entró desde el menú, reiniciar no lo tiene que devolver a una pantalla
    // que ya no se usa.
    this.setState(this.initialState)
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
    if (G.state === GAME_STATES.INTRO && (key === 't' || key === 'T')) {
      skipIntroScene(this)
      return
    }
    // R y el skip de la intro ya se atendieron arriba: de acá abajo el panel se queda con todo el input
    if (G.infoCard) {
      if (key === 'i' || key === 'I' || key === 'Escape') { closeCardInfo(this); return }
      // En el tutorial el panel es el paso de confirmación, así que acá ESPACIO SÍ juega
      // la carta. En la revancha no: ahí el panel es consulta voluntaria contra el reloj
      // y confirmar desde él sería una trampa (el segundo ESPACIO de abrirlo jugaría solo).
      // e.repeat es obligatorio: sin él, mantener ESPACIO abre el panel y el auto-repeat
      // lo confirma en el mismo frame — nunca llegarías a leerlo.
      if ((key === ' ' || key === 'Enter') && !e.repeat && PHASE_CONFIG[G.phase].openInfoOnPick) {
        confirmCardInfo(this)
        return
      }
      // 1-4 con el panel abierto: la MISMA carta la confirma, otra carta abre SU ficha.
      // Sin esto, el que elige con el teclado apretaba '1', se le abría el panel, apretaba
      // '1' otra vez y el panel se comía la tecla sin hacer nada.
      if (key >= '1' && key <= '4' && PHASE_CONFIG[G.phase].openInfoOnPick) {
        const index = Number(key) - 1
        if (G.cards[index] === G.infoCard) confirmCardInfo(this)
        else openCardInfo(this, index)
      }
      return
    }
    if (G.state === GAME_STATES.CHOOSE) {
      if (key === 'i' || key === 'I') { openCardInfo(this, G.sel); return }
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
    // Panel abierto: el clic resuelve el panel antes de cualquier otra cosa.
    // En el tutorial JUEGA la carta que estás leyendo (el panel es el paso de
    // confirmación); en la revancha solo cierra, como hasta ahora.
    if (G.infoCard) {
      if (PHASE_CONFIG[G.phase].openInfoOnPick) confirmCardInfo(this)
      else closeCardInfo(this)
      return
    }
    if (G.state === GAME_STATES.CHOOSE) {
      const { x, y } = this.canvasCoords(e)
      // Badge PRIMERO: su área queda dentro del rectángulo de cardIndexAt (trampa 3).
      // Tercer argumento obligatorio: replica el lift de selección (trampa 5).
      const badge = cardInfoBadgeAt(x, y, G.sel)
      if (badge >= 0) { openCardInfo(this, badge); return }
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
    // Con el panel abierto el mouse no cambia la selección por abajo
    if (G.infoCard) return
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

    if (G.state === GAME_STATES.INTRO) updateIntroScene(this, dt)

    if (G.state === GAME_STATES.CHOOSE) updateChooseTimer(this)

    // Auto-avance de PROBLEM cuando la fase no pide input: en REMATCH el
    // problema encadena solo, sin ESPACIO. Ya está vivo — beginRematch y reset()
    // son los dos caminos que ponen la fase en REMATCH.
    if (G.state === GAME_STATES.PROBLEM &&
        !PHASE_CONFIG[G.phase].problemNeedsSpace &&
        G.t > TIMING.PROBLEM_MIN_WAIT) {
      this.setState(GAME_STATES.CHOOSE)
    }

    // Acá desaparecen las interrupciones de la revancha: si el jugador resolvió
    // limpio no hay pantalla de explicación ni ESPACIO que apretar, endRound
    // encadena directo al problema siguiente.
    if (G.state === GAME_STATES.RESOLVE && G.t > TIMING.RESOLVE_DURATION) {
      if (needsExplain(G)) this.setState(GAME_STATES.EXPLAIN)
      else endRound(this)
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

    if (!OWN_SCENE_STATES.includes(G.state)) {
      drawBoss(this)
      drawHero(this)
    }

    if (G.state === GAME_STATES.CHOOSE) {
      drawCards(this)
      // El panel NO se dibuja acá: es un modal y va al final de draw(). Ver abajo.
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

    // El panel de carta es un MODAL: va al final de TODO, después del HUD y del flash.
    // Estaba pegado abajo de drawCards, y como después de ese punto todavía se dibujan
    // las partículas, el HUD, la barra de vida del jefe y los textos flotantes, todo eso
    // le caía ENCIMA del velo: la barra del jefe tapaba el título de la carta y el vapor
    // del jefe caía adentro del recuadro. No era un problema de coordenadas, era de orden.
    // Va fuera del ctx.restore() a propósito: un modal no tiembla con el shake.
    if (G.state === GAME_STATES.CHOOSE && G.infoCard) drawCardInfo(this)
  }
}
