# PRD — FlowSync MVP

> **Documento de producto.** No contiene diseño técnico: ni modelo de datos, ni endpoints, ni arquitectura. Eso baja a la spec de implementación.
> **Base:** [`alcance-mvp.md`](./alcance-mvp.md), alcance cerrado y acordado. Si algo de aquí lo contradice, manda el alcance.
> **Fecha:** 2026-08-12 · **Estado:** borrador para revisión

---

## 1. Problema y contexto

**En un equipo remoto pequeño, enterarse de en qué está trabajando otra persona cuesta interrumpirla o esperar a la daily — y ese peaje hace que dos personas descubran tarde que van a lo mismo.**

Cómo se manifiesta:

- La ronda de «¿en qué estás?» se come la mitad de una daily de 15 minutos.
- Entre dailys, la misma pregunta se repite por chat, interrumpiendo a quien la recibe.
- Nadie puede ver el estado del equipo sin que alguien pague el coste.

**Episodio de referencia.** Dos personas tocaron el mismo módulo la misma semana porque una empezó sin que la otra lo supiera. Dos días perdidos.

**Qué cambia si esto funciona.** Dos decisiones concretas: no empezar algo que otra persona ya está tocando, y elegir lo siguiente con el reparto a la vista. Si la única respuesta fuera «sentirse informado», el producto no valdría lo que cuesta.

**Qué NO cambia, dicho por delante.** La daily no desaparece entera: solo la ronda de estado. La parte de bloqueos sigue viva y este MVP no la aborda.

### Contexto de producto

FlowSync es **donde se hace el trabajo, no donde se cuenta**. Crea las tareas; no lee las de otro sitio. Sustituye al gestor de tareas en vez de convivir con él, porque convivir exige doble actualización y así es como muere esta categoría.

### Contexto de proyecto

Existe hoy en el repositorio, funcionando de punta a punta: registro, login, sesión persistente, perfil y logout. **No existe ninguna entidad de dominio.** Este MVP es la primera funcionalidad real del producto.

**[SUPUESTO]** No hay usuarios reales. El equipo descrito en la sección 2 es un caso de estudio construido para el proyecto. Ninguna afirmación de este documento está validada con usuarios, y no se citan datos de mercado porque no los tenemos.

---

## 2. Usuarios y jobs-to-be-done

### Usuario principal

El **IC** (dev, diseño, producto) de un equipo remoto de 3–10 personas con roles planos. Es a la vez quien escribe y quien lee: no hay un rol que solo consulta.

**Quién cobra el valor:** los pares. Los dos que descubren tarde que iban a lo mismo, y el que interrumpe a otro para preguntar. No hay reporte hacia arriba.

**Caso de estudio [SUPUESTO]:** equipo de 6 personas de producto SaaS repartido en 3 husos horarios, que hoy usa un gestor de tareas pesado y una daily de 15 minutos por videollamada.

### Quién NO es usuario

- Equipos que necesiten sprints, estimaciones, épicas, backlog priorizado o informes.
- Managers buscando visibilidad de reporte. El producto está diseñado a propósito para no servirles.

### Jobs-to-be-done

| # | Job | Situación | Resultado esperado |
|---|---|---|---|
| **JTBD-1** | **Antes de empezar algo, saber si ya lo está haciendo otro** | Voy a arrancar una pieza de trabajo | No duplico esfuerzo, y si hay solape lo veo antes de invertir días |
| **JTBD-2** | **Ponerme al día de lo que se ha movido, sin preguntar a nadie** | Llego por la mañana o vuelvo de una reunión | Sé en qué está el equipo sin interrumpir y sin esperar a la daily |
| **JTBD-3** | **Decidir qué hago a continuación** | Termino algo y necesito elegir lo siguiente | Veo lo que tengo pendiente con el reparto del equipo delante |
| **JTBD-4** | **Dejar constancia de en qué estoy, sin que me cueste** | Empiezo, avanzo o termino una pieza | El equipo se entera sin que yo tenga que contarlo, y a mí me cuesta segundos |
| **JTBD-5** | **Dejar de recibir «¿cómo va lo tuyo?»** | Estoy concentrado | La respuesta está disponible sin mí |

JTBD-4 es la bisagra: es el único que exige esfuerzo al usuario, y todos los demás dependen de que se cumpla. El producto debe hacerlo tan barato que se sostenga sin obligar a nadie.

### Supuestos sobre el equipo, con dientes

