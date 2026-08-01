import { useCallback, useState } from 'react'

import { LevelCard } from './components/LevelCard/LevelCard'
import { MainMenu } from './components/MainMenu/MainMenu'
import { BattlePage } from './pages/BattlePage/BattlePage'

import { GAME_STATES } from './constants/GAME_STATES'
import { getLevel } from './content/levels'

// Las tres pantallas de la app. Un enum y no dos booleanos: con `started` + `showingCard`
// existían cuatro combinaciones y dos no significaban nada.
const APP_SCREENS = {
  MENU: 'MENU',
  LEVEL_CARD: 'LEVEL_CARD',
  PLAYING: 'PLAYING',
}

export const App = () => {
  // Estado LOCAL a propósito, no en Zustand: qué pantalla de la app se ve no lo necesita el
  // motor, y subirlo al store global acoplaría el menú con el combate.
  const [screen, setScreen] = useState(APP_SCREENS.MENU)

  const start = useCallback(() => setScreen(APP_SCREENS.LEVEL_CARD), [])
  const play = useCallback(() => setScreen(APP_SCREENS.PLAYING), [])
  const exitToMenu = useCallback(() => setScreen(APP_SCREENS.MENU), [])

  if (screen === APP_SCREENS.MENU) return <MainMenu onStart={start} />

  // JUGAR no entra directo al juego: pasa por la placa con el nombre de la isla.
  if (screen === APP_SCREENS.LEVEL_CARD) return <LevelCard onDone={play} />

  // El motor arranca en INTRO (la llegada en barco y el diálogo del pingüino) en vez de
  // TITLE, así el jugador no ve DOS pantallas de título seguidas.
  //
  // Volver al menú desmonta BattlePage entero, y con él el motor: el efecto de
  // useGameCanvas destruye el rAF en su cleanup. Volver a JUGAR crea un motor nuevo, así
  // que la partida arranca de cero sin que nadie tenga que resetear nada a mano.
  return (
    <BattlePage
      initialState={GAME_STATES.INTRO}
      level={getLevel('isla0-n1')}
      onExitToMenu={exitToMenu}
    />
  )
}
