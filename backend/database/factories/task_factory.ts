import factory from '@adonisjs/lucid/factories'
import Task, { TASK_STATUSES } from '#models/task'
import { UserFactory } from '#database/factories/user_factory'
import { inicioDeLaHistoria } from '#database/factories/historia'
import { createTaskValidator, toCalendarDay } from '#validators/task'
import type { FactoryContextContract } from '@adonisjs/lucid/types/factory'
import { DateTime } from 'luxon'

type Faker = FactoryContextContract['faker']

/**
 * Títulos de trabajo de un equipo de producto SaaS, inventados. Son frases
 * enteras y concretas a propósito: el producto solo evita que dos personas
 * pisen el mismo trabajo si un compañero reconoce de qué habla cada título
 * (PRD 4.4), y una lista de títulos genéricos no deja comprobar eso mirándola.
 *
 * Ninguno se parece a otro: dos títulos casi iguales en manos distintas son
 * justo la colisión que FlowSync existe para hacer visible, y no debe
 * aparecer por casualidad en los datos de desarrollo.
 */
export const TITULOS = [
  'Arreglar el redondeo del IVA en las facturas en PDF',
  'Revisar los textos de error del formulario de registro',
  'Migrar los avisos de facturación al nuevo proveedor de colas',
  'Documentar cómo se levanta el entorno local desde cero',
  'Quitar la dependencia de la librería de fechas antigua',
  'Preparar la demo del nuevo panel de suscripciones',
  'Investigar por qué el exportado a CSV corta los acentos',
  'Añadir paginación al listado de clientes del panel interno',
  'Actualizar las capturas de la guía de inicio rápido',
  'Corregir el desbordamiento del menú lateral en tablet',
  'Revisar el contraste de los botones secundarios',
  'Escribir el script de limpieza de cuentas de prueba',
  'Repasar los permisos del bucket de copias de seguridad',
  'Medir el tiempo de carga de la página de precios',
  'Cambiar el cálculo de prorrateo al subir de plan',
  'Reproducir el cierre de sesión inesperado en Safari',
  'Revisar con diseño la propuesta de nuevo onboarding',
  'Subir la versión de Node en el pipeline de despliegue',
  'Limpiar las banderas de funcionalidad que ya no se usan',
  'Traducir al portugués los correos de bienvenida',
  'Añadir un índice a la tabla de eventos de facturación',
  'Arreglar el doble envío del formulario de contacto',
  'Revisar la alerta de disco lleno del servidor de informes',
  'Preparar la retrospectiva del trimestre',
  'Unificar los formatos de fecha en el panel de administración',
  'Escribir las pruebas del cálculo de descuentos por volumen',
  'Investigar los timeouts del webhook de pagos',
  'Rehacer el componente de selector de plan',
  'Repasar con soporte las incidencias abiertas de importación',
  'Mover las variables de entorno al gestor de secretos',
  'Corregir la ordenación por fecha en el historial de pagos',
  'Diseñar el estado vacío del panel de métricas del cliente',
  'Actualizar la política de contraseñas del panel interno',
  'Quitar los logs con datos personales del servicio de cuentas',
  'Añadir reintentos a la sincronización con el CRM',
  'Revisar el presupuesto de la infraestructura de staging',
  'Arreglar el salto de línea en los nombres largos de empresa',
  'Documentar el contrato de la API de suscripciones',
  'Probar la restauración de la copia de seguridad nocturna',
  'Ajustar el tamaño de las imágenes del blog para móvil',
  'Revisar la accesibilidad por teclado del asistente de alta',
  'Automatizar la generación de notas de versión',
  'Investigar el pico de errores 500 del lunes por la mañana',
  'Adelantar a siete días el aviso de fin de la prueba gratuita',
  'Renombrar los planes antiguos en la base de clientes',
  'Preparar la sesión de formación para el equipo de ventas',
  'Eliminar el endpoint antiguo de exportación de datos',
  'Revisar el texto legal del banner de cookies',
  'Añadir el campo NIF al formulario de facturación',
]

/**
 * Días de distancia mínima con «hoy» de cualquier fecha pasada o futura que se
 * genere. El vencimiento se decide con el día de quien mira (RF-14, FS-118
 * CA-19), y el equipo de referencia está repartido en tres husos: a un día de
 * distancia, la misma tarea saldría vencida para unos y no para otros según la
 * hora. A dos, se lee igual desde cualquier sitio.
 */
const MARGEN_ENTRE_HUSOS = 2

/**
 * Lo que alguien ha hecho con la tarea después de crearla —moverla de estado,
 * ponerle fecha— la deja tocada en un momento posterior al último que tenía, y
 * nunca en el futuro.
 */
function tocar(task: Task, faker: Faker) {
  const desde = task.updatedAt ?? task.createdAt
  task.updatedAt = DateTime.fromJSDate(
    faker.date.between({ from: desde.toJSDate(), to: new Date() })
  )
}

function diaEntre(faker: Faker, desde: DateTime, hasta: DateTime): string {
  return toCalendarDay(
    DateTime.fromJSDate(faker.date.between({ from: desde.toJSDate(), to: hasta.toJSDate() }))
  )
}

/**
 * Un día ya pasado para cualquiera del equipo. A ser posible no anterior al
 * día en que se creó la tarea, porque la fecha se pone al abrirla, después de
 * crearla (RF-13); si la tarea es de hace nada, se acepta igual una fecha
 * anterior, que está permitido (FS-118 CA-13).
 */
