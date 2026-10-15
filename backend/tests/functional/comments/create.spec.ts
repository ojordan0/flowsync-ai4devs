import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Comentar una tarea. Un test por cada scenario del requisito «Comentar una
 * tarea» de `openspec/specs/comments/spec.md`.
 *
 * Todo entra por HTTP, como entra el cliente: las cuentas se crean con
 * `POST /api/v1/auth/signup` y se abre sesión con `POST /api/v1/auth/login`,
 * la tarea sale de `POST /api/v1/tasks` y el comentario de
 * `POST /api/v1/tasks/:id/comments`.
 *
 * Este cambio no trae forma de leer el hilo por la API, así que «no se crea
 * ningún comentario» se comprueba contando filas en la tabla `comments`
 * (`task_id`, `author_id`, `body`), el contrato de almacenamiento fijado de
 * antemano. No se importa ningún modelo de comentarios: solo la tabla.
 */
test.group('Comments | comentar una tarea', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // La tarea suelta exige el día de quien mira; aquí no se prueba el
  // vencimiento, es solo el parámetro que hace falta para poder leerla.
  const HOY = '2026-08-20'

  const con = (token: string) => ({ Authorization: `Bearer ${token}` })

  /** Registra una cuenta, abre sesión con ella y devuelve su token y su id. */
  async function persona(client: any, fullName: string, email: string) {
    const signup = await client.post('/api/v1/auth/signup').json({
      fullName,
      email,
      password: 'secreto123',
      passwordConfirmation: 'secreto123',
    })
    signup.assertStatus(200)

    const login = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })
    login.assertStatus(200)
    const token = login.body().data.token as string

    // El id se toma del perfil: es la ruta que el contrato de auth fija para
    // saber de quién es un token.
    const perfil = await client.get('/api/v1/account/profile').headers(con(token))
    perfil.assertStatus(200)

    return { token, id: perfil.body().data.id as number }
  }

  async function crearTarea(client: any, token: string, title = 'Revisar el informe') {
    const creada = await client.post('/api/v1/tasks').headers(con(token)).json({ title })
    creada.assertStatus(201)

    return creada.body().data.id as number
  }

  function comentar(client: any, taskId: number, payload: Record<string, unknown>, token?: string) {
    const request = client.post(`/api/v1/tasks/${taskId}/comments`)
    if (token) request.headers(con(token))
    return request.json(payload)
  }

  async function consultarTarea(client: any, token: string, id: number) {
    const response = await client.get(`/api/v1/tasks/${id}`).qs({ today: HOY }).headers(con(token))
    response.assertStatus(200)

    return response.body().data
  }

  /** Filas de `comments`; de una tarea si se indica, de toda la tabla si no. */
  async function comentariosEnLaBase(taskId?: number) {
    const query = db.from('comments')
    if (taskId !== undefined) query.where('task_id', taskId)
    const [{ total }] = await query.count('* as total')

    return Number(total)
  }

  test('alta con el texto como único dato', async ({ client, assert }) => {
    const ada = await persona(client, 'Ada Lovelace', 'ada@example.com')
    const tarea = await crearTarea(client, ada.token)

    const response = await comentar(
      client,
      tarea,
      { body: 'Falta el informe del trimestre' },
      ada.token
    )

    response.assertStatus(201)

    const comentario = response.body().data
    assert.properties(comentario, ['id', 'body', 'author', 'createdAt'])
    assert.isNumber(comentario.id)
    assert.equal(comentario.body, 'Falta el informe del trimestre')
    assert.isString(comentario.createdAt)
    assert.isFalse(Number.isNaN(Date.parse(comentario.createdAt)))

    // El autor llega con lo que muestra el spec y nada más: un dato de cuenta
    // de más en la respuesta ya no se le puede quitar a un cliente sin romperlo.
    assert.deepEqual(Object.keys(comentario.author).sort(), ['fullName', 'id', 'initials'])
    assert.equal(comentario.author.id, ada.id)
    assert.equal(comentario.author.fullName, 'Ada Lovelace')
    assert.equal(comentario.author.initials, 'AL')

    assert.equal(await comentariosEnLaBase(tarea), 1)
  })

  test('el comentario nace a nombre de quien lo envía', async ({ client, assert }) => {
    const ada = await persona(client, 'Ada Lovelace', 'ada@example.com')
    // Otra cuenta real: si el cuerpo pudiera elegir autor, este id sería un
    // destino válido y el test lo destaparía. Con un id inventado no.
    const grace = await persona(client, 'Grace Hopper', 'grace@example.com')
    const tarea = await crearTarea(client, ada.token)

    // El scenario nombra las dos formas («un "author" o un "authorId"»), y se
    // prueba cada una por separado. Textos distintos para que la regla de no
    // repetir seguido no se cruce con lo que se mide aquí.
    const conAuthor = await comentar(
      client,
      tarea,
      {
        body: 'Lo firmo yo, diga lo que diga el cuerpo',
        author: { id: grace.id, fullName: 'Grace Hopper', initials: 'GH' },
      },
      ada.token
    )
    const conAuthorId = await comentar(
      client,
      tarea,
      { body: 'Y esto también lo firmo yo', authorId: grace.id },
      ada.token
    )

    for (const response of [conAuthor, conAuthorId]) {
      response.assertStatus(201)

      const { author } = response.body().data
      assert.deepEqual(Object.keys(author).sort(), ['fullName', 'id', 'initials'])
      assert.equal(author.id, ada.id)
      assert.equal(author.fullName, 'Ada Lovelace')
      assert.equal(author.initials, 'AL')
    }

    // Lo que se guarda tampoco se deja llevar por el cuerpo: ninguna fila de
    // esa tarea queda a nombre de la otra cuenta.
    const autores = await db.from('comments').where('task_id', tarea).select('author_id')
    assert.lengthOf(autores, 2)
    for (const { author_id: autor } of autores) {
      assert.equal(Number(autor), ada.id)
    }
  })

  test('comentar no cambia la tarea', async ({ client, assert }) => {
    const ada = await persona(client, 'Ada Lovelace', 'ada@example.com')
    const tarea = await crearTarea(client, ada.token, 'Cerrar el trimestre')

    // Se saca la tarea del estado por defecto para que «el estado es el mismo»
    // no se cumpla solo porque el comentario lo devolviera a `pending`.
    const enCurso = await client
      .patch(`/api/v1/tasks/${tarea}/status`)
      .headers(con(ada.token))
      .json({ status: 'in_progress' })
    enCurso.assertStatus(200)

    const antes = await consultarTarea(client, ada.token, tarea)
    assert.equal(antes.title, 'Cerrar el trimestre')
    assert.equal(antes.status, 'in_progress')
    assert.isObject(antes.assignee)

    const response = await comentar(client, tarea, { body: 'Voy por la mitad' }, ada.token)
    response.assertStatus(201)

    const despues = await consultarTarea(client, ada.token, tarea)

    assert.equal(despues.title, antes.title)
    assert.equal(despues.status, antes.status)
    assert.deepEqual(despues.assignee, antes.assignee)
  })

  test('una tarea que no existe no se comenta', async ({ client, assert }) => {
    const ada = await persona(client, 'Ada Lovelace', 'ada@example.com')

    // Ningún literal mágico: se parte del id que el sistema acaba de dar y se
    // salta muy por encima, y antes de usarlo se confirma por la propia API que
    // no corresponde a ninguna tarea.
    const existente = await crearTarea(client, ada.token)
    const inexistente = existente + 1_000_000
    const comprobacion = await client
      .get(`/api/v1/tasks/${inexistente}`)
      .qs({ today: HOY })
      .headers(con(ada.token))
    comprobacion.assertStatus(404)

    const totalAntes = await comentariosEnLaBase()

    // El scenario dice que el 404 gana «aunque el cuerpo fuera inválido»: se
    // prueba con los dos inválidos que más tientan a validar primero (vacío y
    // ausente) y, de paso, con uno válido.
    for (const payload of [{ body: '' }, {}, { body: 'Comentario a una tarea fantasma' }]) {
      const response = await comentar(client, inexistente, payload, ada.token)
      response.assertStatus(404)
    }

    assert.equal(await comentariosEnLaBase(inexistente), 0)
    assert.equal(await comentariosEnLaBase(), totalAntes)
  })

  test('sin sesión no se comenta', async ({ client, assert }) => {
    const ada = await persona(client, 'Ada Lovelace', 'ada@example.com')
    const tarea = await crearTarea(client, ada.token)

    const sinCabecera = await comentar(client, tarea, { body: 'Sin sesión' })
    sinCabecera.assertStatus(401)

    // Con la forma de un token opaco, pero que el sistema nunca ha emitido.
    const tokenInventado = await comentar(
      client,
      tarea,
      { body: 'Con un token inventado' },
      'oat_1.esto-no-es-un-token'
    )
    tokenInventado.assertStatus(401)

    assert.equal(await comentariosEnLaBase(tarea), 0)
  })
})
