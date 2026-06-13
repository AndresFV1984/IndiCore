import { roundToInteger } from './coloresPlanchasUtils'

export const parseMedidaNumeric = (value: string | undefined): number => {
  const normalized = (value ?? '').trim().replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

/** (ancho ÷ 100) × (alto ÷ 100) del despiece seleccionado. */
export const computeTerminadoAreaFactor = (ancho: string, alto: string): number => {
  const anchoNum = parseMedidaNumeric(ancho)
  const altoNum = parseMedidaNumeric(alto)
  if (anchoNum <= 0 || altoNum <= 0) return 0
  return (anchoNum / 100) * (altoNum / 100)
}

export const applyTerminadoCostoMinimo = (
  precioCalculado: number,
  costoMinimo: number
): number => {
  const calculado = roundToInteger(Math.max(0, precioCalculado))
  if (costoMinimo <= 0) return calculado
  const minimo = roundToInteger(costoMinimo)
  if (calculado < minimo) return minimo
  return calculado
}

/**
 * Precio = área × valor cm² × tamaños buenos.
 * Si el resultado es menor al costo mínimo del terminado, se usa el costo mínimo.
 */
export const computeTerminadoPrecio = (
  ancho: string,
  alto: string,
  valorCmCuadrado: number,
  tamanosBuenos: number,
  costoMinimo: number
): { areaFactor: number; precioCalculado: number; precioCobro: number } => {
  const areaFactor = computeTerminadoAreaFactor(ancho, alto)
  if (areaFactor <= 0 || valorCmCuadrado <= 0 || tamanosBuenos <= 0) {
    const cobro = applyTerminadoCostoMinimo(0, costoMinimo)
    return { areaFactor, precioCalculado: 0, precioCobro: cobro }
  }

  const bruto = areaFactor * valorCmCuadrado * tamanosBuenos
  const precioCalculado = roundToInteger(bruto)
  const precioCobro = applyTerminadoCostoMinimo(precioCalculado, costoMinimo)
  return { areaFactor, precioCalculado, precioCobro }
}

export const formatTerminadoPrecioCop = (value: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Math.max(0, value))
