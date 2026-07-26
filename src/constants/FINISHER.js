import { LAYOUT } from './LAYOUT'

// Remate especial: el héroe carga y dispara un rayo al jefe.
// Sub-máquina de la fase FINISH_ANIM, mismo patrón que INTRO_SCENE/introScene.
// Ver .kiro/specs/hero-combat-anim/
//
// El gesto es un Kamehameha, pero lo que dispara NO es energía del héroe: es la nube.
// La única línea del pibe en todo el juego es "Encontré una forma mejor", y el pingüino
// se lo dice en la intro: "No lo vas a vencer a golpes". Si el rayo fuera ki naranja,
// contradiría las dos. Por eso la paleta es blanca y cyan, la nube crece DETRÁS de él
// mientras carga, y el cartel sigue diciendo que la que responde es la nube.
export const FINISHER_STEPS = {
  CHARGE: 'CHARGE',
  FIRE: 'FIRE',
}

export const FINISHER = {
  INITIAL: {
    step: FINISHER_STEPS.CHARGE,
    t: 0,
    // Último múltiplo de BOOM_EVERY que ya sonó. Mismo truco que typedChars en la intro:
    // sin esto el boom se dispara una vez POR FRAME en vez de una por explosión.
    booms: 0,
  },

  CHARGE_DURATION: 1.4,
  BEAM_TRAVEL: 0.2,     // lo que tarda la cabeza del rayo en llegar al jefe
  BEAM_HOLD: 1.5,       // rayo sostenido: acá se desintegra el jefe

  // Origen del rayo: las manos del héroe cuando tiene los brazos extendidos.
  // Offsets desde LAYOUT.HERO, no absolutos, para que mover al héroe no rompa el rayo.
  //
  // Estos dos pares NO son a ojo: salen de medir el centroide de los píxeles de piel en
  // hero_fire_1.png y hero_charge_1.png y convertirlo a coordenadas del canvas con la
  // escala real de dibujado (sprite de 128 pintado a 96 → factor 0.75). Estimados a ojo
  // el rayo salía 16 px por encima de las manos y el orbe 20 px afuera de ellas.
  // Si se regeneran los sprites, hay que volver a medir.
  BEAM_FROM: { dx: 32, dy: -12 },
  // Destino: el centro del jefe, un poco abajo — apuntar al centro exacto deja el rayo
  // entrando por el hueco claro del fondo y se pierde el impacto.
  BEAM_TO: { x: LAYOUT.BOSS.x, y: LAYOUT.BOSS.y + 12 },

  // Orbe de carga: entre las manos ahuecadas, a la cadera y atrás del héroe
  ORB_FROM: { dx: -15, dy: 9 },
  ORB_MAX_RADIUS: 15,

  // Grosores del rayo, de afuera hacia adentro
  BEAM_GLOW_WIDTH: 38,
  BEAM_MID_WIDTH: 20,
  BEAM_CORE_WIDTH: 8,
  // La ondulación del borde se muestrea cada tantos px a lo largo del rayo: menos
  // segmentos se ve poligonal, más no se nota y cuesta.
  BEAM_WOBBLE_STEP: 8,
  BEAM_WOBBLE_AMP: 3.5,
  BEAM_WOBBLE_FREQ: 22,

  // Retroceso del héroe al disparar (px hacia atrás, o sea a la izquierda)
  RECOIL: 7,

  // Sacudida de pantalla
  CHARGE_SHAKE_MAX: 6,
  FIRE_SHAKE: 14,
  HOLD_SHAKE: 5,

  // Explosiones del jefe mientras el rayo lo sostiene
  BOOM_EVERY: 0.22,

  // Nube detrás del héroe: la fuente de lo que dispara.
  // Venía de drawFinishAnimScreen con radio hasta 85 y alpha 0.85, y eran tres círculos
  // blancos OPACOS del tamaño de un cuarto de pantalla que tapaban los corazones y la
  // barra especial. Se lee como un bug, no como una nube. Ahora es chica, tenue y bien
  // arriba: es el telón de fondo del momento, no el momento.
  CLOUD_FROM: { dx: 30, dy: -150 },
  CLOUD_BASE_RADIUS: 16,
  CLOUD_GROWTH_RADIUS: 26,
  // Más alto de lo que parece necesario porque el halo pre-renderizado ya se desvanece a
  // transparente en sus bordes: el alpha efectivo en pantalla es bastante menor que éste.
  CLOUD_ALPHA: 0.55,

  PALETTE: {
    CORE: '#ffffff',
    MID: '#7de0ff',
    SPARK: ['#7de0ff', '#ffffff', '#ffd94a', '#4aa3ff'],
    DEBRIS: ['#ff9d3b', '#ffdd55', '#888888', '#ff5533'],
  },
}
