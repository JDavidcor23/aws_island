import { CREDITS, HOW_TO_PLAY, MENU_OPTIONS, MENU_TEXTS } from '../../constants/MAIN_MENU'

import './MenuPanel.css'

// Un solo componente para CÓMO SE JUEGA y CRÉDITOS: el marco, el título y el botón de
// volver son idénticos, sólo cambia el cuerpo. El ESCAPE lo escucha el hook del menú,
// no este componente, así que acá no hay listeners.
const HowToPlayBody = () => (
  <>
    <dl className="menu-panel__controls">
      {HOW_TO_PLAY.CONTROLS.map(({ keys, action }) => (
        <div className="menu-panel__control" key={keys}>
          <dt className="menu-panel__keys">{keys}</dt>
          <dd className="menu-panel__action">{action}</dd>
        </div>
      ))}
    </dl>
    <p className="menu-panel__body">{HOW_TO_PLAY.BODY}</p>
  </>
)

const CreditsBody = () => (
  <>
    <ul className="menu-panel__team">
      {CREDITS.TEAM.map((name) => (
        <li className="menu-panel__member" key={name}>{name}</li>
      ))}
    </ul>
    {CREDITS.LINES.map((line) => (
      <p className="menu-panel__body" key={line}>{line}</p>
    ))}
  </>
)

const PANELS = {
  [MENU_OPTIONS.HOW_TO_PLAY]: { title: HOW_TO_PLAY.TITLE, Body: HowToPlayBody },
  [MENU_OPTIONS.CREDITS]: { title: CREDITS.TITLE, Body: CreditsBody },
}

export const MenuPanel = ({ panelId, onClose }) => {
  const panel = PANELS[panelId]
  if (!panel) return null

  const { title, Body } = panel

  return (
    <section className="menu-panel" aria-label={title}>
      <h2 className="menu-panel__title">{title}</h2>
      <div className="menu-panel__frame">
        <Body />
      </div>
      <button type="button" className="menu-panel__back" onClick={onClose}>
        {MENU_TEXTS.BACK}
      </button>
    </section>
  )
}
