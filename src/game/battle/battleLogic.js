import { GAME_STATES } from '../../constants/GAME_STATES'
import { ROUNDS } from '../../constants/ROUNDS'
import { CARD_IDS } from '../../constants/CARDS'
import { LAYOUT } from '../../constants/LAYOUT'
import { PHASE_CONFIG, PHASES } from '../../constants/PHASES'
import { TIMING } from '../../constants/TIMING'
import { sfxService } from '../../services/sfx.service'
import { advanceIntroScene } from '../scenes/introScene'

// Reglas del combate: rondas, elección de carta, bloqueo con timing y vida.
// Todas las funciones reciben el engine y mutan su estado G (nunca React).

export const currentRound = (G) => ROUNDS[G.order[G.round % ROUNDS.length]]

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const startRound = (engine) => {
  const { G } = engine
  G.lastResult = null   // trampa 1: sin esto un miss pasado hace que needsExplain mienta en todas las rondas siguientes
  G.infoCard = null     // trampa 2: sin esto el panel queda pintado sobre PROBLEM y se come todo el input
  // infoSeen es estado POR RONDA, y startRound es su único dueño.
  // El gate del tutorial tiene que pedir la lectura en las cuatro rondas: leer
  // "Elasticidad Rápida" en el problema 1 no te dice nada sobre si sirve para el
  // problema 3, y ahí está justamente lo que hay que aprender a descartar.
  // Sin este reset el gate se apagaba solo: para la ronda 3 ya habías visto todas las
  // cartas y no volvía a abrir ni una. Y al revés, no resetearlo NUNCA obligaría a
  // releer la misma carta varias veces dentro de una misma ronda: fricción sin nada
  // que enseñar.
  G.infoSeen = new Set()
  G.cards = shuffle(CARD_IDS)
  G.wrong = new Set()
  G.sel = 0
  G.chosen = null
  G.atk = null
  engine.setState(GAME_STATES.PROBLEM)
  G.shake = 8
  sfxService.shout()
}

export const loseHeart = (engine) => {
  const { G, effects } = engine
  G.hearts--
  sfxService.wrong()
  G.shake = 10
  engine.flash('#ff2222', 0.35)
  effects.addFloat(
    LAYOUT.HUD.heartX + G.hearts * LAYOUT.HUD.heartGap + 13,
    LAYOUT.HUD.heartY + 30,
    '💔',
    '#ff5555',
    14,
  )
  if (G.hearts <= 0) {
    engine.setState(GAME_STATES.DEFEAT)
    sfxService.miss()
  }
  return G.hearts > 0
}

export const updateChooseTimer = (engine) => {
  const { G, effects } = engine
  if (G.state !== GAME_STATES.CHOOSE) return
  // El límite lo decide la fase, no la ronda: null = sin temporizador (TUTORIAL)
  const limit = PHASE_CONFIG[G.phase].chooseTimeLimit
  if (limit === null) return
  if (G.t >= limit) {
    // Timeout: mismo efecto que un Miss — pierde corazón y el ataque entra
    effects.addFloat(LAYOUT.W / 2, 120, '¡Se acabó el tiempo!', '#ff5544', 13)
    sfxService.miss()
    // needsExplain lee lastResult: sin esto un timeout te come un corazón y encadena
    // a la ronda siguiente SIN explicarte nada. Un timeout no resolvió el problema.
    G.lastResult = 'miss'
    // Solo llega acá si la fase tiene timer, y esa es REMATCH: no necesita guard
    loseHeart(engine)
    if (G.hearts > 0) {
      G.atk = { phase: 'hit', t: 0, x: LAYOUT.BOSS.x, y: LAYOUT.BOSS.y, blocked: 'miss', warned: false }
      engine.setState(GAME_STATES.RESOLVE)
    }
  }
}

export const attackSpeed = (G) =>
  // atkSpeedMult escala la velocidad por fase: 1 en TUTORIAL, 1.35 en REMATCH
  (TIMING.ATK_BASE_SPEED + Math.min(G.round, TIMING.ATK_SPEED_MAX_ROUNDS) * TIMING.ATK_SPEED_PER_ROUND) *
  PHASE_CONFIG[G.phase].atkSpeedMult