1. **[SUPUESTO] Espacio único sin frontera.** Quien se registra entra y lo ve todo. Sin invitación, sin aislamiento. Asumible en un caso de estudio; inaceptable con usuarios reales.
2. **[SUPUESTO] Roles planos.** Cualquiera edita y borra lo de cualquiera, incluido borrar por error.

---

## 3. Propuesta de valor

**Saber en qué está cada uno sin preguntárselo a nadie, y saberlo en el momento en que vas a empezar algo.**

Cuatro decisiones de producto la sostienen:

- **Declarar cuesta segundos.** Título, responsable, y ya. Sin sprint, sin estimación, sin flujos de configuración.
- **Quien escribe cobra en el momento.** Esa misma lista es su cola de trabajo: la mira para decidir qué coge, y de paso deja de recibir interrupciones. Si el beneficio fuera solo para los demás, nadie la mantendría.
- **La señal espera, no interrumpe.** Ves qué se ha movido cuando vuelves. Sin notificaciones push.
- **Es frescura, no presencia.** El estado es de la tarea, nunca de la persona. Ni «quién está conectado», ni indicadores de actividad: eso es vigilancia y se rechaza deliberadamente.

### La apuesta

Todo descansa en una sola cosa: **que la gente declare su trabajo antes de empezarlo, porque le sale gratis y le sirve a ella misma.** Si esa apuesta falla, no falla una funcionalidad: falla el producto.

### Riesgos

| # | Riesgo | Mitigación en el MVP |
|---|---|---|
| R-1 | **Frescura.** Si el tablero envejece, el producto no queda inútil: queda engañoso | Que actualizar cueste dos clics, y que la antigüedad de cada tarea sea visible para no fingir frescura que no hay |
| R-2 | **La norma.** Todo depende de declarar antes de empezar | El producto solo puede abaratar el gesto, nunca imponerlo. Sin mitigación técnica |
| R-3 | **Sustituir en vez de convivir.** El equipo pierde el día 1 aquello para lo que usaba el gestor pesado | Ninguna. Riesgo asumido |

---

## 4. Alcance / Fuera de alcance

### Dentro

Una vertical fina, terminada de punta a punta:

1. **Declarar trabajo en un gesto.** Crear una tarea desde la propia lista. Título y responsable obligatorios; fecha de vencimiento opcional.
2. **Mover y reasignar desde la lista.** Tres estados fijos y no configurables: pendiente / en curso / hecho.
3. **Borrar una tarea.** Higiene mínima del tablero.
4. **La lista compartida del equipo.** Agrupada por estado, con la marca de cuándo se movió cada tarea por última vez, y con «hecho» sin competir por el espacio.
5. **Refresco automático.** La lista se actualiza sola, con margen de 5–10 segundos.
6. **Tests.** El trabajo llega con tests.

**Supuesto estructural:** *responsable obligatorio ⇒ trabajo pre-repartido.* No existe montón de tareas sin dueño. «Qué está libre» se convierte en «qué tengo yo en pendiente», y el reparto se decide hablando, fuera del producto. Es lo que impide que crezca un backlog.

**Al borde del corte:** la fecha de vencimiento. Se queda porque sin fecha nunca aparece como vencida, pero es lo primero que cae si hay que recortar.

### Fuera

| Fuera | Por qué |
|---|---|
| Notificaciones push | El dolor es la interrupción; añadir avisos convierte la cura en otra fuente del mismo mal |
| Integración con Slack | El «¿en qué estás?» por Slack *es* el problema. Llevarlo allí devuelve el producto al canal que queremos vaciar |
| Comentarios en tareas | Convierten la lista en hilos que hay que leer enteros. Matan el vistazo |
| Chat, videollamada, edición simultánea | Nunca estuvieron en el problema |
| Sprints, estimaciones, épicas | Definen al no-usuario. Nos convierten en el gestor pesado del que huimos |
| Backlog priorizado | Una tarea sin dueño *es* backlog. El responsable obligatorio es la valla |
| Analítica y reporting | Invitan al lead, y con él la lectura de vigilancia que rechazamos |
| Estado «bloqueado» | Es la otra mitad de la daily, declarada no resuelta. A medias promete lo que no cumple |
| Subtareas, etiquetas, prioridad, adjuntos | El camino estándar hacia el rollo tipo Jira |
| Editar el título de una tarea | No está en el alcance acordado. Un título mal puesto se borra y se rehace |
| Historial de cambios / auditoría | La marca de última actualización cubre el caso a una fracción del coste |
| Entidad «equipo», multi-espacio, pertenencia múltiple | Decisión estructural que duplicaría el trabajo antes de saber si el producto sirve |
| Roles y permisos | Roles planos. Una jerarquía implica reporte hacia arriba |
| Invitaciones y gestión de miembros | Con espacio único, registrarse *es* entrar |
| Señales derivadas de Git, PRs, CI, calendario | Otro producto. Desplazan la apuesta que queremos comprobar |
| Presencia, «conectado ahora», indicadores de actividad | Rechazo deliberado |
| Sincronización colaborativa en tiempo real | Con 5–10 s de margen el caso queda cubierto. No compra nada que el usuario note |
| Filtro por estado | Redundante con la lista agrupada por estado. Reversible si se demuestra lo contrario |
| Búsqueda y ordenación configurable | Resuelven un problema de volumen que no tenemos |

