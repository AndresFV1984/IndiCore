import type {
  ImpresionLadoTintas,
  ImpresionTintasRegistro,
  ImpresionTiroRetiroEntrada,
} from '../../../../core/domain/entities/Order'
import type { TarifaMillarPricing } from '../../../../core/domain/entities/TarifaMillar'
import { TARIFA_MILLAR_UNIDAD } from '../../../../core/domain/entities/TarifaMillar'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import { getColoresOptionMeta } from './coloresPlanchasUtils'
import {
  formatImpresionPlanchaSelectLabel,
  isImpresionPantoneInkIndex,
  isValidImpresionTintaIndex,
  normalizeImpresionInkIndex,
} from './impresionTintasUtils'
import { isImpresionConVolteo, normalizeImpresionTipoBifronte } from '../constants/impresionTipoBifronte'
import {
  computeMillaresCalculados,
  computeValorImpresionPorMillaresReferencia,
  computeValorImpresionColorBasicoPorReferencia,
  computeValorImpresionColorBasicoConVolteoPorReferencia,
  computeValorImpresionPantonePorReferencia,
  computeValorImpresionPantoneConVolteoPorReferencia,
  resolveMillaresParaCobro,
} from './tarifaMillarPricingUtils'

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
  millaresVolteoColorBasico: number
  volteoColorBasico: number
  millaresVolteoPantone: number
  volteoPantone: number
  grandTotal: number
}

export type ImpresionGrupoMillaresAjuste = 'ninguno' | 'minimoPorTope' | 'millarUno'

export type ImpresionTamanosBuenosMillaresFuente = 'referencia' | 'tamanosBuenos'

export interface ImpresionGrupoMillaresPreview {
  variant: 'colorBasico' | 'pantone'
  cantidadTintas: number
  tintasTiro: number
  tintasRetiro: number
  tamanosBuenos: number
  tamanosBuenosFuente: ImpresionTamanosBuenosMillaresFuente
  millaresBase: number
  millaresCalculados: number
  ajuste: ImpresionGrupoMillaresAjuste
  millarMinimoVentaAplicado?: number
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

export type ImpresionTintasResumenVolteoEstado = 'con' | 'sin' | 'mixto' | null

export interface ImpresionTintasResumenConsolidado {
  registros: ImpresionTintasResumenLine[]
  totales: {
    precioTintaColorBasico: number
    precioTintaPantone: number
    precioVolteo: number
    totalCobrar: number
    volteoColorBasico: ImpresionTintasResumenVolteoEstado
    volteoPantone: ImpresionTintasResumenVolteoEstado
  }
}

export const resolveRegistroConVolteoColorBasico = (registro: ImpresionTintasRegistro): boolean => {
  const tipo =
    normalizeImpresionTipoBifronte(registro.tipoBifronteColorBasico) ||
    normalizeImpresionTipoBifronte(registro.tipoBifronte)
  return isImpresionConVolteo(tipo)
}

export const resolveRegistroConVolteoPantone = (registro: ImpresionTintasRegistro): boolean => {
  const tipo =
    normalizeImpresionTipoBifronte(registro.tipoBifrontePantone) ||
    normalizeImpresionTipoBifronte(registro.tipoBifronte)
  return isImpresionConVolteo(tipo)
}

const resolveVolteoEstadoConsolidado = (
  registros: ImpresionTintasRegistro[],
  variant: 'colorBasico' | 'pantone'
): ImpresionTintasResumenVolteoEstado => {
  const conVolteo =
    variant === 'colorBasico' ? resolveRegistroConVolteoColorBasico : resolveRegistroConVolteoPantone
  const aplicaAEntrada = (registro: ImpresionTintasRegistro): boolean => {
    const entrada = registro.entradas[0]
    if (!entrada) return false
    const resumen = resolveEntradaRegistroResumen(entrada)
    return variant === 'colorBasico'
      ? resumen.cantidadTintasColorBasico > 0 || resumen.precioTintaColorBasico > 0
      : resumen.cantidadTintasPantone > 0 || resumen.precioTintaPantone > 0
  }

  const contribuyentes = registros.filter(aplicaAEntrada)
  if (contribuyentes.length === 0) return null

  const conVolteoCount = contribuyentes.filter(conVolteo).length
  if (conVolteoCount === 0) return 'sin'
  if (conVolteoCount === contribuyentes.length) return 'con'
  return 'mixto'
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

export const countDistinctPantoneInLado = (lado: ImpresionLadoTintas): number => {
  const pantones = new Set<number>()
  for (const ink of lado.tintas.slice(0, lado.cantidad)) {
    const normalized = normalizeImpresionInkIndex(ink)
    if (!isValidImpresionTintaIndex(normalized)) continue
    if (isImpresionPantoneInkIndex(normalized)) pantones.add(normalized)
  }
  return pantones.size
}

/** Cuenta cada ranura Pantone seleccionada (tiro/retiro pueden repetir el mismo índice). */
export const countPantoneTintasInLado = (lado: ImpresionLadoTintas): number => {
  let count = 0
  for (const ink of lado.tintas.slice(0, lado.cantidad)) {
    const normalized = normalizeImpresionInkIndex(ink)
    if (!isValidImpresionTintaIndex(normalized)) continue
    if (isImpresionPantoneInkIndex(normalized)) count += 1
  }
  return count
}

export const countDistinctNonPantoneInLado = (lado: ImpresionLadoTintas): number => {
  const inks = new Set<number>()
  for (const ink of lado.tintas.slice(0, lado.cantidad)) {
    const normalized = normalizeImpresionInkIndex(ink)
    if (!isValidImpresionTintaIndex(normalized)) continue
    if (!isImpresionPantoneInkIndex(normalized)) inks.add(normalized)
  }
  return inks.size
}

export const sumDistinctNonPantoneColorsBySide = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): number => countDistinctNonPantoneInLado(tiro) + countDistinctNonPantoneInLado(retiro)

export const sumDistinctPantoneColorsBySide = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): number => countDistinctPantoneInLado(tiro) + countDistinctPantoneInLado(retiro)

