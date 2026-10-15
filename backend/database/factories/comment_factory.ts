import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import Comment from '#models/comment'
import { TaskFactory } from '#database/factories/task_factory'
import { UserFactory } from '#database/factories/user_factory'
import type { FactoryContextContract } from '@adonisjs/lucid/types/factory'

type Faker = FactoryContextContract['faker']

/**
 * Textos inventados, escritos como los dejaría un equipo junto a una tarea: una
 * aclaración, una novedad, una pregunta. Ninguno lleva espacios sobrantes en los extremos
 * y todos quedan muy por debajo de los 500 caracteres.
 */
const TEXTOS = [
  'Falta el informe del trimestre',
  'Lo miro esta tarde',
  'Subido el borrador a la carpeta compartida',
  'Bloqueado hasta que soporte nos pase el caso concreto',
  'Hablado con producto: lo dejamos para la siguiente iteración',
  'Ya está en revisión, a falta de un segundo par de ojos',
  '¿Alguien sabe quién lo pidió? No encuentro el origen',
  'Reproducido en móvil, en escritorio no pasa',
  'He dejado notas en el documento de diseño',
  'Pendiente de revisión',
  'Revisado el apartado 2, el resto sigue igual',
  'Me falta acceso al entorno de pruebas para seguir',
  'Hecho en local, falta probarlo con datos reales',
  'Cambio de plan: lo partimos en dos tareas',
  'Lo hablamos en la reunión del jueves',
  'Añadidas capturas del antes y el después',
  'El cliente confirma que con esto le vale',
  'Ojo, esto toca también la exportación',
  'Paso el relevo: yo no llego esta semana',
  'Medido otra vez y ha bajado a la mitad',
  'De acuerdo',
  'Sigue fallando de vez en cuando; adjunto el registro',
  'Necesito que alguien de diseño le eche un vistazo',
  'Queda pendiente solo el texto de ayuda',
  'Preguntado a legal, esperando respuesta',
]

/**
 * Los textos se reparten como una baraja, igual que los títulos de las tareas: cada
 * llamada saca el siguiente y solo se vuelve a barajar al agotarse. Al rebarajar se
 * evita que el primero de la baraja nueva sea el último que salió, así que **dos
 * comentarios hechos seguidos nunca tienen el mismo texto**: la factory no puede
 * producir por accidente lo que la regla de no repetir seguido rechazaría.
 */
let baraja: string[] = []
let ultimo: string | undefined

function siguienteTexto(faker: Faker) {
  if (baraja.length === 0) {
    baraja = faker.helpers.shuffle(TEXTOS)
    // Se saca con `pop()`, así que el que saldría primero es el del final.
    if (baraja[baraja.length - 1] === ultimo) baraja.reverse()
  }

  ultimo = baraja.pop()!
  return ultimo
}

/**
 * Un comentario. Lo que el esquema exige y la factory cumple sin que nadie se lo pida:
 *
 * - **Texto presentable.** De 1 a 500 caracteres y sin espacios sobrantes en los
 *   extremos: la base lo impone con `comments_body_length_check` y
 *   `comments_body_trimmed_check`, y un texto que no cumpla hace fallar el `INSERT`.
 * - **Nunca dos iguales seguidos.** Ver la baraja de arriba.
 * - **Autor y tarea siempre registrados.** Las claves foráneas lo exigen; las
 *   relaciones `author` y `task` los crean con sus factories si no se dan.
 * - **No se edita.** `updated_at` es la misma marca que `created_at`, también cuando se
 *   pasa un `createdAt` con `merge`. Que esa fecha no sea anterior a la tarea es cosa de
 *   quien la pase: la factory no conoce la tarea hasta que se persiste.
 */
export const CommentFactory = factory
  .define(Comment, ({ faker }) => {
    return {
      body: siguienteTexto(faker),
      createdAt: DateTime.now(),
    }
  })
  .relation('task', () => TaskFactory)
  .relation('author', () => UserFactory)
  .after('make', (_factory, comment) => {
    // Aquí y no en `define`: un `merge` puede cambiar `createdAt` después.
    comment.updatedAt = comment.createdAt
  })
  .build()
