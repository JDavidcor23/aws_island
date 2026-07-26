import { MENU_TEXTS } from '../../constants/MAIN_MENU'
import { useMenuList } from './useMenuList.hook'

import './MenuList.css'

// Lista de opciones con el marco pixel art de `menu_button.png`, el caret ▶ y navegación
// por teclado. La usan el menú principal Y el de pausa: son el mismo control, así que tiene
// que ser el mismo componente. Antes la pausa tenía botones de borde CSS y sólo mouse — dos
// lenguajes visuales para lo mismo dentro del mismo juego.
//
// `items`: [{ id, label, onSelect }]
export const MenuList = ({ items, enabled = true, ariaLabel }) => {
  const { focusedIndex, focus } = useMenuList({
    count: items.length,
    onSelect: (index) => items[index].onSelect(),
    enabled,
  })

  return (
    <nav className="menu-list" aria-label={ariaLabel}>
      {items.map(({ id, label, onSelect }, index) => (
        <button
          type="button"
          key={id}
          className={`menu-list__option${index === focusedIndex ? ' menu-list__option--focused' : ''}`}
          onMouseEnter={() => focus(index)}
          onClick={onSelect}
        >
          <span className="menu-list__caret" aria-hidden="true">{MENU_TEXTS.CARET}</span>
          {label}
        </button>
      ))}
    </nav>
  )
}