export const sumPantoneTintasBySide = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): number => countPantoneTintasInLado(tiro) + countPantoneTintasInLado(retiro)

export const formatMillaresFactor = (value: number): string =>
  value > 0
    ? new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(value)
    : '—'

export interface ValorImpresionFormulaCopy {
  millaresReferencia: string
  precioImpresion: string
  operacion: string
  tarifaConVolteo: string
  tarifaSinVolteo: string
  motivoRef500: string
  motivoRef1000: string
  motivoVolteoBajoTope: string
  motivoVolteoSobreTope: string
}

export interface ValorImpresionFormulaPriceLabels {
  precioConVolteo: string
  precioSinVolteo: string
}

export interface ValorImpresionFormulaStep {
  stepRule: string
  stepCalc: string
}

export interface BuildValorImpresionFormulaStepsInput {
  variant: 'colorBasico' | 'pantone'
  conVolteo: boolean
  usaPrecioConVolteoColorBasico: boolean
  usaPrecioConVolteoPantone: boolean
  usaPrecioInicial: boolean
  millaresCalculados: number
  precioUnitario: number
  valorImpresion: number
  copy: ValorImpresionFormulaCopy
  priceLabels: ValorImpresionFormulaPriceLabels
  formatMillares?: (value: number) => string
  formatPrecio?: (value: number) => string
}

export const resolveValorImpresionPrecioUnitarioLabel = ({
  variant,
  conVolteo,
  usaPrecioConVolteoColorBasico,
  usaPrecioConVolteoPantone,
  usaPrecioInicial,
  priceLabels,
}: Pick<
  BuildValorImpresionFormulaStepsInput,
  | 'variant'
  | 'conVolteo'
  | 'usaPrecioConVolteoColorBasico'
  | 'usaPrecioConVolteoPantone'
  | 'usaPrecioInicial'
  | 'priceLabels'
>): string => {
  if (variant === 'colorBasico') {
    if (conVolteo) {
      return usaPrecioInicial ? priceLabels.precioSinVolteo : priceLabels.precioConVolteo
    }
    return usaPrecioConVolteoColorBasico
      ? priceLabels.precioConVolteo
      : priceLabels.precioSinVolteo
  }
  if (!conVolteo) {
    return usaPrecioConVolteoPantone
      ? priceLabels.precioConVolteo
      : priceLabels.precioSinVolteo
  }
  return usaPrecioInicial ? priceLabels.precioSinVolteo : priceLabels.precioConVolteo
}