export const pickCard = (engine, index) => {
  const { G, effects } = engine
  const id = G.cards[index]
  if (!id || G.wrong.has(id)) return
  const cfg = PHASE_CONFIG[G.phase]

  // Gate del tutorial: una carta que no leíste no se juega, se ABRE.
  // Vale para las cuatro rondas y también para las cartas equivocadas — que es justo
  // el punto: leerlas es cómo descubrís que no son la respuesta.
  // Antes esto pasaba solo en la ronda 1, solo sobre la carta correcta, y en vez de
  // abrir el panel mostraba un cartel pidiendo que apretaras I. Nadie asocia un cartel
  // en el medio de la pantalla con la carta que tocó; el panel abriéndose sobre esa
  // carta, sí. No consume el turno: el panel queda abierto y el segundo gesto sobre
  // ella la confirma (confirmCardInfo).
  if (cfg.openInfoOnPick && !G.infoSeen.has(id)) {
    openCardInfo(engine, index)
    return
  }

  const isCorrect = id === currentRound(G).ans

  if (isCorrect) {
    sfxService.confirm()
    G.chosen = id
    effects.addFloat(LAYOUT.W / 2, 120, '¡CORRECTO! ¡Prepará el bloqueo!', '#7dff7d', 13)
    G.atk = { phase: 'windup', t: 0, x: LAYOUT.BOSS.x, y: LAYOUT.BOSS.y, blocked: null, warned: false }
    engine.setState(GAME_STATES.TIMING)
  } else {
    G.wrong.add(id)
    effects.addFloat(LAYOUT.W / 2, 120, '¡Esa no resuelve ESTE problema!', '#ff8866', 11)
    // El castigo depende de la fase: en TUTORIAL solo suena el error, no cuesta vida
    if (cfg.loseHeartOnWrong) loseHeart(engine)
    else sfxService.wrong()
  }
}

export const timingPress = (engine) => {
  const { G, effects } = engine
  const atk = G.atk
  if (!atk) return
  if (atk.phase === 'windup') {
    if (!atk.warned) {
      atk.warned = true
      effects.addFloat(LAYOUT.BLOCK.x, LAYOUT.BLOCK.y - 40, '¡Todavía no!', '#ffcc88', 10)
    }
    return
  }
  if (atk.phase !== 'fly' || atk.blocked) return

  const dist = Math.hypot(atk.x - LAYOUT.BLOCK.x, atk.y - LAYOUT.BLOCK.y)
  let result
  if (dist <= TIMING.PERFECT_DIST) {
    result = 'perfect'
    G.special += TIMING.PERFECT_GAIN
    G.perfects++
    sfxService.perfect()
    engine.flash('#ffe98a', 0.5)
    effects.addFloat(LAYOUT.BLOCK.x + 20, LAYOUT.BLOCK.y - 46, `¡PERFECT! +${TIMING.PERFECT_GAIN}`, '#ffd94a', 18)
  } else if (dist <= TIMING.GOOD_DIST) {
    result = 'good'
    G.special += TIMING.GOOD_GAIN
    sfxService.good()
    effects.addFloat(LAYOUT.BLOCK.x + 20, LAYOUT.BLOCK.y - 46, `GOOD +${TIMING.GOOD_GAIN}`, '#7de0ff', 14)
  } else {
    result = 'miss'
    sfxService.miss()
    effects.addFloat(LAYOUT.BLOCK.x + 20, LAYOUT.BLOCK.y - 46, '¡Muy pronto!', '#ff6666', 12)
  }
  G.special = Math.min(TIMING.SPECIAL_MAX, G.special)
  G.lastResult = result
  atk.blocked = result

  // Aviso de barra llena. Sin esto el remate aparece de la nada al cerrar la ronda y
  // el jugador nunca entiende que fue ÉL el que lo cargó bloqueando. Se dispara una
  // sola vez porque endRound remata al terminar esta misma ronda.
  if (G.special >= TIMING.SPECIAL_MAX && PHASE_CONFIG[G.phase].specialTriggersFinisher) {
    effects.addFloat(LAYOUT.W / 2, 96, '¡BARRA LLENA — REMATE LISTO!', '#ffe98a', 14)
  }

  if (result !== 'miss') {
    // bloqueado: el ataque se refleja hacia el jefe
    sfxService.reflect()
    G.shake = result === 'perfect' ? 10 : 6
    effects.emit(LAYOUT.BLOCK.x, LAYOUT.BLOCK.y, result === 'perfect' ? 30 : 16, ['#7de0ff', '#ffffff', '#ffd94a'])
    const dx = LAYOUT.BOSS.x - atk.x
    const dy = LAYOUT.BOSS.y - atk.y
    const len = Math.hypot(dx, dy)
    atk.phase = 'reflect'
    atk.vx = (dx / len) * TIMING.REFLECT_SPEED
    atk.vy = (dy / len) * TIMING.REFLECT_SPEED
  } else {
    // demasiado pronto: el ataque sigue y golpea al héroe
    atk.phase = 'hit'
  }
}

