import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea enseña de quien la lleva. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`: el responsable identificable, la tarea que no
 * filtra datos de cuenta, y el responsable sin nombre.
 *
 * El aislamiento es una transacción global y no un truncate a propósito: la
 * suite functional pega contra el mismo fichero SQLite que el servidor de
 * desarrollo (`config/database.ts` no tiene override por entorno), y vaciarlo
 * se llevaría por delante los datos con los que se está trabajando.
 *
 * Por ese mismo motivo la lista puede traer tareas anteriores a estos tests, y
 * las comprobaciones buscan siempre la tarea creada por su `id` en vez de dar
 * por hecho que es la única fila.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  /**
   * El día de referencia que exige `GET /api/v1/tasks/:id`. Es un valor fijo:
   * ninguno de estos scenarios habla de vencimiento, y hacerlo depender del
   * reloj metería en estos tests una variable que no es la suya.
   */
  const DIA_DE_REFERENCIA = '2026-01-15'

  /**
   * Deja una tarea creada por la cuenta indicada y devuelve lo justo para
   * volver a pedirla: el token de quien la creó y el id de la tarea.
   */
  async function tareaDe(client: any, fullName: string | null, email: string) {
    await User.create({ fullName, email, password: 'secreto123' })

    const login = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })
    const token = login.body().data.token as string

    const creada = await client
      .post('/api/v1/tasks')
      .header('Authorization', `Bearer ${token}`)
      .json({ title: 'Revisar el informe' })

    creada.assertStatus(201)

    return { token, id: creada.body().data.id as number, creada }
  }

  /** La tarea de `id` tal y como sale dentro de la lista. */
  async function enLaLista(client: any, token: string, id: number) {
    const response = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    return response.body().data.find((tarea: any) => tarea.id === id)
  }

  /** La tarea de `id` tal y como sale pedida suelta. */
  async function suelta(client: any, token: string, id: number) {
    const response = await client
      .get(`/api/v1/tasks/${id}`)
      .header('Authorization', `Bearer ${token}`)
      .qs({ today: DIA_DE_REFERENCIA })

    response.assertStatus(200)

    return response.body().data
  }

  test('el responsable llega con su nombre y sus iniciales', async ({ client, assert }) => {
    const { token, id } = await tareaDe(client, 'Ada Lovelace', 'ada@example.com')

    // «cada tarea»: el nombre y las iniciales acompañan a la tarea tanto dentro
    // de la lista como pedida suelta.
    for (const tarea of [await enLaLista(client, token, id), await suelta(client, token, id)]) {
      assert.isObject(tarea.assignee)
      assert.equal(tarea.assignee.fullName, 'Ada Lovelace')
      assert.equal(tarea.assignee.initials, 'AL')
    }
  })

  test('la tarea no lleva el email ni ningún otro dato de la cuenta', async ({
    client,
    assert,
  }) => {
    const { token, id, creada } = await tareaDe(client, 'Ada Lovelace', 'ada@example.com')

    // El scenario dice «suelta o dentro de la lista»: se comprueban las dos, y
    // también la respuesta de la creación, que es la primera vez que la tarea
    // sale del sistema.
    const apariciones: Array<[string, any]> = [
      ['la creación', creada.body().data],
      ['la lista', await enLaLista(client, token, id)],
      ['la tarea suelta', await suelta(client, token, id)],
    ]

    for (const [donde, tarea] of apariciones) {
      const serializado = JSON.stringify(tarea.assignee)
      assert.notInclude(serializado, 'ada@example.com', `el email se cuela en ${donde}`)
      assert.notProperty(tarea.assignee, 'email', `el email se cuela en ${donde}`)

      // «ni ningún otro dato de esa cuenta»: identificarlo son tres campos, y
      // cualquiera de más es un dato que el cliente ya no se puede quitar.
      assert.deepEqual(
        Object.keys(tarea.assignee).sort(),
        ['fullName', 'id', 'initials'],
        `${donde} acompaña la tarea de datos de cuenta que no hacen falta`
      )
    }
  })

  test('un responsable sin nombre llega nulo pero con iniciales', async ({ client, assert }) => {
    const { token, id } = await tareaDe(client, null, 'sin-nombre@example.com')

    for (const tarea of [await enLaLista(client, token, id), await suelta(client, token, id)]) {
      assert.isNull(tarea.assignee.fullName)

      // Las iniciales siguen llegando: son con lo que la interfaz lo representa
      // sin tener que recurrir a su email.
      assert.isString(tarea.assignee.initials)
      assert.isNotEmpty(tarea.assignee.initials)
    }
  })
})
