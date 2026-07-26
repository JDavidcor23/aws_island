export const GAME_STATES = {
  LOAD: 'LOAD',
  TITLE: 'TITLE',
  INTRO: 'INTRO',
  // Antesala del combate: el jugador llega a la arena y el jefe está AHÍ, quieto, mientras
  // el pingüino se lo señala y le dice cómo se lo vence. Existe porque sin ella la intro
  // cortaba directo al primer grito del jefe: el jugador entraba y ya lo estaban atacando,
  // sin haber visto contra qué pelea ni saber que las cartas son la respuesta.
  BRIEFING: 'BRIEFING',
  PROBLEM: 'PROBLEM',
  CHOOSE: 'CHOOSE',
  TIMING: 'TIMING',
  RESOLVE: 'RESOLVE',
  EXPLAIN: 'EXPLAIN',
  FINISH_LINE: 'FINISH_LINE',
  FINISH_ANIM: 'FINISH_ANIM',
  TUTORIAL_CLEAR: 'TUTORIAL_CLEAR',
  REMATCH_INTRO: 'REMATCH_INTRO',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT',
}
