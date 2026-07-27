import { COMBO } from '../../constants/COMBO'
import { GAME_STATES } from '../../constants/GAME_STATES'
import { LAYOUT } from '../../constants/LAYOUT'
import { PHASE_CONFIG } from '../../constants/PHASES'
import { TIMING } from '../../constants/TIMING'
import { sfxService } from '../../services/sfx.service'
import { currentRound, loseHeart } from './battleLogic'

// Sub-máquina del combo de parries: un problema = TRES golpes con parry individual.
//
// Mismo patrón que intro, briefing y finisher: el estado vive en G.combo y NO en una
// variable de módulo, así reset() (la tecla R) lo borra recreando G y la ronda siguiente
// arranca limpia sin que este archivo tenga que saber qué campos tiene adentro.
//
// El reparto de responsabilidades con attack.js:
//   attack.js  mueve el orbe QUE VIENE (windup -> fly -> hit) y avisa acá cuando pega.
//   combo.js   decide CUÁNDO sale cada golpe, qué pasó con el parry, y cierra la ronda.
//
// attack.js ya NO llama setState(RESOLVE): antes lo hacía en reflect y en hit, y con tres
// golpes por problema eso cerraba la ronda en el primero. Ahora el único que cierra es
// closeCombo.
//
// ⚠️ El import de battleLogic es un ciclo (battleLogic importa startCombo de acá). Es
// seguro porque las dos puntas se usan sólo DENTRO de funciones, o sea después de que los
// dos módulos terminaron de evaluarse. Lo que NO se puede hacer es leer algo de battleLogic
// en el cuerpo del módulo — eso sí explota, y es el mismo ciclo que obligó a mudar
// drawDialogue a su propio archivo.

// --- la tabla de resultados, como función pura (es lo que testea combo.test.js) ---
//
// blocked = golpes parreados (perfect o good) · perfects = los que salieron perfect.
// `shielded` es false cuando el jugador eligió la carta equivocada: puede parrear, pero no
// neutraliza ni carga.
export const resolveComboOutcome = ({ blocked, perfects, length, shielded }) => {
  const O = COMBO.OUTCOMES
  if (!shielded) return O.NO_SHIELD
  if (length > 0 && perfects >= length) return O.COUNTER
  if (blocked >= length) return O.BLOCKED
  // PARTIAL pide blocked >= 1 además de length - 1: con un combo de un solo golpe,
  // length - 1 es 0 y un combo entero fallado caería en "casi".
  if (blocked >= 1 && blocked === length - 1) return O.PARTIAL
  if (blocked >= 1) return O.GRAZED
  return O.FAILED
}

// Estado inicial del combo. Función pura y exportada para que el test pueda armar un combo
// sin motor: es la única forma de testear la máquina sin canvas.
export const createCombo = ({ pattern, cardId, shielded, length, rhythm }) => ({
  cardId,
  shielded,
  pattern,
  length: Math.min(length, pattern.hits.length),
  // Divide las pausas del patrón: 1 en tutorial, 1.35 en revancha. NO toca la velocidad
  // del orbe — eso es atkSpeedMult, y multiplicar las dos cosas por lo mismo dejaría la
  // revancha a 1.82.
  rhythm: rhythm || 1,
  index: 0,
  results: [],
  perfects: 0,
  held: [],
  gap: (pattern.hits[0].gap ?? 0) / (rhythm || 1),
  counter: null,
  outcome: null,
  closed: false,
})

const heldSlot = (index) => ({
  x: COMBO.HELD.x + index * COMBO.HELD.gap,
  y: COMBO.HELD.y,
})

// El ÚNICO camino al combo. Lo llama pickCard, con escudo si la carta era la correcta y sin
// escudo si no (y sólo si la fase lo permite: wrongCardStartsCombo).
export const startCombo = (engine, { cardId, shielded }) => {
  const { G } = engine
  const cfg = PHASE_CONFIG[G.phase]
  const pattern = COMBO.PATTERNS[currentRound(G).ans]
  G.atk = null
  G.combo = createCombo({
    pattern,
    cardId,
    shielded,
    length: cfg.comboLength,
    rhythm: cfg.comboSpeedMult,
  })
  engine.setState(GAME_STATES.TIMING)
}

