# FlowSync — Alcance consensuado del MVP

> **Estado:** cerrado y acordado. Base para el PRD, que aún no está escrito.
> **Fecha:** 2026-08-12
> **Punto de partida:** rama `s2/start`. El repo tiene autenticación completa de punta a punta (registro, login, perfil protegido, logout) sobre AdonisJS 7 + React 19, y **ninguna entidad de dominio**: no hay tareas, ni proyectos, ni equipos. Este MVP es la primera funcionalidad real del producto.

Este documento existe para no depender de la conversación en la que se acordó. Recorta agresivamente y justifica cada exclusión: el riesgo dominante no es construir poco, es construir un andamiaje ancho e inservible.

---

## 1. Problema

**En un equipo remoto pequeño, enterarse de en qué está trabajando otra persona cuesta interrumpirla o esperar a la daily — y ese peaje hace que dos personas descubran tarde que van a lo mismo.**

Cómo se manifiesta hoy:

- La ronda de «¿en qué estás?» se come la mitad de una daily de 15 minutos.
- Entre dailys, la misma pregunta se repite por chat, interrumpiendo a quien la recibe.
- Nadie puede ver el estado del equipo sin que alguien pague el coste.

**Episodio de referencia.** Dos personas tocaron el mismo módulo la misma semana porque una empezó sin que la otra lo supiera. Dos días perdidos.

**Qué reunión desaparece, sin venderlo de más.** La ronda de «¿en qué estás?», no la daily entera. La parte de bloqueos sigue viva y este MVP no la resuelve.

**Qué decisión cambia.** No empezar algo que otra persona ya está tocando, y elegir lo siguiente con el reparto a la vista. Si la única respuesta fuera «sentirse informado», nada de esto valdría lo que cuesta.

---

## 2. Usuarios

**Usuario principal:** el IC (dev, diseño, producto) de un equipo remoto de 3–10 personas con roles planos. Es a la vez quien escribe y quien lee.

**Quién cobra el valor:** los pares. Los dos que descubren tarde que iban a lo mismo, y el que interrumpe a otro para preguntar. No hay reporte hacia arriba; a un manager le daría igual, y está bien que así sea.

**Primer usuario, dicho en voz alta:** un equipo de 6 personas de producto SaaS en 3 husos horarios, que hoy usa un gestor de tareas pesado y una daily de 15 minutos por videollamada. **Es un caso de estudio construido para el proyecto, no un cliente real.** Ninguna afirmación de este documento está validada con usuarios.

**Quién NO es usuario:** equipos que necesiten sprints, estimaciones, épicas, backlog priorizado o informes. Y managers buscando visibilidad de reporte: el producto está diseñado a propósito para no servirles.

**Supuestos sobre el equipo, con dientes:**

1. **Espacio único sin frontera.** Quien se registra entra y lo ve todo. Sin invitación, sin aislamiento. Asumible con un caso de estudio; inaceptable con usuarios reales.
2. **Roles planos.** Cualquiera edita y borra lo de cualquiera, incluido borrar por error.
3. **No hay equipo real que lo pruebe.**

---

## 3. Propuesta de valor

**Saber en qué está cada uno sin preguntárselo a nadie, y saberlo en el momento en que vas a empezar algo.**

El mecanismo, que es lo que la hace sostenible:

- **Declarar cuesta segundos.** Título, responsable, y ya. Sin sprint, sin estimación, sin flujos de configuración.
- **Quien escribe cobra en el momento.** Esa misma lista es su cola de trabajo: la mira para decidir qué coge, y de paso deja de recibir interrupciones preguntándole cómo va. Si el beneficio fuera solo para los demás, nadie la mantendría.
- **La señal espera, no interrumpe.** Llegas por la mañana o vuelves de una reunión y ves qué se ha movido. Sin notificaciones push.
- **Es frescura, no presencia.** El estado es de la tarea, nunca de la persona. Ni «quién está conectado», ni indicadores de actividad: eso es vigilancia y se rechaza deliberadamente.

**Es donde se hace el trabajo, no donde se cuenta.** FlowSync crea las tareas; no lee las de otro sitio. Sustituye al gestor de tareas en vez de convivir con él, porque convivir exige doble actualización y así es como muere esta categoría.

### La apuesta

