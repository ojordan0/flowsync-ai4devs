# Hallazgos

Aquí van **las tres líneas** del ejercicio, una por cada punto de abajo. Es lo único que hay que
traer hecho.

Escribe **una sola línea por punto**, con tus palabras y con lo que mediste, no con lo que suponías.


## 1. Resultados

Cuántos de tus casos nuevos fallaron y cuántos de los que ya había siguieron en verde, con la cifra que te dio la pantalla.

De los 13 nuevos tests fallaron 5, y los 40 tests que ya había siguieron en verde -- pasaron todos --.

Los 3 fallos de test funcionales nuevos fueron:
- Fecha del día anterior
- Darla por hecha la deja de vencer
- Una tarea hecha con la fecha pasada

De los 6 unit tests, 2 fallaron:
- tarea hecha y con la fecha pasada 
- tarea con la fecha como texto o como Date

## 2. Cuál de los casos nuevos PASÓ y por qué

Cuál de tus casos nuevos PASÓ, si alguno pasó, y por qué crees que pasó. Es la pregunta más interesante del ejercicio, y la respuesta no está en ningún sitio: se deduce mirando qué tienen en común los que fallaron.

Los 4 casos nuevos que pasaron fueron:
Test Funcionales:
- Vencer hoy todavía no es estar vencida
- Fecha futura
- Sin fecha no se vence nunca
- Aplazar resuelve el vencimiento
Unit Tests:
- Fecha anterior, sin hacer
- Fecha igual al día de referencia
- Fecha Posterior
- Sin Fecha

 Los tres primeros esperan isOverdue = false y lo leen del GET. El GET ya vimos que devuelve siempre false, porque dueDate llega de la BD como un Date y la comparación con el texto de "today" nunca da true. Así que estos tres tests pasarían igual con un isOverdue fijo a false. Están en verde por el fallo, no porque comprueben la regla.

El cuarto test, Aplazar, solo lee la respuesta del PUT y la tarea no está done. En la respuesta del PUT, dueDate todavía es el texto que se acaba de enviar, así que la comparación funciona. Y como la tarea está pending, no importa que isOverdueOn ignore el estado.

## 3. Tu duda

De qué dudaste, o qué no pudiste comprobar.

El caso texto frente a Date: se detiene en la primera combinación que difiere. in_progress, hoy, mañana y done con un Date no se han evaluado.
Ningún test funcional usa in_progress, y en el unitario solo aparece en las combinaciones que no llegaron a ejecutarse.
-
