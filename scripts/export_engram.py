#!/usr/bin/env python3
"""Exporta la memoria de Engram de ESTE proyecto a `.engram/` y a `MEMORIA-DEL-PROYECTO.md`.

Por que existe y por que NO se usa `engram export` directo:

  1. `engram export` exporta TODOS los proyectos de la base. Medido: 432 observaciones de
     17 proyectos, incluyendo repos de trabajo y 20 observaciones de scope `personal`.
     Volcar eso en un repo publico publica notas privadas. Este script filtra a este repo
     y a scope `project`, y descarta los prompts.

  2. Este repo aparece con DOS nombres de proyecto en la base: `aws_island` (detectado por
     el git remote) y `hackaton_aws` (detectado por el directorio). Son el mismo proyecto y
     los dos tienen que entrar.

  3. Re-importar un export sobre una base que ya lo tiene DUPLICA las observaciones: se
     midieron 29 sync_id repetidos sobre 70 filas, o sea 41 reales. Se deduplica por
     `sync_id`, quedandose con la fila de `id` mas bajo (la original).

Uso:
    python scripts/export_engram.py
    python scripts/export_engram.py --dry-run     # no escribe, solo informa
"""

import argparse
import collections
import json
import os
import subprocess
import sys
import tempfile

# Los dos nombres con los que la base conoce a este repo
PROJECTS = ("aws_island", "hackaton_aws")
JSON_OUT = ".engram/aws_island.json"
MARKDOWN_OUT = "MEMORIA-DEL-PROYECTO.md"

# Que tipos entran al markdown, en este orden, con su titulo de seccion.
# `passive`, `file_change` y `project` quedan afuera a proposito: son ruido de maquina
# (cambios de archivo, capturas automaticas, inventarios) y no se leen como memoria.
SECTIONS = [
    ("architecture", "Arquitectura"),
    ("decision", "Decisiones"),
    ("bugfix", "Bugs arreglados"),
    ("pattern", "Patrones y convenciones"),
    ("discovery", "Descubrimientos y trampas"),
    ("session_summary", "Resúmenes de sesión"),
]

HEADER = """# Memoria del proyecto — Cloud Quest / Isla 0

> Exportado de [Engram](https://github.com/Gentleman-Programming/engram) el {date}.
> Son las decisiones, los bugs y los descubrimientos que se fueron acumulando trabajando en este repo.
>
> **Para levantarlo en tu propio agente:** `engram import .engram/aws_island.json`
> **Para leerlo sin instalar nada:** este archivo.
>
> No está atado a ningún agente. Engram habla MCP, así que el import sirve igual en Claude
> Code, OpenCode, Codex, Gemini CLI, Cursor, Windsurf o Kiro. Y si no querés instalar nada,
> este markdown se lee solo.
>
> Contiene solo observaciones de este proyecto y de scope `project`. Nada personal, nada de
> otros repos, y ningún prompt.
>
> Se regenera con `python scripts/export_engram.py`. **No lo edites a mano.**
"""


def full_export():
    """Corre `engram export` a un temporal. El archivo trae TODOS los proyectos."""
    handle, path = tempfile.mkstemp(suffix=".json", prefix="engram-full-")
    os.close(handle)
    try:
        result = subprocess.run(
            ["engram", "export", path],
            capture_output=True, text=True, check=False,
        )
        if result.returncode != 0:
            print(result.stdout + result.stderr, file=sys.stderr)
            raise SystemExit("ERROR: fallo `engram export`. Esta engram en el PATH?")
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    finally:
        # El temporal se borra SIEMPRE: tiene los otros proyectos y lo personal adentro
        if os.path.exists(path):
            os.remove(path)


def mine(data):
    """Observaciones de este repo, scope project, deduplicadas por sync_id."""
    rows = [
        o for o in data["observations"]
        if o.get("project") in PROJECTS and o.get("scope") == "project"
    ]
    seen, unique = set(), []
    for observation in sorted(rows, key=lambda o: o["id"]):
        if observation["sync_id"] in seen:
            continue
        seen.add(observation["sync_id"])
        unique.append(observation)
    return rows, unique


def nest_headings(content, minimum=4):
    """Hunde los encabezados del contenido para que queden DEBAJO del `###` de su entrada.

    Los resumenes de sesion traen `## Goal`, `## Discoveries`, etc. Pegados tal cual, esos
    `##` compiten con las secciones del documento: con 14 sesiones el indice queda con 84
    encabezados de nivel 2 sueltos y no se puede navegar.

    No toca lo que este dentro de un bloque de codigo: ahi un `#` es un comentario de bash,
    no un encabezado.
    """
    lines, in_fence = [], False
    for line in content.split("\n"):
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            lines.append(line)
            continue
        if not in_fence and line.startswith("#"):
            level = len(line) - len(line.lstrip("#"))
            rest = line[level:]
            lines.append("#" * max(level, minimum) + rest)
            continue
        lines.append(line)
    return "\n".join(lines)


def write_markdown(observations, exported_at, path):
    date = exported_at.split(" ")[0]
    chunks = [HEADER.format(date=date)]
    for kind, heading in SECTIONS:
        group = [o for o in observations if o["type"] == kind]
        if not group:
            continue
        group.sort(key=lambda o: o.get("created_at") or "")
        chunks.append(f"\n## {heading} ({len(group)})\n")
        for observation in group:
            created = (observation.get("created_at") or "")[:10]
            chunks.append(f"\n### {observation['title']}\n")
            if created:
                chunks.append(f"\n*{created}*\n")
            chunks.append(f"\n{nest_headings(observation['content'].strip())}\n")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("".join(chunks))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    data = full_export()
    total = len(data["observations"])
    rows, unique = mine(data)
    sessions = [s for s in data.get("sessions", []) if s.get("project") in PROJECTS]

    print(f"base completa:      {total} observaciones, {len(data.get('projects', []) or [])} proyectos")
    print(f"de este repo:       {len(rows)} (scope project, nombres {' + '.join(PROJECTS)})")
    print(f"deduplicadas:       {len(unique)}  (-{len(rows) - len(unique)} por sync_id repetido)")
    print(f"por tipo:           {dict(collections.Counter(o['type'] for o in unique))}")
    print(f"sesiones:           {len(sessions)}")

    in_markdown = sum(1 for o in unique if o["type"] in dict(SECTIONS))
    print(f"entran al markdown: {in_markdown}  (se omiten passive / file_change / project)")

    if args.dry_run:
        print("\n--dry-run: no se escribio nada")
        return 0

    payload = {
        "version": data.get("version", "0.1.0"),
        "exported_at": data.get("exported_at", ""),
        "sessions": sessions,
        "observations": unique,
        "prompts": [],
    }
    os.makedirs(os.path.dirname(JSON_OUT), exist_ok=True)
    with open(JSON_OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")
    write_markdown(unique, payload["exported_at"], MARKDOWN_OUT)

    print(f"\nOK {JSON_OUT}      ({os.path.getsize(JSON_OUT) / 1024:.1f} KB)")
    print(f"OK {MARKDOWN_OUT}  ({os.path.getsize(MARKDOWN_OUT) / 1024:.1f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