Todo descansa en una sola cosa: **que la gente declare su trabajo antes de empezarlo, porque le sale gratis y le sirve a ella misma.** Si esa apuesta falla, no falla una funcionalidad: falla el producto.

### Riesgos que sobreviven al recorte

1. **Frescura — riesgo nº1.** Si el tablero envejece, el producto no queda inútil: queda engañoso. La única mitigación es que actualizar cueste dos clics; no se obliga a nadie.
2. **La norma.** El producto solo puede abaratar el gesto de declarar, nunca imponerlo.
3. **Sustituir en vez de convivir.** El equipo pierde el día 1 aquello para lo que usaba el gestor pesado. Hay que saber qué era.

### Éxito

**Criterio de producto, no medible aquí:** que el equipo cancele la ronda de «¿en qué estás?» y nadie pida que vuelva, tras una semana de uso real. Es la prueba correcta y **no hay equipo que la corra**: queda como hipótesis declarada, no como resultado.

**Lo verificable en este proyecto** — recorrido completo con dos usuarios en dos sesiones de navegador:

1. Dos personas se registran; ambas ven el mismo espacio compartido.
2. La primera crea una tarea asignada a sí misma y la pasa a «en curso».
3. La segunda ve ese cambio **sin refrescar**, dentro del margen acordado.
4. La segunda va a crear una tarea y tiene delante lo que ya está en curso — el momento que evita la colisión.
5. La primera reasigna la tarea a la segunda; la segunda lo ve reflejado.
6. Se pasa a «hecho» y deja de competir por el espacio en la vista.
7. Se borra una tarea y desaparece para ambas.
8. Una tarea sin fecha nunca aparece como vencida.

Más: **si crear una tarea cuesta más que escribir el título y elegir responsable, el MVP falla en su premisa aunque funcione.**

---

## 4. Alcance (IN)

Una vertical fina, terminada de punta a punta. Cinco capacidades y ninguna a medias.

### 4.1 Declarar trabajo en un gesto
Crear una tarea desde la propia lista, sin abrir un formulario aparte. **Título y responsable obligatorios; fecha de vencimiento opcional.**

Es la operación de la que depende todo: si cuesta, no hay datos y no hay producto. Y es el momento en que se evita la colisión — escribes el título de lo que vas a empezar con el tablero delante, y ahí ves que alguien ya está en ese módulo.

### 4.2 Mover y reasignar desde la lista
Cambiar el estado y cambiar el responsable sin entrar en la tarea. **Tres estados fijos y no configurables: pendiente / en curso / hecho.**

«En curso» es la señal que el producto existe para transmitir. Reasignar entra porque el trabajo cambia de manos, y sin ello el tablero miente a la semana.

### 4.3 Borrar una tarea
Higiene mínima. Un duplicado o una tarea mal creada que no se puede quitar se queda para siempre, y todo el producto depende de que lo que se ve sea creíble.

### 4.4 La lista compartida del equipo
Superficie única: quién lleva qué, **agrupada por estado**, con la marca de cuándo se movió por última vez.

Dos comportamientos que no son adorno:

- **Las tareas «hecho» no compiten por el espacio** con el resto. A la semana serían mayoría y romperían la promesa del vistazo.
- **La frescura es visible.** Sirve al caso «qué se ha movido desde ayer» —que es exactamente lo que hace la ronda de la daily— y es la única instrumentación del riesgo nº1.

### 4.5 Refresco automático
La lista se actualiza sola, sin que el usuario refresque ni pregunte. **Margen de 5–10 segundos**, suficiente para el caso de uso y sin la maquinaria de sincronización en tiempo real.

### 4.6 Tests
El trabajo llega con tests. No se negocia y no se vuelve a mencionar.

**Orden de construcción.** 4.1 y 4.2 primero, porque son el momento que evita la colisión. 4.4 en paralelo, porque es la superficie donde viven. 4.3 y 4.5 al final. Si algo se cae por falta de tiempo, se cae desde abajo.

**Supuesto estructural del alcance:** *responsable obligatorio ⇒ trabajo pre-repartido.* No existe montón de tareas sin dueño; quien crea la tarea le pone responsable en el mismo gesto. «Qué está libre» se convierte en «qué tengo yo en pendiente», y el reparto se decide hablando, fuera del producto. Es lo que impide que crezca un backlog. Si algún día se prefiere el montón común, el responsable deja de ser obligatorio y hay que decidir quién limpia las huérfanas.

