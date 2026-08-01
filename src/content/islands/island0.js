// La isla agrupa niveles y es dueña de su intro: la llegada en barco, el mentor y el
// briefing son de la ISLA y corren UNA sola vez. Colgadas del nivel, el jugador se comería
// la llegada en barco una vez por nivel.
export const ISLAND0 = {
  id: 'island0',
  name: 'Isla 0 — El Pueblo del Servidor',
  // El orden importa: es el orden de desbloqueo. Completar uno abre el siguiente.
  levels: ['isla0-n1', 'isla0-n2'],
}
