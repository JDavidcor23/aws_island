import { useEffect } from 'react'

import { LEVEL_CARD } from '../../constants/LEVEL_CARD'

import './LevelCard.css'

// Pantalla en negro con el nombre de la isla, entre el menú y la partida.
//
// Se avisa sola cuando termina (onDone) y también se puede saltear con cualquier tecla o
// clic. Lo de "cualquier tecla" es a propósito y no un atajo: el jugador que ya vio la placa
// va a apretar lo primero que tenga a mano, y buscarle la tecla exacta a una pantalla que no
// hace nada es fricción pura.
export const LevelCard = ({ onDone }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, LEVEL_CARD.DURATION_MS)
    const skip = () => {
      clearTimeout(timer)
      onDone()
    }
    window.addEventListener('keydown', skip, { once: true })
    window.addEventListener('pointerdown', skip, { once: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [onDone])

  return (
    <main className="level-card">
      <div className="level-card__content">
        <h1 className="level-card__name">{LEVEL_CARD.NAME}</h1>
        <p className="level-card__subtitle">{LEVEL_CARD.SUBTITLE}</p>
      </div>
      <p className="level-card__hint">{LEVEL_CARD.SKIP_HINT}</p>
    </main>
  )
}
