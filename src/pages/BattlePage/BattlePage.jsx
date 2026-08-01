import { GameCanvas } from '../../components/GameCanvas/GameCanvas'
import { useBattlePage } from './useBattlePage.hook'

import './BattlePage.css'

export const BattlePage = ({ initialState, level, onExitToMenu, onLevelComplete }) => {
  const { hint } = useBattlePage()

  return (
    <main className="battle-page">
      <GameCanvas
        initialState={initialState}
        level={level}
        onExitToMenu={onExitToMenu}
        onLevelComplete={onLevelComplete}
      />
      <p className="battle-page__hint">{hint}</p>
    </main>
  )
}
