import { GAME_STATES } from '../../constants/GAME_STATES'
import { LAYOUT } from '../../constants/LAYOUT'
import { PHASE_CONFIG, PHASES } from '../../constants/PHASES'
import { TIMING } from '../../constants/TIMING'
import { UI_TEXTS } from '../../constants/UI_TEXTS'
import { sfxService } from '../../services/sfx.service'
import { advanceIntroScene } from '../scenes/introScene'
import { advanceBriefing } from '../scenes/briefingScene'
import { completeShout, shoutComplete, shoutReadyToAdvance, startShout } from '../scenes/bossShout'
import { startCombo } from './combo'
import { startFinisher } from './finisher'

// Reglas del combate: rondas, elección de carta, bloqueo con timing y vida.
// Todas las funciones reciben el engine y mutan su estado G (nunca React).

export const currentRound = (G) => G.level.rounds[G.order[G.round % G.level.rounds.length]]

// ¿La carta está bloqueada por la fase? Sólo en TUTORIAL, y sólo las que no son la
// respuesta. Ver la nota de lockWrongCards en PHASE_CONFIG: contradice el diseño original
// del tutorial a pedido explícito del jugador.
export const isCardLocked = (G, id) =>
  PHASE_CONFIG[G.phase].lockWrongCards && id !== currentRound(G).ans

// ¿Se puede jugar esta carta? Es el predicado que tienen que compartir el dibujo, el
// hit-test del mouse, las flechas y pickCard. Con cada uno decidiendo por su cuenta, la
// carta se ve apagada pero la flecha igual se para encima y el ESPACIO deja de responder:
// el jugador no ve un bloqueo, ve un juego colgado.
export const isCardPlayable = (G, id) => Boolean(id) && !G.wrong.has(id) && !isCardLocked(G, id)

// Primer índice jugable a partir de `from`, girando en la fila. Devuelve `from` si no hay
// ninguno, para que nunca devuelva -1 y el llamador no tenga que defenderse.
export const nextPlayableIndex = (G, from, step) => {
  const total = G.cards.length
  for (let offset = 1; offset <= total; offset++) {
    // El doble módulo es para que ande con step negativo: en JS, -1 % 4 es -1, no 3.
    const index = (((from + step * offset) % total) + total) % total
    if (isCardPlayable(G, G.cards[index])) return index
  }
  return from
}

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
  G.cards = shuffle(Object.keys(G.level.cards))
  G.wrong = new Set()
  // La selección arranca en la primera carta JUGABLE y no en el índice 0: con
  // lockWrongCards, el 0 puede caer sobre una carta bloqueada y entonces el ESPACIO no
  // haría nada en el primer gesto de la ronda.
  const firstPlayable = G.cards.findIndex((id) => isCardPlayable(G, id))
  G.sel = firstPlayable >= 0 ? firstPlayable : 0
  G.chosen = null
  G.atk = null
  // El combo es estado POR RONDA: nace en cada startRound y muere acá. startCombo es el
  // único que lo llena.
  G.combo = null
  engine.setState(GAME_STATES.PROBLEM)
  // Después del setState: startShout lee currentRound(G) y el estado tiene que estar ya en
  // PROBLEM para que el primer frame dibuje el globo vacío y no la caja vieja.
  startShout(engine)
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
      // Sin orbe: el jefe no regala un combo por un timeout. Antes se armaba un G.atk en
      // fase 'hit' que no se dibujaba ni se actualizaba (updateAttack sólo corre en TIMING),
      // o sea que quedaba colgado en G hasta la ronda siguiente sin hacer nada.
      G.atk = null
      G.combo = null
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
  // Bloqueada por la fase: no se juega y NO cuenta como error. Se abre su ficha, que sigue
  // siendo la forma de aprender por qué no sirve — es lo único que queda del diseño
  // original del tutorial cuando lockWrongCards está prendido.
  if (isCardLocked(G, id)) {
    openCardInfo(engine, index)
    return
  }
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
    // El orbe ya no se arma acá: el combo es el dueño de los golpes y de su ritmo.
    startCombo(engine, { cardId: id, shielded: true })
    return
  }

  G.wrong.add(id)
  effects.addFloat(LAYOUT.W / 2, 120, '¡Esa no resuelve ESTE problema!', '#ff8866', 11)
  // El castigo depende de la fase: en TUTORIAL solo suena el error, no cuesta vida
  if (cfg.loseHeartOnWrong) {
    // loseHeart puede haber puesto DEFEAT: sin este corte, el combo arrancaría encima de la
    // pantalla de derrota.
    if (!loseHeart(engine)) return
  } else {
    sfxService.wrong()
  }

  // El golpe viene igual. Podés parrear —el escudo es lo que no tenés—, así que el turno se
  // juega hasta el final y la carta equivocada compromete la ronda entera.
  // El tutorial deja esto en false: ahí equivocarse descarta la carta y podés reintentar,
  // que es cómo se aprende a descartar.
  if (cfg.wrongCardStartsCombo) {
    G.chosen = id
    startCombo(engine, { cardId: id, shielded: false })
  }
}

