import factory from '@adonisjs/lucid/factories'
import User from '#models/user'
import { inicioDeLaHistoria } from '#database/factories/historia'
import { DateTime } from 'luxon'

/**
 * El dominio de todos los correos que salen de aquí. `.example` es un dominio
 * de primer nivel reservado (RFC 2606): ningún correo generado puede ser de
 * nadie, ni llegar a ninguna parte.
 */
export const DOMINIO_DE_CORREO = 'flowsync.example'

/**
 * La contraseña con la que entra cualquier persona generada. Cumple el mismo
 * rango de longitud que exige el registro (8 a 32), así que se puede escribir
 * en el formulario de inicio de sesión tal cual.
 */
export const CONTRASENA_DE_DEMOSTRACION = 'flowsync-demo'

/**
 * Nombres y apellidos sueltos, en castellano. Se combinan al azar, así que
 * ninguna persona generada es alguien en concreto.
 */
const NOMBRES = [
  'Lucía',
  'Tomás',
  'Nerea',
  'Iván',
  'Marta',
  'Álvaro',
  'Irene',
  'Sergio',
  'Paula',
  'Diego',
  'Carmen',
  'Rubén',
  'Elena',
  'Hugo',
  'Ainhoa',
  'Jorge',
  'Clara',
  'Pablo',
  'Noelia',
  'Raúl',
]

const APELLIDOS = [
  'Arrieta',
  'Villanueva',
  'Calvo',
  'Sopeña',
  'Quiroga',
  'Ibarra',
  'Montes',
  'Peralta',
  'Lozano',
  'Ferrer',
  'Benítez',
  'Navarro',
  'Cuesta',
  'Escudero',
  'Varela',
  'Ortuño',
  'Salcedo',
  'Rivas',
  'Toledo',
  'Garrido',
]

/**
 * El correo de una persona a partir de su nombre: «Iván Sopeña» da
 * `ivan.sopena`, más el sufijo si lo hay, en `DOMINIO_DE_CORREO`. Sin tildes
 * ni eñes, y en minúsculas: el índice único de `users.email` distingue
 * mayúsculas, y dos correos que solo se diferencian en eso serían dos cuentas
 * para la misma persona.
 */
export function correoDe(fullName: string, sufijo?: string): string {
  const local = fullName
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .join('.')

  return `${sufijo ? `${local}.${sufijo}` : local}@${DOMINIO_DE_CORREO}`
}

/**
 * Una persona registrada en el espacio.
 *
 * Lo que el esquema deja pasar y esta factory no:
 *
 * - **Siempre tiene nombre, y es nombre y apellido.** La columna admite
 *   `null`, pero la lista identifica al responsable por su nombre y nunca por
 *   su correo (E3-1 CA-6), y el registro pide nombre (RF-1). Con dos palabras,
 *   además, las iniciales salen de nombre y apellido.
 * - **El correo es un correo, y es único.** La columna solo pide texto; el
 *   inicio de sesión (RF-2) busca por correo, así que tiene que ser uno que el
 *   registro aceptaría. El sufijo aleatorio evita que dos personas con el mismo
 *   nombre choquen contra el índice único.
 * - **La contraseña se guarda cifrada, nunca en claro.** Aquí se pone en claro
 *   y la cifra el `beforeSave` de `withAuthFinder` al guardar, como en un
 *   registro de verdad. Escribirla directamente en la columna dejaría una
 *   cuenta con la que no se puede entrar (RF-2).
 * - **Se da de alta al principio de la historia.** Toda tarea nace a nombre de
 *   quien la crea (RF-5, RF-7), así que nadie puede tener tareas anteriores a
 *   su propia alta. Las personas entran en el primer medio día de la ventana y
 *   las tareas empiezan después (ver `TaskFactory`).
 */
export const UserFactory = factory
  .define(User, ({ faker }) => {
    const fullName = `${faker.helpers.arrayElement(NOMBRES)} ${faker.helpers.arrayElement(APELLIDOS)}`
    const inicio = inicioDeLaHistoria()

    return {
      fullName,
      email: correoDe(fullName, faker.string.alphanumeric({ length: 5, casing: 'lower' })),
      password: CONTRASENA_DE_DEMOSTRACION,
      createdAt: DateTime.fromJSDate(
        faker.date.between({ from: inicio.toJSDate(), to: inicio.plus({ hours: 12 }).toJSDate() })
      ),
    }
  })
  .before('create', (_, user) => {
    if (!user.fullName?.trim()) {
      throw new Error(
        'Una persona del espacio se identifica por su nombre: no puede quedarse sin él (E3-1 CA-6).'
      )
    }
  })
  .build()
