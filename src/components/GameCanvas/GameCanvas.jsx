import { LAYOUT } from '../../constants/LAYOUT'
import { useGameCanvas } from './useGameCanvas.hook'

import './GameCanvas.css'

export const GameCanvas = () => {
  const { canvasRef } = useGameCanvas()

  return <canvas ref={canvasRef} className="game-canvas" width={LAYOUT.W} height={LAYOUT.H} />
}
