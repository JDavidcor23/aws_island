import { LAYOUT } from '../../constants/LAYOUT'
import { drawText, wrapText } from './textHelpers'

// La caja de diálogo vive sola acá porque la usan drawScreens.js Y
// drawPhaseScreens.js, y drawScreens ya importa a este último para armar
// SCREEN_DRAWERS. Dejándola en drawScreens los dos módulos se importaban entre
// sí, y en ese ciclo el orden de evaluación decide si SCREEN_DRAWERS explota.
// Como módulo hoja el ciclo desaparece: no hay orden que pueda fallar.
export const drawDialogue = (engine, speaker, msg, blink = true) => {
  const { ctx, IMG, G } = engine
  const { w: dw, h: dh } = LAYOUT.DIALOGUE
  const dx = (LAYOUT.W - dw) / 2
  const dy = LAYOUT.H - dh - 6
  if (IMG.dlg) ctx.drawImage(IMG.dlg, dx, dy, dw, dh)
  drawText(ctx, speaker, dx + 80, dy + 16, 9, '#f5e6c8')
  wrapText(msg, 40).forEach((line, i) => {
    drawText(ctx, line, LAYOUT.W / 2, dy + 46 + i * 16, 12, '#4a3520')
  })
  if (blink && Math.floor(G.time * 2) % 2 === 0) {
    drawText(ctx, '▼ ESPACIO', dx + dw - 52, dy + dh - 14, 8, '#8a6d3f')
  }
}
