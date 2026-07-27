import { GAME_STATES } from '../constants/GAME_STATES'
import { LAYOUT } from '../constants/LAYOUT'
import { MUSIC } from '../constants/MUSIC'
import { PHASE_CONFIG, PHASES } from '../constants/PHASES'
import { TIMING } from '../constants/TIMING'
import { assetsService } from '../services/assets.service'
import { musicService } from '../services/music.service'
import { sfxService } from '../services/sfx.service'
import { advance, closeCardInfo, confirmCardInfo, endRound, isCardPlayable, needsExplain, nextPlayableIndex, openCardInfo, pickCard, updateChooseTimer } from './battle/battleLogic'
import { registerParry, updateCombo } from './battle/combo'
import { updateAttack } from './battle/attack'
import { finisherDone, updateFinisher } from './battle/finisher'
import { updateIntroScene, skipIntroScene } from './scenes/introScene'
import { updateBriefing } from './scenes/briefingScene'
import { shoutReadyToAdvance, updateShout } from './scenes/bossShout'
import { createEffects } from './fx/effects'
import { drawBackground, drawBoss, drawHero, drawParticles } from './render/drawScene'
import { drawHUD } from './render/drawHUD'
import { cardIndexAt, cardInfoBadgeAt, drawCards, drawChosenCard } from './render/drawCards'
import { drawCardInfo } from './render/drawCardInfo'
import { drawAttack } from './render/drawAttack'
import { drawBossSpeech } from './render/drawBossSpeech'
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
  // El briefing es una foto quieta: nadie atacó todavía, así que corazones y barra especial
  // no informan nada y sólo compiten con la flecha que señala al jefe. La vida entra en
  // cuadro junto con el primer problema, que es cuando empieza a estar en juego.
  GAME_STATES.BRIEFING,
  GAME_STATES.TUTORIAL_CLEAR,
  GAME_STATES.REMATCH_INTRO,
  // El remate es una cinemática y va sin UI. No es sólo estética: el cartel del remate
  // choca contra el nombre del jefe en su barra de vida, y la barra especial llena
  // mientras el jefe explota no informa nada. La explosión ES el feedback.
  GAME_STATES.FINISH_LINE,
  GAME_STATES.FINISH_ANIM,
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
  // Sub-máquinas de escena. Nacen en null y las inicializa su propio módulo: así reset()
  // las borra sin que este archivo tenga que saber qué campos tienen adentro.
  intro: null,
  briefing: null,
  finisher: null,
  // Combo de parries (game/battle/combo.js) y grito tipeado del jefe
  // (game/scenes/bossShout.js). Mismo contrato que las tres de arriba.
  combo: null,
  shout: null,
})

