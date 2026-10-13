import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'

/**
 * Cuándo una tarea está vencida. Un test por cada scenario del requisito
 * «Cuándo una tarea está vencida» de `openspec/specs/tasks/spec.md`.
 *
 * Todo entra por HTTP, como entra el cliente: la tarea se crea con
 * `POST /api/v1/tasks`, su fecha se fija con `PUT /:id/due-date`, su estado se
 * cambia con `PATCH /:id/status`, y la condición se lee del campo `isOverdue`
 * que viaja en el cuerpo de `GET /:id` o de la respuesta del `PUT`.
 *
 * El día de referencia va siempre en la petición (`today`) y es un día fijo:
 * ningún test mira el reloj, así que el resultado no depende de cuándo se
 * lancen.
 */
test.group('Tasks | vencimiento', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const HOY = '2026-08-20'
  const AYER = '2026-08-19'
  const MANANA = '2026-08-21'
  const HACE_UN_MES = '2026-07-20'

  const con = (token: string) => ({ Authorization: `Bearer ${token}` })

  async function sesion(client: any) {
    const email = 'ada@example.com'
    await User.create({ fullName: 'Ada Lovelace', email, password: 'secreto123' })

    const login = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })
    login.assertStatus(200)

    return login.body().data.token as string
  }

  /** Crea una tarea y devuelve el cuerpo de la creación, con el id que le ha dado el sistema. */
  async function crearTarea(client: any, token: string) {
    const creada = await client
      .post('/api/v1/tasks')
      .headers(con(token))
      .json({ title: 'Revisar el informe' })
    creada.assertStatus(201)

    return creada.body().data as { id: number; createdAt: string }
  }

  async function fijarFecha(
    client: any,
    token: string,
    id: number,
    dueDate: string | null,
    today = HOY
  ) {
    const response = await client
      .put(`/api/v1/tasks/${id}/due-date`)
      .headers(con(token))
      .json({ today, dueDate })
    response.assertStatus(200)

    return response.body().data
  }

  async function cambiarEstado(client: any, token: string, id: number, status: string) {
    const response = await client
      .patch(`/api/v1/tasks/${id}/status`)
      .headers(con(token))
      .json({ status })
    response.assertStatus(200)
  }

  async function consultar(client: any, token: string, id: number, today = HOY) {
    const response = await client.get(`/api/v1/tasks/${id}`).qs({ today }).headers(con(token))
    response.assertStatus(200)

    return response.body().data
  }

  test('fecha del día anterior: llega vencida', async ({ client, assert }) => {
    const token = await sesion(client)
    const { id } = await crearTarea(client, token)
    await fijarFecha(client, token, id, AYER)

    const tarea = await consultar(client, token, id)

    assert.equal(tarea.status, 'pending')
    assert.isTrue(tarea.isOverdue)
  })

  test('vencer hoy todavía no es estar vencida', async ({ client, assert }) => {
    const token = await sesion(client)
    const { id } = await crearTarea(client, token)
    await fijarFecha(client, token, id, HOY)

    const tarea = await consultar(client, token, id)

    assert.equal(tarea.status, 'pending')
    assert.isFalse(tarea.isOverdue)
  })

  test('fecha futura: no llega vencida', async ({ client, assert }) => {
    const token = await sesion(client)
    const { id } = await crearTarea(client, token)
    await fijarFecha(client, token, id, MANANA)

    const tarea = await consultar(client, token, id)

    assert.isFalse(tarea.isOverdue)
  })

  test('sin fecha no se vence nunca, por antigua que sea', async ({ client, assert }) => {
    const token = await sesion(client)
    const { id, createdAt } = await crearTarea(client, token)

    // «Creada hace semanas» se mide contra el día de referencia, no contra el
    // reloj: se toma como referencia un día seis semanas posterior a la
    // creación que devuelve la propia respuesta.
    const seisSemanasDespues = DateTime.fromISO(createdAt, { setZone: true })
      .plus({ weeks: 6 })
      .toFormat('yyyy-MM-dd')

    const tarea = await consultar(client, token, id, seisSemanasDespues)

    assert.equal(tarea.status, 'pending')
    assert.isNull(tarea.dueDate)
    assert.isFalse(tarea.isOverdue)
  })

  test('darla por hecha la deja de vencer y conserva la fecha', async ({ client, assert }) => {
    const token = await sesion(client)
    const { id } = await crearTarea(client, token)
    await fijarFecha(client, token, id, AYER)

    const antes = await consultar(client, token, id)
    assert.isTrue(antes.isOverdue)

    await cambiarEstado(client, token, id, 'done')

    const despues = await consultar(client, token, id)

    assert.equal(despues.status, 'done')
    assert.isFalse(despues.isOverdue)
    assert.equal(despues.dueDate, antes.dueDate)
  })

  test('una tarea hecha con la fecha pasada no llega vencida', async ({ client, assert }) => {
    const token = await sesion(client)
    const { id } = await crearTarea(client, token)
    await cambiarEstado(client, token, id, 'done')

    // Las dos respuestas que traen la tarea con su condición de vencida: la del
    // propio cambio de fecha y la consulta posterior. Ninguna puede marcarla.
    const alFijar = await fijarFecha(client, token, id, HACE_UN_MES)
    const tarea = await consultar(client, token, id)

    for (const leida of [alFijar, tarea]) {
      assert.equal(leida.status, 'done')
      assert.isFalse(leida.isOverdue)
    }
  })

  test('aplazar resuelve el vencimiento en la misma respuesta', async ({ client, assert }) => {
    const token = await sesion(client)
    const { id } = await crearTarea(client, token)

    const vencida = await fijarFecha(client, token, id, AYER)
    assert.isTrue(vencida.isOverdue)

    // Se mira la respuesta del propio cambio, no una consulta posterior: el
    // scenario exige que deje de estar vencida «en la misma respuesta».
    const aplazada = await fijarFecha(client, token, id, MANANA)

    assert.equal(aplazada.id, id)
    assert.equal(aplazada.dueDate, MANANA)
    assert.isFalse(aplazada.isOverdue)
  })
})
