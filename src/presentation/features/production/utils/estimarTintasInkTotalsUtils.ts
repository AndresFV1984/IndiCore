import {
  CMYK_CHANNELS,
  type CmykCoverage,
  type EstimarTintasDetectedColor,
  type EstimarTintasInkTotalsBreakdown,
  type EstimarTintasInkTotalsSnapshot,
  type EstimarTintasResult,
} from './estimarTintasTypes'

export {
  CMYK_CHANNELS,
  ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G,
  ESTIMAR_TINTAS_INK_DENSITY_G_ML,
  ESTIMAR_TINTAS_VOLUME_FACTOR_ML_CM2,
} from './estimarTintasTypes'

export type {
  CmykChannel,
  CmykCoverage,
  EstimarTintasInkTotalsBreakdown,
  EstimarTintasInkTotalsSnapshot,
} from './estimarTintasTypes'

export function sumCmykCoverage(values: CmykCoverage): number {
  return values.c + values.m + values.y + values.k
}

export const sumDetectedPantoneInkG = (
  colors: EstimarTintasDetectedColor[] | undefined
): number =>
  (colors ?? [])
    .filter(color => color.category === 'pantone')
    .reduce((total, color) => total + color.inkG, 0)

export const countDistinctProcessInks = (coverage: CmykCoverage, minCoverage = 0.001): number =>
  CMYK_CHANNELS.filter(channel => coverage[channel] >= minCoverage).length

export const computeDistinctInkCount = (
  coverage: CmykCoverage,
  detectedColors: EstimarTintasDetectedColor[] | undefined
): number => {
  const processCount = countDistinctProcessInks(coverage)
  const pantoneCount = (detectedColors ?? []).filter(color => color.category === 'pantone').length
  const hasProcess = processCount > 0
  return (hasProcess ? 1 : 0) + pantoneCount
}

export function computeEstimarTintasTotalInkGPerPliego(
  result: Pick<EstimarTintasResult, 'inkG' | 'detectedColors'>
): number {
  return sumCmykCoverage(result.inkG) + sumDetectedPantoneInkG(result.detectedColors)
}

export const computeEstimarTintasProcessInkGPerPliego = (
  result: Pick<EstimarTintasResult, 'inkG'>
): number => sumCmykCoverage(result.inkG)

export const computeEstimarTintasPantoneInkGPerPliego = (
  result: Pick<EstimarTintasResult, 'detectedColors'>
): number => sumDetectedPantoneInkG(result.detectedColors)

export const buildEstimarTintasInkTotalsBreakdown = (
  processInkG: number,
  pantoneInkG: number
): EstimarTintasInkTotalsBreakdown => ({
  processInkG,
  pantoneInkG,
  totalInkG: processInkG + pantoneInkG,
})

export const scaleEstimarTintasInkTotalsBreakdown = (
  breakdown: EstimarTintasInkTotalsBreakdown,
  multiplier: number
): EstimarTintasInkTotalsBreakdown => {
  const factor = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 0
  return buildEstimarTintasInkTotalsBreakdown(
    breakdown.processInkG * factor,
    breakdown.pantoneInkG * factor
  )
}

export function resolvePedidoInkTotalsBreakdown(
  perPliego: EstimarTintasInkTotalsBreakdown,
  totalPliegos?: number
): EstimarTintasInkTotalsBreakdown | null {
  const pliegos = Number.isFinite(totalPliegos) && (totalPliegos ?? 0) > 0 ? totalPliegos! : 0
  if (pliegos <= 0) return null
  return scaleEstimarTintasInkTotalsBreakdown(perPliego, pliegos)
}

export function quantizeEstimarTintasWeightG(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  if (value < 0.01) return Number(value.toFixed(4))
  if (value < 1) return Number(value.toFixed(3))
  if (value < 100) return Number(value.toFixed(2))
  return Number(value.toFixed(1))
}

export function quantizeEstimarTintasInkTotalsBreakdown(
  breakdown: EstimarTintasInkTotalsBreakdown
): EstimarTintasInkTotalsBreakdown {
  const processInkG = quantizeEstimarTintasWeightG(breakdown.processInkG)
  const pantoneInkG = quantizeEstimarTintasWeightG(breakdown.pantoneInkG)
  return buildEstimarTintasInkTotalsBreakdown(processInkG, pantoneInkG)
}

export function computeEstimarTintasInkTotalsSnapshot(
  result: Pick<EstimarTintasResult, 'inkG' | 'detectedColors'>,
  totalPliegos?: number
): EstimarTintasInkTotalsSnapshot {
  const rawPerPliego = buildEstimarTintasInkTotalsBreakdown(
    computeEstimarTintasProcessInkGPerPliego(result),
    computeEstimarTintasPantoneInkGPerPliego(result)
  )
  const perPliego = quantizeEstimarTintasInkTotalsBreakdown(rawPerPliego)
  const rawPedido = resolvePedidoInkTotalsBreakdown(perPliego, totalPliegos)

  return {
    perPliego,
    pedido: rawPedido ? quantizeEstimarTintasInkTotalsBreakdown(rawPedido) : null,
  }
}
