import {
  DEFAULT_UMBRAL_DECIMAL_MILLAR,
  TARIFA_MILLAR_UNIDAD,
  type TarifaMillarPricing,
} from '../../../../core/domain/entities/TarifaMillar'
import { TAMANOS_BUENOS_REFERENCIA_PRECIO_VOLTEO_COLOR_BASICO } from './coloresPlanchasUtils'

export interface TarifaMillarCobro {
  millares: number
  precio: number
}

const DECIMAL_EPSILON = 1e-9

export const getMillarParteDecimal = (millares: number): number => {
  if (millares <= 0) return 0
  return millares - Math.floor(millares)
}

/**
 * Regla de decimales para millares:
 * - Parte decimal > umbral: entero siguiente más cercano (ceil).
 * - Parte decimal ≤ umbral: solo la parte entera (sin decimales).
 */
export const applyMillarDecimalRounding = (
  millares: number,
  umbralDecimal = DEFAULT_UMBRAL_DECIMAL_MILLAR
): number => {
  if (millares <= 0) return 0

  const entero = Math.floor(millares)
  const decimal = getMillarParteDecimal(millares)

  if (decimal <= DECIMAL_EPSILON) return entero
  if (decimal > umbralDecimal + DECIMAL_EPSILON) return Math.ceil(millares)
  return entero
}

export const computeMillaresCalculados = (
  tiroRetiroCount: number,
  tamanosBuenos: number
): number => {
  if (tiroRetiroCount <= 0 || tamanosBuenos <= 0) return 0
  return tiroRetiroCount * (tamanosBuenos / 1000)
}

export const resolveMillaresParaCobro = (
  millaresCalculados: number,
  millarMinimoVenta: number,
  umbralDecimalMillar = DEFAULT_UMBRAL_DECIMAL_MILLAR,
  topeMinimoMillar = 0
): number => {
  const topeReferencia = applyTopeMinimoMillar(
    millaresCalculados,
    topeMinimoMillar,
    millarMinimoVenta
  )
  if (topeReferencia != null) return topeReferencia

  const millaresRedondeados = applyMillarDecimalRounding(
    millaresCalculados,
    umbralDecimalMillar
  )
  return millaresRedondeados <= 0 ? 0 : millaresRedondeados
}

/** Millares a cobrar = max(millares ajustados por decimales, millar mínimo venta ÷ 1.000). */
export const applyMillarMinimoVenta = (
  millaresCalculados: number,
  millarMinimoVenta: number
): number => {
  if (millarMinimoVenta <= 0) {
    return millaresCalculados <= 0 ? 0 : millaresCalculados
  }
  const millarMinimoEnMillares = millarMinimoVenta / TARIFA_MILLAR_UNIDAD
  if (millaresCalculados <= 0) return millarMinimoEnMillares
  return Math.max(millaresCalculados, millarMinimoEnMillares)
}

/**
 * Si los millares calculados quedan por debajo del tope mínimo (÷ 1.000),
 * el valor de referencia/cobro es millar mínimo venta ÷ 1.000.
 */
export const applyTopeMinimoMillar = (
  millaresCalculados: number,
  topeMinimoMillar: number,
  millarMinimoVenta = 0
): number | null => {
  if (topeMinimoMillar <= 0 || millarMinimoVenta <= 0) return null

  const topeEnMillares = topeMinimoMillar / TARIFA_MILLAR_UNIDAD
  const millarMinimoEnMillares = millarMinimoVenta / TARIFA_MILLAR_UNIDAD

  if (millaresCalculados < topeEnMillares - DECIMAL_EPSILON) {
    return millarMinimoEnMillares
  }

  return null
}

export interface ValorImpresionPorMillaresReferenciaInput {
  millaresReferencia: number
  precioInicial: number
  precioPorMillar: number
  conVolteo: boolean
  topeMinimoMillar: number
}

export const shouldUsarPrecioConVolteoColorBasico = (
  tamanosBuenosReferencia: number | null | undefined
): boolean =>
  tamanosBuenosReferencia === TAMANOS_BUENOS_REFERENCIA_PRECIO_VOLTEO_COLOR_BASICO

/** Precio impresión Color básico según tamaños buenos referencia (500 → con volteo). */
export const computeValorImpresionColorBasicoPorReferencia = ({
  millaresReferencia,
  tamanosBuenosReferencia,
  precioConVolteo,
  precioSinVolteo,
}: {
  millaresReferencia: number
  tamanosBuenosReferencia: number | null | undefined
  precioConVolteo: number
  precioSinVolteo: number
}): number => {
  if (millaresReferencia <= 0) return 0
  const precioUnitario = shouldUsarPrecioConVolteoColorBasico(tamanosBuenosReferencia)
    ? precioConVolteo
    : precioSinVolteo
  if (precioUnitario <= 0) return 0
  return Math.round(millaresReferencia * precioUnitario)
}

/** Valor impresión = millares referencia × precio con/sin volteo según tope mínimo. */
export const computeValorImpresionPorMillaresReferencia = ({
  millaresReferencia,
  precioInicial,
  precioPorMillar,
  conVolteo,
  topeMinimoMillar,
}: ValorImpresionPorMillaresReferenciaInput): number => {
  if (millaresReferencia <= 0) return 0

  if (!conVolteo) {
    if (precioPorMillar <= 0) return 0
    return Math.round(millaresReferencia * precioPorMillar)
  }

  const topeEnMillares =
    topeMinimoMillar > 0 ? topeMinimoMillar / TARIFA_MILLAR_UNIDAD : 0
  if (
    topeEnMillares > 0 &&
    millaresReferencia >= topeEnMillares - DECIMAL_EPSILON
  ) {
    if (precioInicial <= 0) return 0
    return Math.round(millaresReferencia * precioInicial)
  }

  if (precioPorMillar <= 0) return 0
  return Math.round(millaresReferencia * precioPorMillar)
}

export const computeTarifaMillarCobro = (
  millaresCalculados: number,
  pricing: TarifaMillarPricing
): TarifaMillarCobro => {
  const { millarMinimoVenta, precio, topeMinimoMillar, umbralDecimalMillar } = pricing
  const millares = resolveMillaresParaCobro(
    millaresCalculados,
    millarMinimoVenta,
    umbralDecimalMillar,
    topeMinimoMillar
  )
  if (millares <= 0 || precio <= 0) return { millares: 0, precio: 0 }

  return { millares, precio: Math.round(millares * precio) }
}
