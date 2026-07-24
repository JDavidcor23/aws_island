# Cloud Quest — Documento Maestro del Proyecto

> **RPG por turnos donde aprendés Cloud Computing (AWS) jugando, no leyendo.**
> No derrotás al jefe con espadas: lo derrotás demostrando que la nube resuelve los problemas que él provoca.

Este documento es el **norte** del proyecto. Si tenés una duda de "¿qué estamos construyendo y por qué?", la respuesta está acá. Léelo antes de escribir una sola línea de código o generar un solo asset nuevo.

---

## 1. En una frase

Un niño con un suéter que dice **AWS** llega a una isla que depende de un **servidor gigante, viejo y oxidado**. Un pingüino mentor le explica el problema. El jugador entra a un combate por turnos contra ese **Legacy Server** y lo vence eligiendo la característica de la nube correcta para cada problema que el jefe lanza. Al ganar, la isla revive.

**El objetivo del hackatón NO es demostrar que sabés usar AWS. Es demostrar que podés ENSEÑAR AWS de una forma que la gente quiera seguir jugando.**

---

## 2. Filosofía (la regla de oro)

No queremos que el jugador piense *"estoy haciendo un curso de AWS"*.
Queremos que piense *"quiero derrotar a ese jefe"* — y que al terminar diga *"ahhh, entonces para eso sirve Rapid Elasticity"*.

> **El aprendizaje es una CONSECUENCIA de la diversión, nunca el precio de entrada.**

Tres principios que ordenan cada decisión:

| Principio | Qué significa en la práctica |
|-----------|------------------------------|
| Problemas, no conceptos | El jefe nunca dice "esto es Rapid Elasticity". Grita un PROBLEMA. El jugador descubre el concepto al resolverlo. |
| Jugar > leer | El texto explica en UNA línea, después del golpe. Nunca antes, nunca en párrafos. |
| Pulido > cantidad | Un solo nivel impecable vale más que ocho niveles a medias. |

---

## 3. La mecánica principal (EL CORAZÓN) 🎯

Todo el juego gira alrededor de un bucle de combate por turnos. Cada turno del jefe funciona así:

1. **El jefe lanza un PROBLEMA** (grande, dramático). Ej: *"¡Llegaron 100.000 usuarios de golpe!"*
2. **El jugador elige 1 de 3-4 cartas** = características de la nube.
   → **Acá está el APRENDIZAJE.** Elegir la correcta = entendiste el concepto.
3. **Timing block:** al confirmar, aparece un anillo que se cierra. Apretás en el momento justo.
   → **Acá está la DIVERSIÓN.** (inspirado en *Clair Obscur: Expedition 33*, *Mario RPG*, *Paper Mario*)
4. **Feedback brutal:** partículas, screen shake, sonido, y una explicación de UNA línea de por qué esa característica resuelve ese problema.

> **Carta = aprender. Timing = jugar. Separados y simples.**
> No es un Sekiro frame-perfect: un anillo que se cierra con 3 niveles de acierto alcanza y sobra.

---

## 4. Los 4 problemas del jefe → características de la nube

Estos son los 4 ataques del demo. Cada uno enseña **una característica esencial DISTINTA** de la nube (framework NIST). No se repiten conceptos.

| # | El jefe grita (PROBLEMA) | Respuesta correcta | Explicación (1 línea, post-golpe) |
|---|--------------------------|--------------------|------------------------------------|
| 1 | 🔥 "¡Llegaron 100.000 usuarios de golpe!" | **Rapid Elasticity** | "La nube crece y se achica sola según la demanda." |
| 2 | ⚙️ "¡Necesitás otro servidor YA!" | **On-Demand Self-Service** | "Aprovisionás recursos vos mismo, sin esperar a nadie." |
| 3 | 🌎 "¡Ahora te entran usuarios de todo el mundo!" | **Broad Network Access** | "Se accede desde cualquier lado a través de la red." |
| 4 | 🏢 "¡Mil clientes quieren usar la misma máquina!" | **Resource Pooling** | "Muchos clientes comparten la misma infraestructura física, seguros y aislados." |

> Las 5 características esenciales de NIST son: On-Demand Self-Service, Broad Network Access, Resource Pooling, Rapid Elasticity y Measured Service. El demo usa 4 de las 5. Si querés variar, el 4º alternativo es **Measured Service** ("pagás solo por lo que medís y usás").

---

## 5. Sistemas de combate