export interface ResolveValorImpresionPrecioUnitarioInput {
  variant: 'colorBasico' | 'pantone'
  conVolteo: boolean
  usaPrecioConVolteoColorBasico: boolean
  usaPrecioConVolteoPantone: boolean
  millaresCalculados: number
  topeMinimoMillarActivo: number
  precioInicial: number
  precioPorMillar: number
  precioConVolteoMillar: number
}

/** Precio unitario efectivo para fórmula y cobro según volteo, referencia y tope. */
export const resolveValorImpresionPrecioUnitario = ({
  variant,
  conVolteo,
  usaPrecioConVolteoColorBasico,
  usaPrecioConVolteoPantone,
  millaresCalculados,
  topeMinimoMillarActivo,
  precioInicial,
  precioPorMillar,
  precioConVolteoMillar,
}: ResolveValorImpresionPrecioUnitarioInput): {
  precioUnitario: number
  usaPrecioInicial: boolean
} => {
  const topeEnMillares =
    topeMinimoMillarActivo > 0 ? topeMinimoMillarActivo / TARIFA_MILLAR_UNIDAD : 0
  const sobreTope =
    topeEnMillares > 0 && millaresCalculados >= topeEnMillares - 0.000001

  if (variant === 'colorBasico') {
    if (conVolteo) {
      if (usaPrecioConVolteoColorBasico) {
        return {
          usaPrecioInicial: false,
          precioUnitario: precioConVolteoMillar,
        }
      }
      return {
        usaPrecioInicial: sobreTope,
        precioUnitario: sobreTope ? precioInicial : precioConVolteoMillar,
      }
    }
    return {
      usaPrecioInicial: !usaPrecioConVolteoColorBasico,
      precioUnitario: usaPrecioConVolteoColorBasico
        ? precioConVolteoMillar
        : precioInicial,
    }
  }

  if (conVolteo) {
    if (usaPrecioConVolteoPantone) {
      return {
        usaPrecioInicial: false,
        precioUnitario: precioConVolteoMillar,
      }
    }
    return {
      usaPrecioInicial: sobreTope,
      precioUnitario: sobreTope ? precioInicial : precioPorMillar,
    }
  }

  if (usaPrecioConVolteoPantone) {
    return {
      usaPrecioInicial: false,
      precioUnitario: precioConVolteoMillar,
    }
  }

  return {
    usaPrecioInicial: true,
    precioUnitario: precioInicial,
  }
}

/** Fórmula resumida de Precio impresión con etiqueta antes de cada valor. */
export const buildValorImpresionFormulaSteps = (
  input: BuildValorImpresionFormulaStepsInput
): ValorImpresionFormulaStep[] => {
  const {
    millaresCalculados,
    precioUnitario,
    valorImpresion,
    copy,
    formatMillares = formatMillaresFactor,
    formatPrecio,
  } = input

  if (millaresCalculados <= 0 || valorImpresion <= 0 || !formatPrecio) {
    return []
  }

  const precioUnitarioEfectivo =
    precioUnitario > 0
      ? precioUnitario
      : valorImpresion > 0
        ? valorImpresion / millaresCalculados
        : 0

  if (precioUnitarioEfectivo <= 0) {
    return []
  }

  const millaresLabel = formatMillares(millaresCalculados)
  const precioLabel = formatPrecio(precioUnitarioEfectivo)
  const totalLabel = formatPrecio(valorImpresion)
  const precioUnitarioLabel = resolveValorImpresionPrecioUnitarioLabel(input)

  return [
    {
      stepRule: '',
      stepCalc: `${copy.millaresReferencia}: (${millaresLabel}) × ${precioUnitarioLabel} (${precioLabel} ) = ${totalLabel}`,
    },
  ]
}

