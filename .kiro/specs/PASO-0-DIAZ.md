# PASO 0 — Jorge, antes de repartir las ramas

**Tiempo estimado: 15 minutos.** Son 4 parches chicos y **aditivos** (no borran nada).

## Por qué existe este archivo

Sin estos parches, los tres features necesitan tocar `GameEngine.js` y `useGameCanvas.hook.js`
**los tres a la vez**. Con ellos, cada persona toca **un solo archivo compartido, distinto**:

| Owner | Archivo compartido que toca |
|---|---|
| Nicolás | `src/App.jsx` |
| Jennifer | `src/game/render/drawHUD.js` |
| Osvaldo | `src/pages/BattlePage/BattlePage.jsx` + su `.css` |

Cero intersección. Cero conflictos de merge. **Por eso esto lo hacés vos y no ellos.**

Los parches cubren dos necesidades:

1. **`phase` en el store** → el tutorial necesita distinguir `PROBLEM` / `CHOOSE` / `TIMING`.
   Hoy `onScreenChange` colapsa las 12 fases de `GAME_STATES` en 5 pantallas de React
   (`REACT_SCREENS` en `GameEngine.js:20`) y las tres caen todas en `'BATTLE'`.
2. **`initialState`** → el menú necesita que el motor arranque en `INTRO`, no en `TITLE`,
   así el jugador no ve dos pantallas de título seguidas.

Los cambios de fase son **eventos discretos** (~20 en toda la partida), no por frame. No violan la regla
de oro del proyecto.

---

## Parche 1 · `src/stores/useGameStore.store.js`

Agregá `phase` al store.

```diff
 export const useGameStore = create((set) => ({
   screen: 'LOAD', // LOAD | TITLE | BATTLE | VICTORY | DEFEAT
+  phase: 'LOAD',  // fase cruda del motor: uno de los 12 GAME_STATES
   stats: { perfects: 0, hearts: 4 },
   setScreen: (screen) => set({ screen }),
+  setPhase: (phase) => set({ phase }),
   setStats: (stats) => set({ stats }),
 }))
```

---

## Parche 2 · `src/game/GameEngine.js`

**2a — el constructor acepta un estado inicial:**

```diff
 export class GameEngine {
-  constructor(canvas, { onScreenChange } = {}) {
+  constructor(canvas, { onScreenChange, initialState } = {}) {
     this.canvas = canvas
     this.ctx = canvas.getContext('2d')
     this.ctx.imageSmoothingEnabled = false
     this.onScreenChange = onScreenChange
+    this.initialState = initialState ?? GAME_STATES.TITLE
     this.G = createInitialState()
```

**2b — `init()` y `reset()` usan ese estado:**

```diff
     this.IMG.glowCyan = assetsService.makeGlowSprite('rgb(125,224,255)', 24)
-    this.setState(GAME_STATES.TITLE)
+    this.setState(this.initialState)
     this.lastTs = performance.now()
```

```diff
   reset() {
     this.G = createInitialState()
     this.effects.clear()
-    this.setState(GAME_STATES.TITLE)
+    this.setState(this.initialState)
   }
```

> `reset()` usa `initialState` también, así `R` devuelve al jugador al punto donde el menú lo dejó,
> en vez de a una pantalla de título que ya no se usa.

**2c — `setState` notifica también la fase cruda:**

```diff
   setState(state) {
     this.G.state = state
     this.G.t = 0
     if (this.onScreenChange) {
-      this.onScreenChange(REACT_SCREENS[state] ?? 'BATTLE', {
-        perfects: this.G.perfects,
-        hearts: this.G.hearts,
-      })
+      this.onScreenChange(
+        REACT_SCREENS[state] ?? 'BATTLE',
+        { perfects: this.G.perfects, hearts: this.G.hearts },
+        state, // ← fase cruda, la usa el tutorial
+      )
     }
   }
```

---

## Parche 3 · `src/components/GameCanvas/useGameCanvas.hook.js`

```diff
-export const useGameCanvas = () => {
+export const useGameCanvas = ({ initialState } = {}) => {
   const canvasRef = useRef(null)
   const setScreen = useGameStore((state) => state.setScreen)
+  const setPhase = useGameStore((state) => state.setPhase)
   const setStats = useGameStore((state) => state.setStats)

   useEffect(() => {
     const canvas = canvasRef.current
     if (!canvas) return undefined

     const engine = new GameEngine(canvas, {
-      onScreenChange: (screen, stats) => {
+      initialState,
+      onScreenChange: (screen, stats, phase) => {
         setScreen(screen)
         setStats(stats)
+        setPhase(phase)
       },
     })
     engine.init()
```

Y actualizá el array de dependencias del `useEffect`:

```diff
-  }, [setScreen, setStats])
+  }, [setScreen, setStats, setPhase, initialState])
```

---

## Parche 4 · `src/components/GameCanvas/GameCanvas.jsx` y `BattlePage.jsx`

Pasá la prop hacia abajo. Son dos líneas en cada uno.

```diff
-export const GameCanvas = () => {
-  const { canvasRef } = useGameCanvas()
+export const GameCanvas = ({ initialState }) => {
+  const { canvasRef } = useGameCanvas({ initialState })
```

```diff
-export const BattlePage = () => {
+export const BattlePage = ({ initialState }) => {
   const { hint } = useBattlePage()

   return (
     <main className="battle-page">
-      <GameCanvas />
+      <GameCanvas initialState={initialState} />
```

---

## Verificación (hacela antes de repartir)

```bash
npm run dev
```

- [ ] El juego arranca en la pantalla de título, igual que antes. **Nada cambió visualmente.**
- [ ] Se juega completo: título → intro → 4 rondas → remate → victoria.
- [ ] `R` reinicia bien.
- [ ] En la consola del navegador, `__CLOUD_QUEST__.G.state` devuelve la fase actual.
- [ ] Sin warnings nuevos en consola.

Si todo pasa: los 4 parches son invisibles para el jugador y **habilitan los 3 features sin que nadie
se pise**. Ahí sí, repartí las ramas.

---

## Checklist del resto de tu PASO 0

- [x] ~~`git init` + primer commit + crear el repo en GitHub + `git push`~~ ✅ hecho
- [ ] Conectar el repo a Vercel (deploy automático en cada push a `main`)
- [ ] Agregar a Nicolás, Jennifer y Osvaldo como colaboradores
- [x] ~~Reemplazar la URL del repo en el README raíz~~ ✅ hecho
- [x] ~~Crear las 3 ramas y pushearlas~~ ✅ hecho:
      `feature/nicolas` · `feature/jennifer` · `feature/osvaldo`
- [ ] Mandar al grupo el link del repo + el link a este README + "buscá tu nombre en PARTE 3"

## Sobre los assets: no hace falta generar ninguna imagen nueva

Revisé los tres specs contra `public/assets/art/_gameready/`:

| Feature | Assets que necesita | ¿Falta algo? |
|---|---|---|
| `main-menu` | `scene_island_before.png` | **No.** Ya está |
| `boss-health-bar` | ninguno — se dibuja con rectángulos de canvas | **No** |
| `intro-tutorial` | ninguno — es CSS (triángulo con `border`) | **No** |

**Cero imágenes nuevas.** Las tres figuras (FIG-1, FIG-2, FIG-3) son los `mockup.svg` de cada spec, ya
hechos y a escala 640×360 real. Si más adelante querés el marco pixel art de la barra del jefe, está
anotado como opcional al final de su `design.md` — pero la versión con rectángulos es la entregable.
