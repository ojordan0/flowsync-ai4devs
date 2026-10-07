import { BaseSeeder } from '@adonisjs/lucid/seeders'
import logger from '@adonisjs/core/services/logger'
import User from '#models/user'
import { UserFactory, correoDe } from '#database/factories/user_factory'
import { TaskFactory, TITULOS } from '#database/factories/task_factory'
import { inicioDeLaHistoria } from '#database/factories/historia'
import { DateTime } from 'luxon'

/**
 * Las cinco personas del equipo, inventadas. Son fijas y no salen al azar de
 * la factory porque su correo es lo que identifica al equipo: es lo que hace
 * que lanzar el seeder dos veces no lo duplique, y lo que permite entrar con
 * cualquiera de ellas sabiendo de antemano con qué correo.
 */
const EQUIPO = ['Lucía Arrieta', 'Tomás Villanueva', 'Nerea Calvo', 'Iván Sopeña', 'Marta Quiroga']

type EstadoDeTarea = 'enCurso' | 'hecha' | 'conFecha' | 'venceHoy' | 'conFechaPasada' | 'vencida'

const veces = (n: number, receta: EstadoDeTarea[]) => Array.from({ length: n }, () => receta)

/**
 * Las 40 tareas, como la lista de lo que le ha pasado a cada una. Se reparten
 * por turnos entre las cinco personas (la i-ésima va a la persona i mod 5), así
 * que cada una lleva ocho y las seis «En curso» del principio caen una en cada
 * persona y la sexta otra vez en la primera: todo el mundo está en algo, que es
 * la pregunta que la lista existe para responder (E3-1 CA-5).
 *
 * - Hay tareas en los tres estados, y las hechas bastan para que filtrar por
 *   «Hecho» enseñe algo (RF-21, FS-142 CA-3).
 * - De las 26 vivas, 8 llevan fecha: una minoría, como tiene que ser si la
 *   fecha sigue siendo opcional de verdad (PRD S-3).
 * - Están todos los bordes de la regla de vencimiento: vencidas sin hacer,
 *   una que vence hoy, fechas futuras y hechas fuera de plazo
 *   (FS-118 CA-5, CA-6, CA-9).
 */
const RECETAS: EstadoDeTarea[][] = [
  // En curso: 6
  ...veces(3, ['enCurso']),
  ['enCurso', 'conFecha'],
  ['enCurso', 'vencida'],
  ['enCurso', 'venceHoy'],

  // Pendientes: 20
  ...veces(15, []),
  ...veces(2, ['vencida']),
  ...veces(3, ['conFecha']),

  // Hechas: 14
  ...veces(11, ['hecha']),
  ...veces(3, ['hecha', 'conFechaPasada']),
]

function barajar<T>(elementos: readonly T[]): T[] {
  const copia = [...elementos]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/**
 * `cuantos` momentos repartidos a lo largo de la historia, uno en cada tramo
 * igual de largo, desde el día siguiente al alta del equipo hasta ahora.
 *
 * Por tramos y no al azar: al azar puro, el mes en curso puede quedarse sin
 * ninguna tarea creada aunque empiece hace una semana, y lo que cuente «este
 * mes» no tendría nada que contar. Así hay una cada dos días, más o menos,
 * también este mes.
 */
function momentosRepartidos(cuantos: number): DateTime[] {
  const desde = inicioDeLaHistoria().plus({ days: 1 })
  const tramo = DateTime.now().diff(desde).as('milliseconds') / cuantos

  return Array.from({ length: cuantos }, (_, i) =>
    desde.plus({ milliseconds: tramo * (i + Math.random()) })
  )
}

/**
 * El equipo de demostración: cinco personas y unas cuarenta tareas, con
 * fechas de creación repartidas en los últimos 90 días contados desde el
 * momento de lanzarlo. Todas las personas entran con la contraseña
 * `flowsync-demo`.
 *
 * Solo corre en desarrollo: con cualquier otro `NODE_ENV`, Lucid lo ignora.
 *
 * Lanzarlo dos veces no duplica nada. Si cualquiera de las cinco personas ya
 * está en la base, no hace nada: las tareas no tienen ninguna clave natural
 * con la que reconocerlas, y volver a crearlas pisaría lo que se haya cambiado
 * probando la aplicación. Todo va en una transacción, así que una pasada que
 * falle a medias no deja medio equipo que bloquee la siguiente.
 *
 * Para empezar de cero con fechas recalculadas desde hoy:
 * `node ace migration:fresh --seed`, que borra toda la base de desarrollo.
 */
export default class EquipoDeDemostracionSeeder extends BaseSeeder {
  static environment = ['development']

  async run() {
    if (RECETAS.length > TITULOS.length) {
      throw new Error(`Hay ${RECETAS.length} tareas y solo ${TITULOS.length} títulos distintos.`)
    }

    const correos = EQUIPO.map((fullName) => correoDe(fullName))
    const yaEsta = await User.query({ client: this.client }).whereIn('email', correos).first()

    if (yaEsta) {
      logger.info('El equipo de demostración ya está en la base: no se crea nada.')
      return
    }

    await this.client.transaction(async (trx) => {
      const personas = await UserFactory.client(trx)
        .merge(EQUIPO.map((fullName) => ({ fullName, email: correoDe(fullName) })))
        .createMany(EQUIPO.length)

      const titulos = barajar(TITULOS)
      const momentos = barajar(momentosRepartidos(RECETAS.length))

      for (const [i, receta] of RECETAS.entries()) {
        await TaskFactory.client(trx)
          .merge({
            title: titulos[i],
            assigneeId: personas[i % personas.length].id,
            createdAt: momentos[i],
          })
          .apply(...receta)
          .create()
      }
    })
  }
}
