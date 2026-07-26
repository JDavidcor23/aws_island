import { LAYOUT } from './LAYOUT'

// Escena de tutorial: el héroe llega en barco, cruza el pueblo caminando, el pingüino le
// explica dónde está, y se va a pelear. Sub-máquina de la fase INTRO.
// Ver .kiro/specs/intro-tutorial/ y .kiro/specs/intro-boat-arrival/
//
// La llegada y la charla pasan en DOS fondos distintos y el corte a negro entre ellos no
// es pereza: las líneas del pingüino señalan el molino roto, el agua verde y las casas
// tapiadas, y eso sólo existe en scene_island_path. Mudar la charla a la costa rompería
// la regla de INTRO_LINES de no nombrar nada que no esté en pantalla.
//
// Hubo un paso DISEMBARK en el medio, con el héroe saltando del bote al muelle en una
// parábola. Se sacó: el beat de la escena es el bote LLEGANDO, y el salto era movimiento
// extra que encima había que alinear al píxel con la cubierta del muelle. El corte a negro
// se lleva la bajada del bote sin tener que animarla.
export const INTRO_STEPS = {
  BOAT_IN: 'BOAT_IN',
  FADE: 'FADE',
  WALK_IN: 'WALK_IN',
  TALK: 'TALK',
  WALK_OUT: 'WALK_OUT',
}

export const INTRO_SCENE = {
  INITIAL: {
    step: INTRO_STEPS.BOAT_IN,
    heroX: -40,   // = WALK_START_X. Literal porque INITIAL se define antes que la clave.
    penguinX: 250,      // = PENGUIN_X. Literal por el mismo motivo que heroX.
    penguinWalkTime: 0, // reloj propio del ciclo de caminata del mentor
    line: 0,
    walkTime: 0,
    revealTime: 0,
    typedChars: 0,   // último carácter que ya sonó: sin esto el blip se repite por frame
    stepTime: 0,     // tiempo DENTRO del paso actual: lo usan el bote, el salto y el fade
  },

  // --- llegada en barco ---
  // Todos los valores de Y salen de medir scene_island_shore.png, no de estimarlos:
  // la cubierta del muelle está en y=250 y el agua de primer plano arranca en y~240.
  BOAT: {
    START_X: -80,          // centro del bote, fuera del borde izquierdo
    DOCK_X: 244,           // dónde frena, por debajo del muelle
    WATERLINE_Y: 318,      // el borde INFERIOR del sprite del bote se apoya acá
    WIDTH: 128,            // resolución nativa de boat.png -> escala 1:1
    HEIGHT: 40,
    BOB_AMP: 3,
    BOB_FREQ: 1.8,
    DURATION: 2.6,
    // Un respiro con el bote ya quieto junto al muelle antes del corte a negro. Sin esta
    // pausa el fade arranca en el mismo frame en que el bote frena y no se llega a leer
    // que llegó: se ve como si la pantalla se cortara sola a mitad del movimiento.
    HOLD: 0.7,
    HERO_DX: -12,          // el héroe va parado adentro del casco, corrido a popa
    HERO_FEET_DY: -18,     // sus pies respecto al borde inferior del bote
  },

  // Corte a negro. Va a negro en la primera mitad y vuelve en la segunda, y el fondo se
  // cambia EN EL MEDIO, con la pantalla completamente negra.
  FADE_DURATION: 1,

  // geometría en el espacio lógico del canvas (640x360)
  GROUND_Y: 295,        // línea de piso: los PIES del sprite se apoyan acá
  HERO_SIZE: 64,        // resolución NATIVA de walk1..6 y heroSide -> escala 1:1
  WALK_START_X: -40,    // fuera del borde izquierdo, donde arranca la caminata
  HERO_MEET_X: 150,     // dónde se detiene el héroe a hablar
  HERO_EXIT_X: 700,     // fuera del borde derecho (LAYOUT.W = 640)
  PENGUIN_X: 250,
  PENGUIN_SIZE: 64,     // penguinTalk1/2 son 128px -> 0.5x exacto, sin artefactos

  WALK_SPEED: 78,       // px por segundo
  WALK_FRAME_DURATION: 0.1,   // segundos por frame -> 10 fps
  WALK_FRAME_COUNT: 6,

  // --- el mentor caminando ---
  // El pingüino cierra su última línea con "Vení, que te lo muestro una vez" y hasta ahora
  // se quedaba CLAVADO en PENGUIN_X mientras el héroe se iba caminando solo. El jugador se
  // queda esperando a que arranque el que lo invitó: es el único personaje del juego que
  // pide que lo sigas y no se mueve.
  PENGUIN_WALK: {
    // Un poco MÁS rápido que el héroe (78) y no igual: el que guía tiene que ir adelante.
    // Con la misma velocidad la distancia entre los dos queda congelada en los 100 px que
    // ya tenían al hablar, y eso se lee como dos personajes arrastrados por la cámara, no
    // como uno siguiendo al otro.
    SPEED: 88,
    // 8 fps contra los 10 del héroe. Un pingüino da pasos más cortos y más torpes; a 10
    // fps con 4 frames el ciclo se ve nervioso.
    FRAME_DURATION: 0.125,
    FRAME_COUNT: 4,
    // Cuánto espera el pingüino desde que termina de hablar hasta arrancar a caminar.
    // No es cosmético: es el beat que hace que se lea "te dijo algo Y ENTONCES se dio la
    // vuelta y salió". Arrancando los dos en el mismo frame parece que los empujó la misma
    // palanca.
    START_DELAY: 0.25,
    // El héroe arranca después del pingüino. Mismo motivo, del otro lado: el que sigue
    // reacciona, no adivina.
    HERO_START_DELAY: 0.55,
    // Sale de pantalla por la derecha. 700 = HERO_EXIT_X: los dos se van del cuadro y el
    // corte a la arena pasa cuando el HÉROE llega, así que el pingüino ya no está.
    EXIT_X: 760,

    // --- waddle de emergencia, para cuando penguin_walk_N no cargó ---
    // Con los 4 frames reales esto no se usa. Sin ellos, el pingüino igual tiene que
    // CAMINAR: quedarse quieto es exactamente el bug que vinimos a arreglar, y un asset
    // que falta no puede devolvernos ahí. Se alternan los dos frames de habla (aleta
    // arriba / aleta abajo) y se le suma un rebote vertical, que a 8 fps se lee como un
    // pingüino contoneándose.
    FALLBACK_HOP_AMP: 2.5,
    FALLBACK_HOP_FREQ: 8.4,   // ~2 rebotes por ciclo de 4 frames a FRAME_DURATION
  },

  PENGUIN_TALK_FRAME_DURATION: 0.18,   // alterna penguinTalk1 / penguinTalk2

  SKIP_KEY: 't',
  SKIP_HINT: 'T para saltear',

  FALLBACK_BG: '#2b2333',   // si el fondo A-1 no cargó
  FALLBACK_SEA: '#1e2a26',  // si scene_island_shore no cargó
  REVEAL_CHARS_PER_SEC: 30,   // caracteres revelados por segundo (efecto typewriter)

  // El pingüino mira a la derecha en su sprite, pero el héroe frena en HERO_MEET_X
  // (150) y el pingüino está en PENGUIN_X (250): o sea, a su IZQUIERDA. Sin espejar
  // el sprite, el mentor le habla al vacío durante toda la escena.
  PENGUIN_FACES_HERO: true,

  // Un blip por carácter a 30 char/s es ruido blanco, no una máquina de escribir.
  // Uno cada 3 caracteres da ~10 golpes por segundo: el ritmo de alguien tecleando.
  TYPE_SFX_EVERY: 3,
}

