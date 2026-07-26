import { MENU_ASSETS, MENU_ITEMS, MENU_TEXTS } from '../../constants/MAIN_MENU'
import { MenuList } from '../MenuList/MenuList'
import { MenuPanel } from './MenuPanel'
import { useMainMenu } from './useMainMenu.hook'

import './MainMenu.css'

export const MainMenu = ({ onStart }) => {
  const { openPanel, handleSelect, closePanel } = useMainMenu({ onStart })

  // El subtítulo "Isla 0 — Fundamentos de la Nube" ya NO va acá: se mudó a la placa de
  // nivel que aparece al apretar JUGAR. En la portada era metadata sobre un lugar al que el
  // jugador todavía no entró.
  const items = MENU_ITEMS.map(({ id, label }) => ({
    id,
    label,
    onSelect: () => handleSelect(id),
  }))

  return (
    <main className="main-menu">
      <div className="main-menu__stage">
        <img className="main-menu__background" src={MENU_ASSETS.BACKGROUND} alt="" aria-hidden="true" />
        <div className="main-menu__veil" />

        {/* El elenco. Decoración pura: el fondo tiene suelo vacío en las dos esquinas
            bajas, y ahí es donde no compiten con el logo ni con los botones. */}
        <img className="main-menu__cast main-menu__cast--hero" src={MENU_ASSETS.HERO} alt="" aria-hidden="true" />
        <img className="main-menu__cast main-menu__cast--penguin" src={MENU_ASSETS.PENGUIN} alt="" aria-hidden="true" />

        {/* El contenido se OCULTA cuando hay un panel abierto, pero NO se desmonta: el foco
            de la lista vive adentro de MenuList, así que desmontarla lo perdería y volver
            del panel te dejaría el cursor de nuevo en JUGAR en vez de en la opción que
            acabás de mirar. `visibility: hidden` además la saca del orden de tabulación. */}
        <div className={`main-menu__content${openPanel ? ' main-menu__content--hidden' : ''}`}
             aria-hidden={openPanel ? 'true' : undefined}>
          {/* alt con el título de verdad: el logo transmite información, no decora */}
          <img className="main-menu__logo" src={MENU_ASSETS.LOGO} alt={MENU_TEXTS.TITLE} />
          <MenuList items={items} enabled={!openPanel} ariaLabel={MENU_TEXTS.TITLE} />
          <p className="main-menu__hint">{MENU_TEXTS.NAV_HINT}</p>
        </div>

        {openPanel && <MenuPanel panelId={openPanel} onClose={closePanel} />}
      </div>
    </main>
  )
}
