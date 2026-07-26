// Textos de UI fuera del canvas (React) y líneas fijas del juego.
export const UI_TEXTS = {
  // La única línea del héroe en todo el juego. Con la premisa del novato, estas cuatro
  // palabras son su arco completo. No se toca.
  HERO_FINISHER: 'Encontré una forma mejor.',
  EXPLAIN_HIT_PREFIX: '¡ESO! ',
  EXPLAIN_MISS_PREFIX: '¡La carta era la correcta, pero afiná ese timing! ',

  // Bisagra entre las dos peleas: el jefe cae, se reinicia, y lo que viene es en serio.
  TUTORIAL_CLEAR_SPEAKER: 'MENTOR 🐧',
  TUTORIAL_CLEAR_MENTOR:
    '¡Lo bajaste! Pero mirá: se está reiniciando solo. Eso fue el precalentamiento, ahora va en serio.',

  // Cartel de la revancha. Sin números acá: el límite de tiempo lo manda
  // PHASE_CONFIG y duplicarlo en un texto es garantía de que se desincronice.
  REMATCH_TITLE: 'FASE 2 · SIN AYUDAS',
  REMATCH_CHANGES: 'Nadie te marca la carta · corré contra el reloj · y pega más rápido',
  REMATCH_HINT: 'ESPACIO para la revancha',

  // --- Historia de la Isla 0 · ver .kiro/specs/historia-isla-0/design.md ---

  // El único lugar del juego donde se nombra la nube. Va en el primer EXPLAIN del
  // tutorial porque es el momento en que el jugador acaba de SENTIR que la ayuda vino de
  // afuera de la isla. Acá NO se explica elasticidad: un concepto por momento, y la
  // característica ya la explica la ficha de la carta, que es lectura obligatoria.
  //
  // ⚠️ Medido: concatenado a EXPLAIN_MISS_PREFIX ocupa 4 renglones, que es el TECHO de la
  // caja — el 5º cae encima del '▼ ESPACIO'. Cero margen. Si alargás este texto, o si
  // alargás EXPLAIN_MISS_PREFIX, el desborde solo se ve en la ronda donde FALLÁS el
  // bloqueo, no en la que sale bien. Volvé a medirlo antes de dar por bueno el cambio.
  TUTORIAL_CLOUD_REVEAL:
    'Esa ayuda no salió de la isla: vino de afuera, de máquinas que no son tuyas. Eso es la NUBE.',

  // Pago de la apuesta: las casas estaban tapiadas porque la gente se fue cuando la
  // máquina dejó de dar abasto. "De adorno" es la tesis de CONCEPTO_ISLA_0.md — el
  // esqueleto del servidor queda en pie, tomado por el verde. No se demolió el pasado,
  // se superó.
  VICTORY_PAYOFF: 'Volvieron las familias. El legacy quedó de adorno.',
  VICTORY_NEXT_ISLAND: 'Amazon te espera en la Isla 1: EC2 — Próximamente',

  // La derrota tiene que doler por lo que se perdió, no por lo que quedó en pie: al
  // jugador objetivo no le importa el servidor, le importa el pueblo.
  DEFEAT_TITLE: 'La isla queda así.',
  DEFEAT_STAKE: 'Las casas, tapiadas. Pero ya sabés cómo vencerlo.',
}

export const SCREEN_HINTS = {
  LOAD: 'Cargando assets...',
  TITLE: 'ESPACIO para comenzar',
  BATTLE: 'ESPACIO avanza y bloquea · 1-4 o clic elige carta · R reinicia',
  VICTORY: 'R para jugar de nuevo',
  DEFEAT: 'R para reintentar',
}
