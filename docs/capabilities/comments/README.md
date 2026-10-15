# Capability: `comments`

El hilo de comentarios de cada tarea: apuntar una aclaración o una novedad junto a la tarea, sin tocar
su título ni su estado.

> **Dónde está la verdad.** Las reglas de esta capability viven en
> **[`openspec/specs/comments/spec.md`](../../../openspec/specs/comments/spec.md)** —4 requisitos, 16
> scenarios— y este README **no las repite**: enlaza a cada una y dice dónde está implementada. Si algo
> de aquí y la spec no concuerdan, manda la spec (ver
> [ADR 0001](../../adr/0001-openspec-como-fuente-de-verdad.md)).

## Qué está implementado y qué no

| Requisito | Estado |
|---|---|
| [Comentar una tarea](../../../openspec/specs/comments/spec.md#requirement-comentar-una-tarea) | Implementado |
| [Ningún comentario vacío ni excesivo](../../../openspec/specs/comments/spec.md#requirement-ningún-comentario-vacío-ni-excesivo) | Implementado |
| [Un mismo comentario no se repite seguido](../../../openspec/specs/comments/spec.md#requirement-un-mismo-comentario-no-se-repite-seguido) | Implementado |
| [Leer los comentarios de una tarea](../../../openspec/specs/comments/spec.md#requirement-leer-los-comentarios-de-una-tarea) | **Sin implementar.** `GET /api/v1/tasks/:id/comments` no existe todavía: hoy un comentario solo se ve en la respuesta que lo crea y en la tabla `comments` |

El frontend todavía no tiene nada de esta capability.

## Endpoints

Bajo `/api/v1`, declarado en [`backend/start/routes.ts`](../../../backend/start/routes.ts) dentro del
grupo de `tasks`, que lleva `.use(middleware.auth())`: exige `Authorization: Bearer <token>`.

| Método y ruta | Entrada | Controlador | Devuelve |
|---|---|---|---|
| `POST /tasks/:id/comments` | `{ "body": "..." }` | [`TaskCommentsController.store`](../../../backend/app/controllers/task_comments_controller.ts) | `201` · el comentario creado |

La respuesta va envuelta en `{ "data": ... }` por el serializer de
[`providers/api_provider.ts`](../../../backend/providers/api_provider.ts) y sale por
[`CommentTransformer`](../../../backend/app/transformers/comment_transformer.ts):

```json
{ "data": { "id": 1, "body": "Falta el informe del trimestre", "createdAt": "...",
            "author": { "id": 1, "fullName": "Ada Lovelace", "initials": "AL" } } }
```

El `author` sale por [`TaskAssigneeTransformer`](../../../backend/app/transformers/task_assignee_transformer.ts),
el mismo que el responsable de una tarea: `id`, `fullName` e `initials`, nunca el email.

Las comprobaciones van en este orden, y el orden es parte del contrato:

1. **Sesión** — sin token o con uno inválido, `401`.
2. **Tarea** — si no existe ninguna tarea viva con ese id (tampoco una en la papelera), `404`, aunque
   el cuerpo sea inválido.
3. **Cuerpo** — `422` sobre `body` si falta, está vacío, es solo espacios o pasa de 500 caracteres.
4. **Repetición** — `422` sobre `body`, regla `notRepeated`, si el texto ya recortado es idéntico al
   último comentario de esa misma cuenta en esa misma tarea.

Los dos `422` tienen la misma forma, la de VineJS: `{ "errors": [{ "message", "rule", "field" }] }`.

El contrato está anotado con los decoradores de `@foadonis/openapi` en el controlador, con las formas en
[`backend/app/openapi/schemas.ts`](../../../backend/app/openapi/schemas.ts) (`Comment`,
`CommentResponse`, `CreateCommentBody`), y versionado en
[`docs/api/openapi.json`](../../api/openapi.json) (`npm run openapi:check` lo compara).

## Reglas de negocio: dónde vive cada una

| Área | Implementada en | Requisito que manda |
|---|---|---|
| Comentar con solo el texto | `createCommentValidator` · [`validators/comment.ts`](../../../backend/app/validators/comment.ts) y `TaskCommentsController.store` | [Comentar una tarea](../../../openspec/specs/comments/spec.md#requirement-comentar-una-tarea) |
| El autor es quien envía | `TaskCommentsController.store` pasa `auth.getUserOrFail()`; el validador no declara `author` ni `authorId`, así que no llegan | [Comentar una tarea](../../../openspec/specs/comments/spec.md#requirement-comentar-una-tarea) |
| Comentar no cambia la tarea | [`CommentService.create`](../../../backend/app/services/comment_service.ts) solo inserta en `comments`; la fila de la tarea se bloquea, no se escribe | [Comentar una tarea](../../../openspec/specs/comments/spec.md#requirement-comentar-una-tarea) |
| 404 antes que el cuerpo | `Task.findOrFail` antes de `validateUsing` en `TaskCommentsController.store` | [Comentar una tarea](../../../openspec/specs/comments/spec.md#requirement-comentar-una-tarea) |
| Ni vacío ni más de 500, recortado | `createCommentValidator`: `trim()` antes de `minLength(1)` y `maxLength(500)`. En la base, `comments_body_length_check` y `comments_body_trimmed_check` | [Ningún comentario vacío ni excesivo](../../../openspec/specs/comments/spec.md#requirement-ningún-comentario-vacío-ni-excesivo) |
| No repetir seguido | `CommentService.create`: compara con el último comentario de esa cuenta en esa tarea (por `created_at` y luego `id`) dentro de una transacción que bloquea la fila de la tarea (`FOR UPDATE`), para que dos envíos simultáneos no pasen los dos. Lanza un `E_VALIDATION_ERROR` de VineJS, que AdonisJS pinta como cualquier `422` de validación | [Un mismo comentario no se repite seguido](../../../openspec/specs/comments/spec.md#requirement-un-mismo-comentario-no-se-repite-seguido) |

## Almacenamiento

Tabla `comments`, creada por
[`1792024711212_create_comments_table.ts`](../../../backend/database/migrations/1792024711212_create_comments_table.ts):
`id`, `task_id`, `author_id`, `body` (`text`, ya recortado), `created_at`, `updated_at`, e índice sobre
`(task_id, author_id)`. El modelo es [`Comment`](../../../backend/app/models/comment.ts), que extiende la
clase generada en `database/schema.ts`.

- `task_id` → `tasks`, **`ON DELETE CASCADE`**. Borrar una tarea desde la API la manda a la papelera y
  no borra la fila: sus comentarios se quedan y vuelven con ella al restaurarla. La cascada solo actúa si
  la fila de la tarea se borra de verdad.
- `author_id` → `users`, **`ON DELETE CASCADE`**, igual que `tasks.assignee_id`. La API no borra
  cuentas hoy; conservar el hilo de una cuenta borrada sería otra decisión, en otro cambio.
- La copia de producción (`make copia-produccion`) **no trae comentarios**:
  [`seudonimizar.sql`](../../../backend/database/seudonimizar.sql) es una lista blanca de `users` y
  `tasks`, y el texto de un comentario es texto libre que puede llevar datos reales.

Datos de desarrollo: [`CommentFactory`](../../../backend/database/factories/comment_factory.ts) (texto
presentable y nunca dos iguales seguidos) y el propio
[`main_seeder.ts`](../../../backend/database/seeders/main_seeder.ts), que deja hilos en 12 de las tareas
del equipo demo. Va en el seeder principal y no en uno aparte porque `db:seed` ejecuta los seeders por
orden alfabético y uno de comentarios correría antes de que existieran las personas y las tareas.

## Cómo se prueba en local

### Tests automáticos

Están en [`backend/tests/functional/comments/`](../../../backend/tests/functional/comments/): un test
por scenario de los tres requisitos implementados (`create.spec.ts`, `validation.spec.ts`,
`repeated.spec.ts`). Como no hay lectura del hilo, «no se crea ningún comentario» se comprueba contando
filas en la tabla `comments`.

```bash
make test                                              # desde la raíz: migra las dos bases y corre todo
cd backend && node ace test --files=create --files=validation --files=repeated
```

### A mano, contra el servidor real

```bash
cd backend && node ace serve --hmr        # http://localhost:3333
```

```bash
# Un token (ver docs/capabilities/tasks/README.md) y una tarea
TOKEN=...
curl -s -X POST http://localhost:3333/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Revisar el informe"}'

# Comentar — 201, con el texto recortado
curl -s -X POST http://localhost:3333/api/v1/tasks/1/comments \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"body":"  Falta el informe del trimestre  "}'

# El mismo texto otra vez — 422 sobre body, regla notRepeated
curl -s -X POST http://localhost:3333/api/v1/tasks/1/comments \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"body":"Falta el informe del trimestre"}'
```

Ojo: esto **escribe en la base de datos de desarrollo**.
