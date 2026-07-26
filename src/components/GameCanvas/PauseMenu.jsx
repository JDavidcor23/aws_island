import { useEffect } from 'react'

import { PAUSE_MENU } from '../../constants/PAUSE_MENU'
import { MenuList } from '../MenuList/MenuList'

import './PauseMenu.css'

// Overlay de pausa. Vive sobre el canvas y es DOM, no canvas: una de sus opciones vuelve al
// menú principal, y eso es estado de React (la pantalla activa en App).
//
// Usa el MISMO MenuList que el menú principal, así que hereda el marco de menu_button.png,
// el caret ▶ y la navegación con flechas. La primera versión tenía botones de borde CSS y
// sólo mouse: dos lenguajes visuales para el mismo control dentro del mismo juego.
//
// El listener de ESC es de ACÁ y no del motor: mientras la pausa está abierta el motor se
// desconectó del teclado (GameEngine.handleKeyDown corta con `if (this.paused) return`), así
// que si este componente no escuchara el ESC no habría forma de cerrarla con el teclado. El
// motor sólo se encarga del ESC que la ABRE.
export const PauseMenu = ({ onResume, onRestart, onExit }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== PAUSE_MENU.CLOSE_KEY) return
      event.preventDefault()
      onResume()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onResume])

  const items = [
    { id: 'resume', label: PAUSE_MENU.RESUME, onSelect: onResume },
    { id: 'restart', label: PAUSE_MENU.RESTART, onSelect: onRestart },
    { id: 'exit', label: PAUSE_MENU.EXIT, onSelect: onExit },
  ]

  return (
    <div className="pause-menu" role="dialog" aria-modal="true" aria-label={PAUSE_MENU.TITLE}>
      <h2 className="pause-menu__title">{PAUSE_MENU.TITLE}</h2>
      <MenuList items={items} ariaLabel={PAUSE_MENU.TITLE} />
      <p className="pause-menu__hint">{PAUSE_MENU.HINT}</p>
    </div>
  )
}
