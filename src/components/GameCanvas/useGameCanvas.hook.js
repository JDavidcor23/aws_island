import { useCallback, useEffect, useRef, useState } from 'react'

import { GameEngine } from '../../game/GameEngine'
import { GAME_STATES } from '../../constants/GAME_STATES'
import { musicService } from '../../services/music.service'
import { useGameStore } from '../../stores/useGameStore.store'

// Ciclo de vida del motor: se crea al montar, se destruye al desmontar.
// El motor notifica cambios de pantalla y acá se sincronizan al store.
export const useGameCanvas = ({ initialState, level, onLevelComplete } = {}) => {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const setScreen = useGameStore((state) => state.setScreen)
  const setPhase = useGameStore((state) => state.setPhase)
  const setStats = useGameStore((state) => state.setStats)
  const [paused, setPaused] = useState(false)

  // Flag para llamar onLevelComplete UNA SOLA VEZ por montaje. El motor puede notificar
  // VICTORY más de una vez si el jugador aprieta R después de ganar: progressService.complete
  // es idempotente y no rompe el dato, pero SÍ devolvería al jugador al mapa a mitad del
  // flujo de victoria. El ref no se resetea con re-renders, lo que lo hace ideal para este
  // tipo de "llamar sólo la primera vez".
  const levelCompleteCalled = useRef(false)

  // El callback vive en un ref y NO en las dependencias del efecto de abajo. Es deliberado:
  // ese efecto CONSTRUYE Y DESTRUYE el motor, así que cualquier cosa en sus dependencias que
  // cambie de identidad reinicia la partida. `onLevelComplete` llega desde App como una
  // arrow inline —identidad nueva en cada render— y con StrictMode encima el efecto ya corre
  // doble. Meterlo en las dependencias es una bomba: el día que App gane un estado que
  // cambie durante el combate, el juego se reinicia solo a mitad de la partida.
  //
  // El ref se reasigna en cada render, así que el efecto siempre ve la versión más reciente
  // sin tener que reconstruir nada.
  const onLevelCompleteRef = useRef(onLevelComplete)
  onLevelCompleteRef.current = onLevelComplete

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    // Resetear el flag al crear un motor nuevo: cada montaje de GameCanvas corresponde a
    // una partida distinta y merece su propio disparo de onLevelComplete.
    levelCompleteCalled.current = false

    const engine = new GameEngine(canvas, {
      initialState,
      level,
      onScreenChange: (screen, stats, phase) => {
        setScreen(screen)
        setStats(stats)
        setPhase(phase)
        // La música se decide acá y no adentro del motor: el motor no sabe que existe.
        // Se le pasa la fase CRUDA y no `screen`, porque screen colapsa las 12 fases en 5
        // pantallas y perdería la diferencia entre, por ejemplo, INTRO y el combate.
        musicService.playForState(phase)

        // VICTORY: notificar al padre para marcar progreso y volver al mapa.
        // El check del flag evita que el jugador sea devuelto al mapa si aprieta R
        // después de ganar (el motor renotifica VICTORY al reiniciar desde la victoria).
        if (screen === GAME_STATES.VICTORY && !levelCompleteCalled.current) {
          levelCompleteCalled.current = true
          onLevelCompleteRef.current?.()
        }
      },
      onPauseRequest: () => setPaused(true),
    })
    engineRef.current = engine
    engine.init()

    if (import.meta.env.DEV) {
      // acceso de depuración en desarrollo (tests E2E / consola)
      window.__CLOUD_QUEST__ = engine
    }

    window.addEventListener('keydown', engine.handleKeyDown)
    canvas.addEventListener('mousedown', engine.handleMouseDown)
    canvas.addEventListener('mousemove', engine.handleMouseMove)

    return () => {
      window.removeEventListener('keydown', engine.handleKeyDown)
      canvas.removeEventListener('mousedown', engine.handleMouseDown)
      canvas.removeEventListener('mousemove', engine.handleMouseMove)
      engine.destroy()
      engineRef.current = null
    }
  }, [setScreen, setStats, setPhase, initialState, level])

  // La pausa se aplica en un efecto APARTE. Si `paused` estuviera en las dependencias del
  // efecto de arriba, cada pausa destruiría y recrearía el motor — o sea, pausar
  // reiniciaría la partida.
  useEffect(() => {
    if (engineRef.current) engineRef.current.setPaused(paused)
  }, [paused])

  const resume = useCallback(() => setPaused(false), [])

  const restart = useCallback(() => {
    // reset() vuelve al punto de arranque de la fase: la intro si todavía no pasaste el
    // tutorial, o la antesala de la revancha si ya lo pasaste. Es la misma tecla R.
    if (engineRef.current) engineRef.current.reset()
    setPaused(false)
  }, [])

  return { canvasRef, paused, resume, restart }
}
