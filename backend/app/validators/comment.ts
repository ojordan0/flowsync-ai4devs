import vine from '@vinejs/vine'
import { COMMENT_BODY_MAX_LENGTH } from '#models/comment'

/**
 * El texto es lo único que un comentario necesita, así que es lo único que se pide. El
 * autor no se acepta: sale del token, y un `author` o un `authorId` en el cuerpo ni
 * siquiera llegan al controlador, porque VineJS solo devuelve lo que el esquema declara.
 *
 * Igual que el título de una tarea: `trim()` corre antes que `minLength()`, de modo que
 * un texto de solo espacios se queda vacío y se rechaza como si no se hubiera escrito, y
 * el máximo se mide sobre el texto ya recortado.
 *
 * La regla de no repetir seguido no está aquí: depende de lo que ya hay en la base y de
 * quién escribe, y la aplica `CommentService` con la misma forma de error.
 */
export const createCommentValidator = vine.create({
  body: vine.string().trim().minLength(1).maxLength(COMMENT_BODY_MAX_LENGTH),
})