function diaPasado(task: Task, faker: Faker): string {
  const hasta = DateTime.now().minus({ days: MARGEN_ENTRE_HUSOS }).endOf('day')
  const desde = DateTime.min(task.createdAt.startOf('day'), hasta.startOf('day'))

  return diaEntre(faker, desde, hasta)
}

/**
 * Una tarea del espacio.
 *
 * Sin estados es una tarea **tal como nace**: pendiente, sin fecha y a nombre
 * de quien la crea (RF-5, RF-7, RF-13; E2-3 CA-1 y CA-2; FS-118 CA-1). Cada
 * estado es algo que le ha pasado después y que las reglas permiten. Para el
 * responsable, `with('assignee')` crea una persona nueva y
 * `merge({ assigneeId })` usa una que ya existe.
 *
 * Lo que el esquema deja pasar y esta factory no:
 *
 * - **El estado es uno de los tres.** La columna es texto libre; el dominio
 *   tiene `pending`, `in_progress` y `done` y ninguno más (RF-8, E2-3 CA-3,
 *   E2-4 CA-3).
 * - **El título dice algo.** La columna acepta una cadena vacía o de solo
 *   espacios; el producto no (RF-6, E2-2 CA-1 y CA-2). Se pasa por el mismo
 *   validador que usa la API al crear, y si este lo hubiera guardado distinto
 *   —recortado—, se rechaza: no se guarda nada que la API no guardaría tal
 *   cual (E2-2 CA-3).
 * - **Por defecto, sin fecha.** Que una tarea no tenga fecha es lo normal, no
 *   un dato a medio rellenar (RF-13, alcance fila 9a), y que la mayoría de las
 *   tareas vivas acabe con fecha es la señal de que el riesgo nº 2 se ha
 *   escapado (PRD S-3). La fecha solo llega por un estado.
 * - **Una fecha es un día, no un instante.** Se escribe como texto
 *   `AAAA-MM-DD`, que es como la representa todo el dominio (`Task.isOverdueOn`).
 * - **«Vencida» no se guarda: se deduce.** Fecha anterior a hoy y no hecha
 *   (RF-14). El estado `vencida` construye exactamente eso, y se niega sobre
 *   una tarea hecha, que nunca puede estarlo (FS-118 CA-8 y CA-9).
 * - **Las fechas no se contradicen.** Ninguna tarea es anterior a su
 *   responsable (ver `UserFactory`), ni está tocada antes de crearse, ni
 *   después de ahora; y todo cae dentro de los últimos `DIAS_DE_HISTORIA` días
 *   contados desde hoy.
 */
export const TaskFactory = factory
  .define(Task, ({ faker }) => {
    const desde = inicioDeLaHistoria().plus({ days: 1 })

    return {
      title: faker.helpers.arrayElement(TITULOS),
      status: 'pending' as const,
      dueDate: null,
      createdAt: DateTime.fromJSDate(
        faker.date.between({ from: desde.toJSDate(), to: new Date() })
      ),
    }
  })
  .relation('assignee', () => UserFactory)

  /** Alguien se ha puesto con ella (E2-4). */
  .state('enCurso', (task, { faker }) => {
    task.status = 'in_progress'
    tocar(task, faker)
  })

  /** Terminada: sale de la lista por defecto, pero no se pierde (RF-21). */
  .state('hecha', (task, { faker }) => {
    task.status = 'done'
    tocar(task, faker)
  })

  /** Con una fecha por delante, que nunca vence (FS-118 CA-6). */
  .state('conFecha', (task, { faker }) => {
    const hoy = DateTime.now()
    task.dueDate = diaEntre(
      faker,
      hoy.plus({ days: MARGEN_ENTRE_HUSOS }).startOf('day'),
      hoy.plus({ days: 30 })
    )
    tocar(task, faker)
  })

  /**
   * Vence hoy, que todavía no es estar vencida (FS-118 CA-5). Es el único
   * estado que depende del huso de quien mira: «hoy» es el día del proceso que
   * genera los datos.
   */
  .state('venceHoy', (task, { faker }) => {
    task.dueDate = toCalendarDay(DateTime.now())
    tocar(task, faker)
  })

  /**
   * Con una fecha ya pasada, sea cual sea su estado. Combinado con `hecha` es
   * la tarea terminada fuera de plazo, que no está vencida (FS-118 CA-9).
   */
  .state('conFechaPasada', (task, { faker }) => {
    task.dueDate = diaPasado(task, faker)
    tocar(task, faker)
  })

  /**
   * Vencida: fecha pasada y sin hacer (RF-14). Se aplica **después** del estado
   * de la tarea; sobre una tarea hecha no tiene sentido y se rechaza.
   */
  .state('vencida', (task, { faker }) => {
    if (task.status === 'done') {
      throw new Error(
        'Una tarea hecha nunca está vencida (RF-14). Para una hecha fuera de plazo: hecha + conFechaPasada.'
      )
    }

    task.dueDate = diaPasado(task, faker)
    tocar(task, faker)
  })

  .before('create', async (_, task) => {
    if (!TASK_STATUSES.includes(task.status)) {
      throw new Error(`«${task.status}» no es un estado de tarea (RF-8).`)
    }

    const { title } = await createTaskValidator.validate({ title: task.title })
    if (title !== task.title) {
      throw new Error(`El título «${task.title}» no se guardaría tal cual por la API (RF-6).`)
    }

    // Sin nada que haya pasado después, la última vez que se tocó es al crearla.
    task.updatedAt = task.updatedAt ?? task.createdAt
  })
  .build()