export const openCardInfo = (engine, index) => {
  const { G } = engine
  const id = G.cards[index]
  // Sin id no hay nada que mostrar (carta vacía o índice fuera de rango)
  if (!id) return
  G.infoCard = id
  G.infoSeen.add(id)   // lo que abre el gate del problema 1 en la tarea 9
  // La selección solo se mueve si la carta sigue jugable: dejarla sobre una
  // carta descartada la vuelve inelegible y ESPACIO deja de responder.
  if (!G.wrong.has(id)) G.sel = index
  sfxService.select()
}

export const closeCardInfo = (engine) => {
  engine.G.infoCard = null
  sfxService.confirm()
}

// En el tutorial el panel ES el paso de confirmación: la carta que estás leyendo es la
// que se juega. El índice se resuelve desde infoCard y NO desde G.sel, porque el badge
// '?' puede abrir una carta distinta a la que está seleccionada.
export const confirmCardInfo = (engine) => {
  const { G } = engine
  const index = G.cards.indexOf(G.infoCard)
  if (index < 0) return
  // Cerrar ANTES de jugar: si pickCard rechaza la carta (era la equivocada) no hay
  // cambio de pantalla, y setState —que es lo único que limpia infoCard— no corre.
  // Sin esta línea el panel quedaría pintado encima comiéndose todo el input.
  G.infoCard = null
  pickCard(engine, index)
}

// --- ciclo de ronda y transición de fase ---

// La revancha solo frena si el jugador erró carta o falló el bloqueo
export const needsExplain = (G) =>
  PHASE_CONFIG[G.phase].explainAlways || G.wrong.size > 0 || G.lastResult === 'miss'

// Cierra la ronda: remate por especial, fin del tutorial, o siguiente problema
export const endRound = (engine) => {
  const { G } = engine
  const cfg = PHASE_CONFIG[G.phase]

  // Remate por especial (solo REMATCH — trampa 7: sin el guard el tutorial se gana con 4 perfects)
  if (cfg.specialTriggersFinisher && G.special >= TIMING.SPECIAL_MAX) {
    engine.setState(GAME_STATES.FINISH_LINE)
    return
  }

  G.round++

  // Tutorial completo: las 4 rondas pasaron
  if (G.phase === PHASES.TUTORIAL && G.round >= ROUNDS.length) {
    G.tutorialDone = true
    engine.setState(GAME_STATES.TUTORIAL_CLEAR)
    return
  }

  // En revancha las rondas siguen cíclicas hasta ganar o perder
  if (G.round >= ROUNDS.length) G.extraRound = true
  startRound(engine)
}

// El ÚNICO camino a la fase 2: resetea vida, especial y mezcla el orden
export const beginRematch = (engine) => {
  const { G } = engine
  G.phase = PHASES.REMATCH        // ANTES de startRound: PROBLEM lee la config de la fase
  G.round = 0
  G.extraRound = false
  G.hearts = TIMING.MAX_HEARTS
  G.special = 0
  G.perfects = 0
  // El jefe se reinició: su barra arranca llena otra vez. undefined y no 1 porque el
  // dueño del valor es drawBossHealth y su init perezoso — acá solo lo olvidamos.
  // Sin esto la barra entra a la revancha con el 25% en el que quedó el tutorial y la
  // primera ronda se ve rellenándose sola, como un glitch.
  G.bossHpDisplay = undefined
  G.order = shuffle([...Array(ROUNDS.length).keys()])
  startRound(engine)   // startRound es el dueño de infoSeen: no hace falta limpiarlo acá
}

// --- avance de estados ---

export const advance = (engine) => {
  const { G } = engine
  switch (G.state) {
    case GAME_STATES.TITLE:
      sfxService.confirm()
      engine.setState(GAME_STATES.INTRO)
      break
    case GAME_STATES.INTRO:
      advanceIntroScene(engine)
      break
    case GAME_STATES.PROBLEM:
      if (G.t > TIMING.PROBLEM_MIN_WAIT) {
        sfxService.confirm()
        engine.setState(GAME_STATES.CHOOSE)
      }
      break
    case GAME_STATES.EXPLAIN:
      sfxService.confirm()
      endRound(engine)
      break
    case GAME_STATES.TUTORIAL_CLEAR:
      if (G.t > TIMING.PROBLEM_MIN_WAIT) {
        sfxService.confirm()
        engine.setState(GAME_STATES.REMATCH_INTRO)
      }
      break
    case GAME_STATES.REMATCH_INTRO:
      if (G.t > TIMING.PROBLEM_MIN_WAIT) {
        sfxService.shout()
        beginRematch(engine)
      }
      break
    case GAME_STATES.FINISH_LINE:
      if (G.t > 0.4) {
        engine.setState(GAME_STATES.FINISH_ANIM)
        sfxService.boom()
      }
      break
    default:
      break
  }
}
