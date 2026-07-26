import { LAYOUT } from '../../constants/LAYOUT'
import { INTRO_SCENE, INTRO_STEPS, INTRO_LINES } from '../../constants/INTRO_SCENE'
import { boatX, fadeAlpha, fadePastMidpoint, heroBoatPos, penguinIsWalking } from '../scenes/introScene'
import { drawTypedDialogue } from './drawDialogue'
import { drawTextOutlined } from './textHelpers'

// Helper: ancla sprites por los PIES, no por el centro.
// La esquina superior va en groundY - size (los pies tocan groundY).
// `mirror` invierte el sprite en X: se traslada al borde DERECHO del destino antes
// de escalar en -1, porque scale(-1) sin ese translate dibuja fuera del canvas.
const drawGrounded = (ctx, img, centerX, size, mirror = false, groundY = INTRO_SCENE.GROUND_Y) => {
  const x = Math.round(centerX - size / 2)
  const y = Math.round(groundY - size)
  if (!mirror) {
    ctx.drawImage(img, x, y, size, size)
    return
  }
  ctx.save()
  ctx.translate(x + size, y)
  ctx.scale(-1, 1)
  ctx.drawImage(img, 0, 0, size, size)
  ctx.restore()
}

// La llegada pasa en el mar; del fade en adelante, en la aldea.
// El punto medio del fade es donde cambia, con la pantalla en negro.
const isAtSea = (intro) =>
  intro.step === INTRO_STEPS.BOAT_IN ||
  (intro.step === INTRO_STEPS.FADE && !fadePastMidpoint(intro))

const drawSeaScene = (engine, intro) => {
  const { ctx, IMG, G } = engine
  const { BOAT } = INTRO_SCENE

  // El cabeceo se aplica al bote Y al héroe con el mismo valor: son un solo objeto.
  // Sigue cabeceando durante el fade a propósito — un bote amarrado se mueve con el agua,
  // y congelarlo justo cuando la pantalla se va a negro se lee como que el juego se trabó.
  const bob = Math.sin(G.time * BOAT.BOB_FREQ) * BOAT.BOB_AMP

  if (IMG.boat) {
    ctx.drawImage(
      IMG.boat,
      Math.round(boatX(intro) - BOAT.WIDTH / 2),
      Math.round(BOAT.WATERLINE_Y + bob - BOAT.HEIGHT),
      BOAT.WIDTH,
      BOAT.HEIGHT,
    )
  }

  const hero = heroBoatPos(intro)
  if (IMG.heroSide) {
    drawGrounded(ctx, IMG.heroSide, hero.x, INTRO_SCENE.HERO_SIZE, false, hero.y + bob)
  }
}

// Frame del mentor caminando. Devuelve { img, hop }: `hop` es el rebote vertical que hay
// que sumarle, y sólo es distinto de cero en el camino de fallback.
//
// Con penguin_walk_1..4 presentes, el ciclo real ya trae su propio sube-y-baja y sumarle
// un seno encima lo haría flotar. Sin ellos —una clave del manifest sin archivo no rompe
// el juego, entra en engine.loadErrors— el pingüino TIENE que caminar igual: quedarse
// quieto es exactamente el bug que esto viene a arreglar, y un asset que falta no puede
// devolvernos ahí. El plan B alterna los dos frames de habla (aleta arriba / aleta abajo)
// y agrega el rebote a mano, que a 8 fps se lee como un pingüino contoneándose.
const penguinWalkSprite = (engine, intro) => {
  const { IMG, G } = engine
  const { PENGUIN_WALK } = INTRO_SCENE
  const frames = [IMG.penguinWalk1, IMG.penguinWalk2, IMG.penguinWalk3, IMG.penguinWalk4]

  if (frames.every(Boolean)) {
    const index = Math.floor(intro.penguinWalkTime / PENGUIN_WALK.FRAME_DURATION) % PENGUIN_WALK.FRAME_COUNT
    return { img: frames[index], hop: 0 }
  }

  const flipperUp = Math.floor(intro.penguinWalkTime / PENGUIN_WALK.FRAME_DURATION) % 2 === 0
  return {
    img: flipperUp ? IMG.penguinTalk1 : IMG.penguinTalk2,
    // Math.abs: un rebote sólo hacia ARRIBA. Un seno con signo lo hunde en el piso media
    // parte del ciclo, y ahí se ve como si pisara en un pozo.
    hop: -Math.abs(Math.sin(G.time * PENGUIN_WALK.FALLBACK_HOP_FREQ)) * PENGUIN_WALK.FALLBACK_HOP_AMP,
  }
}

