import { useCallback, useEffect, useRef, useState } from 'react'

import { GameEngine } from '../../game/GameEngine'
import { musicService } from '../../services/music.service'
import { useGameStore } from '../../stores/useGameStore.store'

// Ciclo de vida del motor: se crea al montar, se destruye al desmontar.
// El motor notifica cambios de pantalla y acá se sincronizan al store.
export const useGameCanvas = ({ initialState } = {}) => {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const [paused, setPaused] = useState(false)
  const setScreen = useGameStore((state) => state.setScreen)
  const setPhase = useGameStore((state) => state.setPhase)
  const setStats = useGameStore((state) => state.setStats)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const engine = new GameEngine(canvas, {
      initialState,
      onScreenChange: (screen, stats, phase) => {
        setScreen(screen)
        setStats(stats)
        setPhase(phase)
        // La música se decide acá y no adentro del motor: el motor no sabe que existe.
        // Se le pasa la fase CRUDA y no `screen`, porque screen colapsa las 12 fases en 5
        // pantallas y perdería la diferencia entre, por ejemplo, INTRO y el combate.
        musicService.playForState(phase)
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
  }, [setScreen, setStats, setPhase, initialState])

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
