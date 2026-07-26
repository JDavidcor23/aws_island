import { FINISHER_STEPS } from '../../constants/FINISHER'
import { GAME_STATES } from '../../constants/GAME_STATES'
import { LAYOUT } from '../../constants/LAYOUT'

// Fondo, jefe y héroe. El flash de daño del jefe usa un sprite blanco
// pre-renderizado (assets.service) en vez de ctx.filter, que es lento.
const BOSS_BOB_FREQ = 2.6
const BOSS_BOB_AMP = 3
const HERO_BOB_FREQ = 4
const HERO_BOB_AMP = 2

// Respiración de la pose de pelea: dos frames alternando lento. 0.55s por frame da un
// ciclo de 1.1s, que es el ritmo de alguien conteniendo el aire, no de alguien agitado.
const STANCE_FRAME_DURATION = 0.55
// La carga sí es agitada: el temblor de esfuerzo va rápido.
const CHARGE_FRAME_DURATION = 0.12

// Estados en los que el héroe está frente al jefe y tiene que estar en guardia.
// El resto (TITLE, VICTORY) usa el sprite de frente, y ahí sonreír está BIEN: en la
// portada todavía no lo atacaron, y en la victoria ya ganó.
const STANCE_STATES = [
  // El briefing entra acá aunque todavía no haya empezado la pelea: el héroe está mirando al
  // jefe mientras el mentor se lo señala. Sin esto cae al sprite de frente y queda sonriendo
  // a cámara con el Legacy Server a tres metros, que es exactamente el problema que este
  // selector vino a resolver.
  GAME_STATES.BRIEFING,
  GAME_STATES.PROBLEM,
  GAME_STATES.CHOOSE,
  GAME_STATES.TIMING,
  GAME_STATES.RESOLVE,
  GAME_STATES.EXPLAIN,
  GAME_STATES.FINISH_LINE,
]

// Qué sprite del héroe corresponde al estado actual.
//
// Las cadenas de fallback terminan en heroSide y NO en hero, y eso es deliberado: si los
// sprites de combate no cargaron, lo PEOR que puede pasar es volver al sprite de frente,
// porque el problema que este selector viene a resolver es justamente que el héroe mira a
// cámara sonriendo mientras el jefe lo ataca desde la derecha. heroSide al menos lo pone
// mirando al jefe, con el brazo flexionado. Es el peor caso aceptable.
// Devuelve { img, bob }. `bob` dice si hay que aplicarle el flotado senoidal encima.
// Va en false cuando el sprite ya trae sus propios frames de respiración (los pares
// stance1/stance2 suben y bajan solos, y sumarles el seno da un globo) y también cuando la
// pose no tiene que moverse para nada: el disparo en pleno retroceso y el cuerpo tirado en
// la derrota. Los sprites de un solo frame que SÍ representan a alguien de pie y quieto se
// quedan con el bob, o parecen una calcomanía.
const heroSprite = (engine) => {
  const { IMG, G } = engine
  const frame = (durationSeconds) => Math.floor(G.time / durationSeconds) % 2 === 0
  const facingBoss = { img: IMG.heroSide || IMG.hero, bob: true }

  // Derrota: tirado en el piso. Sin bob — un cuerpo inconsciente que sube y baja se lee
  // como que está flotando, no como que está tirado.
  if (G.state === GAME_STATES.DEFEAT) {
    return IMG.heroDown ? { img: IMG.heroDown, bob: false } : facingBoss
  }

  // Victoria: puño arriba y la única sonrisa del juego. CON bob, al revés que la derrota —
  // acá el flotado se lee como que está rebotando de contento.
  if (G.state === GAME_STATES.VICTORY) {
    return { img: IMG.heroWin || IMG.hero, bob: true }
  }

  if (G.state === GAME_STATES.FINISH_ANIM) {
    const step = G.finisher?.step ?? FINISHER_STEPS.CHARGE
    if (step === FINISHER_STEPS.CHARGE) {
      if (IMG.heroCharge1 && IMG.heroCharge2) {
        return { img: frame(CHARGE_FRAME_DURATION) ? IMG.heroCharge1 : IMG.heroCharge2, bob: false }
      }
      return IMG.heroStance1 ? { img: IMG.heroStance1, bob: false } : facingBoss
    }
    if (IMG.heroFire) return { img: IMG.heroFire, bob: false }
    return facingBoss
  }

  if (STANCE_STATES.includes(G.state)) {
    if (IMG.heroStance1 && IMG.heroStance2) {
      return { img: frame(STANCE_FRAME_DURATION) ? IMG.heroStance1 : IMG.heroStance2, bob: false }
    }
    return facingBoss
  }

  return { img: IMG.hero, bob: true }
}