| Sistema | Diseño |
|---------|--------|
| **Vida** | 4 corazones. ❤️❤️❤️❤️ Perdés uno por cada fallo de timing (Miss). |
| **Timing** | Anillo que se cierra. **Perfect** = llena mucho la barra especial · **Good** = llena poco · **Miss** = perdés un corazón. |
| **Barra especial** | Sube con cada bloqueo (mucho si es Perfect). Al llenarse, se dispara el remate. |
| **Remate épico** | El héroe dice *"Encontré una forma mejor"* → nube gigante detrás → el Legacy Server se rompe (tuberías explotan, luces se apagan, cadenas ceden). **No lo destruís a golpes: sus limitaciones no pueden competir con la nube.** |

---

## 6. Flujo del demo (10-15 min)

1. Llegás a la isla → al fondo, el **servidor gigante oxidado** ocupando media isla, como un castillo.
2. Conocés al **pingüino Linux** (mentor). Te explica que el servidor viejo ya no da abasto.
3. Caminás hacia el servidor y entrás a la **arena del jefe**.
4. **Combate por turnos:** 4 rondas de problema → carta → timing.
5. La barra especial llega al máximo → **remate épico**.
6. El Legacy Server cae.
7. La **isla se transforma**: se va el humo, todo se vuelve limpio y colorido.
8. El pingüino sonríe: *"Bienvenido al mundo Cloud."*
9. Aparece el **mapamundi** con las siguientes islas bloqueadas → genera el hype.

---

## 7. Alcance del hackatón (LO MÁS IMPORTANTE) ⚠️

Tenemos **hasta el lunes 27** — unos 2 días y medio. Lo que mata un hackatón no es la mala idea: es el alcance. El demo es **la Isla 0 y NADA más**, y dentro de ella, un solo combate pulido.

**Regla de oro de producción: el juego ya es jugable de punta a punta. Todo lo que se agregue de acá al lunes NO puede romper eso.** Si tu cambio deja el combate sin terminar, se revierte.

| ✅ SÍ construimos (el 80% del valor) | ❌ NO construimos (se FALSEA con arte/cutscene) |
|--------------------------------------|-------------------------------------------------|
| Un combate por turnos, jugosísimo | Pueblo caminable con NPCs |
| Intro corta (servidor gigante + pingüino) | Mapamundi navegable de dos escalas |
| Secuencia de victoria (isla se transforma) | Sistema de exploración libre |
| Pantalla final de islas bloqueadas (imagen fija) | Las 7 islas restantes |

- [x] El combate funciona de principio a fin
- [x] Los 4 conceptos se enseñan jugando
- [x] Arte final integrado
- [x] Juice: partículas, shake, sonido
- [ ] Menú principal · Barra de vida del jefe · Tutorial de combate → **ver `.kiro/specs/`**
- [ ] Deploy en Vercel
- [ ] Video de presentación de 5 minutos grabado

---

## 8. El mundo completo (roadmap, post-hackatón)

El mapamundi se ve desde arriba, estilo Super Mario World. Solo la Isla 0 es jugable; el resto se ve bloqueado (nubes, niebla, cadenas) para generar curiosidad.

| Isla | Tema |
|------|------|
| 🏝️ 0 | **Cloud Computing Fundamentals** ← ÚNICA del hackatón |
| 1 | EC2 (Compute) |
| 2 | Storage (EBS / EFS) |
| 3 | Load Balancing |
| 4 | Auto Scaling |
| 5 | Networking (VPC) |
| 6 | Security (IAM) |
| 7 | Serverless / S3 |
| Final | Arquitecto Cloud |

---

## 9. Dirección de arte

- **Estilo:** Pixel art HD, limpio, MUY colorido. Semi-anime occidental (à la *Sea of Stars* / *Eastward*), nunca anime exagerado ni pixel oscuro.
- **Paleta:** cálida y saturada en el pueblo sano; óxido, gris y verde tóxico en la zona del servidor. **El contraste ES la narrativa: mundo vivo vs. tecnología muerta.**
- **Personaje principal:** niño 12-14, pelo negro, ojos grandes expresivos, **suéter blanco con logo AWS en el pecho**, jeans, botas, mochila. Curioso, valiente, carismático.
- **Pingüino Linux:** mentor adorable, bufanda roja, bastón, mochila. Expresiones exageradas.
- **Legacy Server (jefe):** servidor CRT oxidado con forma de **capitán pirata**, ojos rojos, engranajes, cables como tentáculos, vapor, sombrero con calavera. **Viejo y obsoleto, NO malvado.**

---

## 10. Inventario de assets (ya generados) ✅

Todo listo para el juego en `assets/art/_gameready/` (archivos de KB, sin riesgo de navegador). Los raw de alta resolución quedan en `characters/`, `ui/` y `scenes/` por si hay que reeditar.

