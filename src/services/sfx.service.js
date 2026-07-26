// Efectos de sonido retro generados con WebAudio: cero archivos de audio.
let audioContext = null

const beep = (freq, dur = 0.08, type = 'square', vol = 0.06, slide = 0) => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()
    osc.type = type
    osc.frequency.value = freq
    if (slide) {
      osc.frequency.linearRampToValueAtTime(freq + slide, audioContext.currentTime + dur)
    }
    gain.gain.value = vol
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + dur)
    osc.connect(gain).connect(audioContext.destination)
    osc.start()
    osc.stop(audioContext.currentTime + dur)
  } catch (error) {
    // sin audio no se rompe el juego
  }
}

export const sfxService = {
  select: () => beep(440, 0.05, 'square', 0.04),
  confirm: () => beep(660, 0.09, 'square', 0.05, 200),
  wrong: () => beep(160, 0.2, 'sawtooth', 0.07, -60),
  perfect: () => {
    beep(880, 0.08, 'square', 0.06)
    setTimeout(() => beep(1320, 0.12, 'square', 0.06), 70)
  },
  good: () => beep(700, 0.1, 'square', 0.05),
  miss: () => beep(120, 0.3, 'sawtooth', 0.08, -50),
  shout: () => {
    beep(90, 0.25, 'sawtooth', 0.09, -30)
    setTimeout(() => beep(70, 0.3, 'sawtooth', 0.08), 120)
  },
  boom: () => {
    beep(60, 0.5, 'sawtooth', 0.12, -40)
    beep(200, 0.3, 'square', 0.06, -150)
  },
  fire: () => beep(300, 0.35, 'sawtooth', 0.07, -180),
  reflect: () => beep(520, 0.15, 'square', 0.07, 400),
  // Carga del remate: un solo tono que sube durante toda la carga. Es la única señal de
  // audio LARGA del juego, y eso es a propósito — avisa que lo que viene no es una ronda
  // más. Dura lo mismo que FINISHER.CHARGE_DURATION; si tuneás una, tuneá la otra.
  charge: () => beep(110, 1.4, 'sawtooth', 0.05, 520),
  // Disparo: dos capas, la grave para el cuerpo y la aguda para el filo.
  blast: () => {
    beep(420, 0.9, 'sawtooth', 0.11, -340)
    beep(1100, 0.5, 'square', 0.05, -700)
  },
  // Oleaje: lo más suave del juego. Es ambiente, no un evento — si se nota, está mal.
  wave: () => beep(70, 0.6, 'sine', 0.03, 25),
  // Tecla de máquina de escribir: cortísimo, agudo y MUY bajo de volumen.
  // Se dispara varias veces por segundo mientras corre el typewriter, así que
  // cualquier cosa más larga o más fuerte que esto deja de ser textura y molesta.
  type: () => beep(1500, 0.015, 'square', 0.022, -400),
}
