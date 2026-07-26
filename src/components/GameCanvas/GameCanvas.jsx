import { LAYOUT } from '../../constants/LAYOUT'
import { PauseMenu } from './PauseMenu'
import { useGameCanvas } from './useGameCanvas.hook'

import './GameCanvas.css'

export const GameCanvas = ({ initialState, onExitToMenu }) => {
  const { canvasRef, paused, resume, restart } = useGameCanvas({ initialState })

  return (
    <div className="game-canvas">
      <canvas
        ref={canvasRef}
        className="game-canvas__surface"
        width={LAYOUT.W}
        height={LAYOUT.H}
      />
      {paused && (
        <PauseMenu onResume={resume} onRestart={restart} onExit={onExitToMenu} />
      )}
    </div>
  )
}
