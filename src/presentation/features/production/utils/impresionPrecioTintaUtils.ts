import type {
  ImpresionLadoTintas,
  ImpresionTintasRegistro,
  ImpresionTiroRetiroEntrada,
} from '../../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import { getColoresOptionMeta } from './coloresPlanchasUtils'
import {
  formatImpresionPlanchaSelectLabel,
  isImpresionPantoneInkIndex,
  isValidImpresionTintaIndex,
  normalizeImpresionInkIndex,
} from './impresionTintasUtils'

export interface ImpresionPrecioTintaBreakdown {
  cantidadTintasColorBasico: number
  cantidadTintasPantone: number
  millaresColorBasico: number
  millaresPantone: number
  millaresTotal: number
  colorBasico: number
  pantone: number
  total: number
  millaresVolteo: number
  volteo: number
  grandTotal: number
}

export interface ImpresionTintasResumenLine {
  colorPlanchaId: string
  label: string
  shortLabel: string
  completo: boolean
  precioTintaColorBasico: number
  precioTintaPantone: number
  precioVolteo: number
  totalCobrar: number
}

export interface ImpresionTintasResumenConsolidado {
  registros: ImpresionTintasResumenLine[]
  totales: {
    precioTintaColorBasico: number
    precioTintaPantone: number
    precioVolteo: number
    totalCobrar: number
  }
}

export interface ImpresionEntradaRegistroResumen {
  cantidadTintasColorBasico: number
  cantidadTintasPantone: number
  millaresColorBasico: number
  millaresPantone: number
  precioTintaColorBasico: number
  precioTintaPantone: number
  precioTintaTotal: number
  millaresVolteo: number
  precioVolteo: number
  grandTotal: number
}

const countDistinctPantoneInLado = (lado: ImpresionLadoTintas): number => {
  const pantones = new Set<number>()
  for (const ink of lado.tintas.slice(0, lado.cantidad)) {
    const normalized = normalizeImpresionInkIndex(ink)
    if (!isValidImpresionTintaIndex(normalized)) continue
    if (isImpresionPantoneInkIndex(normalized)) pantones.add(normalized)
  }
  return pantones.size
}

const countDistinctNonPantoneInLado = (lado: ImpresionLadoTintas): number => {
  const inks = new Set<number>()
  for (const ink of lado.tintas.slice(0, lado.cantidad)) {
    const normalized = normalizeImpresionInkIndex(ink)
    if (!isValidImpresionTintaIndex(normalized)) continue
    if (!isImpresionPantoneInkIndex(normalized)) inks.add(normalized)
  }
  return inks.size
}

/** Colores distintos NO-Pantone (primarios/secundarios) en tiro + en retiro. */
export const sumDistinctNonPantoneColorsBySide = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): number => countDistinctNonPantoneInLado(tiro) + countDistinctNonPantoneInLado(retiro)

/** Pantones distintos asignados en tiro + Pantones distintos asignados en retiro. */
export const sumDistinctPantoneColorsBySide = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): number => countDistinctPantoneInLado(tiro) + countDistinctPantoneInLado(retiro)

/** Millares = (tiro + retiro) × Tamaños buenos ÷ 1.000, con mínimo 1 si aplica. */
export const computeImpresionMillaresFactor = (
  tiroRetiroCount: number,
  tamanosBuenos: number
): number => {
  if (tiroRetiroCount <= 0 || tamanosBuenos <= 0) return 0
  const factorBase = tiroRetiroCount * (tamanosBuenos / 1000)
  return Math.max(1, factorBase)
}

export const formatMillaresFactor = (value: number): string =>
  value > 0
    ? new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(value)
    : '—'

const computeGrupoMillares = (
  count: number,
  tamanosBuenos: number,
  precioMillar: number
): { millares: number; precio: number } => {
  const millares = computeImpresionMillaresFactor(count, tamanosBuenos)
  if (millares <= 0 || precioMillar <= 0) return { millares: 0, precio: 0 }
  return { millares, precio: Math.round(millares * precioMillar) }
}

/**
 * Calcular millares al registrar un tiro/retiro (desglosado):
 * - (Tiro + retiro) × Tamaños buenos ÷ 1.000 × Precio Color básico
 * - (Tiro + retiro) × Tamaños buenos ÷ 1.000 × Precio Pantone
 *
 * Si el factor de cada grupo da menos de 1, se cobra mínimo 1 millar por grupo.
 */
const computeVolteoFromMillares = (
  millaresTiroRetiro: number,
  precioVolteoMillar: number
): { millaresVolteo: number; volteo: number } => {
  if (millaresTiroRetiro <= 0 || precioVolteoMillar <= 0) {
    return { millaresVolteo: 0, volteo: 0 }
  }
  return {
    millaresVolteo: millaresTiroRetiro,
    volteo: Math.round(millaresTiroRetiro * precioVolteoMillar),
  }
}

