import { COMBO_ORIGINS } from '../../constants/COMBO'

// Nivel 1 de la Isla 0: las 5 características esenciales del cloud (NIST), de las que
// jugamos 4. Es el contenido que antes vivía en constants/ROUNDS.js, constants/CARDS.js y
// COMBO.PATTERNS — mismo texto, misma clave, mismo patrón de parry.
//
// La clave de `cards` es la que usan `rounds[].ans` y `combos`: los tres índices tienen que
// coincidir o el nivel es incoherente. Eso lo verifica levels/index.js al cargar.
export const isla0n1 = {
  id: 'isla0-n1',
  mechanic: 'cards',
  concept: '5 características del cloud computing',

  rounds: [
    { prob: '¡Llegaron 100.000 usuarios DE GOLPE!', ans: 'ela', expl: 'La nube crece y se achica sola según la demanda.' },
    { prob: '¡Necesitás otro servidor... YA!', ans: 'self', expl: 'Aprovisionás recursos vos mismo, sin esperar a nadie.' },
    { prob: '¡Ahora te entran usuarios de TODO EL MUNDO!', ans: 'net', expl: 'Se accede desde cualquier lado a través de la red.' },
    { prob: '¡MIL clientes quieren usar la misma máquina!', ans: 'pool', expl: 'Muchos clientes comparten la misma infraestructura, seguros y aislados.' },
  ],

  // ⚠️ Límite de largo: el panel entra 4 renglones de `what`, 3 de `why` y 2 de `blocks` a
  // 44 caracteres (CARD_INFO.WRAP_CHARS). Si alargás un texto, mirá el panel corriendo.
  cards: {
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
  },

  // Un patrón de parry por carta. Campos de cada golpe:
  //   origin  clave de COMBO_ORIGINS
  //   gap     pausa ANTES de este golpe, en segundos (0 en el primero)
  //   speed   multiplicador de velocidad del orbe, sobre attackSpeed()
  //   radius  tamaño del orbe — es la "forma" que diferencia al problema
  //   offset  corrimiento del punto de salida, para que un enjambre no salga del mismo píxel
  combos: {
    // Elasticidad: oleadas que se ACELERAN, y un tercer golpe que se hace esperar y llega
    // más rápido que los dos anteriores. Es el pico de carga: creciente y traicionero.
    ela: {
      icon: 'iconEla',
      accent: '#ffd94a',
      hits: [
        { origin: COMBO_ORIGINS.BOSS, gap: 0, speed: 0.95, radius: 10 },
        { origin: COMBO_ORIGINS.BOSS, gap: 0.3, speed: 1.2, radius: 11 },
        { origin: COMBO_ORIGINS.BOSS, gap: 0.85, speed: 1.55, radius: 12 },
      ],
    },
    // Autoservicio: tres golpes mecánicos, ritmo constante, como un trámite que no se apura.
    // Es el patrón de referencia contra el que se sienten los otros tres.
    self: {
      icon: 'iconSelf',
      accent: '#7de0ff',
      hits: [
        { origin: COMBO_ORIGINS.BOSS, gap: 0, speed: 1.05, radius: 10 },
        { origin: COMBO_ORIGINS.BOSS, gap: 0.45, speed: 1.05, radius: 10 },
        { origin: COMBO_ORIGINS.BOSS, gap: 0.45, speed: 1.05, radius: 10 },
      ],
    },
    // Acceso por red: tres orígenes distintos. El golpe puede venir de cualquier lado,
    // igual que los usuarios.
    net: {
      icon: 'iconNet',
      accent: '#9fb6d8',
      hits: [
        { origin: COMBO_ORIGINS.BOSS, gap: 0, speed: 1, radius: 10 },
        { origin: COMBO_ORIGINS.HIGH, gap: 0.5, speed: 1.1, radius: 10 },
        { origin: COMBO_ORIGINS.LOW, gap: 0.5, speed: 1.1, radius: 10 },
      ],
    },
    // Recursos compartidos: tres orbes CHICOS que salen de puntos distintos del jefe y
    // convergen en el mismo punto de bloqueo. La multitud sobre una sola máquina.
    pool: {
      icon: 'iconPool',
      accent: '#ff9d7a',
      hits: [
        { origin: COMBO_ORIGINS.BOSS, gap: 0, speed: 1.15, radius: 7, offset: { x: -46, y: -28 } },
        { origin: COMBO_ORIGINS.BOSS, gap: 0.24, speed: 1.15, radius: 7, offset: { x: 46, y: -14 } },
        { origin: COMBO_ORIGINS.BOSS, gap: 0.24, speed: 1.15, radius: 7, offset: { x: 0, y: 26 } },
      ],
    },
  },
}
