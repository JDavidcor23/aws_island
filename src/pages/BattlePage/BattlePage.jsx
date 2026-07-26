import { GameCanvas } from '../../components/GameCanvas/GameCanvas'
import { useBattlePage } from './useBattlePage.hook'

import './BattlePage.css'

export const BattlePage = ({ initialState, onExitToMenu }) => {
  const { hint } = useBattlePage()

  return (
    <main className="battle-page">
      <GameCanvas initialState={initialState} onExitToMenu={onExitToMenu} />
      <p className="battle-page__hint">{hint}</p>
    </main>
  )
}
