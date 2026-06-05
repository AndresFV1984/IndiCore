import type { ImpresionTipoBifronte } from '../../../../core/domain/entities/Order'
import type { TarifaMillar } from '../../../../core/domain/entities/TarifaMillar'
import {
  IMPRESION_VOLTEO_TARIFA_NAME,
  isImpresionConVolteo,
} from '../constants/impresionTipoBifronte'

export interface ImpresionTintasRegistroVolteoPatch {
  tarifaVolteoMillarId: string
  precioVolteoMillar: number
}

export const resolveTarifaVolteoMillar = (
  tarifas: TarifaMillar[],
  tipoBifronte: ImpresionTipoBifronte | ''
): TarifaMillar | null => {
  if (!isImpresionConVolteo(tipoBifronte)) return null
  const expectedName = IMPRESION_VOLTEO_TARIFA_NAME[tipoBifronte]
  const normalized = expectedName.trim().toLowerCase()
  return (
    tarifas.find(
      item => item.state && item.name.trim().toLowerCase() === normalized
    ) ?? null
  )
}

export const resolvePrecioVolteoMillarPatch = (
  tarifas: TarifaMillar[],
  tipoBifronte: ImpresionTipoBifronte | ''
): ImpresionTintasRegistroVolteoPatch => {
  const tarifa = resolveTarifaVolteoMillar(tarifas, tipoBifronte)
  if (!tarifa) {
    return { tarifaVolteoMillarId: '', precioVolteoMillar: 0 }
  }
  return {
    tarifaVolteoMillarId: tarifa.id,
    precioVolteoMillar: tarifa.precio,
  }
}

const formatCop = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

export const formatPrecioMillar = (precio: number) => formatCop(precio)

export const formatUnidadMillar = (unidadMedida: number) =>
  new Intl.NumberFormat('es-CO').format(unidadMedida)