// Prepara el golpe `index` del patrón y lo pone en vuelo. El punto de bloqueo no se mueve
// nunca: lo que cambia es de dónde sale.
const spawnHit = (engine) => {
  const { G } = engine
  const combo = G.combo
  const hit = combo.pattern.hits[combo.index]
  const origin = COMBO.ORIGIN_POS[hit.origin] ?? COMBO.ORIGIN_POS.BOSS
  const offset = hit.offset ?? { x: 0, y: 0 }
  G.atk = {
    phase: 'windup',
    t: 0,
    x: origin.x + offset.x,
    y: origin.y + offset.y,
    blocked: null,
    warned: false,
    index: combo.index,
    origin: hit.origin,
    radius: hit.radius ?? COMBO.ORB_RADIUS,
    speedMult: hit.speed ?? 1,
    // El primer golpe se telegrafía como siempre; los siguientes más corto, porque la pausa
    // del patrón ya hizo de anticipación.
    windup: combo.index === 0 ? COMBO.WINDUP_FIRST : COMBO.WINDUP_NEXT,
    // Dirección de vuelo. La setea attack.js al pasar a `fly` y es lo que hace que el miss
    // se detecte por proyección, sirva el golpe de donde venga.
    dirX: 0,
    dirY: 0,
  }
}

// Pasa al golpe siguiente, o programa el cierre si ya no quedan.
const advanceCombo = (engine) => {
  const combo = engine.G.combo
  combo.index++
  if (combo.index < combo.length) {
    const next = combo.pattern.hits[combo.index]
    combo.gap = (next.gap ?? 0) / combo.rhythm
    return
  }
  combo.gap = COMBO.CLOSE_DELAY
}

// ESPACIO durante TIMING. Es el reemplazo de timingPress: la ventana y el resultado se
// calculan igual que antes, pero ya no suma especial ni saca corazones — eso es del cierre.
export const registerParry = (engine) => {
  const { G, effects } = engine
  const combo = G.combo
  const atk = G.atk
  if (!combo || !atk) return

  if (atk.phase === 'windup') {
    if (!atk.warned) {
      atk.warned = true
      effects.addFloat(LAYOUT.BLOCK.x, LAYOUT.BLOCK.y - 40, COMBO.TEXTS.NOT_YET, '#ffcc88', 10)
    }
    return
  }
  if (atk.phase !== 'fly' || atk.blocked) return

  const dist = Math.hypot(atk.x - LAYOUT.BLOCK.x, atk.y - LAYOUT.BLOCK.y)

  // Muy pronto: el golpe sigue y va a pegar. El miss lo registra comboHitLanded cuando el
  // orbe llega al héroe, para que haya UN solo lugar que cuente golpes fallados.
  if (dist > TIMING.GOOD_DIST) {
    atk.blocked = 'miss'
    atk.phase = 'hit'
    sfxService.miss()
    effects.addFloat(LAYOUT.BLOCK.x + 20, LAYOUT.BLOCK.y - 46, COMBO.TEXTS.TOO_EARLY, '#ff6666', 12)
    return
  }

  const result = dist <= TIMING.PERFECT_DIST ? 'perfect' : 'good'
  atk.blocked = result
  combo.results.push(result)
  if (result === 'perfect') {
    combo.perfects++
    G.perfects++
  }

  const step = Math.min(combo.results.length - 1, COMBO.TEXTS.PARRY.length - 1)

  if (combo.shielded) {
    // El orbe parreado NO sale disparado al jefe en el acto: queda flotando sobre el hombro
    // del héroe hasta que cierre el combo. Es la munición del contraataque, y tenerla a la
    // vista es lo que hace que 3/3 se entienda antes de que pase.
    combo.held.push({
      slot: combo.held.length,
      fromX: atk.x,
      fromY: atk.y,
      x: atk.x,
      y: atk.y,
      t: 0,
      result,
      launched: false,
      arrived: false,
      delay: 0,
      vx: 0,
      vy: 0,
    })
    sfxService.parry(step)
    G.shake = result === 'perfect' ? 9 : 5
    effects.emit(LAYOUT.BLOCK.x, LAYOUT.BLOCK.y, result === 'perfect' ? 22 : 12, [
      '#7de0ff',
      '#ffffff',
      '#ffd94a',
    ])
    effects.addFloat(
      LAYOUT.BLOCK.x + 20,
      LAYOUT.BLOCK.y - 46,
      COMBO.TEXTS.PARRY[step],
      result === 'perfect' ? '#ffd94a' : '#7de0ff',
      result === 'perfect' ? 16 : 13,
    )
  } else {
    // Sin escudo el parry FRENA el golpe —no pierde corazón por golpe— pero no refleja
    // nada: no hay orbe retenido, así que tampoco hay contraataque ni carga.
    sfxService.parryBlank()
    G.shake = 4
    effects.emit(LAYOUT.BLOCK.x, LAYOUT.BLOCK.y, 10, ['#9fb6d8', '#ffffff'])
    effects.addFloat(
      LAYOUT.BLOCK.x + 20,
      LAYOUT.BLOCK.y - 46,
      COMBO.TEXTS.NO_SHIELD_PARRY,
      '#9fb6d8',
      11,
    )
  }

  G.atk = null
  advanceCombo(engine)
}