export const computeImpresionPrecioTintaBreakdown = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  tamanosBuenos: number,
  precioColorBasicoMillar: number,
  precioPantoneMillar: number,
  precioVolteoMillar = 0
): ImpresionPrecioTintaBreakdown => {
  const cantidadTintasColorBasico = sumDistinctNonPantoneColorsBySide(tiro, retiro)
  const cantidadTintasPantone = sumDistinctPantoneColorsBySide(tiro, retiro)
  const colorBasicoGrupo = computeGrupoMillares(
    cantidadTintasColorBasico,
    tamanosBuenos,
    precioColorBasicoMillar
  )
  const pantoneGrupo = computeGrupoMillares(
    cantidadTintasPantone,
    tamanosBuenos,
    precioPantoneMillar
  )
  const millaresTotal = colorBasicoGrupo.millares + pantoneGrupo.millares
  const total = colorBasicoGrupo.precio + pantoneGrupo.precio
  const volteoGrupo = computeVolteoFromMillares(millaresTotal, precioVolteoMillar)

  return {
    cantidadTintasColorBasico,
    cantidadTintasPantone,
    millaresColorBasico: colorBasicoGrupo.millares,
    millaresPantone: pantoneGrupo.millares,
    millaresTotal,
    colorBasico: colorBasicoGrupo.precio,
    pantone: pantoneGrupo.precio,
    total,
    millaresVolteo: volteoGrupo.millaresVolteo,
    volteo: volteoGrupo.volteo,
    grandTotal: total + volteoGrupo.volteo,
  }
}

export const resolveEntradaRegistroResumen = (
  entrada: ImpresionTiroRetiroEntrada
): ImpresionEntradaRegistroResumen => {
  const cantidadTintasColorBasico =
    typeof entrada.cantidadTintasColorBasico === 'number' && entrada.cantidadTintasColorBasico >= 0
      ? entrada.cantidadTintasColorBasico
      : sumDistinctNonPantoneColorsBySide(entrada.tiro, entrada.retiro)
  const cantidadTintasPantone =
    typeof entrada.cantidadTintasPantone === 'number' && entrada.cantidadTintasPantone >= 0
      ? entrada.cantidadTintasPantone
      : sumDistinctPantoneColorsBySide(entrada.tiro, entrada.retiro)

  const precioTintaTotal = entrada.precioTinta ?? 0
  const precioVolteo = entrada.precioVolteo ?? 0

  return {
    cantidadTintasColorBasico,
    cantidadTintasPantone,
    millaresColorBasico: entrada.millaresColorBasico ?? 0,
    millaresPantone: entrada.millaresPantone ?? 0,
    precioTintaColorBasico: entrada.precioTintaColorBasico ?? 0,
    precioTintaPantone: entrada.precioTintaPantone ?? 0,
    precioTintaTotal,
    millaresVolteo: entrada.millaresVolteo ?? 0,
    precioVolteo,
    grandTotal: precioTintaTotal + precioVolteo,
  }
}

export const buildImpresionTintasResumenConsolidado = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  registros: ImpresionTintasRegistro[] = []
): ImpresionTintasResumenConsolidado => {
  const byId = new Map(registros.map(registro => [registro.colorPlanchaId, registro]))

  const lines = coloresPlanchas.map(plancha => {
    const entrada = byId.get(plancha.id)?.entradas[0]
    const resumen = entrada ? resolveEntradaRegistroResumen(entrada) : null
    const meta = getColoresOptionMeta(plancha.colores)

    return {
      colorPlanchaId: plancha.id,
      label: formatImpresionPlanchaSelectLabel(plancha),
      shortLabel: meta.shortLabel,
      completo: Boolean(entrada),
      precioTintaColorBasico: resumen?.precioTintaColorBasico ?? 0,
      precioTintaPantone: resumen?.precioTintaPantone ?? 0,
      precioVolteo: resumen?.precioVolteo ?? 0,
      totalCobrar: resumen?.grandTotal ?? 0,
    }
  })

  const totales = lines.reduce(
    (acc, line) => ({
      precioTintaColorBasico: acc.precioTintaColorBasico + line.precioTintaColorBasico,
      precioTintaPantone: acc.precioTintaPantone + line.precioTintaPantone,
      precioVolteo: acc.precioVolteo + line.precioVolteo,
      totalCobrar: acc.totalCobrar + line.totalCobrar,
    }),
    {
      precioTintaColorBasico: 0,
      precioTintaPantone: 0,
      precioVolteo: 0,
      totalCobrar: 0,
    }
  )

  return { registros: lines, totales }
}

export const computeImpresionPrecioTinta = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  tamanosBuenos: number,
  precioColorBasicoMillar: number,
  precioPantoneMillar: number
): number =>
  computeImpresionPrecioTintaBreakdown(
    tiro,
    retiro,
    tamanosBuenos,
    precioColorBasicoMillar,
    precioPantoneMillar
  ).total