### Lo que el MVP no promete

- **No hace imposible la colisión, solo la hace visible.** Si alguien trabaja sin declararlo, ningún producto lo detecta.
- **No resuelve los bloqueos.**
- **No garantiza que la información esté fresca.** Solo abarata mantenerla.

---

## 5. Épicas del MVP

| Épica | Qué agrupa |
|---|---|
| **E1 — Cuentas y acceso** | Registro, login, sesión persistente, logout y acceso al espacio compartido: quién puede entrar y a quién se puede asignar trabajo. |
| **E2 — Gestión de tareas** | Crear, reasignar, cambiar de estado y borrar tareas con el mínimo de gestos posible. |
| **E3 — Actividad del equipo** | La lista compartida agrupada por estado, con frescura visible y refresco automático: ver en qué está cada uno sin preguntar. |

> **Nota de nomenclatura.** El documento de alcance menciona un «E3» distinto —la sincronización colaborativa en tiempo real del backlog del curso—, que sigue **fuera** del MVP. La E3 de este PRD es «Actividad del equipo» y su refresco es el de 5–10 segundos, no sincronización colaborativa.

**Estado de partida:** E1 está en su mayor parte construida y funcionando. E2 y E3 están enteras por hacer.

---

## 6. Requisitos funcionales

Numerados y testables. Describen **qué debe hacer el sistema**, no cómo.

### E1 — Cuentas y acceso

| ID | Requisito |
|---|---|
| **RF-1** | Una persona puede registrarse con nombre, email y contraseña, y queda con sesión iniciada al terminar. *(Existe)* |
| **RF-2** | Una persona registrada puede iniciar sesión con email y contraseña. *(Existe)* |
| **RF-3** | La sesión sobrevive a recargar la página y a cerrar y reabrir el navegador. Si el servidor la rechaza, se lleva al login **explicando el motivo**; una caída de red pasajera no cierra la sesión. *(Existe)* |
| **RF-4** | Una persona con sesión puede cerrarla, y al hacerlo pierde el acceso a la lista. *(Existe)* |
| **RF-5** | Sin sesión no se ve ninguna tarea: cualquier intento de acceder a la lista lleva al login. |
| **RF-6** | **[SUPUESTO]** Toda persona registrada pertenece al mismo espacio único: ve todas las tareas y puede modificar cualquiera, sin invitación ni pertenencia explícita. |
| **RF-7** | El sistema ofrece la lista de personas registradas como posibles responsables de una tarea. |

### E2 — Gestión de tareas

| ID | Requisito |
|---|---|
| **RF-8** | Se puede crear una tarea **desde la propia lista**, sin navegar a otra pantalla. |
| **RF-9** | Crear una tarea exige **título y responsable**; la fecha de vencimiento es opcional. No hay ningún otro campo. |
| **RF-10** | Una tarea recién creada aparece en estado **pendiente**. |
| **RF-11** | Si falta el título o el responsable, la creación se rechaza y el motivo se muestra **junto al campo que falla**, en castellano. |
| **RF-12** | El responsable de una tarea puede ser cualquier persona registrada, no solo quien la crea. |
| **RF-13** | El estado de una tarea se cambia **desde la lista, sin abrir la tarea**. |
| **RF-14** | Los estados son exactamente tres —pendiente, en curso, hecho— y no son configurables por el usuario. |
| **RF-15** | Se permite cualquier transición entre los tres estados, incluido volver atrás. No hay flujo obligatorio. |
| **RF-16** | El responsable de una tarea se puede cambiar **desde la lista, sin abrir la tarea**. |
| **RF-17** | Una tarea se puede borrar, y desaparece para todo el equipo. |
| **RF-18** | Borrar pide una confirmación explícita. *(Con roles planos, cualquiera puede borrar el trabajo de cualquiera; el borrado accidental es irreversible.)* |
| **RF-19** | Una tarea **sin fecha de vencimiento nunca aparece como vencida**, en ninguna circunstancia. |
| **RF-20** | Una tarea con fecha de vencimiento pasada que **no** esté en «hecho» se muestra distinguible como vencida. |
| **RF-21** | Cualquier cambio hecho por una persona es visible para el resto del equipo. No hay tareas privadas ni borradores. |

