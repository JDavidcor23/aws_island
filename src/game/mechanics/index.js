import { cardsMechanic } from './cards.mechanic'

// Una mecánica por forma de pelear. El nivel declara cuál usa con `level.mechanic`.
//
// Hay UNA sola y es a propósito: el registro existe porque ya sabemos que hace falta una
// segunda —el nivel de las 6 ventajas del cloud no entra en `cards`, ver el spec— pero
// escribirla ahora sería adivinar. Esto es el enchufe, no el aparato.
export const MECHANICS = {
  [cardsMechanic.id]: cardsMechanic,
}

export const getMechanic = (id) => {
  const mechanic = MECHANICS[id]
  if (!mechanic) throw new Error(`mecánica desconocida: "${id}"`)
  return mechanic
}
