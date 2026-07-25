# Escena de Tutorial · FIG-3 — Osvaldo

**Rama:** `feature/osvaldo`

---

## ✅ Lo que ya entregaste está bien

El commit `1de9279` está revisado y **funciona integrado**. Jorge lo bajó, lo mergeó con el mapamundi en una
rama de prueba y lo corrió de punta a punta:

- La escena entra bien, el héroe camina hasta `HERO_MEET_X` y arranca el diálogo.
- Tocaste **exactamente** los archivos que tu spec lista. Cero conflicto con las otras dos ramas.
- La caja de diálogo arriba (`dy = 6`) para no tapar a los personajes: buena decisión, se nota.
- Merge limpio contra `main` y contra el mapamundi, verificado antes de tocar nada.

**No hay nada que arreglar de lo entregado.**

---

## ⚠️ 1. El fondo A-1 CAMBIÓ. Traete `main`.

Dos cosas que el README raíz decía y ya no valen:

| Decía | La verdad |
|---|---|
| "el fondo A-1 todavía no existe, trabajá con un color plano" | **Existe desde antes de tu commit.** Ya lo estabas usando |
| — | **Y se REGENERÓ el 25/07.** `scene_island_path.png` es una imagen nueva |

Se rehizo porque las cuatro vistas de la isla se habían generado con prompts independientes y eran cuatro
lugares distintos. Ahora salen todas de [`CONCEPTO_ISLA_0.md`](../CONCEPTO_ISLA_0.md) y comparten los mismos 7
elementos: molino a la izquierda, torre de agua a la derecha, puente sobre el canal, el servidor en la colina.

```bash
git add . && git commit -m "wip"
git fetch origin
git merge origin/main
```

> ✅ **Tu `GROUND_Y = 295` sigue siendo correcto, no lo toques.** Se verificó píxel por píxel: cae exacto
> sobre el borde de la vereda de piedra del fondo nuevo. El héroe y el pingüino apoyan perfecto.
> Si al mergear te parece que flotan, mirá de nuevo con zoom antes de mover el número — a Jorge le pasó
> exactamente eso y era un error de lectura, no del arte.

---

## 📋 2. Tareas nuevas → [`RITMO_Y_JUICE.md`](../RITMO_Y_JUICE.md)

Dos son tuyas. **Leé ese documento completo**, tiene las trampas y las decisiones que hay que tomar antes de
codear.

| # | Tarea | Prioridad | Por qué |
|---|---|---|---|
| **T-2** | **Máximo 5 segundos para elegir carta** | 🔴 **primera** | Hoy la fase `CHOOSE` **espera para siempre**. Sin presión no hay tensión, y ahí está la diversión del juego |
| **T-1** | El texto se escribe solo, estilo Mario | 🟡 segunda | Barato, vistoso, cero riesgo, todo en archivos tuyos |

**Si solo te da el tiempo para una, es T-2.**

### Lo que NO hay que hacer

- **No reescribas la historia ni el tutorial.** Tus 5 líneas ya explican qué está pasando y qué hay que
  hacer. Solo falta **una frase** en la línea 1 para decir qué está en juego. Está en T-0 del documento.
- **No toques la vida del jefe.** Es el spec de Jennifer, y además el jefe no tiene vida: se gana llenando la
  barra especial. Está explicado en T-3.
- **No agregues nada a `TIMING.js`** aunque el número de los 5 segundos parezca ir ahí. Es archivo compartido
  y es la regla 4 del README. Va en un archivo propio.

---

## Los 4 archivos del spec

| # | Archivo | Qué te dice |
|---|---|---|
| 1 | [`requirements.md`](./requirements.md) | **QUÉ** construir y cuándo está terminado |
| 2 | `reference.png` | **CÓMO SE VE** — FIG-3, con los assets reales |
| 3 | [`design.md`](./design.md) | **CÓMO**: archivos exactos, código, y las trampas |
| 4 | [`tasks.md`](./tasks.md) | **EN QUÉ ORDEN** |

Y `walkthrough.md`, que escribiste vos — todavía vive **solo en tu rama**, no está en `main`.
