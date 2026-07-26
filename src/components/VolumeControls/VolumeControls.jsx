import { AUDIO_SETTINGS } from '../../constants/AUDIO_SETTINGS'
import { useVolumeControls } from './useVolumeControls.hook'

import './VolumeControls.css'

const { LABELS, MIN, MAX, STEP } = AUDIO_SETTINGS

const percent = (value) => `${Math.round(value * 100)}%`

// Los dos sliders de volumen. Se usan en el menú de pausa y en el panel AUDIO del menú
// principal — el mismo control en los dos lados, como MenuList.
export const VolumeControls = ({ onFocusChange }) => {
  const { music, sfx, muted, handleMusicChange, handleSfxChange, handleFocus, handleBlur } =
    useVolumeControls({ onFocusChange })

  // Las dos filas son idénticas salvo los datos, así que salen de una lista y no de JSX
  // duplicado: cambiar el markup de una y olvidarse de la otra es cómo terminan
  // comportándose distinto.
  const rows = [
    { id: 'music', label: LABELS.MUSIC, value: music, onChange: handleMusicChange },
    { id: 'sfx', label: LABELS.SFX, value: sfx, onChange: handleSfxChange },
  ]

  return (
    <section className="volume-controls" aria-label={LABELS.TITLE}>
      {rows.map(({ id, label, value, onChange }) => (
        <div className="volume-controls__row" key={id}>
          {/* htmlFor/id y no un <label> envolvente: envolviendo el range, un clic en el
              texto de la etiqueta salta el thumb al extremo donde cayó el clic. */}
          <label className="volume-controls__label" htmlFor={`volume-${id}`}>
            {label}
          </label>
          <input
            className="volume-controls__slider"
            id={`volume-${id}`}
            type="range"
            min={MIN}
            max={MAX}
            step={STEP}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-valuetext={percent(value)}
          />
          <output className="volume-controls__value" htmlFor={`volume-${id}`}>
            {percent(value)}
          </output>
        </div>
      ))}

      {/* Si está muteado hay que decirlo: mover el slider sin oír nada se lee como que el
          control está roto, y el mute vive en otra tecla. */}
      <p className="volume-controls__hint">
        {muted ? LABELS.MUTED : LABELS.MUTE_HINT}
      </p>
    </section>
  )
}
