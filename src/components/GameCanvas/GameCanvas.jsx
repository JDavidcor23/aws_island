import { LAYOUT } from '../../constants/LAYOUT'
import { useGameCanvas } from './useGameCanvas.hook'

import './GameCanvas.css'

export const GameCanvas = ({ initialState }) => {
  const { canvasRef } = useGameCanvas({ initialState })

  return <canvas ref={canvasRef} className="game-canvas" width={LAYOUT.W} height={LAYOUT.H} />
}
