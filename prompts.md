# Prompts

Aquí van **todos los prompts que lanzaste** para hacer el ejercicio, en el orden en que los
lanzaste, con el modelo y la herramienta de cada uno.

Esto no es papeleo. Lo que se revisa es **cómo pediste las cosas**, no solo lo que salió: un
resultado flojo con un prompt bueno y un resultado flojo con un prompt vago necesitan feedback
distinto, y sin este archivo no se distinguen.

## Cómo rellenarlo

- Un apartado `## Prompt N` por cada prompt.
- **Pega el prompt tal cual lo lanzaste**, dentro del bloque de código, aunque ocupe diez líneas
  y aunque tenga faltas. No lo reescribas para que quede bien: el que arreglaste mentalmente
  después no es el que lanzaste.
- Incluye también los que **no funcionaron**. Suelen ser los más útiles de leer.
- `Modelo` y `Herramienta` en todos. Si cambiaste de una a otra a mitad, se nota aquí.

Borra el ejemplo de abajo cuando escribas el primero.

---

## Prompt 1

**Modelo:** Opus 5.5 1M xHigh
**Herramienta:** Claude Code

```
Tu tarea es migrar la base de datos de este proyecto de SQLite a PostgreSQL corriendo en Docker, con dos bases de datos: una de desarrollo y otra de pruebas.

Las siguientes restricciones aplican, y no son negociables:

- El fichero de Compose se llama compose.yaml y los dos servicios se llaman db y db-test.

- La imagen es pgvector/pgvector:pg17. Es la imagen oficial de PostgreSQL con la extensión de vectores ya dentro.

- Los puertos son 54410 para desarrollo y 54411 para pruebas. No el 5432: quien tenga un PostgreSQL suyo levantado se lo encontraría ocupado, y el error que vería no menciona a Docker por ningún lado.

- La base de pruebas va en memoria, sin volumen. Es efímera a propósito: una batería de pruebas que depende de lo que dejó la anterior no es una batería de pruebas.

- Los dos servicios llevan comprobación de salud, y el arranque espera a que estén sanos. La propia imagen avisa de que, la primera vez, crea la base y no acepta conexiones mientras tanto, y de que eso rompe a quien levanta varios contenedores a la vez.

- Sin la clave version: en el fichero de Compose: está obsoleta y Docker imprime un aviso.

- La batería de pruebas apunta a la otra base por su propio fichero de entorno, que el framework carga solo cuando el entorno es de pruebas.

- Y deja atajos en el Makefile para levantar las bases, pararlas, migrar las dos y correr las pruebas.


No toques ninguna migración existente. Si tienes alguna propuesta de cambio para migraciones, dime cuales son antes de tocar nada. 
```

**Qué salió:** (opcional, una línea)
Completó la migración de la base de datos de SQLite a PostgreSQL en Docker, y commiteó los cambios en la rama`motor-oje`. Indicó que los 23 tests pasaron contra la base de pruebas, y lint y typecheck están en verde. Pero dijo que encontró un fallo que ni los tests ni el typecheck detectaron: las tareas vencidas ya no salen como vencidas al leerlas de la base de datos.


## Prompt 2

**Modelo:** Opus 5.5 1M xHigh
**Herramienta:** Claude Code

```
Hagamos una prueba para comprobar por qué las tareas vencidas ya no salen como tal al leerlas de la BD. Crea una tarea con fecha 2026-01-01 y usa 2026-10-05 como día de referencia. Devuelveme el dato tal cual se almacenó en la BD, y despues de que se leyera de la BD con un GET. Quiero ver los datos que recibe isOverdueOn() para hacer la comparacion. Incluye los tipos de dato en cada caso.

```

**Qué salió:** (opcional, una línea)
La BD guarda bien la fecha, como texto 2026-01-01, pero al leerla con el GET el driver pg la entrega a isOverdueOn() como un objeto Date. Comparar un Date con un texto con < siempre da false, así que una tarea vencida desde enero sale como no vencida.

 Lo que recibe isOverdueOn() en cada caso:

GET (releído de la BD)
this.dueDate = 2026-01-01T00:00:00.000Z (object, Date instance)
referenceDay =  "2026-10-05" (string)

JavaScript convierte los dos a número:
El Date se convierte en 1767225600000
"2026-10-05" se convierte en NaN

dueDate < referenceDay  = false

** Cualquier comparación con NaN da false **
    