| Categoría | Assets |
|-----------|--------|
| **Personajes** | `hero_front` (batalla), `hero_side` (caminar), `penguin`, `boss` (v3, ojos rojos brillantes) — en 64/128px |
| **Animación** | `hero_walk_1..6` (ciclo de caminata de lado) |
| **UI** | `heart_full` / `heart_empty`, 4 tarjetas de concepto (`card_*_frame`), `special_bar`, `dialogue_box` |
| **Escenarios** | `scene_island_before`, `scene_island_after`, `scene_battle_arena`, `scene_world_map` (640×360) |
| **Grillas** | `grid/` 32×32 y 64×64 |

Previews de revisión en `assets/art/_preview/` (montajes, strip y GIF de la caminata).

---

## 11. Stack técnico y despliegue

| Decisión | Elección | Por qué |
|----------|----------|---------|
| **Motor** | **React 19 + Vite 6**, canvas 2D a mano | El equipo ya sabe JS. Cero curva de aprendizaje de motor a 2 días de la entrega. |
| **Estado del juego** | Objeto `G` mutado imperativamente dentro del `engine` | Un loop de juego no necesita el ciclo de render de React. Ver `src/game/`. |
| **Despliegue** | **Vercel** | Deploy automático desde GitHub en cada push. AWS daba más puntos, pero el equipo está aprendiendo las herramientas y el plazo manda. |
| **Formato** | Build web | Cero instalación, corre en cualquier navegador. |

> **Decisión revisada el 24/07.** La versión original de esta tabla decía Godot 4 + AWS S3/CloudFront.
> Se cambió en la reunión de coordinación: **no instales Godot, no toques nada de AWS.**

> Los sprites finales pesan KB (el más grande, el jefe a 192px, ~26 KB). Todo el set junto no llega a 3 MB. **Cero problema de rendimiento en el navegador.**

---

## 12. Pipeline de generación de arte

El arte se genera con el **CLI de Codex** (motor de PixelForge), no con modelos genéricos.

- **Comando:** `codex exec --sandbox danger-full-access -m gpt-5.5 -- "<prompt>" < /dev/null` (el `< /dev/null` es obligatorio o codex se cuelga esperando stdin).
- **Personajes:** prompt base 64×64 + descripción corta del sujeto.
- **Animaciones:** feature de sprite-sheet usando un sprite como referencia (`-i`).
- **Post-proceso** (`scratchpad/*.py`): chroma key (remove bg) → recorte a contenido → fit → downscale a 64/128 → quantize a 16 colores.
- **Gotcha:** algunas imágenes de Codex vienen con fondo verde en vez de transparente → hay que aplicar el chroma key.

---

## 13. Criterio de éxito

El demo gana si, al terminar el nivel, el jurado tiene **ganas de ver qué hay en la Isla 1**.

- ✅ Aprendieron 4 conceptos de nube sin darse cuenta de que "estudiaron".
- ✅ El combate se sintió divertido (el timing enganchó).
- ✅ La transformación de la isla emocionó.
- ✅ Quedaron con curiosidad por el resto del mundo.

Si el jurado dice *"esto lo jugaría mi sobrino para aprender AWS"*, ganamos.

---

## 14. Pendientes / próximos pasos

**Bloqueantes (Jorge, antes de repartir ramas):**

- [ ] Crear el repositorio en GitHub y conectarlo a Vercel
- [ ] Cerrar la migración a React — hoy `src/App.jsx` importa `src/pages/BattlePage/BattlePage`, que todavía no existe
- [ ] Agregar `engine.subscribe()` (lo necesita el tutorial — acordar con Osvaldo quién lo escribe)

**Features repartidos — cada uno tiene su spec en `.kiro/specs/`:**

- [ ] Menú principal → `main-menu` (Nicolás)
- [ ] Barra de vida del jefe → `boss-health-bar` (Jennifer)
- [ ] Tutorial de combate → `intro-tutorial` (Osvaldo)

**Pulido de arte (solo si sobra tiempo):**

- [ ] Alinear la baseline del ciclo de caminata (los 6 frames deben compartir línea de piso)
- [ ] Limpiar la motita gris del `heart_full`
- [ ] Pegar el logo real de AWS en el recuadro naranja del suéter (en editor)
- [ ] Animación de ataque especial del héroe
- [ ] Música

**Entrega:**

- [ ] Deploy final en Vercel verificado
- [ ] Video de presentación de 5 minutos

---

*Documento vivo. Actualizalo cuando cambie una decisión de diseño.*
