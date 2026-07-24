// Helpers de texto para el canvas: texto plano, texto con contorno y wrap.
export const drawText = (ctx, str, x, y, size = 10, color = '#fff', align = 'center', bold = true) => {
  ctx.font = `${bold ? 'bold ' : ''}${size}px monospace`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(str, Math.round(x), Math.round(y))
}

export const drawTextOutlined = (ctx, str, x, y, size = 10, color = '#fff', align = 'center') => {
  ctx.font = `bold ${size}px monospace`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 3
  ctx.strokeStyle = '#141420'
  ctx.strokeText(str, Math.round(x), Math.round(y))
  ctx.fillStyle = color
  ctx.fillText(str, Math.round(x), Math.round(y))
}

export const wrapText = (str, maxChars) => {
  const words = str.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars) {
      lines.push(line.trim())
      line = word
    } else {
      line += ' ' + word
    }
  }
  if (line.trim()) lines.push(line.trim())
  return lines
}
