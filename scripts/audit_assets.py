#!/usr/bin/env python3
"""Audita que imagen del repo se usa y cual no, cruzando contra el codigo.

Por que existe: el proyecto tiene imagenes en CUATRO roles distintos y borrarlas todas
por igual romperia cosas que no se ven hasta que hay que regenerar arte:

  public/assets/art/_gameready/  -> RUNTIME. Lo que el juego carga. Si no esta referenciado
                                    en el codigo, es peso muerto en el bundle.
  assets/art/generated/          -> RAW del generador. Es la fuente para volver a correr
                                    postprocess.py sin regenerar (ver ASSETS.md). Borrarlo
                                    NO rompe el juego pero mata ese camino de recuperacion.
  assets/art/{characters,scenes,ui}/ -> ORIGINALES de alta resolucion. Son las REFERENCIAS
                                    que se adjuntan con -i al generar (regla 1 de arte.md:
                                    si el personaje ya existe, va la imagen). Borrarlas es
                                    lo mas caro de todo: sin ellas el proximo sprite sale
                                    con otro personaje.
  assets/art/_preview/           -> montajes y GIFs para mirar. Descartable.

Uso:
    python scripts/audit_assets.py
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Donde se puede mencionar un asset
CODE_DIRS = ["src", "scripts", ".kiro"]
CODE_FILES = ["index.html", "README.md", "CLOUD_QUEST.md", "BRIEF-VIDEO.md", "MEMORIA-DEL-PROYECTO.md"]
CODE_EXT = {".js", ".jsx", ".css", ".html", ".md", ".sh", ".py", ".json"}

IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp"}

ROLES = [
    ("RUNTIME",   os.path.join("public", "assets", "art", "_gameready")),
    ("RAW",       os.path.join("assets", "art", "generated")),
    ("PREVIEW",   os.path.join("assets", "art", "_preview")),
    ("ORIGINAL",  os.path.join("assets", "art", "characters")),
    ("ORIGINAL",  os.path.join("assets", "art", "scenes")),
    ("ORIGINAL",  os.path.join("assets", "art", "ui")),
]


def read_all_code():
    """Devuelve {ruta_relativa: contenido} de todo archivo donde pueda haber una referencia."""
    blobs = {}
    for name in CODE_FILES:
        p = os.path.join(ROOT, name)
        if os.path.isfile(p):
            try:
                blobs[name] = open(p, encoding="utf-8", errors="ignore").read()
            except OSError:
                pass
    for d in CODE_DIRS:
        base = os.path.join(ROOT, d)
        for dirpath, _dirnames, filenames in os.walk(base):
            for fn in filenames:
                if os.path.splitext(fn)[1].lower() not in CODE_EXT:
                    continue
                p = os.path.join(dirpath, fn)
                try:
                    blobs[os.path.relpath(p, ROOT)] = open(p, encoding="utf-8", errors="ignore").read()
                except OSError:
                    pass
    return blobs


def list_images(rel_dir):
    base = os.path.join(ROOT, rel_dir)
    if not os.path.isdir(base):
        return []
    out = []
    for fn in sorted(os.listdir(base)):
        if os.path.splitext(fn)[1].lower() in IMAGE_EXT:
            out.append(fn)
    return out


def main():
    blobs = read_all_code()

    # Los scripts de generacion referencian los RAW y los ORIGINAL, pero eso NO cuenta como
    # "el juego lo usa": cuenta como "es fuente reproducible". Se separan para poder
    # distinguir "muerto" de "fuente".
    script_blobs = {k: v for k, v in blobs.items() if k.replace("\\", "/").startswith("scripts/")}
    doc_blobs = {k: v for k, v in blobs.items()
                 if k.replace("\\", "/").startswith(".kiro/") or k.endswith(".md")}
    app_blobs = {k: v for k, v in blobs.items()
                 if k not in script_blobs and k not in doc_blobs}

    total_bytes = {"DEAD": 0}
    report = []

    for role, rel_dir in ROLES:
        images = list_images(rel_dir)
        if not images:
            continue
        report.append("")
        report.append(f"=== {role}  {rel_dir}  ({len(images)} imagenes) ===")
        for fn in images:
            stem = os.path.splitext(fn)[0]
            size = os.path.getsize(os.path.join(ROOT, rel_dir, fn))

            def hits(bag):
                found = []
                for path, text in bag.items():
                    # Se busca el nombre COMPLETO y tambien el stem: el manifest guarda
                    # 'boss_192.png' pero un CSS puede armar la ruta por pedazos.
                    if fn in text or re.search(rf"\b{re.escape(stem)}\b", text):
                        found.append(path)
                return found

            in_app = hits(app_blobs)
            in_scripts = hits(script_blobs)
            in_docs = hits(doc_blobs)

            if in_app:
                status = "USADO"
                where = in_app[0]
            elif in_scripts:
                status = "FUENTE"      # solo lo menciona un gen_*.sh: es reproducible, no runtime
                where = in_scripts[0]
            elif in_docs:
                status = "SOLO-DOC"    # solo aparece en documentacion
                where = in_docs[0]
            else:
                status = "MUERTO"
                where = "-"
                total_bytes["DEAD"] += size

            report.append(f"  {status:<9} {fn:<34} {size/1024:7.1f} KB   {where}")

    report.append("")
    report.append(f"Peso total de los MUERTO: {total_bytes['DEAD']/1024:.1f} KB")
    report.append("")
    report.append("Leyenda:")
    report.append("  USADO    lo referencia el codigo de la app -> NO SE TOCA")
    report.append("  FUENTE   solo lo menciona un script de generacion -> es la referencia")
    report.append("           reproducible; borrarlo no rompe el juego pero si el proximo asset")
    report.append("  SOLO-DOC solo aparece en .md o en .kiro -> revisar a mano")
    report.append("  MUERTO   nadie lo menciona -> candidato a borrar")

    out = "\n".join(report)
    print(out)
    with open(os.path.join(ROOT, "tmp_audit.txt"), "w", encoding="utf-8") as f:
        f.write(out + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
