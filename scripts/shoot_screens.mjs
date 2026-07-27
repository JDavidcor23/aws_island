// Capturas para el README, tomadas del juego CORRIENDO.
//
// POR QUE NO SE SIMULA EL JUEGO. Llegar a la pantalla del remate apretando ESPACIO en el
// momento justo desde un script es fragil: depende del timing real del orbe y falla una de
// cada tres corridas. En cambio el motor se expone en `window.__CLOUD_QUEST__` cuando corre
// en dev, y su draw() es una funcion PURA de G: se le setea el estado y pinta esa pantalla.
// Asi cada captura es determinista.
//
// Requiere playwright instalado ad-hoc (NO esta en package.json a proposito, es una
// herramienta de documentacion, no una dependencia del juego):
//
//     npm install --no-save playwright
//     npx playwright install chromium
//     npm run dev                      # en otra terminal
//     node scripts/shoot_screens.mjs
//
// Salida: docs/screens/*.png a 3x (1920x1080), que es lo que se ve nitido en GitHub.

import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const URL = process.env.URL ?? 'http://localhost:5173'
const OUT = path.join(process.cwd(), 'docs', 'screens')
// El canvas es 640x360 logicos. 3x da 1920x1080: suficiente para que GitHub no lo escale
// hacia abajo y se vea el pixel art nitido.
const SCALE = 3

// Cada toma dice como dejar el motor y que capturar.
// `setup` corre DENTRO del navegador con el engine como argumento.
const SHOTS = [
  {
    name: '01-menu',
    // El menu principal es DOM, no canvas: no hace falta tocar el motor.
    dom: true,
    describe: 'menu principal',
  },
  {
    name: '02-intro-barco',
    describe: 'la llegada en barco',
    setup: (e) => {
      e.setState('INTRO')
      e.G.intro = { step: 'BOAT_IN', stepTime: 1.9, heroX: -40, penguinX: 250,
                    penguinWalkTime: 0, line: 0, walkTime: 0, revealTime: 0, typedChars: 0 }
      e.G.time = 2.2
    },
  },
  {
    name: '03-intro-mentor',
    describe: 'el pinguino explica donde estas',
    setup: (e) => {
      e.setState('INTRO')
      e.G.intro = { step: 'TALK', stepTime: 3, heroX: 150, penguinX: 250, penguinWalkTime: 0,
                    line: 2, walkTime: 0, revealTime: 4.2, typedChars: 126 }
      e.G.time = 1
    },
  },
  {
    name: '04-briefing',
    describe: 'el briefing: el mentor senala al jefe',
    setup: (e) => {
      e.setState('BRIEFING')
      e.G.briefing = { line: 0, revealTime: 4, typedChars: 120 }
      e.G.time = 0.5
    },
  },
  {
    name: '05-problema',
    describe: 'el jefe grita un problema',
    setup: (e) => {
      e.G.cards = ['ela', 'self', 'net', 'pool']
      e.G.order = [0, 1, 2, 3]
      e.G.round = 0
      e.setState('PROBLEM')
      e.G.t = 0.9
      e.G.time = 1.4
    },
  },
  {
    name: '06-elegir-carta',
    describe: 'las 4 cartas, con la correcta resaltada por el tutorial',
    setup: (e) => {
      e.G.cards = ['self', 'ela', 'pool', 'net']
      e.G.order = [0, 1, 2, 3]
      e.G.round = 0
      e.G.sel = 1
      e.G.wrong = new Set()
      e.setState('CHOOSE')
      // time elegido para que el pulso del brillo guia este en su punto mas alto
      e.G.time = 0.4
    },
  },
  {
    name: '07-ficha-carta',
    describe: 'la ficha de la carta: que es, por que funciona y que bloquea',
    setup: (e) => {
      e.G.cards = ['self', 'ela', 'pool', 'net']
      e.G.order = [0, 1, 2, 3]
      e.G.round = 0
      e.G.sel = 1
      e.G.wrong = new Set()
      e.setState('CHOOSE')
      e.G.infoCard = 'ela'
      e.G.time = 0.4
    },
  },
  {
    name: '08-bloqueo',
    describe: 'el orbe en vuelo, el momento del bloqueo',
    setup: (e) => {
      e.G.cards = ['self', 'ela', 'pool', 'net']
      e.G.order = [0, 1, 2, 3]
      e.G.round = 0
      e.G.chosen = 'ela'
      e.setState('TIMING')
      e.G.atk = { phase: 'fly', t: 0.7, x: 190, y: 240, vx: -250, vy: 60, blocked: null, warned: false }
      e.G.special = 25
      e.G.time = 1.1
    },
  },
  {
    name: '09-remate',
    describe: 'el remate: la nube responde',
    setup: (e) => {
      e.G.special = 100
      e.setState('FINISH_ANIM')
      e.G.finisher = { step: 'FIRE', t: 0.75, booms: 3 }
      e.G.bossGone = 0.35
      e.G.bossHit = 0.3
      e.G.time = 3
    },
  },
  {
    name: '10-victoria',
    describe: 'la isla revive',
    setup: (e) => {
      e.G.perfects = 4
      e.G.hearts = 4
      e.setState('VICTORY')
      e.G.time = 1
    },
  },
]

const shoot = async (page, shot) => {
  if (shot.dom) {
    await page.screenshot({ path: path.join(OUT, `${shot.name}.png`) })
    console.log(`  OK ${shot.name}  (${shot.describe})`)
    return
  }

  // Entrar al juego: JUGAR y despues saltear la placa de nivel.
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('JUGAR'))
    if (btn) btn.click()
  })
  await page.waitForTimeout(2600)   // LEVEL_CARD.DURATION_MS + aire
  await page.waitForFunction(() => Boolean(window.__CLOUD_QUEST__), null, { timeout: 15000 })
  // Y esperar a que los sprites terminen de cargar, o se capturan pantallas vacias.
  await page.waitForFunction(() => Object.keys(window.__CLOUD_QUEST__.IMG).length > 10, null, { timeout: 15000 })

  await page.evaluate((src) => {
    const engine = window.__CLOUD_QUEST__
    // Congelar el loop: si sigue corriendo, update() avanza G.t y pisa el estado que
    // acabamos de armar entre que lo seteamos y que se toma la foto.
    engine.setPaused(true)
    // eslint-disable-next-line no-new-func
    new Function('e', `(${src})(e)`)(engine)
    engine.draw()
  }, shot.setup.toString())

  const canvas = await page.locator('canvas')
  await canvas.screenshot({ path: path.join(OUT, `${shot.name}.png`) })
  console.log(`  OK ${shot.name}  (${shot.describe})`)
}

const main = async () => {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 640 * SCALE, height: 360 * SCALE },
    deviceScaleFactor: 1,
  })

  const errors = []
  page.on('pageerror', (err) => errors.push(String(err)))

  console.log(`abriendo ${URL}`)
  for (const shot of SHOTS) {
    // Recarga limpia por toma: el motor muta G y una toma podria contaminar la siguiente.
    await page.goto(URL, { waitUntil: 'load' })
    await page.waitForTimeout(400)
    try {
      await shoot(page, shot)
    } catch (err) {
      console.log(`  FALLO ${shot.name}: ${err.message}`)
    }
  }

  await browser.close()
  if (errors.length) {
    console.log('\nerrores de JS en la pagina:')
    for (const e of new Set(errors)) console.log(`  ${e}`)
  }
  console.log(`\nlisto: ${OUT}`)
}

main()
