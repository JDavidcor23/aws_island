#!/usr/bin/env python3
"""Genera las imagenes de referencia de los specs, componiendo los assets REALES.

Por que existe: el mockup dibujado a mano del spec del tutorial quedo con
GROUND_Y=300 cuando el design.md decia 295, HERO_MEET_X=180 cuando decia 150 y el
heroe a 96px cuando la constante es 64. Un dev (o la IA que ejecute el spec) le
cree al dibujo y programa los numeros equivocados.

La solucion es no dibujar la referencia a mano: se genera desde las MISMAS
constantes que declara el spec. Si cambian, se regenera y no pueden divergir.

Uso:
    python scripts/make_reference.py
"""

from PIL import Image, ImageDraw, ImageFont

ART = "public/assets/art/_gameready/"
SPECS = ".kiro/specs/"

W, H = 640, 360
CYAN, GOLD, WHITE, DIM, RED = "#7de0ff", "#ffd94a", "#ffffff", "#9fb6d8", "#ff5544"

# ---------------------------------------------------------------- constantes
# Estas son las MISMAS que declara cada design.md. Si cambian ahi, cambian aca.
INTRO = dict(
    GROUND_Y=295, HERO_SIZE=64, HERO_MEET_X=150, HERO_EXIT_X=700,
    PENGUIN_X=250, PENGUIN_SIZE=64, WALK_SPEED=78, HERO_START_X=-40,
)
BOSS_BAR = dict(x=216, y=66, w=208, h=12, labelY=58, SEGMENTS=4)
BOSS_BAR_INNER = dict(x0=0.075, x1=0.925, y0=0.30, y1=0.70)


def load(name):
    try:
        return Image.open(ART + name).convert("RGBA")
    except OSError:
        print(f"  !! falta {name}")
        return None


