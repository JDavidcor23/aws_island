// Las cartas jugables. La clave coincide con `ans` en ROUNDS
// y con la clave de imagen en ASSETS_MANIFEST.
//
// Cada carta se explica en tres pasos, y los tres son necesarios:
//   what   → qué ES la característica (la definición, sin jerga)
//   why    → POR QUÉ resuelve el problema (el caso concreto, con números)
//   blocks → QUÉ tipo de ataque bloquea (para poder decidir en 3 segundos)
//
// El `what` solo no alcanzaba: definir "la nube agrega servidores sola" no le dice
// al jugador cuál de las cuatro cartas juega contra el ataque que tiene enfrente.
// Eso lo dice el `why`.
//
// ⚠️ Límite de largo: el panel entra 4 renglones de `what`, 3 de `why` y 2 de
// `blocks` a 44 caracteres (CARD_INFO.WRAP_CHARS). Si alargás un texto, mirá el
// panel corriendo antes de dar por buena la carta.
export const CARDS = {
  ela: {
    label: 'Rapid Elasticity',
    es: 'Elasticidad Rápida',
    what: 'La capacidad crece y se achica sola, en minutos, siguiendo la demanda real. Nadie compra hardware por adelantado ni paga por lo que no usa.',
    why: 'Entran 100.000 usuarios de golpe y se suman servidores solos; cuando se van, se apagan. Pagás el pico mientras dura, no todo el año.',
    blocks: 'PICOS DE CARGA — avalanchas de usuarios, tráfico repentino, Black Friday.',
  },
  self: {
    label: 'Self-Service',
    es: 'Autoservicio bajo demanda',
    what: 'Pedís y activás los recursos vos mismo, desde un panel o una API, en el momento que los necesitás.',
    why: 'Necesitás otro servidor: lo levantás en minutos y seguís. Sin ticket, sin orden de compra, sin esperar a nadie.',
    blocks: 'ESPERAS Y TRÁMITES — pedidos que tardan días, aprobaciones y colas.',
  },
  net: {
    label: 'Network Access',
    es: 'Acceso amplio por red',
    what: 'Al servicio se llega por la red de siempre, desde cualquier lugar y con cualquier dispositivo: notebook, celular o tablet.',
    why: 'Te entran usuarios de todo el mundo y no hace falta una máquina en cada país: el mismo servicio se sirve por la red.',
    blocks: 'BARRERAS DE DISTANCIA — usuarios lejanos, acceso desde otro país o del celular.',
  },
  pool: {
    label: 'Resource Pooling',
    es: 'Recursos Compartidos',
    what: 'Una misma infraestructura física se reparte entre muchos clientes: cada uno recibe la porción que pide y queda aislado del resto.',
    why: 'Mil clientes en la misma máquina no se estorban: cada uno corre en su porción, y lo que uno libera lo usa otro.',
    blocks: 'SATURACIÓN POR MULTITUD — miles de clientes sobre la misma máquina.',
  },
}

export const CARD_IDS = Object.keys(CARDS)
