// Manifest de sprites. Las claves ela/self/net/pool deben coincidir con CARDS.
export const ASSETS_BASE_PATH = '/assets/art/_gameready/'

export const ASSETS_MANIFEST = {
  arena: 'scene_battle_arena.png',
  after: 'scene_island_after.png',
  islandPath: 'scene_island_path.png',
  boss: 'boss_192.png',
  hero: 'hero_front_128.png',
  heroSide: 'hero_side_64.png',
  walk1: 'hero_walk_1.png',
  walk2: 'hero_walk_2.png',
  walk3: 'hero_walk_3.png',
  walk4: 'hero_walk_4.png',
  walk5: 'hero_walk_5.png',
  walk6: 'hero_walk_6.png',
  // Sprites de combate: el héroe mirando al jefe. Ver .kiro/specs/hero-combat-anim/
  heroStance1: 'hero_stance_1.png',
  heroStance2: 'hero_stance_2.png',
  heroCharge1: 'hero_charge_1.png',
  heroCharge2: 'hero_charge_2.png',
  heroFire: 'hero_fire_1.png',
  // Derrota y victoria. Los dos empaquetados con --pad-bottom 5 para que apoyen en la MISMA
  // línea de piso que las poses de pie: centrados en el lienzo quedaban flotando en el aire
  // (medido: 25 px en el caso del cuerpo tirado).
  heroDown: 'hero_down_1.png',
  heroWin: 'hero_win_1.png',
  // Llegada en barco. Ver .kiro/specs/intro-boat-arrival/
  islandShore: 'scene_island_shore.png',
  boat: 'boat.png',
  penguin: 'penguin_64.png',
  penguinTalk1: 'penguin_talk_1.png',
  penguinTalk2: 'penguin_talk_2.png',
  // Caminata del mentor. Ver scripts/gen_penguin_walk.sh.
  // Existen porque el pingüino decía "vení conmigo" y se quedaba clavado mientras el héroe
  // se iba solo. Si estos cuatro no cargan, drawIntroScene cae al waddle con los frames de
  // habla: el pingüino igual CAMINA, sólo que con menos gracia. Nunca se queda quieto.
  penguinWalk1: 'penguin_walk_1.png',
  penguinWalk2: 'penguin_walk_2.png',
  penguinWalk3: 'penguin_walk_3.png',
  penguinWalk4: 'penguin_walk_4.png',
  heartF: 'heart_full.png',
  heartE: 'heart_empty.png',
  bar: 'special_bar.png',
  dlg: 'dialogue_box.png',
  ela: 'card_elasticity_frame.png',
  self: 'card_selfservice_frame.png',
  net: 'card_networkaccess_frame.png',
  pool: 'card_resourcepool_frame.png',
}
