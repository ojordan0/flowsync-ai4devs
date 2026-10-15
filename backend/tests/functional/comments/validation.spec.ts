import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Ningún comentario vacío ni excesivo. Un test por cada scenario del requisito
 * «Ningún comentario vacío ni excesivo» de `openspec/specs/comments/spec.md`.
 *
 * Los rechazos se miran en los dos sitios que importan: la respuesta (`422`
 * con un error sobre el campo `body`, con la forma `errors` de VineJS que ya
 * comprueban los tests de auth) y la tabla `comments`, que tiene que seguir
 * sin filas de esa tarea. Sin endpoint de lectura del hilo en este cambio, la
 * tabla es la única forma de ver que «no se crea nada».
 */
test.group('Comments | ni vacío ni excesivo', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const MAXIMO = 500

  const con = (token: string) => ({ Authorization: `Bearer ${token}` })

  async function sesion(client: any) {
    const email = 'ada@example.com'
    const signup = await client.post('/api/v1/auth/signup').json({
      fullName: 'Ada Lovelace',
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

  function comentar(client: any, token: string, taskId: number, payload: Record<string, unknown>) {
    return client.post(`/api/v1/tasks/${taskId}/comments`).headers(con(token)).json(payload)
  }

  async function comentariosEnLaBase(taskId: number) {
    const [{ total }] = await db.from('comments').where('task_id', taskId).count('* as total')
    return Number(total)
  }

  test('texto ausente, vacío o de solo espacios', async ({ client, assert }) => {
    const token = await sesion(client)
    const tarea = await crearTarea(client, token)

    // Los tres cuerpos que nombra el scenario, uno a uno.
    for (const payload of [{}, { body: '' }, { body: '   ' }]) {
      const response = await comentar(client, token, tarea, payload)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'body' }] })
    }

    assert.equal(await comentariosEnLaBase(tarea), 0)
  })

  test('texto demasiado largo', async ({ client, assert }) => {
    const token = await sesion(client)
    const tarea = await crearTarea(client, token)

    const response = await comentar(client, token, tarea, { body: 'a'.repeat(MAXIMO + 1) })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'body' }] })

    // «Nunca un recorte silencioso»: ni la fila completa ni una recortada a 500.
    assert.equal(await comentariosEnLaBase(tarea), 0)
  })

  test('los espacios de los extremos no cuentan', async ({ client, assert }) => {
    const token = await sesion(client)
    const tarea = await crearTarea(client, token)

    const hecho = await comentar(client, token, tarea, { body: '  Hecho  ' })
    hecho.assertStatus(201)
    assert.equal(hecho.body().data.body, 'Hecho')

    // Exactamente el máximo por dentro y espacios por fuera: el límite se mide
    // sobre el texto ya recortado, así que se acepta y llega con 500 justos.
    const justo = 'abcde'.repeat(MAXIMO / 5)
    const alLimite = await comentar(client, token, tarea, { body: `   ${justo}   ` })
    alLimite.assertStatus(201)
    assert.equal(alLimite.body().data.body, justo)
    assert.lengthOf(alLimite.body().data.body, MAXIMO)

    // Y lo guardado es el texto recortado, no el que se envió.
    const guardados = await db
      .from('comments')
      .where('task_id', tarea)
      .orderBy('id', 'asc')
      .select('body')
    assert.deepEqual(
      guardados.map((fila) => fila.body),
      ['Hecho', justo]
    )
  })
})
