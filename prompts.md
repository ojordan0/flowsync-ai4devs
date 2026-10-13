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

**Modelo:** Opus 5.5 (1M context) with high effort
**Herramienta:** Claude Code

```
Tu tarea es construir los test para el requirement "Cuándo una tarea está vencida". 

Primero, lee el Requirement entero y sus Scenarios en openspec/specs/tasks/spec.md

Escribe un archivo de tests funcionales que los ejerza entrando por HTTP (HyperText Transfer Protocol, el protocolo por el que entra un cliente de la interfaz de programación de aplicaciones), igual que entra la aplicación que consume este backend. Uno por Scenario.

Córrelo con make test-e2e y quédate con la salida entera, no solo con si pasó o no.

Cinco restricciones que debes cumplir, y ninguna es decorativa:

1- No toques ni una línea fuera de backend/tests/. Ni el modelo, ni el transformer, ni el controlador.

2- Los tests comprueban lo que sale en la respuesta, no lo que devuelve un método interno. El campo se llama isOverdue y viaja en el cuerpo.

3- El día de referencia se le pasa a la petición. Nada de la fecha de hoy ni de ningún reloj.

4- Sigue la forma de aislamiento que ya usan los tests de backend/tests/functional/, sin inventar otra.

5- No des por hecho ningún identificador: usa el que te devuelva la creación.
```

**Qué salió:**
Escribió backend/tests/functional/tasks/overdue.spec.ts, con 7 tests, uno por scenario. Corrió make test-e2e y dijo que 3 de los 7 tests fallan. Guardó la salida entera en scratchpad/test-e2e.log.


## Prompt 2

**Modelo:** Opus 5.5 (1M context) with high effort
**Herramienta:** Claude Code

```
Muestrame una tabla con los resultados de los tests: Cuántos de tus casos nuevos fallaron y cuántos de los que ya había siguieron en verde?
```

**Qué salió:**
Datos de la última ejecución de make test-e2e: 47 tests en total, 44 en verde y 3 en rojo.
Mostró una tabla con los 7 nuevos tests: los 3 que fallaron y los 4 que pasaron. Los 3 fallos vienen de errores reales de la implementación, no de los tests. El resto de la suite sigue en verde: 44 passed, 3 failed (47).


## Prompt 3

**Modelo:** Opus 5.5 (1M context) with high effort
**Herramienta:** Claude Code

```
Ahora vamos a bajar la regla, y solo la regla.

La regla vive en isOverdueOn, en backend/app/models/task.ts. Crea backend/tests/unit/, que hoy no existe, y escribe ahí sus bordes, sin servidor y sin base de datos:

- Fecha anterior al día de referencia, y la tarea sin hacer.

- Fecha exactamente igual al día de referencia.

- Fecha posterior.

- Sin fecha.

- Tarea ya hecha, con la fecha pasada.

Añade un caso más que no sale de la spec: que la regla se comporte igual reciba la fecha como texto o como objeto de fecha. Ese no lo pide ningún requisito de producto. Sale de preguntarse cómo llega el dato de verdad.

Sigue sin tocar implementación.
```

**Qué salió:**
Creó backend/tests/unit/task_overdue.spec.ts con 6 tests. Los corrió con make test-unit: 4 pasan y 2 fallan. Los dos fallos son los mismos errores que salieron por HTTP, ahora aislados en la regla. Solo hay ficheros nuevos bajo backend/tests/.