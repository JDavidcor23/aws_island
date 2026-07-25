#!/usr/bin/env bash
# Genera las 6 vistas de la Isla 0 desde el concepto compartido.
# Los pares antes/despues van SIEMPRE en la misma corrida: generarlos por separado
# da dos islas distintas (verificado, es lo que paso con el primer nodo del mapa).
cd "C:/Users/jdiaz483/Documents/work/my-proyects/hackaton_aws" || exit 1

CONCEPT='ISLAND CONCEPT -- Isla 0, "Server Town". Seven fixed landmarks must appear in the SAME relative positions in every view, this is the whole point: (1) a WINDMILL on a high hill on the LEFT; (2) a cylindrical WATER TOWER on stilts on the RIGHT; (3) a colossal LEGACY SERVER TOWER at the CENTER-BACK standing on the hill, dark corroded metal, stacked server racks, thick cables spilling down its sides like roots; (4) a cluster of four or five BRICK AND TIMBER HOUSES with tiled roofs in the LOWER MIDDLE; (5) a stone ARCH BRIDGE over a CANAL in the FOREGROUND; (6) thick PIPES snaking across the ground; (7) a row of tall POPLAR TREES along the path. Style: clean HD pixel art, western semi-anime like Sea of Stars and Eastward, crisp hard pixel edges, limited palette, no blur, no anti-aliasing, no gradients, detailed but readable. No text, no letters, no numbers, no UI, no characters, no people.'

SICK='SICK STATE: everything oxidized, sagging, abandoned and smoking. The windmill is crooked with torn broken blades and splintered gray wood. The water tower is rusted, stained and leaking. The legacy server tower dominates the skyline with two or three columns of dark smoke rising from it and faint red glowing lights. The houses have sagging broken roofs and boarded windows. The bridge is cracked and the canal is stagnant toxic green sludge. The pipes are corroded and leaking. The poplars are bare, dead and leaning. Palette: rust #8a5a32, rotten brown #4a3a2a, dull steel #5c6272, toxic green #7a9a3a, muddy green water #5a6b2a, violet smog sky #5a4a68, alarm red #c4402a.'

HEALED='HEALED STATE, exact same layout and exact same silhouette as the sick version: the LEGACY SERVER TOWER IS STILL THERE but reduced to a bare metal SKELETON completely overgrown with green vines and flowers -- same height, same silhouette, same position, no smoke at all, no red lights. This is critical: do NOT remove it and do NOT replace it with a different building, it must read as the same structure reclaimed by nature. The PIPES are also still there, crossing the same ground, now clean and painted white and cyan. The windmill is repaired, white with red trim and intact blades. The water tower is repainted white and teal. The houses are repaired with warm terracotta tiled roofs and flowers in the windows. The bridge is whole and the canal is clear light blue water. The poplars are full and leafy. Palette: terracotta #c9603c, warm brown #7a5236, bone white #f2e8d5, vivid green #63c74d, light blue water #5cb4ee, clear sky #7dc4f0, cloud cyan #7de0ff.'

echo "=== CORRIDA A: panoramicas (par antes/despues) ==="
codex exec --sandbox danger-full-access -m gpt-5.5 -- "Generate TWO pixel art images, each exactly 640x360, and save them as assets/art/generated/a8_island_before.png and assets/art/generated/a8_island_after.png in the current project directory.

$CONCEPT

Both images are the SAME wide establishing shot of the whole island seen from a slight distance and slightly above, IDENTICAL framing, identical camera, identical horizon line, identical island silhouette. A player must instantly recognize it as the same place in two moments. Draw the second image by repainting the first, not by inventing a new island.

FILE a8_island_before.png -- $SICK

FILE a8_island_after.png -- $HEALED" < /dev/null

echo "=== CORRIDA B: nodos del mapa (par antes/despues) ==="
codex exec --sandbox danger-full-access -m gpt-5.5 -- "Generate TWO pixel art sprites, each exactly 112x96 with a fully TRANSPARENT background, and save them as assets/art/generated/a9_node_before.png and assets/art/generated/a9_node_after.png in the current project directory.

$CONCEPT

Both sprites are the same small island seen from a TOP-DOWN three-quarter angle, as one node of a world map, in the visual style of the overworld maps of Super Mario World. The island has a sandy beach ring around its edge and a thin white foam outline where land meets water, so it sits naturally on blue ocean. Everything outside the island silhouette must be fully transparent. Readable at small size. No padlock.

The two sprites must be the SAME ISLAND: identical silhouette, identical shoreline, identical positions for every landmark. Draw the second by repainting the first.

FILE a9_node_before.png -- $SICK

FILE a9_node_after.png -- $HEALED" < /dev/null

echo "=== CORRIDA C: arena del jefe + camino del tutorial ==="
codex exec --sandbox danger-full-access -m gpt-5.5 -- "Generate TWO pixel art background images, each exactly 640x360, and save them as assets/art/generated/a10_battle_arena.png and assets/art/generated/a10_island_path.png in the current project directory. Both are in the SICK state.

$CONCEPT

$SICK

FILE a10_battle_arena.png -- a close ground-level view at the FOOT of the legacy server tower, where the boss fight happens. The colossal rusted server tower fills the background and rises out of frame. Thick corroded pipes and cables snake across a floor of cracked stone slabs in the lower half. The rusted water tower is visible small at the right edge. HARD LAYOUT CONSTRAINTS, this is a game background and not an illustration, respect them exactly: (a) the lower third must be a FLAT unobstructed floor of cracked stone slabs with a clear straight floor line, because character sprites stand on it; (b) the vertical band in the exact CENTER of the image, from x=224 to x=416 and from y=100 to y=292, must be noticeably LIGHTER and LOW DETAIL -- a pale smoggy opening or washed backlight -- because a large very dark boss sprite is drawn on top of it and must read as a clean silhouette; (c) the TOP-LEFT corner, from x=0 to x=210 and y=0 to y=90, must be dark, calm and empty, because the health hearts and a bar are drawn there; (d) do not put any important detail in the bottom center area from x=128 to x=512 and y=232 to y=354, it gets covered by a dialogue box.

FILE a10_island_path.png -- a side-scrolling ground-level view of walking THROUGH the decayed village, the intermediate moment before reaching the boss. Foreground: a wide flat walkable path of cracked stone slabs running horizontally across the lower third, with a clear unobstructed floor line and empty space above it for character sprites. Midground seen from the side: the crooked windmill on the left, the brick and timber houses with sagging roofs, the rusted water tower, the dead leaning poplars, the stone arch bridge over the sludge canal, and corroded pipes running along the path toward the right. Far background, small and distant on the horizon: the silhouette of the colossal rusted legacy server tower with faint red lights and columns of dark smoke. The server must read as FAR AWAY on the horizon, not looming in the foreground." < /dev/null

echo "=== FIN ==="
ls -la assets/art/generated/ | grep -E "a8_|a9_|a10_"