### E3 — Actividad del equipo

| ID | Requisito |
|---|---|
| **RF-22** | Existe una **única lista compartida** con todas las tareas del espacio. No hay vistas alternativas ni personales. |
| **RF-23** | La lista se presenta **agrupada por estado**, de modo que se ve a la vez lo pendiente, lo que está en curso y lo hecho. |
| **RF-24** | Cada tarea muestra, sin abrirla: título, responsable, su estado (por el grupo en que está), **cuánto hace que se movió por última vez** y la fecha de vencimiento si la tiene. |
| **RF-25** | Las tareas en «hecho» **no compiten por el espacio** con el resto: no desplazan a lo pendiente ni a lo que está en curso, y siguen siendo accesibles bajo demanda. |
| **RF-26** | La lista **se actualiza sola**, sin que el usuario refresque, pulse nada ni pregunte. |
| **RF-27** | El refresco automático **no destruye trabajo en curso**: no borra lo que el usuario está escribiendo, no cierra lo que tiene abierto y no revierte visualmente un cambio que acaba de hacer. |
| **RF-28** | Si el servidor no responde, la lista indica que los datos pueden estar desactualizados **en lugar de aparentar frescura**. |
| **RF-29** | Con el espacio vacío, la lista explica cómo crear la primera tarea en vez de mostrar una pantalla en blanco. |
| **RF-30** | La antigüedad de cada tarea y las fechas se muestran en la **zona horaria local de quien mira**. *(El equipo de referencia está en 3 husos.)* |

**Trazabilidad:** RF-8…RF-12 → JTBD-4 · RF-13…RF-16 → JTBD-4 · RF-22…RF-25 → JTBD-1, JTBD-2, JTBD-3, JTBD-5 · RF-26…RF-28 → JTBD-2 y R-1.

---

## 7. Requisitos no funcionales

| ID | Requisito | Cómo se comprueba |
|---|---|---|
| **RNF-1** | **Frescura.** Un cambio hecho por una persona es visible para otra en **≤ 10 segundos** sin que esta interactúe. | Dos sesiones abiertas, cambio en una, cronómetro en la otra |
| **RNF-2** | **Coste de declarar.** Crear una tarea no exige más que escribir el título, elegir responsable y confirmar. **Ningún campo adicional obligatorio.** | Contar interacciones en el recorrido real |
| **RNF-3** | **Coste de mover.** Cambiar el estado o el responsable de una tarea se resuelve **sin abrir la tarea y en dos interacciones como máximo**. | Contar interacciones |
| **RNF-4** | **Rendimiento.** Con un volumen realista **[SUPUESTO: ~10 personas y ~100 tareas activas]**, la lista carga en menos de 1 s en entorno local y el refresco automático no produce parpadeo ni salto de scroll. | Medición manual con datos de prueba |
| **RNF-5** | **Errores en castellano y por campo**, siguiendo el patrón ya establecido en el frontend. Ningún error técnico crudo llega al usuario. | Revisión de los casos de error de RF-11 |
| **RNF-6** | **Accesibilidad mínima.** Crear una tarea y cambiarle el estado son operables **solo con teclado**, con foco visible. | Recorrido sin ratón |
| **RNF-7** | **Sin telemetría de personas.** El producto no registra ni muestra actividad, presencia ni tiempos de conexión de nadie. Coherente con el rechazo explícito a la vigilancia. | Revisión de lo que se guarda y se muestra |
| **RNF-8** | **Privacidad de acceso.** Ningún dato de tareas es accesible sin sesión válida. | Intento de acceso sin sesión |
| **RNF-9** | **Tests automatizados** que cubran el comportamiento de E2 y E3 en backend, incluidos los casos de rechazo de RF-11, RF-19 y RF-20. | Suite en verde |
| **RNF-10** | **Navegadores [SUPUESTO]:** navegadores de escritorio modernos actualizados. No se soporta móvil como caso de uso principal en el MVP. | — |

---

## 8. Restricciones

### De stack (impuestas por el repositorio)

