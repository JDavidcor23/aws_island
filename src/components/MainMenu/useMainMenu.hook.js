import { useCallback, useEffect, useState } from 'react'

import { MENU_KEYS, MENU_OPTIONS } from '../../constants/MAIN_MENU'
import { MUSIC, MUSIC_TRACKS } from '../../constants/MUSIC'
import { musicService } from '../../services/music.service'

// Lo que queda del menú principal después de mudar el foco y las flechas a MenuList:
// qué panel está abierto, qué hace cada opción, y la música.
export const useMainMenu = ({ onStart }) => {
  const [openPanel, setOpenPanel] = useState(null)

  const closePanel = useCallback(() => setOpenPanel(null), [])

  const handleSelect = useCallback(
    (id) => {
      if (id === MENU_OPTIONS.PLAY) {
        onStart()
        return
      }
      setOpenPanel(id)
    },
    [onStart],
  )

  // Música del menú. Se intenta arrancar de una, y si el navegador la bloquea por la
  // política de autoplay queda anotada y el primer gesto real la libera — de ahí el
  // pointerdown de una sola vez. Mover el mouse no cuenta como gesto para el navegador.
  //
  // Se ejecuta también al VOLVER al menú desde la pausa, porque MainMenu se remonta: ahí
  // play() cruza de la pista de batalla a la del menú.
  useEffect(() => {
    musicService.play(MUSIC_TRACKS.MENU)
    const unlock = () => musicService.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Apretar una tecla es el gesto que el navegador pide para dejar sonar el audio
      musicService.unlock()
      if (event.key === MUSIC.MUTE_KEY || event.key === MUSIC.MUTE_KEY.toUpperCase()) {
        musicService.toggleMute()
        return
      }
      // Con el panel abierto ESCAPE es la única tecla que hace algo. Las flechas y el ENTER
      // ya están cortados por el lado de MenuList, que se monta con enabled={false}.
      if (openPanel !== null && event.key === MENU_KEYS.ESCAPE) closePanel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openPanel, closePanel])

  return { openPanel, handleSelect, closePanel }
}
