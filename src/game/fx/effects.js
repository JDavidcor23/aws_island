// Partículas y textos flotantes. Se actualizan por dt y se dibujan como
// rects/texto plano: barato y suficiente para el estilo pixel art.
const GRAVITY = 220
const FLOAT_RISE_SPEED = 26

export const createEffects = () => {
  const parts = []
  const floats = []

  const emit = (x, y, count, colors, speed = 120, life = 0.7) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const velocity = speed * (0.3 + Math.random())
      parts.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 40,
        life: life * (0.5 + Math.random()),
        max: life,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3,
      })
    }
  }

  // Lo contrario de emit: las partículas nacen en un anillo de radio `radius` y viajan
  // HACIA (x, y). La velocidad se calcula para que lleguen al centro justo cuando se les
  // termina la vida — así no lo cruzan y salen por el otro lado, que es lo que arruina el
  // efecto de carga. Van con g: 0 porque una partícula que está siendo absorbida no cae.
  const implode = (x, y, count, colors, radius = 90, life = 0.55) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = radius * (0.6 + Math.random() * 0.4)
      const speed = distance / life
      parts.push({
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        vx: -Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        life,
        max: life,
        g: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 2,
      })
    }
  }

  const addFloat = (x, y, txt, color, size = 12) => {
    floats.push({ x, y, txt, color, size, life: 1.2 })
  }

  const update = (dt) => {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]
      p.life -= dt
      if (p.life <= 0) {
        parts.splice(i, 1)
        continue
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      // `?? 1` y no `p.g`: las partículas que se crean con parts.push() a mano (el vapor
      // del jefe, la estela del orbe) no traen el campo, y tienen que seguir cayendo
      // exactamente igual que antes.
      p.vy += GRAVITY * (p.g ?? 1) * dt
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i]
      f.life -= dt
      if (f.life <= 0) floats.splice(i, 1)
      else f.y -= FLOAT_RISE_SPEED * dt
    }
  }

  const clear = () => {
    parts.length = 0
    floats.length = 0
  }

  return { parts, floats, emit, implode, addFloat, update, clear }
}