def font(size):
    for name in ("consola.ttf", "cour.ttf", "arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def grounded(canvas, sprite, center_x, size, ground_y):
    """Pega el sprite con los PIES en ground_y (no centrado)."""
    if sprite is None:
        return
    s = sprite.resize((size, size), Image.NEAREST)
    canvas.alpha_composite(s, (round(center_x - size / 2), round(ground_y - size)))


def label(draw, x, y, text, color=CYAN, size=11, anchor="la"):
    draw.text((x, y), text, fill=color, font=font(size), anchor=anchor)


def panel(title, note=""):
    """Lienzo de un panel: 640x360 + franja de titulo arriba."""
    img = Image.new("RGBA", (W, H + 34), "#0b0b12")
    d = ImageDraw.Draw(img)
    label(d, 8, 8, title, CYAN, 13)
    if note:
        label(d, W - 8, 11, note, DIM, 10, anchor="ra")
    return img, d


def stack(panels, out):
    """Apila paneles verticalmente con separacion."""
    gap = 10
    total_h = sum(p.height for p in panels) + gap * (len(panels) - 1)
    sheet = Image.new("RGBA", (W, total_h), "#0b0b12")
    y = 0
    for p in panels:
        sheet.alpha_composite(p, (0, y))
        y += p.height + gap
    sheet.convert("RGB").save(out)
    print(f"  OK {out}  ({sheet.width}x{sheet.height})")


# ------------------------------------------------------- intro-tutorial
def reference_intro():
    print("intro-tutorial:")
    bg = load("scene_island_path.png")
    walk = [load(f"hero_walk_{i}.png") for i in range(1, 7)]
    side = load("hero_side_64.png")
    peng_open = load("penguin_talk_1.png")
    peng_shut = load("penguin_talk_2.png")
    dlg = load("dialogue_box.png")
    c = INTRO
    panels = []

    def scene(title, note):
        img, d = panel(title, note)
        if bg:
            img.alpha_composite(bg, (0, 34))
        return img, d

    def ground_guide(d, extra=""):
        gy = 34 + c["GROUND_Y"]
        for x in range(0, W, 9):
            d.line([(x, gy), (x + 5, gy)], fill=CYAN, width=1)
        label(d, W - 6, gy + 4, f"GROUND_Y = {c['GROUND_Y']} — acá van los PIES {extra}", CYAN, 10, "ra")

    # PASO 1 - WALK_IN
    img, d = scene("PASO 1 · WALK_IN — entra caminando, sin input",
                   f"WALK_SPEED {c['WALK_SPEED']} px/s · 6 frames a 10 fps")
    grounded(img, walk[0], 60, c["HERO_SIZE"], 34 + c["GROUND_Y"])
    grounded(img, peng_shut, c["PENGUIN_X"], c["PENGUIN_SIZE"], 34 + c["GROUND_Y"])
    d.line([(84, 34 + 250), (128, 34 + 250)], fill=GOLD, width=2)
    d.polygon([(122, 34 + 245), (132, 34 + 250), (122, 34 + 255)], fill=GOLD)
    label(d, 136, 34 + 244, f"heroX  {c['HERO_START_X']} → {c['HERO_MEET_X']}", GOLD, 10)
    ground_guide(d)
    label(d, W - 6, 34 + 8, "T para saltear", DIM, 10, "ra")
    panels.append(img)

    # PASO 2 - TALK
    img, d = scene("PASO 2 · TALK — ESPACIO avanza las 5 líneas",
                   "el pingüino alterna penguinTalk1 / penguinTalk2")
    grounded(img, side, c["HERO_MEET_X"], c["HERO_SIZE"], 34 + c["GROUND_Y"])
    grounded(img, peng_open, c["PENGUIN_X"], c["PENGUIN_SIZE"], 34 + c["GROUND_Y"])
    ground_guide(d)
    if dlg:
        dw, dh = 384, 122
        dx, dy = (W - dw) // 2, 34 + H - dh - 6
        img.alpha_composite(dlg.resize((dw, dh), Image.NEAREST), (dx, dy))
        label(d, dx + 80, dy + 12, "MENTOR", "#f5e6c8", 9)
        for i, line in enumerate([
            "Vos elegís la característica de la nube",
            "que resuelve ESE problema. Con 1-4 o",
            "con un clic.",
        ]):
            label(d, W // 2, dy + 40 + i * 16, line, "#4a3520", 12, "ma")
        label(d, dx + dw - 52, dy + dh - 18, "▼ ESPACIO", "#8a6d3f", 8)
    label(d, c["HERO_MEET_X"], 34 + c["GROUND_Y"] + 16, f"HERO_MEET_X {c['HERO_MEET_X']}", GOLD, 9, "ma")
    label(d, c["PENGUIN_X"], 34 + c["GROUND_Y"] + 16, f"PENGUIN_X {c['PENGUIN_X']}", GOLD, 9, "ma")
    panels.append(img)

    # PASO 3 - WALK_OUT
    img, d = scene("PASO 3 · WALK_OUT — se va y arranca el combate",
                   "al salir de pantalla: startRound()")
    grounded(img, walk[3], 560, c["HERO_SIZE"], 34 + c["GROUND_Y"])
    grounded(img, peng_shut, c["PENGUIN_X"], c["PENGUIN_SIZE"], 34 + c["GROUND_Y"])
    d.line([(596, 34 + 250), (630, 34 + 250)], fill=GOLD, width=2)
    d.polygon([(624, 34 + 245), (634, 34 + 250), (624, 34 + 255)], fill=GOLD)
    label(d, 592, 34 + 244, f"heroX  {c['HERO_MEET_X']} → {c['HERO_EXIT_X']}", GOLD, 10, "ra")
    ground_guide(d)
    panels.append(img)

    # escalas
    img = Image.new("RGBA", (W, 92), "#0b0b12")
    d = ImageDraw.Draw(img)
    label(d, 8, 8, "ESCALAS — nativa o múltiplo exacto, nunca 1.5x", CYAN, 12)
    label(d, 8, 30, f"héroe   walk1..6 y heroSide son 64px  →  dibujar a {c['HERO_SIZE']}   (1:1)", WHITE, 11)
    label(d, 8, 48, f"pingüino  penguinTalk1/2 son 128px  →  dibujar a {c['PENGUIN_SIZE']}   (0.5x exacto)", WHITE, 11)
    label(d, 8, 68, "a 96px la escala es 1.5x: píxeles desparejos, y el héroe queda gigante contra la casa", RED, 10)
    panels.append(img)

    stack(panels, SPECS + "intro-tutorial/reference.png")


# ------------------------------------------------------ boss-health-bar
def reference_boss():
    print("boss-health-bar:")
    arena, boss = load("scene_battle_arena.png"), load("boss_192.png")
    frame = load("boss_bar_frame.png")
    b, inner = BOSS_BAR, BOSS_BAR_INNER
    panels = []

    def bar(img, d, hp, pulse=False):
        """fondo vacío -> relleno -> marco encima. Ese orden es el del spec."""
        ix0, ix1 = b["x"] + b["w"] * inner["x0"], b["x"] + b["w"] * inner["x1"]
        iy0, iy1 = b["y"] + b["h"] * inner["y0"], b["y"] + b["h"] * inner["y1"]
        d.rectangle([ix0, iy0, ix1, iy1], fill="#08081c")
        if hp > 0:
            d.rectangle([ix0, iy0, ix0 + (ix1 - ix0) * hp, iy1], fill=GOLD if pulse else RED)
        if frame:
            img.alpha_composite(frame.resize((b["w"], b["h"]), Image.NEAREST), (b["x"], b["y"]))

    img, d = panel("EN CONTEXTO — la barra sobre la cabeza del jefe", "el relleno va DEBAJO del marco")
    if arena:
        img.alpha_composite(arena, (0, 34))
    if boss:
        img.alpha_composite(boss, (320 - 96, 34 + 196 - 96))
    sub = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sub)
    bar(sub, sd, 0.75)
    label(sd, 320, b["labelY"] - 10, "LEGACY SERVER", WHITE, 9, "ma")
    img.alpha_composite(sub, (0, 34))
    label(d, b["x"] + b["w"] + 8, 34 + b["y"], f"x={b['x']} y={b['y']} w={b['w']} h={b['h']}", GOLD, 10)
    panels.append(img)

    img = Image.new("RGBA", (W, 168), "#0b0b12")
    d = ImageDraw.Draw(img)
    label(d, 8, 8, "LOS 5 VALORES — targetHp = 1 - min(G.round, 3) / 4", CYAN, 12)
    filas = [
        (0, 1.00, False, "arranque"),
        (1, 0.75, False, "resolvió el problema 1"),
        (2, 0.50, False, "resolvió el problema 2"),
        (3, 0.25, True, "MÍNIMO · pulsa · incluye ¡EL JEFE INSISTE!"),
    ]
    for i, (rnd, hp, pulse, nota) in enumerate(filas):
        y = 32 + i * 26
        label(d, 8, y + 2, f"G.round {rnd}", WHITE, 10)
        strip = Image.new("RGBA", (W, 20), (0, 0, 0, 0))
        sd = ImageDraw.Draw(strip)
        saved = b["x"], b["y"]
        b["x"], b["y"] = 92, 2
        bar(strip, sd, hp, pulse)
        b["x"], b["y"] = saved
        img.alpha_composite(strip, (0, y - 2))
        label(d, 316, y + 2, f"{int(hp * 100)}%   {nota}", GOLD if pulse else DIM, 10)
    label(d, 8, 138, "el jefe NO cae por esta barra: cae cuando G.special llega a 100 y se dispara el remate", RED, 10)
    label(d, 8, 152, "el PNG ya trae los 3 divisores — no los dibujes o quedan dobles", RED, 10)
    panels.append(img)

    stack(panels, SPECS + "boss-health-bar/reference.png")


# ----------------------------------------------------------- main-menu
def reference_menu():
    print("main-menu:")
    bg, logo, btn = load("scene_island_before.png"), load("logo_cloud_quest.png"), load("menu_button.png")
    panels = []

    img, d = panel("ESTADO 1 · Menú — foco en JUGAR", "logo y botón son assets reales")
    if bg:
        img.alpha_composite(bg, (0, 34))
        img.alpha_composite(Image.new("RGBA", (W, H), (4, 6, 20, 140)), (0, 34))
    if logo:
        lw = 300
        lh = round(logo.height * lw / logo.width)
        img.alpha_composite(logo.resize((lw, lh), Image.NEAREST), ((W - lw) // 2, 34 + 16))
    opciones = ["JUGAR", "CÓMO SE JUEGA", "CRÉDITOS"]
    for i, texto in enumerate(opciones):
        y = 34 + 214 + i * 40
        if btn:
            img.alpha_composite(btn, ((W - btn.width) // 2, y))
        col = GOLD if i == 0 else WHITE
        label(d, W // 2, y + 22, texto, col, 13, "mm")
        if i == 0:
            label(d, (W - btn.width) // 2 - 16 if btn else 180, y + 22, "▶", GOLD, 14, "mm")
    label(d, W // 2, 34 + H - 14, "↑↓ mover · ENTER elegir", DIM, 10, "ma")
    panels.append(img)

    img = Image.new("RGBA", (W, 116), "#0b0b12")
    d = ImageDraw.Draw(img)
    label(d, 8, 8, "ASSETS QUE USA", CYAN, 12)
    label(d, 8, 30, "fondo    /assets/art/_gameready/scene_island_before.png", WHITE, 11)
    label(d, 8, 48, "logo     /assets/art/_gameready/logo_cloud_quest.png     400x214", WHITE, 11)
    label(d, 8, 66, "botón    /assets/art/_gameready/menu_button.png          240x44", WHITE, 11)
    label(d, 8, 90, "image-rendering: pixelated en TODAS. Sin eso el navegador las suaviza y arruina el estilo", RED, 10)
    panels.append(img)

    stack(panels, SPECS + "main-menu/reference.png")


if __name__ == "__main__":
    reference_intro()
    reference_boss()
    reference_menu()