// El golpe llegó al héroe: golpe fallado. Lo llama attack.js.
// Acá NO se pierde corazón: el daño es del combo entero y se cobra una sola vez en
// closeCombo. Con tres golpes por problema, cobrarlo por golpe costaría hasta 3 corazones
// en una ronda.
export const comboHitLanded = (engine) => {
  const { G } = engine
  const combo = G.combo
  G.atk = null
  if (!combo) return
  combo.results.push('miss')
  advanceCombo(engine)
}

// Lanza los orbes retenidos contra el jefe. Con 3/3 perfect CONVERGEN —salen todos juntos y
// llegan juntos, de ahí el tiempo de vuelo fijo—; si no, vuelven de a uno, escalonados.
const startCounter = (engine, isCounter) => {
  const { G, effects } = engine
  const combo = G.combo
  combo.counter = { t: 0, isCounter }
  combo.held.forEach((orb, index) => {
    const dx = LAYOUT.BOSS.x - orb.x
    const dy = LAYOUT.BOSS.y - orb.y
    const len = Math.hypot(dx, dy) || 1
    const speed = isCounter ? len / COMBO.COUNTER.TRAVEL : TIMING.REFLECT_SPEED
    orb.vx = (dx / len) * speed
    orb.vy = (dy / len) * speed
    orb.delay = isCounter ? 0 : index * COMBO.COUNTER.STAGGER
    orb.launched = true
  })
  if (isCounter) {
    sfxService.counter()
    effects.addFloat(
      LAYOUT.W / 2,
      COMBO.COUNTER.BANNER_Y,
      COMBO.TEXTS.COUNTER_BANNER,
      COMBO.COUNTER.FLASH,
      18,
    )
  } else {
    sfxService.reflect()
  }
}

const updateCounter = (engine, dt) => {
  const { G, effects } = engine
  const combo = G.combo
  const counter = combo.counter
  counter.t += dt

  let flying = 0
  for (const orb of combo.held) {
    if (orb.arrived) continue
    if (orb.delay > 0) {
      orb.delay -= dt
      flying++
      continue
    }
    orb.x += orb.vx * dt
    orb.y += orb.vy * dt
    if (Math.random() < 0.7) {
      effects.parts.push({
        x: orb.x,
        y: orb.y,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        life: 0.35,
        max: 0.35,
        color: '#7de0ff',
        size: 3,
      })
    }
    if (Math.hypot(orb.x - LAYOUT.BOSS.x, orb.y - LAYOUT.BOSS.y) < 34) {
      orb.arrived = true
      G.bossHit = 0.4
      effects.emit(LAYOUT.BOSS.x, LAYOUT.BOSS.y, 14, COMBO.COUNTER.PALETTE)
    } else {
      flying++
    }
  }

  // TIMEOUT es red de seguridad, no ritmo: si un orbe quedara sin llegar (por un dt raro
  // tras una pausa larga) la ronda no puede quedarse colgada en TIMING para siempre.
  if (flying > 0 && counter.t < COMBO.COUNTER.TIMEOUT) return

  if (counter.isCounter) {
    engine.flash(COMBO.COUNTER.FLASH, COMBO.COUNTER.FLASH_ALPHA)
    G.shake = COMBO.COUNTER.SHAKE
    effects.emit(LAYOUT.BOSS.x, LAYOUT.BOSS.y, COMBO.COUNTER.PARTICLES, COMBO.COUNTER.PALETTE, 190, 0.9)
  } else {
    G.shake = COMBO.COUNTER.SHAKE_WEAK
    effects.emit(LAYOUT.BOSS.x, LAYOUT.BOSS.y, COMBO.COUNTER.PARTICLES_WEAK, COMBO.COUNTER.PALETTE)
  }
  sfxService.boom()
  engine.setState(GAME_STATES.RESOLVE)
}

