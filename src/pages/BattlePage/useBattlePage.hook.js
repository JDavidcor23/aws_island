import { SCREEN_HINTS } from '../../constants/UI_TEXTS'
import { useGameStore } from '../../stores/useGameStore.store'

export const useBattlePage = () => {
  const screen = useGameStore((state) => state.screen)

  return { hint: SCREEN_HINTS[screen] ?? SCREEN_HINTS.BATTLE }
}
