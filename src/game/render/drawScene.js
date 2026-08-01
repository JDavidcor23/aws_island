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
  // El envión hacia adelante ahora es el CONTRAATAQUE y no un reflejo suelto: con el combo,
  // el orbe parreado queda retenido sobre el hombro y los tres salen juntos al cerrar.
  if (G.combo?.counter) return 3
  if (!G.atk) return 0
  if (G.atk.phase === 'windup') return -2    // se planta
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

// Opacidad de los enemigos que NO están atacando. Es lo único que separa al que lanza el
// problema de sus dos compañeros, y por eso es agresiva: con 0.8 los tres se ven iguales y
// el jugador no sabe de dónde le viene el golpe.
const INACTIVE_ALPHA = 0.55
// Desfasaje del bob por posición en la formación. Sin esto los tres suben y bajan en el
// mismo frame y se leen como un solo objeto de tres cabezas, no como tres enemigos.
const BOB_PHASE_STEP = 1.7

// Un enemigo de la formación. Todo lo que era `drawBoss` vive acá, pero las coordenadas
// ahora entran por parámetro: el nivel declara cuántos enemigos hay y dónde.
//
// `isActive` gobierna TODO lo que llama la atención — opacidad, temblor, flash y vapor — y
// no es decoración: con tres enemigos en pantalla, lo único que le dice al jugador contra
// quién está jugando esta ronda es cuál de los tres está vivo y cuáles dos están apagados.
const drawEnemy = (engine, enemy, isActive, index) => {
  const { ctx, IMG, G, effects } = engine

  const bob = Math.sin(G.time * BOSS_BOB_FREQ + index * BOB_PHASE_STEP) * BOSS_BOB_AMP
  const size = enemy.size
  let x = enemy.x
  let y = enemy.y + bob
  let alpha = isActive ? 1 : INACTIVE_ALPHA

  // El remate se lo come el que está atacando. Los otros se quedan quietos: una animación
  // de remate triple es otro trabajo y no se improvisa acá.
  if (isActive && (G.state === GAME_STATES.FINISH_ANIM || G.state === GAME_STATES.FINISH_LINE)) {
    const gone = G.bossGone
    x += (Math.random() - 0.5) * 14 * (0.3 + gone)
    y += gone * 46
    alpha = 1 - gone * 0.9
  }
  if (isActive && G.state === GAME_STATES.PROBLEM) {
    x += Math.sin(G.t * 40) * Math.max(0, 4 - G.t * 3)
  }
  if (isActive && G.atk && G.atk.phase === 'windup') {
    x += (Math.random() - 0.5) * 5
  }

  const drawX = Math.round(x - size / 2)
  const drawY = Math.round(y - size / 2)
  ctx.globalAlpha = alpha
  // El sprite teñido se pre-renderizó en init() (assets.service.makeTintedSprite). Acá sólo
  // se elige cuál dibujar: componer el tinte por frame es justamente lo que ese pre-render
  // viene a evitar. Un enemigo sin `tint` cae al sprite original.
  ctx.drawImage(IMG.tinted?.[enemy.id] ?? IMG.boss, drawX, drawY, size, size)

  // flash de daño: sprite blanco encima, alpha según bossHit. Sólo al que está peleando.
  if (isActive && G.bossHit > 0 && IMG.bossWhite) {
    ctx.globalAlpha = Math.min(1, G.bossHit * 2.5) * alpha
    ctx.drawImage(IMG.bossWhite, drawX, drawY, size, size)
  }
  ctx.globalAlpha = 1

  // Vapor ambiente, sólo del activo y a la mitad de densidad que antes: con tres enemigos
  // emitiendo a 0.06 la pantalla se llena de humo y deja de leerse el combate.
  if (isActive && Math.random() < 0.03 && G.state !== GAME_STATES.FINISH_ANIM) {
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

// Formación de respaldo: el jefe único de siempre. Existe para que un nivel al que le falte
// `formation` siga dibujando algo en vez de una arena vacía — un nivel sin enemigos no se ve
// como un error de datos, se ve como un juego colgado.
const FALLBACK_FORMATION = [{ id: 'boss', x: LAYOUT.BOSS.x, y: LAYOUT.BOSS.y, size: LAYOUT.BOSS.size }]

export const drawBoss = (engine) => {
  const { IMG, G } = engine
  if (!IMG.boss || G.state === GAME_STATES.VICTORY) return

  const formation = G.level?.formation ?? FALLBACK_FORMATION
  formation.forEach((enemy, index) => {
    // Sin `activeEnemy` TODOS se dibujan como activos, y eso NO es un caso borde: es el
    // nivel 1 entero, que tiene un solo enemigo y nunca necesita señalar cuál ataca. Si el
    // default fuera "inactivo", el jefe del nivel 1 se vería al 55% toda la partida.
    const isActive = !G.activeEnemy || G.activeEnemy === enemy.id
    drawEnemy(engine, enemy, isActive, index)
  })
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
