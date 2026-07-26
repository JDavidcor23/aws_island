import { useCallback, useEffect, useState } from 'react'

import { audioSettingsService } from '../../services/audioSettings.service'
import { MUSIC } from '../../constants/MUSIC'

// Estado y handlers de los dos sliders de volumen. El componente sólo pinta.
//
// `onFocusChange` no es opcional por capricho: mientras un slider tiene el foco, la lista de
// opciones que lo rodea (MenuList) TIENE que dejar de escuchar el teclado. MenuList tiene un
// listener de ↑/↓ en window, y un <input type="range"> enfocado también usa las flechas, así
// que sin este aviso una flecha mueve el volumen Y el cursor del menú al mismo tiempo. Para
// eso existe el flag `enabled` de useMenuList, que ya se usa igual con los paneles del menú
// principal.
export const useVolumeControls = ({ onFocusChange } = {}) => {
  // Inicialización perezosa (función y no valor): sin ella se leería el service en CADA
  // render y el valor de arranque pisaría lo que el jugador está arrastrando.
  const [music, setMusic] = useState(() => audioSettingsService.get().music)
  const [sfx, setSfx] = useState(() => audioSettingsService.get().sfx)
  const [muted, setMuted] = useState(() => audioSettingsService.isMuted())

  const handleMusicChange = useCallback((event) => {
    setMusic(audioSettingsService.setMusicVolume(event.target.value))
  }, [])

  const handleSfxChange = useCallback((event) => {
    setSfx(audioSettingsService.setSfxVolume(event.target.value))
  }, [])

  const handleFocus = useCallback(() => onFocusChange?.(true), [onFocusChange])
  const handleBlur = useCallback(() => onFocusChange?.(false), [onFocusChange])

  // El mute lo togglea la tecla M desde OTROS dos lugares (GameEngine y useMainMenu), así
  // que este componente se puede quedar mostrando un estado viejo.
  //
  // El listener es de KEYUP y no de keydown a propósito: los que togglean escuchan keydown,
  // y el keyup del mismo golpe de tecla llega siempre después. Escuchando keydown acá, quién
  // gana depende del orden en que se registraron los listeners — o sea, el cartel diría lo
  // contrario de la realidad la mitad de las veces.
  useEffect(() => {
    const syncMute = (event) => {
      if (event.key !== MUSIC.MUTE_KEY && event.key !== MUSIC.MUTE_KEY.toUpperCase()) return
      setMuted(audioSettingsService.isMuted())
    }
    window.addEventListener('keyup', syncMute)
    return () => window.removeEventListener('keyup', syncMute)
  }, [])

  return { music, sfx, muted, handleMusicChange, handleSfxChange, handleFocus, handleBlur }
}
