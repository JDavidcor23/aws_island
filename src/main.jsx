import React from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'

import { audioSettingsService } from './services/audioSettings.service'
import { progressService } from './services/progress.service'

import './index.css'

// Los volúmenes guardados se aplican ANTES del primer render, y por eso está acá y no en un
// efecto de App: useMainMenu arranca la música en su primer efecto, y si los ajustes se
// cargaran después, el primer segundo de música suena al volumen por defecto y baja de golpe.
// Es el único trabajo de bootstrap del proyecto; no justifica un componente.
audioSettingsService.load()

// Consola de desarrollo. `import.meta.env.DEV` es false en cualquier build de producción, así
// que el bundler borra este bloque entero — no queda un panel de trucos en el juego publicado.
//
// Existe porque probar el nivel 4 no puede costar jugarse los tres anteriores cada vez, y
// porque la alternativa —dejar todo desbloqueado siempre en dev— taparía un bug en el
// desbloqueo real hasta que lo encontrara un jugador.
if (import.meta.env.DEV) {
  window.cq = {
    unlockAll: () => {
      progressService.setDevUnlock(true)
      location.reload()
    },
    lockAll: () => {
      progressService.setDevUnlock(false)
      location.reload()
    },
    // Borra el progreso de verdad: vuelve a la primera partida, con la intro y todo.
    reset: () => {
      progressService.reset()
      progressService.setDevUnlock(false)
      location.reload()
    },
    status: () => ({ ...progressService.load(), devUnlock: progressService.isDevUnlockOn() }),
  }
  // eslint-disable-next-line no-console
  console.info('[cq] dev: cq.unlockAll() · cq.lockAll() · cq.reset() · cq.status()')
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
