import type { PaperRow } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import type { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import {
  formatUnidadEmpaqueDisplay,
  normalizeUnidadEmpaque,
} from '../../../../core/domain/value-objects/UnidadEmpaque'
import { deriveCantidadHojas, roundToInteger } from './coloresPlanchasUtils'

export const DEFAULT_MARGEN_REDONDEO = 2

export const normalizeMargenRedondeo = (value: number | undefined): number => {
  if (value == null || !Number.isFinite(value)) return DEFAULT_MARGEN_REDONDEO
  return Math.max(0, Math.round(value))
}

export const parseMargenRedondeoInput = (raw: string): number => {
  const trimmed = raw.trim()
  if (trimmed === '') return DEFAULT_MARGEN_REDONDEO
  const n = Math.round(Number(trimmed))
  if (!Number.isFinite(n) || n < 0) return DEFAULT_MARGEN_REDONDEO
  return n
}

/** @deprecated Preferir `normalizeUnidadEmpaque`. Compatibilidad con texto legado. */
export const parseUnidadEmpaqueCantidad = (unidadEmpaque: string): number =>
  normalizeUnidadEmpaque(unidadEmpaque)

export const resolveUnidadEmpaqueCantidad = normalizeUnidadEmpaque

/** Primera cifra decimal del cociente (1,3 → 3; 1,1 → 1). */
export const cocientePrimeraDecima = (cociente: number): number => {
  const parteDecimal = cociente - Math.floor(cociente)
  return Math.floor(parteDecimal * 10 + 1e-9)
}

/** Parte decimal en centésimas (0,028 → 2,8). Solo para cocientes menores a 1. */
export const cocienteCentesimas = (cociente: number): number => {
  const parteDecimal = cociente - Math.floor(cociente)
  return Math.round(parteDecimal * 10000) / 100
}

/**
 * Cociente Cantidad hojas ÷ Unidad empaque con margen de redondeo:
 * - Cociente ≥ 1: si la primera cifra decimal es mayor al margen → sube al entero siguiente (1,3 → 2);
 *   si es igual o menor → conserva el cociente (1,1 → 1,1).
 * - Cociente &lt; 1: si las centésimas superan el margen → sube a 1 (p. ej. 14÷500).
 */
export const applyMargenRedondeoToHojasPorEmpaque = (
  cantidadHojas: number,
  unidadEmpaqueCantidad: number,
  margenRedondeo: number
): number => {
  if (cantidadHojas <= 0 || unidadEmpaqueCantidad <= 0) return 0
  const cociente = cantidadHojas / unidadEmpaqueCantidad
  if (!Number.isFinite(cociente)) return 0

  const margen = normalizeMargenRedondeo(margenRedondeo)
  const superaMargen =
    cociente >= 1
      ? cocientePrimeraDecima(cociente) > margen
      : cocienteCentesimas(cociente) > margen

  if (superaMargen) {
    return cociente < 1 ? Math.ceil(cociente) : Math.ceil(cociente)
  }
  return cociente
}

/** Valor papel = Cantidad hojas × Valor hoja del tipo de papel. */
export const deriveValorPapel = (cantidadHojas: number, valorHoja: number): number => {
  if (cantidadHojas <= 0 || valorHoja <= 0) return 0
  return roundToInteger(cantidadHojas * valorHoja)
}

/** Si el total calculado es menor al valor corte del catálogo, se usa el valor del catálogo. */
export const applyMinimoValorCorteCatalogo = (
  valorCorteCalculado: number,
  valorCorteCatalogo: number
): number => {
  if (valorCorteCatalogo <= 0) return Math.max(0, valorCorteCalculado)
  if (valorCorteCalculado < valorCorteCatalogo) return valorCorteCatalogo
  return valorCorteCalculado
}

/**
 * Valor corte total = (Cantidad hojas ÷ Unidad empaque, con margen) × Valor corte unitario.
 * El producto se redondea al entero más cercano y no puede ser menor al valor corte del catálogo.
 */
export const deriveValorCorteFromCantidades = (
  cantidadHojas: number,
  unidadEmpaqueCantidad: number,
  valorCorteUnitario: number,
  margenRedondeo = DEFAULT_MARGEN_REDONDEO
): number => {
  if (cantidadHojas <= 0 || unidadEmpaqueCantidad <= 0 || valorCorteUnitario <= 0) {
    return 0
  }
  const cociente = applyMargenRedondeoToHojasPorEmpaque(
    cantidadHojas,
    unidadEmpaqueCantidad,
    margenRedondeo
  )
  const calculado = roundToInteger(cociente * valorCorteUnitario)
  return applyMinimoValorCorteCatalogo(calculado, valorCorteUnitario)
}

export const deriveValorCorte = (
  cantidadHojas: number,
  unidadEmpaque: number,
  valorCorteUnitario: number,
  margenRedondeo = DEFAULT_MARGEN_REDONDEO
): number =>
  deriveValorCorteFromCantidades(
    cantidadHojas,
    normalizeUnidadEmpaque(unidadEmpaque),
    valorCorteUnitario,
    margenRedondeo
  )

export interface CortePapelValoresInput {
  coloresPlanchas: DisenoColorPlanchaItem[]
  row: PaperRow
  tipoPapel?: TipoPapel | null
  margenRedondeo?: number
}

export interface CortePapelValores {
  cantidadHojas: number
  margenRedondeo: number
  unidadEmpaqueLabel: string
  unidadEmpaqueCantidad: number
  cocienteHojasPorEmpaque: number
  valorCorteUnitario: number
  valorCorte: number
  valorHoja: number
  valorPapel: number
}

/** Métricas de corte de papel a partir de preprensa y selección en Datos del corte de papel. */
export const computeCortePapelValores = ({
  coloresPlanchas,
  row,
  tipoPapel = null,
  margenRedondeo,
}: CortePapelValoresInput): CortePapelValores => {
  const margen = normalizeMargenRedondeo(margenRedondeo)
  const cantidadHojas = deriveCantidadHojas(
    coloresPlanchas,
    row.despiece?.piezasPorPliego ?? 0
  )
  const unidadEmpaqueCantidad =
    resolveUnidadEmpaqueCantidad(row.unidadEmpaque) ||
    resolveUnidadEmpaqueCantidad(tipoPapel?.unidadEmpaque)
  const unidadEmpaqueLabel = formatUnidadEmpaqueDisplay(unidadEmpaqueCantidad)
  const despieceCatalogo =
    tipoPapel && row.despiece?.despieceId
      ? tipoPapel.despiecesPliego.find(d => d.despieceId === row.despiece!.despieceId)
      : undefined
  const valorCorteUnitario =
    row.valorCorteUnitario ??
    despieceCatalogo?.valorCorte ??
    row.despiece?.valorCorte ??
    0
  const valorHoja = row.valorHoja ?? tipoPapel?.valorHoja ?? 0
  const cocienteHojasPorEmpaque = applyMargenRedondeoToHojasPorEmpaque(
    cantidadHojas,
    unidadEmpaqueCantidad,
    margen
  )
  const valorCorte = deriveValorCorteFromCantidades(
    cantidadHojas,
    unidadEmpaqueCantidad,
    valorCorteUnitario,
    margen
  )
  const valorPapel = deriveValorPapel(cantidadHojas, valorHoja)
  return {
    cantidadHojas,
    margenRedondeo: margen,
    unidadEmpaqueLabel,
    unidadEmpaqueCantidad,
    cocienteHojasPorEmpaque,
    valorCorteUnitario,
    valorCorte,
    valorHoja,
    valorPapel,
  }
}