/** @deprecated Usar buildValorImpresionFormulaSteps. */
export const buildValorImpresionFormulaStep = (
  input: BuildValorImpresionFormulaStepsInput
): ValorImpresionFormulaStep | null => buildValorImpresionFormulaSteps(input).at(-1) ?? null

export const resolveImpresionTarifaMillarPricing = (
  precio: number,
  millarMinimoVenta?: number,
  topeMinimoMillar?: number,
  umbralDecimalMillar?: number
): TarifaMillarPricing => ({
  precio: Math.max(0, precio),
  millarMinimoVenta: millarMinimoVenta ?? 0,
  topeMinimoMillar: topeMinimoMillar ?? 0,
  umbralDecimalMillar: umbralDecimalMillar ?? 0.2,
})

const resolveGrupoMillaresAjuste = (
  millaresBase: number,
  millaresCalculados: number,
  pricing: TarifaMillarPricing
): ImpresionGrupoMillaresAjuste => {
  if (millaresBase <= 0 || millaresCalculados <= 0) return 'ninguno'
  if (millaresCalculados === 1 && millaresBase < 1) return 'millarUno'
  const topeEnMillares =
    pricing.topeMinimoMillar > 0 ? pricing.topeMinimoMillar / 1000 : 0
  const millarMinimoEnMillares =
    pricing.millarMinimoVenta > 0 ? pricing.millarMinimoVenta / 1000 : 0
  if (
    topeEnMillares > 0 &&
    millaresBase < topeEnMillares &&
    millarMinimoEnMillares > 0 &&
    millaresCalculados === millarMinimoEnMillares
  ) {
    return 'minimoPorTope'
  }
  return 'ninguno'
}

export const buildImpresionGrupoMillaresPreview = (
  variant: 'colorBasico' | 'pantone',
  tintasTiro: number,
  tintasRetiro: number,
  tamanosBuenos: number,
  pricing: TarifaMillarPricing,
  tamanosBuenosFuente: ImpresionTamanosBuenosMillaresFuente = 'tamanosBuenos'
): ImpresionGrupoMillaresPreview | null => {
  const cantidadTintas = tintasTiro + tintasRetiro
  if (cantidadTintas <= 0 || tamanosBuenos <= 0) return null
  const millaresBase = computeMillaresCalculados(cantidadTintas, tamanosBuenos)
  const millaresCalculados = resolveMillaresParaCobro(
    millaresBase,
    pricing.millarMinimoVenta,
    pricing.umbralDecimalMillar,
    pricing.topeMinimoMillar
  )
  const ajuste = resolveGrupoMillaresAjuste(millaresBase, millaresCalculados, pricing)
  return {
    variant,
    cantidadTintas,
    tintasTiro,
    tintasRetiro,
    tamanosBuenos,
    tamanosBuenosFuente,
    millaresBase,
    millaresCalculados,
    ajuste,
    millarMinimoVentaAplicado:
      ajuste === 'minimoPorTope' ? pricing.millarMinimoVenta : undefined,
  }
}

const resolveGrupoMillaresReferencia = (
  variant: 'colorBasico' | 'pantone',
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  tamanosBuenos: number,
  conVolteo: boolean,
  basePricing: TarifaMillarPricing,
  volteoPricing: TarifaMillarPricing
): number => {
  const tintasTiro =
    variant === 'colorBasico'
      ? countDistinctNonPantoneInLado(tiro)
      : countPantoneTintasInLado(tiro)
  const tintasRetiro =
    variant === 'colorBasico'
      ? countDistinctNonPantoneInLado(retiro)
      : countPantoneTintasInLado(retiro)
  const pricing = conVolteo ? volteoPricing : basePricing
  const preview = buildImpresionGrupoMillaresPreview(
    variant,
    tintasTiro,
    tintasRetiro,
    tamanosBuenos,
    pricing
  )
  return preview?.millaresCalculados ?? 0
}

