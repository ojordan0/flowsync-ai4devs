import type Comment from '#models/comment'
import { BaseTransformer } from '@adonisjs/core/transformers'
import TaskAssigneeTransformer from '#transformers/task_assignee_transformer'

/**
 * Un comentario tal y como lo devuelve la API: el texto, quién lo escribió y cuándo.
 *
 * No lleva `taskId` ni `updatedAt`: el comentario siempre se pide desde su tarea, y no
 * se edita. Lo que no sale aquí no hay que retirárselo después a ningún cliente.
 */
export default class CommentTransformer extends BaseTransformer<Comment> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'body', 'createdAt']),
      // El autor sale con la misma forma que el responsable de una tarea —`id`,
      // `fullName` e `initials`, nunca el email—, y por eso se reutiliza su
      // transformer en vez de `UserTransformer`. Si un día uno de los dos necesita un
      // dato que el otro no debe enseñar, se separan.
      author: TaskAssigneeTransformer.transform(this.whenLoaded(this.resource.author)),
    }
  }
}
