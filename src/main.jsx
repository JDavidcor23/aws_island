import React from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'

import { audioSettingsService } from './services/audioSettings.service'

import './index.css'

// Los volúmenes guardados se aplican ANTES del primer render, y por eso está acá y no en un
// efecto de App: useMainMenu arranca la música en su primer efecto, y si los ajustes se
// cargaran después, el primer segundo de música suena al volumen por defecto y baja de golpe.
// Es el único trabajo de bootstrap del proyecto; no justifica un componente.
audioSettingsService.load()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