const computeGrupoImpresionCobro = (
  variant: 'colorBasico' | 'pantone',
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  tamanosBuenos: number,
  precioInicial: number,
  precioPorMillar: number,
  conVolteo: boolean,
  basePricing: TarifaMillarPricing,
  volteoPricing: TarifaMillarPricing,
  tamanosBuenosReferencia: number | null = null
): { millares: number; precio: number } => {
  const millares = resolveGrupoMillaresReferencia(
    variant,
    tiro,
    retiro,
    tamanosBuenos,
    conVolteo,
    basePricing,
    volteoPricing
  )
  const precioConVolteo = precioPorMillar > 0 ? precioPorMillar : volteoPricing.precio
  const precio =
    variant === 'colorBasico'
      ? conVolteo
        ? computeValorImpresionColorBasicoConVolteoPorReferencia({
            millaresReferencia: millares,
            tamanosBuenosReferencia,
            precioConVolteo,
            precioSinVolteo: precioInicial,
            topeMinimoMillar: volteoPricing.topeMinimoMillar,
          })
        : computeValorImpresionColorBasicoPorReferencia({
            millaresReferencia: millares,
            tamanosBuenosReferencia,
            precioConVolteo,
            precioSinVolteo: precioInicial,
          })
      : conVolteo
        ? computeValorImpresionPantoneConVolteoPorReferencia({
            millaresReferencia: millares,
            tamanosBuenosReferencia,
            precioConVolteo,
            precioSinVolteo: precioInicial,
            topeMinimoMillar: volteoPricing.topeMinimoMillar,
          })
        : computeValorImpresionPantonePorReferencia({
            millaresReferencia: millares,
            tamanosBuenosReferencia,
            precioConVolteo,
            precioSinVolteo: precioInicial,
          })
  return { millares, precio }
}

export interface ImpresionPrecioTintaBreakdownInput {
  precioColorBasicoMillar: number
  precioPantoneMillar: number
  precioVolteoColorBasicoMillar?: number
  precioVolteoPantoneMillar?: number
  conVolteoColorBasico?: boolean
  conVolteoPantone?: boolean
  millarMinimoVentaColorBasico?: number
  topeMinimoMillarColorBasico?: number
  umbralDecimalMillarColorBasico?: number
  millarMinimoVentaPantone?: number
  topeMinimoMillarPantone?: number
  umbralDecimalMillarPantone?: number
  millarMinimoVentaVolteoColorBasico?: number
  topeMinimoMillarVolteoColorBasico?: number
  umbralDecimalMillarVolteoColorBasico?: number
  millarMinimoVentaVolteoPantone?: number
  topeMinimoMillarVolteoPantone?: number
  umbralDecimalMillarVolteoPantone?: number
}

export interface ImpresionPrecioTintaBreakdownOptions {
  tamanosBuenosColorBasico?: number
  tamanosBuenosPantone?: number
  tamanosBuenosReferenciaColorBasico?: number | null
  tamanosBuenosReferenciaPantone?: number | null
  /** @deprecated Use tamanosBuenosReferenciaColorBasico / tamanosBuenosReferenciaPantone */
  tamanosBuenosReferencia?: number | null
}

