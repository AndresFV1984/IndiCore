import type { ImpresionTipoBifronte } from '../../../../core/domain/entities/Order'
import {
  DEFAULT_MILLAR_MINIMO_VENTA,
  DEFAULT_TOPE_MINIMO_MILLAR,
  DEFAULT_UMBRAL_DECIMAL_MILLAR,
  TARIFA_MILLAR_UNIDAD,
  type TarifaMillar,
  type TarifaMillarPricing,
} from '../../../../core/domain/entities/TarifaMillar'

export const TARIFA_COLOR_BASICO_NAME = 'Color básico'

export const TARIFA_PANTONE_NAME = 'Pantone'

export const TARIFA_MILLAR_VOLTEO_CATALOG_NAMES = [
  'Volteo por pinza',
  'Volteo por escuadra',
  'Volteo de pinza',
  'Volteo de escuadra',
] as const

export const IMPRESION_VOLTEO_PRECIO_COLOR_BASICO_MILLAR = 20_000

export const IMPRESION_VOLTEO_PRECIO_PANTONE_MILLAR = 70_000

export const IMPRESION_VOLTEO_MILLAR_RULES: TarifaMillarPricing = {
  precio: 0,
  millarMinimoVenta: DEFAULT_MILLAR_MINIMO_VENTA,
  topeMinimoMillar: DEFAULT_TOPE_MINIMO_MILLAR,
  umbralDecimalMillar: DEFAULT_UMBRAL_DECIMAL_MILLAR,
}

export const isLegacyVolteoTarifaMillarRecord = (item: {
  name: string
  categoria?: string
}): boolean => {
  const normalizedName = item.name.trim().toLowerCase()
  return (
    item.categoria === 'Volteos' ||
    TARIFA_MILLAR_VOLTEO_CATALOG_NAMES.some(
      name => name.toLowerCase() === normalizedName
    )
  )
}

export const resolveVolteoPrecioMillarPorGrupoColor = (tarifaName: string): number | null => {
  const normalized = tarifaName.trim().toLowerCase()
  if (normalized === TARIFA_COLOR_BASICO_NAME.trim().toLowerCase()) {
    return IMPRESION_VOLTEO_PRECIO_COLOR_BASICO_MILLAR
  }
  if (normalized === TARIFA_PANTONE_NAME.trim().toLowerCase()) {
    return IMPRESION_VOLTEO_PRECIO_PANTONE_MILLAR
  }
  return null
}

export const resolveTarifaMillarPrecioVolteoPinza = (
  item: Pick<TarifaMillar, 'name' | 'precioVolteoPinza'> | null | undefined
): number | null => {
  if (!item) return null
  if (item.precioVolteoPinza > 0) return item.precioVolteoPinza
  return resolveVolteoPrecioMillarPorGrupoColor(item.name)
}

export const resolveTarifaMillarPrecioVolteoEscuadra = (
  item: Pick<TarifaMillar, 'name' | 'precioVolteoEscuadra'> | null | undefined
): number | null => {
  if (!item) return null
  if (item.precioVolteoEscuadra > 0) return item.precioVolteoEscuadra
  return resolveVolteoPrecioMillarPorGrupoColor(item.name)
}

export const resolveTarifaMillarPrecioVolteoPorTipo = (
  item: Pick<TarifaMillar, 'name' | 'precioVolteoPinza' | 'precioVolteoEscuadra'> | null | undefined,
  tipoBifronte: ImpresionTipoBifronte | ''
): number => {
  if (!item) return 0
  if (tipoBifronte === 'volteo-escuadra') {
    return resolveTarifaMillarPrecioVolteoEscuadra(item) ?? 0
  }
  if (tipoBifronte === 'volteo-pinza') {
    return resolveTarifaMillarPrecioVolteoPinza(item) ?? 0
  }
  return 0
}

/** Precio con volteo por defecto (pinza) para reglas de referencia sin volteo activo. */
export const resolveTarifaMillarPrecioConVolteoDefault = (
  item: Pick<TarifaMillar, 'name' | 'precioVolteoPinza' | 'precioVolteoEscuadra'> | null | undefined
): number => {
  if (!item) return 0
  return resolveTarifaMillarPrecioVolteoPinza(item) ?? 0
}