const drawVillageScene = (engine, intro) => {
  const { ctx, IMG, G } = engine

  // --- Pingüino ---
  const walking = penguinIsWalking(intro)
  let penguinImg
  let penguinHop = 0
  if (walking) {
    const sprite = penguinWalkSprite(engine, intro)
    penguinImg = sprite.img
    penguinHop = sprite.hop
  } else {
    // Quieto: alterna la boca si está hablando
    const talking = intro.step === INTRO_STEPS.TALK
    const mouthOpen = Math.floor(G.time / INTRO_SCENE.PENGUIN_TALK_FRAME_DURATION) % 2 === 0
    penguinImg = talking && mouthOpen ? IMG.penguinTalk1 : IMG.penguinTalk2
  }
  if (penguinImg) {
    drawGrounded(
      ctx,
      penguinImg,
      intro.penguinX,
      INTRO_SCENE.PENGUIN_SIZE,
      // Espejado SÓLO cuando está quieto hablando: el sprite mira a la derecha y el héroe
      // frena a su IZQUIERDA, así que sin espejar le habla al vacío. Pero cuando CAMINA va
      // hacia la derecha, y espejarlo ahí lo haría caminar de espaldas.
      !walking && INTRO_SCENE.PENGUIN_FACES_HERO,
      INTRO_SCENE.GROUND_Y + penguinHop,
    )
  }

  // Héroe — frame de caminata si camina, heroSide si quieto
  let heroImg = IMG.heroSide
  if (intro.step === INTRO_STEPS.WALK_IN || intro.step === INTRO_STEPS.WALK_OUT) {
    const frameIndex = Math.floor(intro.walkTime / INTRO_SCENE.WALK_FRAME_DURATION) % INTRO_SCENE.WALK_FRAME_COUNT
    const walkKey = `walk${frameIndex + 1}`
    heroImg = IMG[walkKey] || IMG.heroSide
  }
  if (heroImg) {
    drawGrounded(ctx, heroImg, intro.heroX, INTRO_SCENE.HERO_SIZE)
  }
}

export const drawIntroScene = (engine) => {
  const { ctx, IMG, G } = engine
  const intro = G.intro || INTRO_SCENE.INITIAL
  const atSea = isAtSea(intro)

  // 1. Fondo (o fallback)
  const bg = atSea ? IMG.islandShore : IMG.islandPath
  if (bg) {
    ctx.drawImage(bg, 0, 0, LAYOUT.W, LAYOUT.H)
  } else {
    ctx.fillStyle = atSea ? INTRO_SCENE.FALLBACK_SEA : INTRO_SCENE.FALLBACK_BG
    ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
  }

  // 2. Personajes
  if (atSea) drawSeaScene(engine, intro)
  else drawVillageScene(engine, intro)

  // 3. Hint de saltear (esquina superior derecha, no tapa personajes)
  drawTextOutlined(ctx, INTRO_SCENE.SKIP_HINT, LAYOUT.W - 70, 20, 9, '#9fb6d8')

  // 4. Caja de diálogo ARRIBA con efecto typewriter.
  // El dibujado vive en drawDialogue.drawTypedDialogue, compartido con el briefing: la
  // caja tipeada es el mismo widget en las dos escenas.
  if (intro.step === INTRO_STEPS.TALK && intro.line < INTRO_LINES.length) {
    const line = INTRO_LINES[intro.line]
    drawTypedDialogue(engine, {
      speaker: line.speaker,
      text: line.text,
      revealedChars: Math.floor(intro.revealTime * INTRO_SCENE.REVEAL_CHARS_PER_SEC),
      top: true,
    })
  }

  // 5. Negro del corte. Va ÚLTIMO y tapa todo, incluido el hint de saltear: es un corte
  // de escena, no un velo de ambiente.
  const alpha = fadeAlpha(intro)
  if (alpha > 0) {
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
    ctx.globalAlpha = 1
  }
}