- **Backend:** AdonisJS 7 con Lucid 22 sobre SQLite. **Frontend:** React 19 con Vite 8, Tailwind v4, shadcn/ui y react-router.
- **Monorepo sin workspaces:** no hay `package.json` raíz; todo se ejecuta desde `backend/` o desde `frontend/`.
- **Convenciones vigentes que no se renegocian aquí:** el esquema de base de datos se genera desde las migraciones y no se escribe a mano; todas las respuestas de la API se serializan con el envoltorio establecido y pasan por transformers; la validación es con VineJS; el frontend concentra **todas** las llamadas al backend en un único módulo de API.

### De producto

- **La autenticación ya existe** y no se rehace: registro, login, sesión persistente, perfil y logout están construidos y funcionando. De E1 solo queda lo que depende del espacio compartido (RF-5, RF-6, RF-7).
- **No hay entidades de dominio previas.** E2 y E3 se construyen desde cero.
- **Sin servicios de terceros.** Ni OAuth externo, ni proveedores de notificaciones, ni integraciones. El MVP funciona con lo que hay en el repositorio.
- **Espacio único.** No se construye multi-tenencia, ni siquiera preparada «por si acaso».

### De verificación

- **No hay runner de tests en el frontend.** La cobertura automatizada vive en el backend; la parte de interfaz se verifica con el recorrido manual de la sección 9.
- **[SUPUESTO] No hay equipo real.** El criterio de éxito de producto no se puede ejecutar en este proyecto.

### De proceso

El trabajo va en rama propia, se cierra con commit convencional y pull request descriptivo, y pasa una revisión adversarial antes de darse por terminado.

---

## 9. Métricas de éxito

### Nivel 1 — Criterio de producto (no medible en este proyecto)

> **Tras una semana de uso real, el equipo cancela la ronda de «¿en qué estás?» de la daily y nadie pide que vuelva.**

Es la prueba correcta y **no hay equipo que la corra**. Queda como **hipótesis declarada, no como resultado**. Cualquier afirmación de éxito basada en esto sería falsa.

### Nivel 2 — Métricas definidas y listas para instrumentar [SUPUESTO: requieren usuarios reales]

| Métrica | Qué mide | Umbral propuesto |
|---|---|---|
| **Frescura del tablero** | % de tareas en «en curso» cuya última actualización tiene menos de 24 h | ≥ 80 %. Por debajo, R-1 se está materializando |
| **Tareas declaradas antes de empezar** | % de trabajo que aparece en la lista antes de estar hecho, no después | La apuesta de la sección 3 vive o muere aquí |
| **Uso de la vista de llegada** | Personas que abren la lista al empezar su jornada sin que nadie se lo pida | JTBD-2 |
| **Interrupciones de estado por chat** | Menciones de «¿en qué estás?» / «¿cómo va?» por semana | Debe bajar. Si no baja, el producto no ha sustituido nada |

### Nivel 3 — Criterios de aceptación verificables en este proyecto

Recorrido completo con **dos usuarios distintos en dos sesiones de navegador**. Cada paso es una comprobación pasa/no pasa:

| # | Comprobación | RF |
|---|---|---|
| 1 | Dos personas se registran y ambas ven el mismo espacio compartido | RF-1, RF-6 |
| 2 | La primera crea una tarea asignada a sí misma y la pasa a «en curso» | RF-8, RF-9, RF-10, RF-13 |
| 3 | La segunda ve ese cambio **sin refrescar**, en ≤ 10 s | RF-26, RNF-1 |
| 4 | La segunda va a crear una tarea y tiene delante lo que ya está en curso | RF-22, RF-23 |
| 5 | La primera reasigna la tarea a la segunda; la segunda lo ve reflejado | RF-16 |
| 6 | La tarea pasa a «hecho» y deja de competir por el espacio en la vista | RF-25 |
| 7 | Se borra una tarea, previa confirmación, y desaparece para ambas | RF-17, RF-18 |
| 8 | Una tarea sin fecha nunca aparece como vencida; una vencida y no hecha, sí | RF-19, RF-20 |
| 9 | Crear una tarea no cuesta más que título + responsable + confirmar | RNF-2 |
| 10 | Cambiar estado o responsable se hace sin abrir la tarea | RNF-3 |
| 11 | Sin sesión no se ve ninguna tarea | RF-5, RNF-8 |
| 12 | El refresco automático no borra lo que se está escribiendo | RF-27 |
| 13 | Con el backend caído, la lista lo advierte en vez de aparentar frescura | RF-28 |
| 14 | La suite de tests del backend pasa en verde | RNF-9 |

**El MVP se considera entregado cuando los 14 pasos pasan.** Si el paso 9 falla, el MVP falla en su premisa aunque todo lo demás funcione.