**Al borde del corte:** la fecha de vencimiento opcional. Se queda porque no molesta —sin fecha nunca aparece como vencida— pero es lo primero que cae si hay que recortar: no aparece en el episodio fundacional y es el campo que más rápido se pudre.

---

## 5. NO-alcance (OUT)

### Comunicación y avisos

| Fuera | Por qué |
|---|---|
| Notificaciones push | Contradice la forma de señal elegida. El dolor es la interrupción; añadir avisos convierte la cura en otra fuente del mismo mal. |
| Integración con Slack | El «¿en qué estás?» por Slack *es* el problema. Llevar FlowSync a Slack lo devuelve al canal que queremos vaciar, y encima es integración de terceros. |
| Comentarios en tareas | Convierten la lista en hilos que hay que leer enteros. Matan el vistazo, que es la promesa central. |
| Chat, videollamada, edición simultánea | Nunca estuvieron en el problema. «Tiempo real» aquí significa ver cambios de estado sin refrescar, nada más. |

### Gestión de proyecto

| Fuera | Por qué |
|---|---|
| Sprints, estimaciones, épicas | Definen al no-usuario. Añadirlos nos convierte en el gestor pesado del que huimos. |
| Backlog priorizado | Una tarea sin dueño *es* backlog. El responsable obligatorio es la valla que impide que crezca uno. |
| Analítica y reporting | El valor lo cobran los pares, no hay reporte hacia arriba. Reporting invita al lead, y con él la lectura de vigilancia que rechazamos. |
| Estado «bloqueado» | Es la otra mitad de la daily, declarada explícitamente no resuelta. Meterlo a medias promete algo que el MVP no cumple. |
| Subtareas, etiquetas, prioridad, adjuntos | El camino estándar hacia el rollo tipo Jira. Ninguno aparece en el problema. |
| Historial de cambios / auditoría | Tentador porque sirve al «qué se ha movido», pero la marca de última actualización cubre ese caso a una fracción del coste. |

### Organización y acceso

| Fuera | Por qué |
|---|---|
| Entidad «equipo», multi-espacio, pertenencia múltiple | Espacio único compartido. La multi-tenencia es una decisión estructural que duplicaría el trabajo antes de saber si el producto sirve. |
| Roles y permisos | Roles planos. Una jerarquía implica reporte hacia arriba, que es el modelo descartado. |
| Invitaciones y gestión de miembros | Con espacio único, registrarse *es* entrar. Construirlas exige antes la entidad equipo. |

### Automatización

| Fuera | Por qué |
|---|---|
| Señales derivadas de Git, PRs, CI, calendario | Es otro producto. Integraciones y OAuth de terceros se comerían el proyecto, y además desplazan la apuesta: queremos saber si la gente declara su trabajo cuando le sale gratis. |
| Presencia, «conectado ahora», indicadores de actividad | Rechazo deliberado. El estado es de la tarea, no de la persona. |

### Sincronización

| Fuera | Por qué |
|---|---|
| Sync colaborativo en tiempo real (E3) | Con 5–10 segundos de margen el caso de uso queda cubierto. La maquinaria de tiempo real no compra nada que el usuario note. |

### Recortes acordados sobre lo inicialmente pedido

| Fuera | Por qué |
|---|---|
| Filtro por estado | Con tres estados y la lista **agrupada por estado**, el filtro es redundante: ya se ve lo pendiente aislado *y* el resto, que es lo que responde «¿en qué está el equipo?». Un control menos que construir y mantener. Reversible: si se quiere el filtro explícito, entra. |
| Búsqueda y ordenación configurable | Seis personas y decenas de tareas caben en una pantalla. Resuelven un problema de volumen que no tenemos. |

### Lo que el MVP no promete

Dicho por adelantado para que nadie lo lea entre líneas:

- **No hace imposible la colisión, solo la hace visible.** Si alguien empieza a trabajar sin declararlo, ningún producto lo detecta.
- **No resuelve los bloqueos.** Esa mitad de la daily sigue en pie.
- **No garantiza que la información esté fresca.** Solo abarata mantenerla.

---

## Fuera de estos cinco bloques

No se deciden aquí, y bajan al PRD o a la spec de implementación: modelo de datos, esquema, nombres de los estados en código, endpoints, diseño de pantallas y desglose en historias.
