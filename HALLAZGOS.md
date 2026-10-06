# Hallazgos

Aquí van **las tres líneas** del ejercicio, una por cada punto de abajo. Es lo único que hay que
traer hecho: un cambio de motor a medias con estas tres líneas escritas vale más que lo contrario,
porque lo que se discute en el directo es dónde te chocaste.

Escribe **una sola línea por punto**, con tus palabras y con lo que mediste, no con lo que suponías.

## 1. Las filas que cambian y la rama

Cuántas filas cambian de valor en tu cambio de esquema, medido con una consulta, y en qué rama del árbol de reversibilidad cae. Si tu migración no toca datos, dilo tal cual: también es una respuesta.

Ninguna fila cambió. No hay ninguna migración nueva ni modificada entre los cambios que hizo el agente. Lo comprobe con: git diff e0f8e50 HEAD -- backend/database/  que sale vacío. Los cambios solo cambiaron el motor: configuración, compose.yaml, ficheros de entorno y Makefile.
Si hay que escoger una rama del árbol de reversibilidad, estos cambios estarían en la rama de lo que no toca datos, la de los cambios reversibles sin pérdida.
-

## 2. Lo que la batería de pruebas no podía ver

Una cosa que la batería de pruebas no podía ver. Si no encontraste ninguna, escribe qué buscaste y dónde.

Los tests salieron en verde, pero las tareas vencidas ya no salen como vencidas al releerlas de la base de datos. El comentario de isOverdueOn() en app/models/task.ts, que dice que se compara texto con texto, despues de la migración ya no es cierto.

Que cambio con la migración? 

El driver de pg convierte las columnas date en objetos Date de JavaScript, pero el código las espera como texto. Lo comprobé con una tarea con fecha 2026-01-01 y día de referencia 2026-10-05:
- Respuesta del PUT: sale bien, con dueDate: "2026-01-01" e isOverdue: true, porque usa el valor que tiene en memoria.
- GET que vuelve a leer el valor de la base y devuelve dueDate: "2026-01-01T00:00:00.000Z" y isOverdue: false.

 Lo que cambió es el valor que llega en ejecución, no el tipo declarado.

 Por qué la comprobación de tipos(typecheck) no detecta el fallo?

El typecheck no lo ve porque el fichero database/schema.ts declara dueDate: string|null porque así lo fija la regla de database/schema_rules.ts. Esos tipos salen de esa regla, no del driver, así que no cambian al pasar de SQLite a PostgreSQL. Por eso el agente no hizo cambios en schema.ts al implementar la migración.

El compilador de typescript no puede ver lo que pasa en tiempo de ejecución, trabaja solo con lo que el código declara, así que aprueba la comparación Date < string que siempre da false.


## 3. Tu duda

De qué dudaste, o qué no pudiste comprobar.

Inicialmente dudé del fallo que punto el Agente despues que completo la migración. 
Como no hizo cambios en el esquema de datos, inicialmente descarté que el fallo fuera problema de tipos de datos.