// Solo CONTEXTO y VOCABULARIO. Las mecánicas siguen sin explicarse acá: las enseña la
// pelea tutorial jugando, que para eso te resalta la carta y te hace leer su ficha.
//
// Lo que sí entra son dos de las cuatro palabras del juego: on-premise y legacy.
// No son mecánicas, son el contenido. Y entran acá porque `scene_island_path.png` tiene
// los siete elementos del pueblo enfermo en cuadro: el molino roto, el canal verde, las
// casas tapiadas y la torre echando humo sobre la colina. La regla es que ninguna palabra
// técnica se nombra sin algo en pantalla que la sostenga — si no se ve, no se nombra.
//
// El orden 2 -> 3 -> 4 no es negociable: primero VE la máquina y lo que hacía, después se
// le nombra dónde está (on-premise), después por qué falla (legacy). El sustantivo llega
// último, cuando ya hay una imagen a la que pegarlo.
//
// ⚠️ Límite duro medido: drawIntroScene envuelve a 40 caracteres y la caja aguanta 4
// renglones — el 5º cae encima del '▼ ESPACIO'. Las seis líneas son de 3 renglones.
// Si alargás una, volvé a medirla.
//
// Ver .kiro/specs/historia-isla-0/design.md
export const INTRO_LINES = [
  {
    speaker: 'MENTOR 🐧',
    text: 'Primera isla, novato. Mirá bien: el molino roto, el agua verde, las casas tapiadas. Todo esto funcionaba.',
  },
  {
    speaker: 'MENTOR 🐧',
    text: '¿Ves esa torre que echa humo allá arriba? Una sola máquina hacía TODO acá. La luz, el agua, el molino.',
  },
  {
    speaker: 'MENTOR 🐧',
    text: 'Está adentro de la isla y es solo de ellos. Eso es on-premise: tu máquina, en tu lugar. Si no da más, nadie te ayuda.',
  },
  {
    speaker: 'MENTOR 🐧',
    text: 'Y ya no da más. Tan vieja que nadie sabe arreglarla y no puede crecer ni un poco. Una máquina así es un legacy.',
  },
  {
    speaker: 'MENTOR 🐧',
    text: 'La gente se fue. A mí Amazon me mandó a una isla como esta hace años. Hoy te toca a vos.',
  },
  // Esta era la línea 2 del guion viejo y se mantiene intacta: presenta la estructura
  // tutorial -> revancha sin nombrar una sola mecánica. No la toques.
  {
    speaker: 'MENTOR 🐧',
    text: 'No lo vas a vencer a golpes. Vení, que te lo muestro una vez... y después te la arreglás.',
  },
]
