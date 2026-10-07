import { DateTime } from 'luxon'

/**
 * Cuántos días hacia atrás llegan los datos generados.
 */
export const DIAS_DE_HISTORIA = 90

/**
 * Dónde empieza la historia de los datos generados: hace `DIAS_DE_HISTORIA`
 * días contando desde **ahora**, el momento de generarlos, y nunca desde una
 * fecha fija. Con una fecha fija los datos envejecen solos, y cualquier cosa
 * que cuente «este mes» acabaría sin nada que contar.
 */
export function inicioDeLaHistoria(): DateTime {
  return DateTime.now().minus({ days: DIAS_DE_HISTORIA })
}