// La lectura de la ventana de bloqueo se fue a registerParry (game/battle/combo.js).
// Vivía acá como timingPress y hacía tres cosas en una: leía la ventana, sumaba especial y
// sacaba corazones. Con tres parries por problema las dos últimas tenían que salir del
// golpe y pasar al CIERRE del combo, o la barra se llenaba en dos rondas y una ronda mala
// costaba tres corazones.

export const openCardInfo = (engine, index) => {
  const { G } = engine
  const id = G.cards[index]
  // Sin id no hay nada que mostrar (carta vacía o índice fuera de rango)
  if (!id) return
  G.infoCard = id
  G.infoSeen.add(id)   // lo que abre el gate del problema 1 en la tarea 9
  // La selección solo se mueve si la carta sigue JUGABLE: dejarla sobre una carta
  // descartada —o bloqueada por la fase— la vuelve inelegible y ESPACIO deja de responder.
  if (isCardPlayable(G, id)) G.sel = index
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
  // Si la carta está bloqueada, confirmar sólo CIERRA. Sin este corte, pickCard la volvería
  // a abrir en el mismo frame (es lo que hace con las bloqueadas) y el panel parpadearía
  // sin cerrarse nunca: el ESPACIO se vería como una tecla muerta.
  if (isCardLocked(G, G.infoCard)) {
    closeCardInfo(engine)
    return
  }
  // Cerrar ANTES de jugar: si pickCard rechaza la carta (era la equivocada) no hay
  // cambio de pantalla, y setState —que es lo único que limpia infoCard— no corre.
  // Sin esta línea el panel quedaría pintado encima comiéndose todo el input.
  G.infoCard = null
  pickCard(engine, index)
}

// --- ciclo de ronda y transición de fase ---

// ¿Hace falta la pantalla de explicación? Lo decide la FASE de punta a punta.
// Antes los dos últimos términos no miraban la fase, así que la revancha frenaba en cada
// error aunque su config dijera explainAlways: false. Ahora `explainOnMistake` lo gobierna.
export const needsExplain = (G) => {
  const cfg = PHASE_CONFIG[G.phase]
  if (cfg.explainAlways) return true
  if (!cfg.explainOnMistake) return false
  return G.wrong.size > 0 || G.lastResult === 'miss'
}

// ¿Hubo error DE CARTA? Es lo único que la lección flotante puede enseñar.
//
// Antes mistakeHint se disparaba con hadMistake, o sea también cuando el jugador había
// elegido bien y falló el timing. Con el combo eso pasó a ser lo normal —basta con que uno
// de los tres parries se escape para que lastResult sea 'miss'— y el flotante quedaba
// diciendo "Era Elasticidad Rápida" arriba de la carta correcta que el jugador acababa de
// jugar. La lección es sobre la carta; el timing ya lo enseña el resultado del combo.
const hadCardMistake = (G) => G.wrong.size > 0

