import { BRIEFING } from '../../constants/BRIEFING'
import { LAYOUT } from '../../constants/LAYOUT'
import { currentBriefingLine, revealedChars } from '../scenes/briefingScene'
import { drawTypedDialogue } from './drawDialogue'
import { drawTextOutlined } from './textHelpers'

// Antesala del combate. El jefe y el héroe los dibuja GameEngine.draw() ANTES de llamar
// acá (BRIEFING no está en OWN_SCENE_STATES a propósito: la escena de la arena ya es la
// correcta, no hay que repintarla). Este archivo agrega sólo lo que es del briefing: el
// velo, el mentor, la flecha que señala al jefe y la caja tipeada.
export const drawBriefing = (engine) => {
  const { ctx, IMG, G } = engine
  const briefing = G.briefing || BRIEFING.INITIAL

  // 1. Velo tenue. Baja la arena para que el texto se lea, sin tapar al jefe: acá el jefe
  // es justamente lo que hay que mirar.
  ctx.fillStyle = BRIEFING.VEIL
  ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)

  // 2. Flecha sobre el jefe. Sin algo que apunte, "mirá allá" es todo el cuadro.
  const pointer = BRIEFING.POINTER
  const pointerY = pointer.Y + Math.sin(G.time * pointer.BOB_FREQ) * pointer.BOB_AMP
  drawTextOutlined(ctx, pointer.CHAR, pointer.X, Math.round(pointerY), pointer.SIZE, pointer.COLOR)

  // 3. El mentor, al lado del héroe y mirando al jefe.
  // penguinTalk1 es el frame con la aleta LEVANTADA: acá no alterna, se queda con ese fijo
  // porque el gesto que tiene que leerse es "te está señalando eso", no "está charlando".
  // Sin espejar: el sprite mira a la derecha y el jefe está a la derecha.
  const penguin = IMG.penguinTalk1 || IMG.penguin
  if (penguin) {
    const size = BRIEFING.PENGUIN_SIZE
    const bob = Math.sin(G.time * BRIEFING.BOB_FREQ) * BRIEFING.BOB_AMP
    ctx.drawImage(
      penguin,
      Math.round(BRIEFING.PENGUIN_X - size / 2),
      Math.round(BRIEFING.GROUND_Y - size + bob),
      size,
      size,
    )
  }

  // 4. Caja de diálogo ABAJO con typewriter. Abajo y no arriba como la intro: el jefe ocupa
  // el centro y la franja alta del cuadro, y es lo que esta pantalla viene a mostrar.
  // Además es la MISMA posición que usan PROBLEM y EXPLAIN, así que el jugador ya sabe
  // dónde mirar cuando arranca la pelea.
  const line = currentBriefingLine(briefing)
  drawTypedDialogue(engine, {
    speaker: BRIEFING.SPEAKER,
    text: line.text,
    revealedChars: revealedChars(briefing),
  })
}
