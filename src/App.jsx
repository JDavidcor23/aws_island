import { useCallback, useState } from 'react'

import { IslandMap } from './components/IslandMap/IslandMap'
import { LevelCard } from './components/LevelCard/LevelCard'
import { MainMenu } from './components/MainMenu/MainMenu'
import { BattlePage } from './pages/BattlePage/BattlePage'

import { GAME_STATES } from './constants/GAME_STATES'
import { ISLAND0 } from './content/islands/island0'
import { getLevel } from './content/levels'
import { progressService } from './services/progress.service'

// Las cuatro pantallas de la app. Un enum y no booleanos: con dos booleanos existirían
// cuatro combinaciones y dos no significarían nada.
const APP_SCREENS = {
  MENU: 'MENU',
  LEVEL_CARD: 'LEVEL_CARD',
  ISLAND_MAP: 'ISLAND_MAP',
  PLAYING: 'PLAYING',
}

export const App = () => {
  // Estado LOCAL a propósito, no en Zustand: qué pantalla de la app se ve no lo necesita el
  // motor, y subirlo al store global acoplaría el menú con el combate.
  const [screen, setScreen] = useState(APP_SCREENS.MENU)
  // Qué nivel se está jugando. Vive acá y no en el store por la misma razón que `screen`:
  // el motor lo recibe por props, no lo consulta.
  const [levelId, setLevelId] = useState(null)

  const start = useCallback(() => setScreen(APP_SCREENS.LEVEL_CARD), [])
  const toMap = useCallback(() => setScreen(APP_SCREENS.ISLAND_MAP), [])
  const exitToMenu = useCallback(() => setScreen(APP_SCREENS.MENU), [])

  const play = useCallback((id) => {
    setLevelId(id)
    setScreen(APP_SCREENS.PLAYING)
  }, [])

  // Al terminar un nivel se marca el progreso y se vuelve AL MAPA, no al menú: el mapa es
  // donde se ve lo que acabás de desbloquear.
  const finishLevel = useCallback((id) => {
    const index = ISLAND0.levels.indexOf(id)
    progressService.complete(id, ISLAND0.levels[index + 1])
    setScreen(APP_SCREENS.ISLAND_MAP)
  }, [])

  // La intro (barco + mentor + briefing) es de la ISLA y corre UNA vez. El resto de los
  // niveles entra directo al briefing: el jugador ya sabe dónde está y quién es el pingüino.
  const firstVisit = !progressService.hasSeenIntro(ISLAND0.id)

  if (screen === APP_SCREENS.MENU) return <MainMenu onStart={start} />

  // JUGAR no entra directo al juego: pasa por la placa con el nombre de la isla.
  if (screen === APP_SCREENS.LEVEL_CARD) return <LevelCard onDone={toMap} />

  if (screen === APP_SCREENS.ISLAND_MAP) {
    return <IslandMap island={ISLAND0} onPickLevel={play} onBack={exitToMenu} />
  }

  // Guardia explícita: si por algún bug de flujo llegamos a PLAYING sin levelId,
  // getLevel(null) tira "nivel desconocido: null" en lugar de un error críptico del motor.
  // El mapa SIEMPRE setea levelId antes de setear screen=PLAYING (en `play`), así que
  // esto no debería ocurrir — pero si ocurre, el error es legible.
  return (
    <BattlePage
      initialState={firstVisit ? GAME_STATES.INTRO : GAME_STATES.BRIEFING}
      level={getLevel(levelId)}
      onExitToMenu={exitToMenu}
      onLevelComplete={() => {
        progressService.markIntroSeen(ISLAND0.id)
        finishLevel(levelId)
      }}
    />
  )
}
