import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * La fecha de vencimiento leída de vuelta de la base de datos. Cubre el
 * scenario «La fecha es un día, no un instante» del requisito «Fecha de
 * vencimiento opcional» y el scenario «Fecha del día anterior» del requisito
 * «Cuándo una tarea está vencida» de `openspec/specs/tasks/spec.md`.
 *
 * Las dos comprobaciones se hacen con un `GET` posterior al `PUT`, y no con la
 * respuesta del `PUT`: esa responde con el valor que el controlador tiene en
 * memoria, que es el texto que él mismo escribió. Lo que hay que probar es lo
 * que devuelve el driver al releer la columna `date`, porque es lo único que
 * depende del motor de base de datos.
 */
test.group('Tasks | fecha de vencimiento releída', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const DIA_DE_REFERENCIA = '2026-08-20'
  const DIA_ANTERIOR = '2026-08-19'

  /** Una tarea con fecha, leída de nuevo desde la base por `GET /tasks/:id`. */
  async function tareaReleidaConFecha(client: any, dueDate: string) {
    await User.create({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secreto123',
    })

    const login = await client
      .post('/api/v1/auth/login')
      .json({ email: 'ada@example.com', password: 'secreto123' })
    const token = login.body().data.token as string

    const creada = await client
      .post('/api/v1/tasks')
      .header('Authorization', `Bearer ${token}`)
      .json({ title: 'Revisar el informe' })
    creada.assertStatus(201)
    const id = creada.body().data.id as number

    const fijada = await client
      .put(`/api/v1/tasks/${id}/due-date`)
      .header('Authorization', `Bearer ${token}`)
      .json({ dueDate, today: DIA_DE_REFERENCIA })
    fijada.assertStatus(200)

    const releida = await client
      .get(`/api/v1/tasks/${id}`)
      .qs({ today: DIA_DE_REFERENCIA })
      .header('Authorization', `Bearer ${token}`)
    releida.assertStatus(200)

    return releida.body().data
  }

  test('la fecha releída llega como día del calendario, sin hora ni huso', async ({
    client,
    assert,
  }) => {
    const tarea = await tareaReleidaConFecha(client, DIA_ANTERIOR)

    assert.equal(tarea.dueDate, DIA_ANTERIOR)
  })

  test('una tarea con la fecha del día anterior llega vencida al releerla', async ({
    client,
    assert,
  }) => {
    const tarea = await tareaReleidaConFecha(client, DIA_ANTERIOR)

    assert.isTrue(tarea.isOverdue)
  })
})
