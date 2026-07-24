# Estructura del proyecto

```
hackaton_aws/
├── README.md                  # onboarding del equipo — instalación, tarea de cada uno, reglas
├── CLOUD_QUEST.md             # documento maestro de diseño del juego
├── index.html                 # entry de Vite
├── vite.config.js
├── .kiro/
│   ├── steering/              # ← estas reglas (product, tech, structure, conventions)
│   └── specs/                 # los features pendientes, uno por carpeta
├── public/assets/art/_gameready/   # los sprites que consume el juego en runtime
├── assets/art/                # fuentes de arte en alta resolución (no se sirven)
├── prototype/index.html       # prototipo original en canvas vanilla (backup de demo, congelado)
└── src/
    ├── main.jsx
    ├── App.jsx                # punto de entrada de React
    ├── index.css              # estilos globales
    ├── components/            # componentes reutilizables
    │   └── GameCanvas/        # el <canvas> + ciclo de vida del motor
    ├── pages/                 # una carpeta por pantalla
    │   └── BattlePage/        # shell React del combate
    ├── stores/                # estado global Zustand
    │   └── useGameStore.store.js
    ├── services/              # side effects e I/O
    │   ├── assets.service.js  # carga sprites + pre-renderiza glows/flashes
    │   └── sfx.service.js     # SFX retro con WebAudio
    ├── constants/             # TODOS los números y textos del juego
    │   ├── TIMING.js          # ← tunear dificultad/tempo SOLO acá
    │   ├── LAYOUT.js          # geometría del canvas 640×360
    │   ├── ROUNDS.js          # los 4 problemas del jefe
    │   ├── CARDS.js  GAME_STATES.js  ASSETS_MANIFEST.js  UI_TEXTS.js
    └── game/                  # el motor — JS puro, cero React
        ├── GameEngine.js      # loop, input, orquestación update/draw
        ├── battle/
        │   ├── battleLogic.js # reglas: rondas, cartas, bloqueo, vida
        │   └── attack.js      # física del orbe (windup/fly/reflect/hit)
        ├── fx/effects.js      # partículas y textos flotantes
        └── render/            # dibujado, una responsabilidad por archivo
            ├── drawScene.js   # fondo, jefe, héroe, partículas
            ├── drawHUD.js     # corazones, barra especial, indicador de ronda
            ├── drawCards.js   drawAttack.js   drawScreens.js
            └── textHelpers.js # drawText, drawTextOutlined, wrapText
```

## Anatomía de un componente o página

Cada uno vive en su carpeta, con tres archivos:

```
MiComponente/
├── MiComponente.jsx           # SOLO JSX, cero lógica
├── MiComponente.css           # todos sus estilos
└── useMiComponente.hook.js    # toda la lógica: estado, efectos, handlers
```

## Dónde va cada cosa

| Necesitás… | Va en… |
|---|---|
| Un número o texto que significa algo | `src/constants/<NOMBRE>.js` — **archivo propio por feature** |
| Lógica de UI (estado, efectos, handlers) | el `use*.hook.js` del componente |
| Estado compartido entre componentes | `src/stores/` con Zustand |
| Reglas de combate | `src/game/battle/` |
| Algo que se dibuja en el canvas | `src/game/render/` — un archivo por responsabilidad |
| Carga de assets o audio | `src/services/` |

## Regla anti-conflictos (crítica cuando trabajan varios a la vez)

**Las constantes nuevas van a un archivo nuevo**, nunca agregadas a `LAYOUT.js` ni a `TIMING.js`.
Esos dos son compartidos por todo el equipo y cada agregado es un conflicto de merge garantizado.

Ejemplo: el feature de la barra del jefe crea `src/constants/BOSS_HEALTH.js` con su propia geometría,
en vez de sumarle campos a `LAYOUT.js`.

## Naming

| Qué | Convención | Ejemplo |
|---|---|---|
| Componente / página | PascalCase, carpeta + archivo homónimo | `MainMenu/MainMenu.jsx` |
| Hook | `use` + PascalCase + `.hook.js` | `useMainMenu.hook.js` |
| Store | `use` + PascalCase + `.store.js` | `useGameStore.store.js` |
| Service | camelCase + `.service.js` | `assets.service.js` |
| Constantes | UPPER_SNAKE_CASE dentro, archivo con el nombre del grupo | `BOSS_HEALTH.js` → `export const BOSS_HEALTH` |
| Función de dibujado | `draw` + Sustantivo, firma `(engine) => {}` | `drawBossHealth(engine)` |

**Nunca uses `index.jsx` como nombre de componente.** El archivo se llama igual que su carpeta.
