import { GameCanvas } from '../../components/GameCanvas/GameCanvas'
import { useBattlePage } from './useBattlePage.hook'

import './BattlePage.css'

export const BattlePage = () => {
  const { hint } = useBattlePage()

  return (
    <main className="battle-page">
      <GameCanvas />
      <p className="battle-page__hint">{hint}</p>
    </main>
  )
}
