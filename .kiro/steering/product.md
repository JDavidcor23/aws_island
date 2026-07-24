# Producto — Cloud Quest

**RPG por turnos donde el jugador aprende Cloud Computing (AWS) jugando, no leyendo.**

Un chico con un suéter de AWS llega a una isla que depende de un servidor gigante, viejo y oxidado. Un
pingüino mentor le explica el problema. El jugador entra a un combate por turnos contra ese **Legacy Server**
y lo vence eligiendo la característica de la nube correcta para cada problema que el jefe lanza.

## La regla de oro del diseño

> **El aprendizaje es una CONSECUENCIA de la diversión, nunca el precio de entrada.**

No queremos que el jugador piense *"estoy haciendo un curso de AWS"*. Queremos que piense *"quiero derrotar
a ese jefe"* — y que al terminar diga *"ahhh, entonces para eso sirve Rapid Elasticity"*.

| Principio | Qué significa en la práctica |
|---|---|
| Problemas, no conceptos | El jefe nunca dice "esto es Rapid Elasticity". Grita un PROBLEMA. El jugador descubre el concepto al resolverlo. |
| Jugar > leer | El texto explica en UNA línea, después del golpe. Nunca antes, nunca en párrafos. |
| Pulido > cantidad | Un solo nivel impecable vale más que ocho niveles a medias. |

## El bucle de combate

1. El jefe lanza un **PROBLEMA** dramático. Ej: *"¡Llegaron 100.000 usuarios de golpe!"*
2. El jugador elige 1 de 4 **cartas** = características de la nube. ← acá está el APRENDIZAJE
3. **Timing block:** al confirmar, el orbe vuela hacia el héroe. Hay que apretar en el momento justo. ← acá está la DIVERSIÓN
4. **Feedback:** partículas, screen shake, sonido, y una explicación de UNA línea.

**Carta = aprender. Timing = jugar. Separados y simples.**

## Los 4 problemas (framework NIST)

| El jefe grita | Respuesta correcta | Explicación (1 línea, post-golpe) |
|---|---|---|
| "¡Llegaron 100.000 usuarios de golpe!" | Rapid Elasticity | "La nube crece y se achica sola según la demanda." |
| "¡Necesitás otro servidor YA!" | On-Demand Self-Service | "Aprovisionás recursos vos mismo, sin esperar a nadie." |
| "¡Ahora te entran usuarios de todo el mundo!" | Broad Network Access | "Se accede desde cualquier lado a través de la red." |
| "¡Mil clientes quieren usar la misma máquina!" | Resource Pooling | "Muchos clientes comparten la misma infraestructura, seguros y aislados." |

## Sistemas

| Sistema | Diseño |
|---|---|
| **Vida del jugador** | 4 corazones. Se pierde uno por carta incorrecta o fallo de timing. |
| **Timing** | El orbe vuela al punto de bloqueo. **Perfect** = +25 al especial · **Good** = +12 · **Miss** = perdés un corazón. |
| **Barra especial** | 0..100. Al llenarse, se dispara el remate. |
| **Remate** | El héroe dice *"Encontré una forma mejor"* → nube gigante → el Legacy Server se rompe. **No lo destruís a golpes: sus limitaciones no pueden competir con la nube.** |

> **El jefe NO tiene vida propia como condición de victoria.** Cae cuando la barra especial del jugador
> llega a 100. Cualquier barra de vida del jefe es representación visual del progreso, nunca una segunda
> condición de derrota.

## Alcance

**La Isla 0 y NADA más**, y dentro de ella, un solo combate pulido. El mundo completo (8 islas: EC2,
Storage, Load Balancing, Auto Scaling, VPC, IAM, Serverless) es roadmap post-hackatón y solo se insinúa en
la pantalla final para generar curiosidad.

## Criterio de éxito

El demo gana si, al terminar el nivel, el jurado tiene **ganas de ver qué hay en la Isla 1**.
Si dicen *"esto lo jugaría mi sobrino para aprender AWS"*, ganamos.

## Dirección de arte

- **Estilo:** pixel art HD, limpio, MUY colorido. Semi-anime occidental (*Sea of Stars*, *Eastward*).
- **Paleta:** cálida y saturada en la isla sana; óxido, gris y verde tóxico en la zona del servidor.
  **El contraste ES la narrativa: mundo vivo vs. tecnología muerta.**
- **Legacy Server:** servidor CRT oxidado con forma de capitán pirata, ojos rojos, cables como tentáculos.
  **Viejo y obsoleto, NO malvado.**

Paleta en código — usar estos valores, no inventar otros:

| Uso | Color |
|---|---|
| Acento frío / títulos | `#7de0ff` |
| Destacado / foco | `#ffd94a` |
| Peligro / jefe | `#ff5544` |
| Texto normal | `#ffffff` |
| Texto tenue | `#9fb6d8` |
| Fondo oscuro | `#0b0b12` |
| Panel | `#101528` |
| Borde | `#3d4763` |

El documento de diseño completo vive en `CLOUD_QUEST.md`.
