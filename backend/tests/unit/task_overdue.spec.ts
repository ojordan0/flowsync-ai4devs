import Task, { type TaskStatus } from '#models/task'
import { test } from '@japa/runner'

/**
 * La regla de «vencida», sola: `Task#isOverdueOn`, sin servidor y sin base de
 * datos. Los mismos bordes que el requisito «Cuándo una tarea está vencida» de
 * `openspec/specs/tasks/spec.md`, ejercidos sobre el método y no sobre la API
 * (esos están en `tests/functional/tasks/overdue.spec.ts`).
 *
 * Las tareas se construyen en memoria y nunca se guardan: lo único que la regla
 * mira es su fecha y su estado.
 */
test.group('Task | isOverdueOn', () => {
  const HOY = '2026-08-20'
  const AYER = '2026-08-19'
  const MANANA = '2026-08-21'

  function tarea(dueDate: string | null, status: TaskStatus = 'pending') {
    const task = new Task()
    task.status = status
    task.dueDate = dueDate
    return task
  }

  test('fecha anterior al día de referencia y sin hacer: vencida', ({ assert }) => {
    assert.isTrue(tarea(AYER).isOverdueOn(HOY))
  })

  test('fecha igual al día de referencia: todavía no vencida', ({ assert }) => {
    assert.isFalse(tarea(HOY).isOverdueOn(HOY))
  })

  test('fecha posterior al día de referencia: no vencida', ({ assert }) => {
    assert.isFalse(tarea(MANANA).isOverdueOn(HOY))
  })

  test('sin fecha: no vencida', ({ assert }) => {
    assert.isFalse(tarea(null).isOverdueOn(HOY))
  })

  test('hecha y con la fecha pasada: no vencida', ({ assert }) => {
    assert.isFalse(tarea(AYER, 'done').isOverdueOn(HOY))
  })

  /**
   * No sale de la spec, sino de cómo llega el dato de verdad. El tipo dice
   * `string`, y así es justo después de fijar la fecha por la API. Pero una
   * tarea leída de la base trae la columna `date` como un objeto `Date`: el
   * `GET /api/v1/tasks/:id` la devuelve serializada como
   * `"2026-08-19T00:00:00.000Z"`. La regla tiene que dar lo mismo en los dos
   * casos, porque las dos son la misma tarea.
   */
  test('da lo mismo con la fecha como texto que como objeto Date', ({ assert }) => {
    const casos: Array<[string, TaskStatus]> = [
      [AYER, 'pending'],
      [AYER, 'in_progress'],
      [HOY, 'pending'],
      [MANANA, 'pending'],
      [AYER, 'done'],
    ]

    for (const [dia, status] of casos) {
      const comoTexto = tarea(dia, status)

      // El cast es el punto del test: reproduce lo que el driver deja en el
      // atributo aunque el tipo generado diga otra cosa.
      const comoDate = tarea(new Date(`${dia}T00:00:00.000Z`) as unknown as string, status)

      assert.equal(
        comoDate.isOverdueOn(HOY),
        comoTexto.isOverdueOn(HOY),
        `${status} con fecha ${dia}, mirada desde ${HOY}`
      )
    }
  })
})
