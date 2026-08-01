import { ASSETS_BASE_PATH, ASSETS_MANIFEST } from '../constants/ASSETS_MANIFEST'

// Carga de sprites + pre-render de efectos costosos.
// IMPORTANTE (rendimiento): shadowBlur y ctx.filter por frame son carísimos
// en Canvas 2D. Acá se pre-renderizan UNA vez a canvases offscreen y el
// juego solo hace drawImage, que es barato.
export const assetsService = {
  loadAll: () => {
    const images = {}
    const errors = []
    const jobs = Object.entries(ASSETS_MANIFEST).map(
      ([key, file]) =>
        new Promise((resolve) => {
          const img = new Image()
          img.onload = () => {
            images[key] = img
            resolve()
          }
          img.onerror = () => {
            errors.push(file)
            resolve()
          }
          img.src = ASSETS_BASE_PATH + file
        }),
    )
    return Promise.all(jobs).then(() => ({ images, errors }))
  },

  // Copia blanca de un sprite (para el flash de daño del jefe)
  makeWhiteSprite: (img) => {
    const off = document.createElement('canvas')
    off.width = img.width
    off.height = img.height
    const ctx = off.getContext('2d')
    ctx.drawImage(img, 0, 0)
    ctx.globalCompositeOperation = 'source-in'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, off.width, off.height)
    return off
  },

  // Copia teñida de un sprite. La usa la formación de varios enemigos del nivel 2, que son
  // el MISMO png repetido: el tinte es lo único que los separa.
  //
  // Va acá, pre-renderizado a un canvas offscreen, y NO compuesto por frame en el canvas del
  // juego. Ese fue el primer intento y sale mal por una razón concreta: 'source-atop' compone
  // contra lo que YA hay dibujado, y en el canvas del juego eso incluye el fondo — el
  // resultado es un rectángulo de color tapando la escena. Acá el canvas sólo tiene el
  // sprite, así que el color cae únicamente sobre sus píxeles opacos y respeta su alpha.
  makeTintedSprite: (img, color, strength = 0.45) => {
    const off = document.createElement('canvas')
    off.width = img.width
    off.height = img.height
    const ctx = off.getContext('2d')
    ctx.drawImage(img, 0, 0)
    ctx.globalCompositeOperation = 'source-atop'
    ctx.globalAlpha = strength
    ctx.fillStyle = color
    ctx.fillRect(0, 0, off.width, off.height)
    return off
  },

  // Halo circular pre-renderizado (reemplaza shadowBlur en orbes)
  makeGlowSprite: (color, radius) => {
    const size = radius * 2
    const off = document.createElement('canvas')
    off.width = size
    off.height = size
    const ctx = off.getContext('2d')
    const grad = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius)
    grad.addColorStop(0, color)
    grad.addColorStop(0.5, color.replace(')', ', 0.4)').replace('rgb', 'rgba'))
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    return off
  },
}
