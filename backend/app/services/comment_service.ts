import db from '@adonisjs/lucid/services/db'
import { errors } from '@vinejs/vine'
import Comment from '#models/comment'
import Task from '#models/task'
import type User from '#models/user'

/**
 * La regla que la repetición rompe, tal y como llega al cliente en el campo `rule`.
 * Va aquí, junto a quien la aplica, y no en el validador: no es una regla de VineJS.
 */
export const COMMENT_NOT_REPEATED_RULE = 'notRepeated'

export class CommentService {
  /**
   * Escribe un comentario de `author` sobre `task`, salvo que repita el último que esa
   * misma cuenta dejó en esa misma tarea (requisito «Un mismo comentario no se repite
   * seguido»). `body` llega ya validado y recortado, así que comparar es comparar texto
   * tal cual: la misma cadena con espacios de más en los extremos ya es la misma cadena.
   *
   * El rechazo es un `E_VALIDATION_ERROR` de VineJS sobre el campo `body`, no un error
   * propio. El manejador de excepciones de AdonisJS lo reconoce por su `code` y lo pinta
   * igual que un fallo del validador —`422` con `{ errors: [{ message, rule, field }] }`—,
   * de modo que el cliente trata un texto repetido como trata uno vacío.
   *
   * Comprobar y crear van en una transacción que bloquea la fila de la tarea, porque un
   * doble envío accidental es justo el caso de dos peticiones que llegan a la vez: sin el
   * bloqueo las dos leerían el mismo «último comentario», las dos pasarían y quedaría el
   * mensaje dos veces. Con él, la segunda espera a que la primera confirme y ya la ve.
   * Bloquea la tarea, no la tabla: solo se esperan entre sí los comentarios de una misma
   * tarea. Si la tarea ha ido a la papelera entre medias, `Task` ya no la encuentra y
   * sale el mismo 404 que si no existiera.
   */
  async create(task: Task, author: User, body: string): Promise<Comment> {
    const comment = await db.transaction(async (trx) => {
      await Task.query({ client: trx }).where('id', task.id).forUpdate().firstOrFail()

      // «El último» es el último del hilo tal y como se lee: por fecha de escritura, con
      // el id como desempate para dos comentarios del mismo milisegundo.
      const ultimo = await Comment.query({ client: trx })
        .where('taskId', task.id)
        .where('authorId', author.id)
        .orderBy('createdAt', 'desc')
        .orderBy('id', 'desc')
        .first()

      if (ultimo?.body === body) {
        throw new errors.E_VALIDATION_ERROR([
          {
            field: 'body',
            rule: COMMENT_NOT_REPEATED_RULE,
            message: 'The body field must not repeat your previous comment on this task',
          },
        ])
      }

      return Comment.create({ taskId: task.id, authorId: author.id, body }, { client: trx })
    })

    // El autor es la cuenta que ya está en memoria: no hace falta volver a leerla.
    comment.$setRelated('author', author)

    return comment
  }
}