export class GameEngine {
  constructor(canvas, { onScreenChange, onPauseRequest, initialState } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.ctx.imageSmoothingEnabled = false
    this.onScreenChange = onScreenChange
    // Aviso discreto de "el jugador apretó ESC". El motor NO dibuja el menú de pausa ni
    // sabe que existe: sólo avisa, igual que con onScreenChange. El overlay es DOM porque
    // una de sus opciones es volver al menú principal, y eso es estado de React.
    this.onPauseRequest = onPauseRequest
    this.paused = false
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
    // Halo blanco: lo usan las volutas de la nube del remate. Con círculos de borde duro
    // la nube se leía como tres pelotas planas pegadas en el cielo.
    this.IMG.glowWhite = assetsService.makeGlowSprite('rgb(255,255,255)', 24)
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
    // En pausa el motor se desconecta del teclado por completo: el overlay de pausa tiene
    // su propio listener y es el único que manda. Sin este corte, las flechas y el ESPACIO
    // seguirían jugando la partida por debajo del menú.
    if (this.paused) return
    const key = e.key
    // El mute se atiende antes que todo lo demás y en cualquier pantalla: es un control de
    // la aplicación, no una acción del juego. Está acá y también en useMainMenu porque son
    // los dos únicos lugares con listener de teclado, y no vale la pena un tercero.
    if (key === MUSIC.MUTE_KEY || key === MUSIC.MUTE_KEY.toUpperCase()) {
      musicService.toggleMute()
      return
    }
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
    // ESC abre la pausa, pero SÓLO acá abajo: arriba el bloque del panel de carta ya se
    // quedó con el ESC para cerrarse. Ese orden importa — si la pausa se atendiera antes,
    // el jugador que abre una ficha y aprieta ESC para cerrarla se comería el menú de
    // pausa con la ficha todavía abierta debajo.
    if (key === 'Escape') {
      if (this.onPauseRequest) this.onPauseRequest()
      return
    }
    if (G.state === GAME_STATES.CHOOSE) {
      if (key === 'i' || key === 'I') { openCardInfo(this, G.sel); return }
      if (key >= '1' && key <= '4') {
        G.sel = Number(key) - 1
        pickCard(this, G.sel)
      } else if (key === 'ArrowLeft') {
        // Las flechas SALTEAN las cartas no jugables. Si se pararan encima, el jugador
        // vería el cursor sobre una carta apagada y el ESPACIO no haría nada.
        G.sel = nextPlayableIndex(G, G.sel, -1)
        sfxService.select()
      } else if (key === 'ArrowRight') {
        G.sel = nextPlayableIndex(G, G.sel, 1)
        sfxService.select()
      } else if (key === 'Enter' || key === ' ') {
        pickCard(this, G.sel)
      }
      return
    }
    if (G.state === GAME_STATES.TIMING) {
      if (key === ' ' || key === 'Enter') registerParry(this)
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
      registerParry(this)
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
    // Mismo criterio que las flechas: el mouse tampoco deja la selección sobre una carta
    // que no se puede jugar. Pasar por encima de una bloqueada no mueve nada.
    if (index >= 0 && index !== G.sel && isCardPlayable(G, G.cards[index])) {
      G.sel = index
      sfxService.select()
    }
  }

  // ---------- Loop ----------
  setPaused(paused) {
    // lastTs se resetea al despausar y NO al pausar: si no, el primer frame después de la
    // pausa recibe un dt del tamaño de todo el rato que estuvo pausado. MAX_DT lo acota a
    // 50 ms, así que no explota, pero igual se ve como un salto.
    if (!paused) this.lastTs = performance.now()
    this.paused = paused
  }

  frame = (ts) => {
    if (this.destroyed) return
    // El rAF sigue vivo en pausa pero no se actualiza ni se dibuja: el canvas se queda con
    // el último frame pintado, que es justo lo que se quiere ver detrás del menú.
    if (this.paused) {
      this.rafId = requestAnimationFrame(this.frame)
      return
    }
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

    // El briefing sólo hace correr su typewriter. No tiene auto-avance a propósito: el
    // jugador acaba de ver al jefe por primera vez y la pantalla tiene que esperarlo.
    if (G.state === GAME_STATES.BRIEFING) updateBriefing(this, dt)

    if (G.state === GAME_STATES.CHOOSE) updateChooseTimer(this)

    // El grito del jefe se revela por dt mientras dura PROBLEM.
    if (G.state === GAME_STATES.PROBLEM) updateShout(this, dt)

    // El combo de parries: decide cuándo sale cada golpe y cierra la ronda.
    if (G.state === GAME_STATES.TIMING) updateCombo(this, dt)

    // Auto-avance de PROBLEM cuando la fase no pide input: en REMATCH el
    // problema encadena solo, sin ESPACIO. Ya está vivo — beginRematch y reset()
    // son los dos caminos que ponen la fase en REMATCH.
    //
    // La condición ya NO es un tiempo fijo: es "el grito terminó de revelarse". Con
    // PROBLEM_MIN_WAIT de 0.5 s la revancha se comía el problema antes de que se leyera —
    // era la mitad del bug que este feature vino a arreglar.
    if (G.state === GAME_STATES.PROBLEM &&
        !PHASE_CONFIG[G.phase].problemNeedsSpace &&
        shoutReadyToAdvance(G)) {
      this.setState(GAME_STATES.CHOOSE)
    }

    // Acá desaparecen las interrupciones de la revancha: si el jugador resolvió
    // limpio no hay pantalla de explicación ni ESPACIO que apretar, endRound
    // encadena directo al problema siguiente.
    if (G.state === GAME_STATES.RESOLVE && G.t > TIMING.RESOLVE_DURATION) {
      if (needsExplain(G)) this.setState(GAME_STATES.EXPLAIN)
      else endRound(this)
    }

    // El remate es una sub-máquina propia (CHARGE -> FIRE) y se lleva TODO lo que antes
    // estaba acá inline: el bossGone, las explosiones y su ritmo. Ver game/battle/finisher.
    if (G.state === GAME_STATES.FINISH_ANIM) {
      updateFinisher(this, dt)
      if (G.finisher && finisherDone(G.finisher)) {
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
      // El bocadillo del jefe SIGUE en pantalla mientras se elige la carta: el problema es
      // lo que hay que tener a la vista para poder decidir. Va antes de las cartas para que
      // la franja de foco de drawCards no lo tape.
      drawBossSpeech(this)
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
