import Task from '#models/task'
import User from '#models/user'
import { belongsTo } from '@adonisjs/lucid/orm'
import { CommentSchema } from '#database/schema'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

/**
 * El máximo de un comentario, contado sobre el texto ya recortado. Pasarse es un error,
 * nunca un recorte silencioso. La migración repite el número en su `CHECK` a propósito:
 * una migración describe la base del día en que se escribió y no importa del código.
 */
export const COMMENT_BODY_MAX_LENGTH = 500

/**
 * Un comentario del hilo de una tarea (`openspec/specs/comments/spec.md`).
 *
 * No se edita ni se borra: este cambio solo los crea. El texto llega ya recortado y entre
 * 1 y 500 caracteres, y la base lo impone con dos `CHECK` además del validador.
 *
 * `task` pasa por `Task`, que esconde la papelera: el comentario de una tarea borrada en
 * blando sigue en la tabla, pero precargar su tarea da `null`. Cualquier lectura del hilo
 * tiene que partir de una tarea viva, como hace la creación.
 */
export default class Comment extends CommentSchema {
  @belongsTo(() => Task)
  declare task: BelongsTo<typeof Task>

  /**
   * Quien lo escribió: siempre la cuenta dueña del token, nunca lo que diga el cuerpo.
   */
  @belongsTo(() => User, { foreignKey: 'authorId' })
  declare author: BelongsTo<typeof User>
}