// Los orbes parreados suben al hombro del héroe y quedan flotando ahí.
const updateHeld = (engine, dt) => {
  const { G } = engine
  for (const orb of G.combo.held) {
    if (orb.launched) continue
    orb.t += dt
    const k = Math.min(1, orb.t / COMBO.HELD.riseTime)
    const slot = heldSlot(orb.slot)
    const bob = k >= 1 ? Math.sin(G.time * COMBO.HELD.bobFreq + orb.slot) * COMBO.HELD.bobAmp : 0
    orb.x = orb.fromX + (slot.x - orb.fromX) * k
    orb.y = orb.fromY + (slot.y - orb.fromY) * k + bob
  }
}

// Cierra la ronda: cuenta la cadena, aplica la tabla y decide si hay contraataque.
// Es el ÚNICO lugar que suma especial y el único que saca corazones por timing.
export const closeCombo = (engine) => {
  const { G, effects } = engine
  const combo = G.combo
  if (combo.closed) return
  combo.closed = true

  const blocked = combo.results.filter((result) => result !== 'miss').length
  const outcome = resolveComboOutcome({
    blocked,
    perfects: combo.perfects,
    length: combo.length,
    shielded: combo.shielded,
  })
  combo.outcome = outcome

  // needsExplain y drawExplainScreen leen lastResult: el resultado de la RONDA es el del
  // combo entero, no el del último golpe.
  G.lastResult = outcome.lastResult

  if (outcome.gain > 0) {
    G.special = Math.min(TIMING.SPECIAL_MAX, G.special + outcome.gain)
  }
  effects.addFloat(
    LAYOUT.BLOCK.x + 26,
    LAYOUT.BLOCK.y - 62,
    outcome.label,
    outcome.color,
    outcome.id === COMBO.OUTCOMES.COUNTER.id ? 16 : 13,
  )

  // Aviso de barra llena. Sin esto el remate aparece de la nada al cerrar la ronda y el
  // jugador nunca entiende que fue ÉL el que lo cargó bloqueando. Se dispara una sola vez
  // porque endRound remata al terminar esta misma ronda.
  if (G.special >= TIMING.SPECIAL_MAX && PHASE_CONFIG[G.phase].specialTriggersFinisher) {
    effects.addFloat(LAYOUT.W / 2, 96, COMBO.TEXTS.SPECIAL_FULL, '#ffe98a', 14)
  }

  // Un combo cuesta como MÁXIMO un corazón. Si ese corazón era el último, loseHeart ya
  // puso DEFEAT y acá no hay nada más que hacer.
  if (outcome.damage && !loseHeart(engine)) return

  if (combo.held.length > 0) {
    startCounter(engine, outcome.id === COMBO.OUTCOMES.COUNTER.id)
    return
  }
  engine.setState(GAME_STATES.RESOLVE)
}

// Se llama cada frame desde GameEngine.update() mientras G.state === TIMING.
export const updateCombo = (engine, dt) => {
  const { G } = engine
  const combo = G.combo
  if (!combo) return

  updateHeld(engine, dt)

  // El contraataque corre DESPUÉS del cierre, así que se atiende antes que el guard de
  // `closed`.
  if (combo.counter) {
    updateCounter(engine, dt)
    return
  }
  if (combo.closed) return
  // Hay un golpe en vuelo: manda attack.js y acá no se hace nada.
  if (G.atk) return

  combo.gap -= dt
  if (combo.gap > 0) return
  if (combo.index < combo.length) {
    spawnHit(engine)
    return
  }
  closeCombo(engine)
}
