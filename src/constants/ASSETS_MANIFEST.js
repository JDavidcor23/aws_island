// Manifest de sprites. Las claves ela/self/net/pool deben coincidir con CARDS.
// Todo lo que este acá se carga al arrancar y queda en engine.IMG[clave].
// Si un archivo falta, NO rompe el juego: entra en engine.loadErrors.
export const ASSETS_BASE_PATH = '/assets/art/_gameready/'

export const ASSETS_MANIFEST = {
  // escenarios
  arena: 'scene_battle_arena.png',
  after: 'scene_island_after.png',
  islandPath: 'scene_island_path.png',

  // personajes
  boss: 'boss_192.png',
  hero: 'hero_front_128.png',
  heroSide: 'hero_side_64.png',
  penguin: 'penguin_64.png',
  penguinTalk1: 'penguin_talk_1.png',
  penguinTalk2: 'penguin_talk_2.png',

  // ciclo de caminata del héroe (escena de tutorial)
  walk1: 'hero_walk_1.png',
  walk2: 'hero_walk_2.png',
  walk3: 'hero_walk_3.png',
  walk4: 'hero_walk_4.png',
  walk5: 'hero_walk_5.png',
  walk6: 'hero_walk_6.png',

  // HUD
  heartF: 'heart_full.png',
  heartE: 'heart_empty.png',
  bar: 'special_bar.png',
  bossBar: 'boss_bar_frame.png',
  dlg: 'dialogue_box.png',

  // menú
  logo: 'logo_cloud_quest.png',
  menuButton: 'menu_button.png',

  // cartas
  ela: 'card_elasticity_frame.png',
  self: 'card_selfservice_frame.png',
  net: 'card_networkaccess_frame.png',
  pool: 'card_resourcepool_frame.png',
}
