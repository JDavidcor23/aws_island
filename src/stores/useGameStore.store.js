import { create } from 'zustand'

// Estado compartido entre el motor del juego y el shell React.
// El motor lo actualiza SOLO en eventos discretos (cambio de pantalla),
// nunca por frame — eso mataría el rendimiento.
export const useGameStore = create((set) => ({
  screen: 'LOAD', // LOAD | TITLE | BATTLE | VICTORY | DEFEAT
  stats: { perfects: 0, hearts: 4 },
  setScreen: (screen) => set({ screen }),
  setStats: (stats) => set({ stats }),
}))