export const computeImpresionPrecioTintaBreakdown = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  tamanosBuenos: number,
  input: ImpresionPrecioTintaBreakdownInput,
  options: ImpresionPrecioTintaBreakdownOptions = {}
): ImpresionPrecioTintaBreakdown => {
  const tamanosBuenosColorBasico = options.tamanosBuenosColorBasico ?? tamanosBuenos
  const tamanosBuenosPantone = options.tamanosBuenosPantone ?? tamanosBuenos
  const referenciaColorBasico =
    options.tamanosBuenosReferenciaColorBasico ?? options.tamanosBuenosReferencia ?? null
  const referenciaPantone =
    options.tamanosBuenosReferenciaPantone ?? options.tamanosBuenosReferencia ?? null
  const cantidadTintasColorBasico = sumDistinctNonPantoneColorsBySide(tiro, retiro)
  const cantidadTintasPantone = sumPantoneTintasBySide(tiro, retiro)

  const pricingColorBasico = resolveImpresionTarifaMillarPricing(
    input.precioColorBasicoMillar,
    input.millarMinimoVentaColorBasico,
    input.topeMinimoMillarColorBasico,
    input.umbralDecimalMillarColorBasico
  )
  const pricingPantone = resolveImpresionTarifaMillarPricing(
    input.precioPantoneMillar,
    input.millarMinimoVentaPantone,
    input.topeMinimoMillarPantone,
    input.umbralDecimalMillarPantone
  )

  const volteoColorBasicoPricing = resolveImpresionTarifaMillarPricing(
    input.precioVolteoColorBasicoMillar ?? 0,
    input.millarMinimoVentaVolteoColorBasico,
    input.topeMinimoMillarVolteoColorBasico,
    input.umbralDecimalMillarVolteoColorBasico
  )
  const volteoPantonePricing = resolveImpresionTarifaMillarPricing(
    input.precioVolteoPantoneMillar ?? 0,
    input.millarMinimoVentaVolteoPantone,
    input.topeMinimoMillarVolteoPantone,
    input.umbralDecimalMillarVolteoPantone
  )
  const conVolteoColorBasico = Boolean(input.conVolteoColorBasico)
  const conVolteoPantone = Boolean(input.conVolteoPantone)

  const colorBasicoGrupo = computeGrupoImpresionCobro(
    'colorBasico',
    tiro,
    retiro,
    tamanosBuenosColorBasico,
    input.precioColorBasicoMillar,
    input.precioVolteoColorBasicoMillar ?? 0,
    conVolteoColorBasico,
    pricingColorBasico,
    volteoColorBasicoPricing,
    referenciaColorBasico
  )
  const pantoneGrupo = computeGrupoImpresionCobro(
    'pantone',
    tiro,
    retiro,
    tamanosBuenosPantone,
    input.precioPantoneMillar,
    input.precioVolteoPantoneMillar ?? 0,
    conVolteoPantone,
    pricingPantone,
    volteoPantonePricing,
    referenciaPantone
  )

  const total = colorBasicoGrupo.precio + pantoneGrupo.precio
  const millaresTotal = colorBasicoGrupo.millares + pantoneGrupo.millares

  return {
    cantidadTintasColorBasico,
    cantidadTintasPantone,
    millaresColorBasico: colorBasicoGrupo.millares,
    millaresPantone: pantoneGrupo.millares,
    millaresTotal,
    colorBasico: colorBasicoGrupo.precio,
    pantone: pantoneGrupo.precio,
    total,
    millaresVolteo: 0,
    volteo: 0,
    millaresVolteoColorBasico: 0,
    volteoColorBasico: 0,
    millaresVolteoPantone: 0,
    volteoPantone: 0,
    grandTotal: total,
  }
}

/** @deprecated Use computeImpresionPrecioTintaBreakdown with input object. */
export const computeImpresionMillaresFactor = (
  tiroRetiroCount: number,
  tamanosBuenos: number
): number => {
  if (tiroRetiroCount <= 0 || tamanosBuenos <= 0) return 0
  const factorBase = tiroRetiroCount * (tamanosBuenos / 1000)
  return Math.max(1, factorBase)
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
      : sumPantoneTintasBySide(entrada.tiro, entrada.retiro)

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

  const totalesBase = lines.reduce(
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

  const registrosCompletos = coloresPlanchas
    .map(plancha => byId.get(plancha.id))
    .filter((registro): registro is ImpresionTintasRegistro => Boolean(registro?.entradas[0]))

  return {
    registros: lines,
    totales: {
      ...totalesBase,
      volteoColorBasico: resolveVolteoEstadoConsolidado(registrosCompletos, 'colorBasico'),
      volteoPantone: resolveVolteoEstadoConsolidado(registrosCompletos, 'pantone'),
    },
  }
}

export const computeImpresionPrecioTinta = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  tamanosBuenos: number,
  precioColorBasicoMillar: number,
  precioPantoneMillar: number
): number =>
  computeImpresionPrecioTintaBreakdown(tiro, retiro, tamanosBuenos, {
    precioColorBasicoMillar,
    precioPantoneMillar,
  }).total
