import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * El hilo de comentarios de cada tarea (`openspec/specs/comments/spec.md`). Un comentario
 * es un texto de 1 a 500 caracteres, ya recortado, escrito por una cuenta sobre una tarea.
 *
 * Rama (convención 5): REVERSIBLE respecto a los datos que existen. Contado contra la base
 * de desarrollo: 44 tareas y 9 personas, y la migración no toca ninguna fila: solo crea
 * una tabla nueva y vacía. Lo que `down()` descarta es esa tabla entera, y con ella los
 * comentarios escritos después de aplicarla; antes de usarse no pierde nada.
 *
 * Las dos reglas del texto viven también aquí y no solo en el validador (convención 2):
 * un `INSERT` a mano, un seeder o una factory no pasan por VineJS.
 *
 * - `comments_body_length_check`: de 1 a 500 caracteres. `char_length` cuenta puntos de
 *   código y el `maxLength` de VineJS unidades UTF-16, que nunca son menos: todo lo que
 *   acepta el validador cabe aquí, y la base nunca es más estricta que la API.
 * - `comments_body_trimmed_check`: sin espacios, tabuladores ni saltos de línea en los
 *   extremos. El `trim()` de JavaScript quita esos y más, así que lo que llega del
 *   validador siempre cumple. Junto con la longitud mínima, impide también un texto
 *   hecho solo de esos caracteres.
 *
 * Un índice sobre `(task_id, author_id)`: sirve a la regla de no repetir seguido, que
 * busca el último comentario de una cuenta en una tarea, y su prefijo `task_id` servirá
 * para leer el hilo. PostgreSQL no indexa por su cuenta las columnas de una clave foránea.
 */
export default class extends BaseSchema {
  protected tableName = 'comments'

  async down() {
    // Las restricciones y el índice se van con la tabla.
    this.schema.dropTable(this.tableName)
  }

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // CASCADE: un comentario es parte del hilo de su tarea y fuera de ella no
      // significa nada. Ojo, borrar una tarea desde la API NO llega aquí: la manda a la
      // papelera (`deleted_at`), la fila sigue y sus comentarios con ella, de modo que
      // restaurarla devuelve también su hilo. Esto solo actúa cuando la fila de la tarea
      // se borra de verdad, a mano o con un TRUNCATE ... CASCADE.
      table
        .integer('task_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('tasks')
        .onDelete('CASCADE')

      // CASCADE, igual que `tasks.assignee_id` y los tokens: lo de una cuenta borrada se
      // va con ella, también lo que escribió, que es texto libre suyo. SET NULL dejaría
      // comentarios sin autor, y la spec exige de cada uno `id`, `fullName` e `initials`;
      // RESTRICT haría que poder borrar una cuenta dependiera de si alguna vez comentó.
      // Hoy la API no borra cuentas: decidir otra cosa (conservar el hilo con un autor
      // «cuenta eliminada») es de negocio y va en otro cambio.
      table
        .integer('author_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.text('body').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['task_id', 'author_id'])
    })

    this.schema.raw(`
      ALTER TABLE ${this.tableName}
      ADD CONSTRAINT comments_body_length_check
      CHECK (char_length(body) BETWEEN 1 AND 500)
    `)

    this.schema.raw(`
      ALTER TABLE ${this.tableName}
      ADD CONSTRAINT comments_body_trimmed_check
      CHECK (body = btrim(body, E' \\t\\n\\r'))
    `)
  }
}
