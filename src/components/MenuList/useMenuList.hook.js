import { useCallback, useEffect, useState } from 'react'

import { MENU_KEYS } from '../../constants/MAIN_MENU'

// Navegación por teclado de una lista de opciones. La comparten el menú principal y el de
// pausa: sin esto cada menú traía su propio manejo de flechas y terminaban comportándose
// distinto, que es exactamente lo que pasó — la pausa había quedado sólo con el mouse.
//
// `enabled` existe para el caso del menú principal con un panel abierto: la lista sigue
// montada detrás pero NO tiene que responder al teclado, o el jugador cierra el panel y
// descubre que mientras leía se le movió el foco.
export const useMenuList = ({ count, onSelect, enabled = true }) => {
  const [focusedIndex, setFocusedIndex] = useState(0)

  const focus = useCallback((index) => setFocusedIndex(index), [])

  useEffect(() => {
    if (!enabled) return undefined

    const handleKeyDown = (event) => {
      if (event.key === MENU_KEYS.DOWN) {
        // preventDefault en flechas y ESPACIO: sin esto el navegador scrollea la página
        // además de mover el foco, y en viewports cortos el menú salta.
        event.preventDefault()
        setFocusedIndex((current) => (current + 1) % count)
        return
      }
      if (event.key === MENU_KEYS.UP) {
        event.preventDefault()
        setFocusedIndex((current) => (current - 1 + count) % count)
        return
      }
      if (event.key === MENU_KEYS.ENTER || event.key === MENU_KEYS.SPACE) {
        // preventDefault también evita la doble activación: si un <button> quedó con foco
        // del DOM después de un clic, el navegador le sintetiza un click al soltar
        // ESPACIO. Este handler ya activó la opción, así que ese click sería el segundo.
        event.preventDefault()
        onSelect(focusedIndex)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [count, onSelect, focusedIndex, enabled])

  return { focusedIndex, focus }
}