// La lección sin el freno: cuando la fase no explica pero el jugador SÍ erró, la respuesta
// correcta se dice en un texto flotante y el juego encadena igual. Dos datos y nada más,
// porque tiene que leerse de un vistazo mientras arranca el problema siguiente: QUÉ carta
// era, y CONTRA QUÉ sirve. El "contra qué" sale de la primera parte de `blocks`, que ya
// está escrita como categoría corta antes del guión.
const mistakeHint = (engine) => {
  const { G, effects } = engine
  const answer = G.level.cards[currentRound(G).ans]
  if (!answer) return
  const category = answer.blocks.split('—')[0].trim()
  // y=120 es la línea de mensajes de combate que ya usan pickCard y updateChooseTimer
  effects.addFloat(
    LAYOUT.W / 2,
    120,
    `${UI_TEXTS.MISTAKE_HINT_PREFIX}${answer.es} · ${category}`,
    '#ff9d7a',
    11,
  )
}

// Cierra la ronda: remate por especial, fin del tutorial, o siguiente problema
export const endRound = (engine) => {
  const { G } = engine
  const cfg = PHASE_CONFIG[G.phase]

  // La lección sin el freno. Va ANTES del remate y del startRound: startRound limpia
  // `wrong` y `lastResult`, así que después de esa línea ya no hay con qué saber si el
  // jugador erró. Y sólo cuando la fase no explica — si explainOnMistake está en true, la
  // pantalla de EXPLAIN ya dijo todo esto y el flotante sería ruido duplicado.
  if (!cfg.explainOnMistake && hadCardMistake(G)) mistakeHint(engine)

  // Remate por especial (solo REMATCH — trampa 7: sin el guard el tutorial se gana con 4 perfects)
  if (cfg.specialTriggersFinisher && G.special >= TIMING.SPECIAL_MAX) {
    engine.setState(GAME_STATES.FINISH_LINE)
    return
  }

  G.round++

  // Tutorial completo: las 4 rondas pasaron
  if (G.phase === PHASES.TUTORIAL && G.round >= G.level.rounds.length) {
    G.tutorialDone = true
    engine.setState(GAME_STATES.TUTORIAL_CLEAR)
    return
  }

  // En revancha las rondas siguen cíclicas hasta ganar o perder
  if (G.round >= G.level.rounds.length) G.extraRound = true
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
  G.order = shuffle([...Array(G.level.rounds.length).keys()])
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
    case GAME_STATES.BRIEFING:
      // La sub-máquina decide: completar la línea que se tipea, pasar a la siguiente, o
      // arrancar la primera ronda. Acá no hay guard de G.t porque el briefing ya tiene su
      // propio freno: hasta que la línea no terminó de revelarse, ESPACIO la completa en
      // vez de avanzar, así que no se puede pasar de largo sin haber visto el texto.
      advanceBriefing(engine)
      break
    case GAME_STATES.PROBLEM:
      // Contrato de dos tiempos, el mismo del briefing: el primer ESPACIO COMPLETA el grito
      // que se está tipeando, el segundo pasa a elegir carta. Completar en vez de saltear es
      // lo que hace que el botón nunca se sienta muerto — y garantiza que nadie llegue a las
      // cartas sin haber visto el problema entero.
      if (!shoutComplete(G.shout)) {
        completeShout(engine)
        return
      }
      if (shoutReadyToAdvance(G)) {
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
        // startFinisher ANTES del setState: el primer frame de FINISH_ANIM ya tiene que
        // encontrar la sub-máquina inicializada, o dibuja un frame con el remate viejo.
        startFinisher(engine)
        engine.setState(GAME_STATES.FINISH_ANIM)
      }
      break
    default:
      break
  }
}
