import { useMemo } from 'react'

import { ISLAND_MAP } from '../../constants/ISLAND_MAP'
import { getLevel } from '../../content/levels'
import { progressService } from '../../services/progress.service'

// El estado de un nodo es UNO de tres, y quién lo decide es este hook — no el JSX.
// El componente lo necesita en tres lugares a la vez (la clase CSS, el aria-label y el
// símbolo que se dibuja adentro), y con `completed`/`unlocked` sueltos cada uno rehacía el
// mismo ternario anidado por su cuenta. Tres copias de una decisión es una que se olvida de
// actualizar el día que aparezca un cuarto estado.
const statusOf = (id) => {
  if (progressService.isCompleted(id)) return 'done'
  return progressService.isUnlocked(id) ? 'open' : 'locked'
}

// Arma la lista de nodos a dibujar. Se calcula una vez por montaje y no por render:
// el progreso no cambia mientras el mapa está en pantalla — cambia cuando volvés de jugar,
// y para entonces el componente se remontó.
export const useIslandMap = (island) => {
  return useMemo(
    () =>
      island.levels
        .filter((id) => ISLAND_MAP.NODES[id])
        .map((id) => ({
          id,
          concept: getLevel(id).concept,
          ...ISLAND_MAP.NODES[id],
          status: statusOf(id),
        })),
    [island],
  )
}
