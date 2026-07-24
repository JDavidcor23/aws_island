import { create } from 'zustand'

// Estado compartido entre el motor del juego y el shell React.
// El motor lo actualiza SOLO en eventos discretos (cambio de pantalla),
// nunca por frame — eso mataría el rendimiento.
export const useGameStore = create((set) => ({
  screen: 'LOAD', // LOAD | TITLE | BATTLE | VICTORY | DEFEAT
  // Fase cruda del motor: uno de los 12 GAME_STATES. `screen` las colapsa en 5,
  // así que no sirve para distinguir PROBLEM de CHOOSE o de TIMING.
  phase: 'LOAD',
  stats: { perfects: 0, hearts: 4 },
  setScreen: (screen) => set({ screen }),
  setPhase: (phase) => set({ phase }),
  setStats: (stats) => set({ stats }),
}))
