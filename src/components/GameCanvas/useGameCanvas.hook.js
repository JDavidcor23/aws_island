import { useEffect, useRef } from 'react'

import { GameEngine } from '../../game/GameEngine'
import { useGameStore } from '../../stores/useGameStore.store'

// Ciclo de vida del motor: se crea al montar, se destruye al desmontar.
// El motor notifica cambios de pantalla y acá se sincronizan al store.
export const useGameCanvas = ({ initialState } = {}) => {
  const canvasRef = useRef(null)
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
      },
    })
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
    }
  }, [setScreen, setStats, setPhase, initialState])

  return { canvasRef }
}
