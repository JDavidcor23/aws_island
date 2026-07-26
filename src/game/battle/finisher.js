import { FINISHER, FINISHER_STEPS } from '../../constants/FINISHER'
import { LAYOUT } from '../../constants/LAYOUT'
import { sfxService } from '../../services/sfx.service'

// Sub-máquina del remate: CHARGE (carga el orbe) -> FIRE (dispara el rayo y desintegra
// al jefe). Vive en G.finisher, NO en variable de módulo: reset() recrea G entero, así
// que el remate se re-inicializa limpio en la partida siguiente.
//
// La geometría se exporta desde acá y la consume drawFinisher. Que el origen del rayo lo
// calcule un solo lugar es lo que evita que el rayo salga de las manos y las partículas
// de la muñeca — el bug clásico de tener las mismas coordenadas escritas dos veces.
const ensureFinisher = (G) => {
  if (!G.finisher) G.finisher = { ...FINISHER.INITIAL }
  return G.finisher
}

// El ÚNICO camino al remate. Arranca la sub-máquina desde cero y suelta el tono de carga
// acá y no en el update, porque el sonido dura lo mismo que CHARGE_DURATION y tiene que
// empezar en el frame exacto en que empieza la carga.
export const startFinisher = (engine) => {
  engine.G.finisher = { ...FINISHER.INITIAL }
  sfxService.charge()
}

// El rayo ya se sostuvo todo lo que tenía que sostener: el jefe está desintegrado.
export const finisherDone = (fin) =>
  fin.step === FINISHER_STEPS.FIRE && fin.t > FINISHER.BEAM_TRAVEL + FINISHER.BEAM_HOLD

export const orbCenter = () => ({
  x: LAYOUT.HERO.x + FINISHER.ORB_FROM.dx,
  y: LAYOUT.HERO.y + FINISHER.ORB_FROM.dy,
})

export const beamOrigin = () => ({
  x: LAYOUT.HERO.x + FINISHER.BEAM_FROM.dx,
  y: LAYOUT.HERO.y + FINISHER.BEAM_FROM.dy,
})

// 0..1 mientras la cabeza del rayo viaja, 1 cuando ya llegó al jefe
export const beamTravel = (fin) =>
  fin.step === FINISHER_STEPS.FIRE ? Math.min(1, fin.t / FINISHER.BEAM_TRAVEL) : 0

// 0..1 de la carga del orbe
export const chargeProgress = (fin) =>
  fin.step === FINISHER_STEPS.CHARGE ? Math.min(1, fin.t / FINISHER.CHARGE_DURATION) : 1

export const updateFinisher = (engine, dt) => {
  const { G, effects } = engine
  const fin = ensureFinisher(G)
  fin.t += dt

  if (fin.step === FINISHER_STEPS.CHARGE) {
    const progress = chargeProgress(fin)
    // Math.max y no asignación directa: GameEngine baja el shake por dt cada frame, y
    // pisarlo con el valor de la rampa borraría cualquier sacudida que venga de afuera.
    G.shake = Math.max(G.shake, progress * FINISHER.CHARGE_SHAKE_MAX)

    // Partículas absorbidas hacia el orbe. El radio crece con la carga: al principio
    // chupa de cerca, al final de media pantalla.
    if (Math.random() < 0.6) {
      const orb = orbCenter()
      effects.implode(orb.x, orb.y, 2, FINISHER.PALETTE.SPARK, 60 + progress * 70, 0.5)
    }

    if (fin.t >= FINISHER.CHARGE_DURATION) {
      fin.step = FINISHER_STEPS.FIRE
      fin.t = 0
      sfxService.blast()
      engine.flash(FINISHER.PALETTE.CORE, 0.9)
      G.shake = FINISHER.FIRE_SHAKE
    }
    return
  }

  // --- FIRE ---
  const held = fin.t - FINISHER.BEAM_TRAVEL
  if (held < 0) return   // la cabeza del rayo todavía viaja: el jefe no se enteró

  // El jefe se desintegra mientras el rayo lo sostiene. bossGone ya lo sabe leer
  // drawBoss (lo hunde, lo sacude y le baja el alpha), así que acá sólo se avanza.
  G.bossGone = Math.min(1, held / FINISHER.BEAM_HOLD)
  // Refrescado CADA frame a propósito: bossHit decae por dt, y renovarlo mantiene el
  // sprite blanco encima todo el tiempo que el rayo lo está incinerando.
  G.bossHit = 0.3
  G.shake = Math.max(G.shake, FINISHER.HOLD_SHAKE)

  // Explosiones a ritmo fijo. El contador `booms` es lo que hace que suene una vez por
  // explosión y no una vez por frame.
  const booms = Math.floor(held / FINISHER.BOOM_EVERY)
  if (booms > fin.booms && G.bossGone < 0.92) {
    fin.booms = booms
    effects.emit(
      LAYOUT.BOSS.x + (Math.random() - 0.5) * 140,
      LAYOUT.BOSS.y + (Math.random() - 0.5) * 120,
      18,
      FINISHER.PALETTE.DEBRIS,
      160,
      0.9,
    )
    sfxService.boom()
  }
}
