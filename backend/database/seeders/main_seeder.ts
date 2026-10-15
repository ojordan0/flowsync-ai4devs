import db from '@adonisjs/lucid/services/db'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'
import Comment from '#models/comment'
import Task from '#models/task'
import User from '#models/user'
import { CommentFactory } from '#database/factories/comment_factory'
import { TaskFactory, VENTANA_DIAS } from '#database/factories/task_factory'
import { UserFactory, emailPara } from '#database/factories/user_factory'

/**
 * Cinco personas con nombre fijo, para que quien desarrolla sepa con quién entrar:
 * el correo sale de `emailPara(nombre)` y la contraseña es `PASSWORD_DEMO`.
 */
const EQUIPO = [
  'Lucía Fernández',
  'Mateo Ortega',
  'Valentina Navarro',
  'Iker Molina',
  'Carmen Ibáñez',
]

const TOTAL_TAREAS = 40

/**
 * Las tareas que ejercitan cada rama de la regla de vencimiento (RF-14), para que el
 * dato de desarrollo no dependa de que el azar las produzca. El resto, hasta 40, son
 * lo que dé la factory sola.
 */
const CASOS = [
  'vencida',
  'vencida',
  'vencida',
  'venceHoy',
  'conFechaFutura',
  'conFechaFutura',
  'conFechaFutura',
  'conFechaFutura',
  'hechaConFechaPasada',
  'hechaConFechaPasada',
] as const

/**
 * Cuántas tareas del equipo quedan con hilo de comentarios. El resto se queda sin
 * ninguno, que también es un caso que la interfaz tiene que saber mostrar.
 */
const TAREAS_COMENTADAS = 12

/**
 * Cuántos comentarios lleva cada tarea comentada, por turno. Nunca más de cinco, el
 * tamaño del equipo: ver `sembrarComentarios`.
 */
const COMENTARIOS_POR_TAREA = [3, 1, 2, 4, 2, 1] as const

export default class extends BaseSeeder {
  /**
   * Solo en desarrollo: estas cuentas llevan una contraseña pública.
   */
  static environment = ['development']

  /**
   * Se puede lanzar las veces que haga falta. Las personas se identifican por su
   * correo y no se vuelven a crear; de las tareas solo se crean las que faltan hasta
   * llegar a 40 entre las de estas cinco personas, y de los hilos de comentarios, los
   * que faltan hasta llegar a 12 tareas comentadas. Todo va en una transacción: o se
   * siembra entero o no queda nada a medias que el siguiente intento duplicaría.
   *
   * Los comentarios van aquí y no en un seeder propio porque dependen de las personas
   * y las tareas de este: `db:seed` ejecuta los ficheros de `database/seeders/` por
   * orden alfabético, y un `comment_seeder.ts` correría antes que este, sobre una base
   * que puede estar vacía.
   */
  async run() {
    await db.transaction(async (trx) => {
      const equipo: User[] = []
      for (const fullName of EQUIPO) {
        const email = emailPara(fullName)
        const existente = await User.query({ client: trx }).where('email', email).first()
        equipo.push(
          existente ?? (await UserFactory.client(trx).merge({ fullName, email }).create())
        )
      }

      const cuenta = await Task.query({ client: trx })
        .whereIn(
          'assigneeId',
          equipo.map((persona) => persona.id)
        )
        .count('* as total')
        .firstOrFail()
      const yaSembradas = Number(cuenta.$extras.total)

      // La ventana se cuenta desde ahora y se reparte en 40 tramos iguales, uno por
      // tarea, con un punto al azar dentro de cada tramo: así hay tareas en todo el
      // periodo y ninguna cae en el futuro.
      const ahora = DateTime.now()
      const inicio = ahora.minus({ days: VENTANA_DIAS })
      const tramo = ahora.diff(inicio).as('milliseconds') / TOTAL_TAREAS

      for (let i = yaSembradas; i < TOTAL_TAREAS; i++) {
        const createdAt = inicio.plus({ milliseconds: Math.floor((i + Math.random()) * tramo) })

        // Los casos van en las 20 tareas más antiguas, una de cada dos, para que
        // una fecha pasada tenga sentido en una tarea que ya llevaba tiempo creada.
        const caso = i < 20 && i % 2 === 0 ? CASOS[i / 2] : undefined

        const constructor = TaskFactory.client(trx).merge({
          // 3 es primo con 5: recorre a las cinco personas sin repetir patrón.
          assigneeId: equipo[(i * 3) % equipo.length].id,
          createdAt,
        })

        await (caso ? constructor.apply(caso) : constructor).create()
      }

      await this.sembrarComentarios(trx, equipo)
    })
  }

  /**
   * Hilos de comentarios sobre las tareas vivas del equipo, hasta que haya
   * `TAREAS_COMENTADAS` con alguno. Una tarea que ya tiene comentarios (sembrados antes
   * o escritos por la API) cuenta y no se toca: así relanzar no añade nada y no se
   * intercalan comentarios viejos entre otros más recientes.
   *
   * **Nadie repite seguido** (requisito «Un mismo comentario no se repite seguido»):
   * dentro de una tarea, cada comentario es de una persona distinta, empezando por su
   * responsable y siguiendo por el equipo en orden. Con hilos de cinco o menos, nadie
   * tiene dos comentarios en la misma tarea, y la regla no tiene nada que comparar.
   */
  private async sembrarComentarios(trx: TransactionClientContract, equipo: User[]) {
    const tareas = await Task.query({ client: trx })
      .whereIn(
        'assigneeId',
        equipo.map((persona) => persona.id)
      )
      .orderBy('createdAt', 'asc')
      .orderBy('id', 'asc')

    const comentarios = await Comment.query({ client: trx })
      .whereIn(
        'taskId',
        tareas.map((tarea) => tarea.id)
      )
      .select('taskId')
    const conHilo = new Set(comentarios.map((comentario) => comentario.taskId))

    const faltan = TAREAS_COMENTADAS - conHilo.size
    if (faltan <= 0) return

    // Repartidas por todo el periodo en vez de las más antiguas seguidas.
    const sinHilo = tareas.filter((tarea) => !conHilo.has(tarea.id))
    const paso = Math.max(1, Math.floor(sinHilo.length / faltan))
    const elegidas = sinHilo.filter((_, i) => i % paso === 0).slice(0, faltan)

    const ahora = DateTime.now()

    for (const [i, tarea] of elegidas.entries()) {
      const total = COMENTARIOS_POR_TAREA[i % COMENTARIOS_POR_TAREA.length]
      const primero = equipo.findIndex((persona) => persona.id === tarea.assigneeId)

      // Entre la creación de la tarea y ahora, en tramos iguales y con un punto al azar
      // dentro de la segunda mitad de cada uno: crecientes, y ninguno en el futuro.
      const tramo = ahora.diff(tarea.createdAt).as('milliseconds') / (total + 1)

      for (let j = 0; j < total; j++) {
        const createdAt = tarea.createdAt.plus({
          milliseconds: Math.floor(tramo * (j + 0.5 + Math.random() * 0.5)),
        })

        await CommentFactory.client(trx)
          .merge({
            taskId: tarea.id,
            authorId: equipo[(primero + j) % equipo.length].id,
            createdAt,
          })
          .create()
      }
    }
  }
}
