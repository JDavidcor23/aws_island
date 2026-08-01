import { ISLAND_MAP } from '../../constants/ISLAND_MAP'
import { useIslandMap } from './useIslandMap.hook'
import './IslandMap.css'

// Lo que se dibuja adentro del nodo y cómo se lo nombra un lector de pantalla, por estado.
// El símbolo NO es decoración: es el canal que comunica el estado sin depender del color,
// que es lo único que le queda a un jugador daltónico.
const NODE_GLYPH = { done: '✓', open: null, locked: '🔒' }
const NODE_SUFFIX = { done: ' — completado', open: '', locked: ' — bloqueado' }

// Selección de nivel dentro de una isla. Container-presentational: el hook decide QUÉ
// nodos hay y en qué estado, esto sólo los pinta.
export const IslandMap = ({ island, onPickLevel, onBack }) => {
  const nodes = useIslandMap(island)

  return (
    <div className="island-map" style={{ backgroundImage: `url(${ISLAND_MAP.BACKGROUND})` }}>
      <h1 className="island-map__title">{island.name}</h1>

      {nodes.map((node) => (
        <button
          key={node.id}
          type="button"
          className={`island-map__node island-map__node--${node.status}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          disabled={node.status === 'locked'}
          // El concepto va en el title y no en el nodo: el nodo tiene que leerse de un
          // vistazo como un punto del mapa, no como una tarjeta de texto.
          title={node.concept}
          aria-label={`Nivel ${node.label}: ${node.concept}${NODE_SUFFIX[node.status]}`}
          onClick={() => onPickLevel(node.id)}
        >
          {NODE_GLYPH[node.status] ?? node.label}
        </button>
      ))}

      <button type="button" className="island-map__back" onClick={onBack}>
        ← Menú
      </button>
    </div>
  )
}
