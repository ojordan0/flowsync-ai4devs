import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Un mismo comentario no se repite seguido. Un test por cada scenario del
 * requisito «Un mismo comentario no se repite seguido» de
 * `openspec/specs/comments/spec.md`.
 *
 * La regla compara con el ÚLTIMO comentario de la MISMA cuenta en la MISMA
 * tarea, y lo compara una vez recortado. Cada test fija una de esas tres
 * condiciones: repetido y seguido (se rechaza), repetido pero no seguido (se
 * admite) y repetido por otra cuenta (se admite).
 *
 * «La tarea queda con un solo comentario de ese texto» se cuenta en la tabla
 * `comments` (`task_id`, `body`): este cambio no trae lectura del hilo.
 */
test.group('Comments | sin repetir seguido', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const con = (token: string) => ({ Authorization: `Bearer ${token}` })

  async function sesion(client: any, fullName: string, email: string) {
    const signup = await client.post('/api/v1/auth/signup').json({
      fullName,
      email,
      password: 'secreto123',
      passwordConfirmation: 'secreto123',
    })
    signup.assertStatus(200)

    const login = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })
    login.assertStatus(200)

    return login.body().data.token as string
  }

  async function crearTarea(client: any, token: string) {
    const creada = await client
      .post('/api/v1/tasks')
      .headers(con(token))
      .json({ title: 'Revisar el informe' })
    creada.assertStatus(201)

    return creada.body().data.id as number
  }

  function comentar(client: any, token: string, taskId: number, body: string) {
    return client.post(`/api/v1/tasks/${taskId}/comments`).headers(con(token)).json({ body })
  }

  /** Filas de la tarea; solo las de ese texto si se indica. */
  async function comentariosEnLaBase(taskId: number, body?: string) {
    const query = db.from('comments').where('task_id', taskId)
    if (body !== undefined) query.where('body', body)
    const [{ total }] = await query.count('* as total')

    return Number(total)
  }

  test('el mismo texto dos veces seguidas', async ({ client, assert }) => {
    const token = await sesion(client, 'Ada Lovelace', 'ada@example.com')
    const tarea = await crearTarea(client, token)

    const primero = await comentar(client, token, tarea, 'Subido el borrador')
    primero.assertStatus(201)

    const segundo = await comentar(client, token, tarea, 'Subido el borrador')
    segundo.assertStatus(422)
    segundo.assertBodyContains({ errors: [{ field: 'body' }] })

    // El requisito compara el texto «una vez recortado»: el doble envío con
    // espacios de más en los extremos es el mismo comentario. Sigue siendo
    // seguido, porque el rechazado de antes no ha dejado nada en medio.
    const conEspacios = await comentar(client, token, tarea, '  Subido el borrador  ')
    conEspacios.assertStatus(422)
    conEspacios.assertBodyContains({ errors: [{ field: 'body' }] })

    assert.equal(await comentariosEnLaBase(tarea, 'Subido el borrador'), 1)
    assert.equal(await comentariosEnLaBase(tarea), 1)
  })

  test('lo repetido pero no seguido sí se admite', async ({ client, assert }) => {
    const token = await sesion(client, 'Ada Lovelace', 'ada@example.com')
    const tarea = await crearTarea(client, token)

    for (const texto of [
      'Pendiente de revisión',
      'Revisado el apartado 2',
      'Pendiente de revisión',
    ]) {
      const response = await comentar(client, token, tarea, texto)
      response.assertStatus(201)
    }

    assert.equal(await comentariosEnLaBase(tarea), 3)
    assert.equal(await comentariosEnLaBase(tarea, 'Pendiente de revisión'), 2)
  })

  test('otra cuenta puede decir lo mismo', async ({ client, assert }) => {
    const ada = await sesion(client, 'Ada Lovelace', 'ada@example.com')
    const grace = await sesion(client, 'Grace Hopper', 'grace@example.com')
    const tarea = await crearTarea(client, ada)

    const deAda = await comentar(client, ada, tarea, 'De acuerdo')
    deAda.assertStatus(201)

    const deGrace = await comentar(client, grace, tarea, 'De acuerdo')
    deGrace.assertStatus(201)

    assert.equal(await comentariosEnLaBase(tarea, 'De acuerdo'), 2)
  })
})