// Desplazamiento horizontal del héroe. Son pocos píxeles y hacen toda la diferencia:
// plantarse cuando el jefe carga y tirarse adelante al devolver el golpe es lo que hace
// que el bloqueo se SIENTA, mucho más que cualquier partícula.
const heroOffsetX = (engine) => {
  const { G } = engine
  if (G.state === GAME_STATES.FINISH_ANIM) {
    // El retroceso del disparo. Sólo en FIRE: durante la carga está clavado en el piso.
    return G.finisher?.step === FINISHER_STEPS.FIRE ? -7 : 0
  }
  if (!G.atk) return 0
  if (G.atk.phase === 'windup') return -2    // se planta
  if (G.atk.phase === 'reflect') return 3    // se tira adelante
  return 0
}

export const drawBackground = (engine) => {
  const { ctx, IMG, G } = engine
  const bg = G.state === GAME_STATES.VICTORY ? IMG.after : IMG.arena
  if (bg) {
    ctx.drawImage(bg, 0, 0, LAYOUT.W, LAYOUT.H)
  } else {
    ctx.fillStyle = '#1a1022'
    ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
  }
}

export const drawBoss = (engine) => {
  const { ctx, IMG, G, effects } = engine
  if (!IMG.boss || G.state === GAME_STATES.VICTORY) return

  const bob = Math.sin(G.time * BOSS_BOB_FREQ) * BOSS_BOB_AMP
  const size = LAYOUT.BOSS.size
  let x = LAYOUT.BOSS.x
  let y = LAYOUT.BOSS.y + bob
  let alpha = 1

  if (G.state === GAME_STATES.FINISH_ANIM || G.state === GAME_STATES.FINISH_LINE) {
    const gone = G.bossGone
    x += (Math.random() - 0.5) * 14 * (0.3 + gone)
    y += gone * 46
    alpha = 1 - gone * 0.9
  }
  if (G.state === GAME_STATES.PROBLEM) {
    x += Math.sin(G.t * 40) * Math.max(0, 4 - G.t * 3)
  }
  if (G.atk && G.atk.phase === 'windup') {
    x += (Math.random() - 0.5) * 5
  }

  const drawX = Math.round(x - size / 2)
  const drawY = Math.round(y - size / 2)
  ctx.globalAlpha = alpha
  ctx.drawImage(IMG.boss, drawX, drawY, size, size)
  // flash de daño: sprite blanco encima, alpha según bossHit
  if (G.bossHit > 0 && IMG.bossWhite) {
    ctx.globalAlpha = Math.min(1, G.bossHit * 2.5) * alpha
    ctx.drawImage(IMG.bossWhite, drawX, drawY, size, size)
  }
  ctx.globalAlpha = 1

  // vapor ambiente
  if (Math.random() < 0.06 && G.state !== GAME_STATES.FINISH_ANIM) {
    effects.parts.push({
      x: x + 30 + Math.random() * 40 - 20,
      y: y - 80,
      vx: 8,
      vy: -22,
      life: 1.6,
      max: 1.6,
      color: 'rgba(200,200,200,0.35)',
      size: 5,
    })
  }
}

export const drawHero = (engine) => {
  const { ctx, G } = engine
  const { img, bob: wantsBob } = heroSprite(engine)
  if (!img) return
  const bob = wantsBob ? Math.sin(G.time * HERO_BOB_FREQ) * HERO_BOB_AMP : 0
  const size = LAYOUT.HERO.size
  ctx.drawImage(
    img,
    Math.round(LAYOUT.HERO.x - size / 2 + heroOffsetX(engine)),
    Math.round(LAYOUT.HERO.y - size / 2 + bob),
    size,
    size,
  )
}

export const drawParticles = (engine) => {
  const { ctx, effects } = engine
  for (const p of effects.parts) {
    ctx.globalAlpha = Math.max(0, p.life / p.max)
    ctx.fillStyle = p.color
    ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(p.size), Math.round(p.size))
  }
  ctx.globalAlpha = 1
}
