import Task from '#models/task'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { CommentService } from '#services/comment_service'
import { createCommentValidator } from '#validators/comment'
import CommentTransformer from '#transformers/comment_transformer'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'
import {
  CommentResponse,
  CreateCommentBody,
  ErrorResponse,
  ValidationErrorResponse,
} from '#openapi/schemas'

@ApiBearerAuth()
@inject()
export default class TaskCommentsController {
  constructor(protected comments: CommentService) {}

  /**
   * Comentar una tarea cuesta un texto. Cualquier persona con sesión comenta cualquier
   * tarea viva, propia o ajena, y comentar no cambia nada de la tarea.
   *
   * El orden de las comprobaciones es parte del contrato: primero que la tarea exista
   * (un 404 gana aunque el cuerpo sea inválido, como en `TaskStatusesController`),
   * después el cuerpo, y por último que no repita el comentario anterior de la misma
   * cuenta, que necesita la base y vive en `CommentService`.
   */
  @ApiOperation({
    summary: 'Comentar una tarea',
    description:
      'Crea un comentario sobre una tarea viva a nombre de la cuenta dueña del token: un `author` o un `authorId` enviados en el cuerpo se ignoran, no se rechazan. La tarea no cambia: ni su título, ni su estado, ni su responsable. Una tarea en la papelera no se puede comentar. El texto se recorta y no puede repetir, ya recortado, el último comentario de la misma cuenta en la misma tarea; otra cuenta sí puede escribir lo mismo.',
  })
  @ApiBody({ type: () => CreateCommentBody })
  @ApiResponse({
    status: 201,
    description: 'El comentario ya creado, con el texto recortado y a nombre de quien lo envió.',
    type: () => CommentResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Falta el token o no es válido. No se crea ningún comentario.',
    type: () => ErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description:
      'No existe ninguna tarea viva con ese identificador. Se comprueba antes que el cuerpo. No se crea ningún comentario.',
    type: () => ErrorResponse,
  })
  @ApiResponse({
    status: 422,
    description:
      'Sobre el campo `body`: falta, está vacío, es solo espacios o pasa de 500 caracteres (no se guarda una versión recortada), o repite el último comentario de la misma cuenta en esa tarea (regla `notRepeated`). No se crea ningún comentario.',
    type: () => ValidationErrorResponse,
  })
  async store({ params, request, response, auth, serialize }: HttpContext) {
    const task = await Task.findOrFail(params.id)
    const { body } = await request.validateUsing(createCommentValidator)

    const comment = await this.comments.create(task, auth.getUserOrFail(), body)

    // Como en `TasksController.store`: el estado se marca aparte y el cuerpo se
    // devuelve, porque `serialize()` entrega una promesa que resuelve el pipeline.
    response.status(201)
    return serialize(CommentTransformer.transform(comment))
  }
}
