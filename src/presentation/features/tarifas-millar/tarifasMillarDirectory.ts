import type { TarifaMillar } from '../../../core/domain/entities/TarifaMillar'
import {
  TARIFA_COLOR_BASICO_NAME,
  TARIFA_PANTONE_NAME,
} from '../production/constants/impresionTarifaMillar'

const DIRECTORY_TARIFA_ORDER = [
  TARIFA_COLOR_BASICO_NAME.trim().toLowerCase(),
  TARIFA_PANTONE_NAME.trim().toLowerCase(),
]

export const isTarifaMillarDirectoryRecord = (item: TarifaMillar): boolean =>
  DIRECTORY_TARIFA_ORDER.includes(item.name.trim().toLowerCase())

export const sortTarifasMillarDirectory = (items: TarifaMillar[]): TarifaMillar[] =>
  [...items].sort((a, b) => {
    const orderA = DIRECTORY_TARIFA_ORDER.indexOf(a.name.trim().toLowerCase())
    const orderB = DIRECTORY_TARIFA_ORDER.indexOf(b.name.trim().toLowerCase())
    return orderA - orderB
  })
