import type { DespieceAsociado } from '../../../../core/domain/entities/CortePapel'
import type { EstimarTintasDetectedColor } from './estimarTintasImageColorsUtils'
import type { EstimarTintasSpotRgb } from './estimarTintasPdfSpotUtils'
import {
  buildEstimarTintasSpotReferences,
  extractSpotReferenceRgbsFromImageData,
  shouldExtractSpotReferenceRgbsFromImage,
} from './estimarTintasPdfSpotUtils'
import {
  resolveEstimarTintasColorAnalysisAlgorithm,
  type EstimarTintasColorAnalysisAlgorithm,
  type EstimarTintasSourceColorSpace,
} from './estimarTintasColorSpaceUtils'

export type CmykChannel = 'c' | 'm' | 'y' | 'k'

export interface EstimarTintasPrintAreaCm {
  widthCm: number
  heightCm: number
}

export interface CmykCoverage {
  c: number
  m: number
  y: number
  k: number
}

export interface EstimarTintasEstimateOptions {
  widthCm: number
  heightCm: number
  dpi: number
  conversionFactorG: number
  referenceDpi?: number
  maxSampleEdge?: number
  alphaMin?: number
  /** RGB de spots Pantone detectados en el PDF (p. ej. PANTONE Yellow C). */
  spotReferenceRgbs?: readonly EstimarTintasSpotRgb[]
  /** Nombres Pantone spot declarados en el PDF. */
  pantoneSpotNames?: readonly string[]
  /** Espacio de color detectado en el archivo fuente. */
  sourceColorSpace?: EstimarTintasSourceColorSpace
  /** Muestras CMYK leídas de operadores PDF (DeviceCMYK). */
  cmykOperatorSamples?: readonly CmykCoverage[]
}

export interface EstimarTintasResult {
  coverage: CmykCoverage
  inkG: CmykCoverage
  sampledPixels: number
  inkedPixels: number
  sampleWidth: number
  sampleHeight: number
  imageWidthPx: number
  imageHeightPx: number
  averageTac: number
  /** Colores distintos detectados en el archivo analizado. */
  detectedColors?: EstimarTintasDetectedColor[]
  /** Espacio de color del archivo analizado. */
  sourceColorSpace: EstimarTintasSourceColorSpace
  /** Algoritmo aplicado según el espacio de color detectado. */
  colorAnalysisAlgorithm: EstimarTintasColorAnalysisAlgorithm
  /** Tintas distintas: CMYK (proceso) + Pantone(s) detectados. */
  distinctInkCount: number
}

export const ESTIMAR_TINTAS_MAX_FILE_MB = 25
/** Borde máximo del muestreo de píxeles (mayor = cobertura CMYK más precisa). */
export const ESTIMAR_TINTAS_MAX_SAMPLE_EDGE = 1024
export const ESTIMAR_TINTAS_REFERENCE_DPI = 300
/** Resolución de archivo estándar en preprensa offset (Colombia). */
export const ESTIMAR_TINTAS_DEFAULT_DPI = 300
/** Plancha / pliego offset más usado en litografía colombiana (70 × 100 cm). */
export const ESTIMAR_TINTAS_DEFAULT_WIDTH_CM = 70
export const ESTIMAR_TINTAS_DEFAULT_HEIGHT_CM = 100
/** Volumen de referencia (ml/cm² al 100 % de cobertura sólida, offset). */
export const ESTIMAR_TINTAS_VOLUME_FACTOR_ML_CM2 = 0.0002
/** Densidad media de tinta offset (g/ml). */
export const ESTIMAR_TINTAS_INK_DENSITY_G_ML = 1.05
/** g/cm² = ml/cm² × densidad. */
export const ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G =
  ESTIMAR_TINTAS_VOLUME_FACTOR_ML_CM2 * ESTIMAR_TINTAS_INK_DENSITY_G_ML
export const ESTIMAR_TINTAS_ALPHA_MIN = 64
/** Umbral más bajo solo para comprobar si hay contenido visible (PDFs con transparencia). */
export const ESTIMAR_TINTAS_VISIBLE_INK_ALPHA_MIN = 16
/** Ignora píxeles casi blancos (papel sin tinta) al promediar cobertura. */
export const ESTIMAR_TINTAS_WHITE_THRESHOLD = 0.985
/** TAC máximo (300 %) aplicado por píxel, acorde a cuatricromía offset. */
export const ESTIMAR_TINTAS_MAX_TAC = 3
/** Fuerza de GCR simplificado: traslada componente gris CMY hacia K. */
export const ESTIMAR_TINTAS_GCR_STRENGTH = 0.85

const ACCEPTED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const ACCEPTED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i
const ACCEPTED_PDF_MIME_TYPE = 'application/pdf'
const ACCEPTED_PDF_EXTENSION = /\.pdf$/i

export type EstimarTintasSourceKind = 'image' | 'pdf'

export type EstimarTintasProgressPhase = 'preparing' | 'rendering' | 'analyzing' | 'finishing'

export interface EstimarTintasProgressUpdate {
  phase: EstimarTintasProgressPhase
  percent: number
  label: string
}

export type EstimarTintasProgressCallback = (update: EstimarTintasProgressUpdate) => void

export const CMYK_CHANNELS: CmykChannel[] = ['c', 'm', 'y', 'k']

export interface EstimarTintasDefaultPrintArea {
  widthCm: number
  heightCm: number
  dpi: number
  conversionFactorG: number
}

export const getEstimarTintasDefaultPrintArea = (): EstimarTintasDefaultPrintArea => ({
  widthCm: ESTIMAR_TINTAS_DEFAULT_WIDTH_CM,
  heightCm: ESTIMAR_TINTAS_DEFAULT_HEIGHT_CM,
  dpi: ESTIMAR_TINTAS_DEFAULT_DPI,
  conversionFactorG: ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G,
})

/** Parámetros fijos del algoritmo (offset Colombia) usados en cada estimación. */
export const ESTIMAR_TINTAS_ALGORITHM_DEFAULTS = {
  dpi: ESTIMAR_TINTAS_DEFAULT_DPI,
  conversionFactorG: ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G,
  referenceDpi: ESTIMAR_TINTAS_REFERENCE_DPI,
  maxSampleEdge: ESTIMAR_TINTAS_MAX_SAMPLE_EDGE,
  alphaMin: ESTIMAR_TINTAS_ALPHA_MIN,
  whiteThreshold: ESTIMAR_TINTAS_WHITE_THRESHOLD,
  maxTac: ESTIMAR_TINTAS_MAX_TAC,
  gcrStrength: ESTIMAR_TINTAS_GCR_STRENGTH,
  volumeFactorMlCm2: ESTIMAR_TINTAS_VOLUME_FACTOR_ML_CM2,
  inkDensityGPerMl: ESTIMAR_TINTAS_INK_DENSITY_G_ML,
} as const

export function buildEstimarTintasEstimateOptions(
  params: Pick<EstimarTintasEstimateOptions, 'widthCm' | 'heightCm' | 'dpi' | 'conversionFactorG'> &
    Partial<EstimarTintasEstimateOptions>
): EstimarTintasEstimateOptions {
  return {
    widthCm: params.widthCm,
    heightCm: params.heightCm,
    dpi: params.dpi > 0 ? params.dpi : ESTIMAR_TINTAS_DEFAULT_DPI,
    conversionFactorG:
      params.conversionFactorG > 0
        ? params.conversionFactorG
        : ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G,
    referenceDpi: params.referenceDpi ?? ESTIMAR_TINTAS_REFERENCE_DPI,
    maxSampleEdge: params.maxSampleEdge ?? ESTIMAR_TINTAS_MAX_SAMPLE_EDGE,
    alphaMin: params.alphaMin ?? ESTIMAR_TINTAS_ALPHA_MIN,
    spotReferenceRgbs: params.spotReferenceRgbs,
    pantoneSpotNames: params.pantoneSpotNames,
    sourceColorSpace: params.sourceColorSpace ?? 'rgb',
    cmykOperatorSamples: params.cmykOperatorSamples,
  }
}

/** Recalcula gramos a partir de la cobertura ya muestreada (sin volver a leer la imagen). */
export function rescaleEstimarTintasInkG(
  result: EstimarTintasResult,
  options: Pick<EstimarTintasEstimateOptions, 'widthCm' | 'heightCm' | 'conversionFactorG'>
): EstimarTintasResult {
  return {
    ...result,
    inkG: computeInkGFromCoverage(result.coverage, options),
  }
}

export function isAcceptedEstimarTintasImage(file: File): boolean {
  if (ACCEPTED_IMAGE_MIME_TYPES.has(file.type)) return true
  return ACCEPTED_IMAGE_EXTENSIONS.test(file.name)
}

export function isAcceptedEstimarTintasPdf(file: File): boolean {
  if (file.type === ACCEPTED_PDF_MIME_TYPE) return true
  return ACCEPTED_PDF_EXTENSION.test(file.name)
}

export function getEstimarTintasSourceKind(file: File): EstimarTintasSourceKind | null {
  if (isAcceptedEstimarTintasImage(file)) return 'image'
  if (isAcceptedEstimarTintasPdf(file)) return 'pdf'
  return null
}

export function validateEstimarTintasFile(
  file: File,
  maxMb = ESTIMAR_TINTAS_MAX_FILE_MB
): string | null {
  if (!getEstimarTintasSourceKind(file)) return 'invalid-type'
  if (file.size > maxMb * 1024 * 1024) return 'max-size'
  return null
}

/** @deprecated Use validateEstimarTintasFile */
export function validateEstimarTintasImageFile(
  file: File,
  maxMb = ESTIMAR_TINTAS_MAX_FILE_MB
): string | null {
  return validateEstimarTintasFile(file, maxMb)
}

/** sRGB 0–255 → canal lineal 0–1 (precisión preprensa). */
export function srgbChannelToLinear(channel: number): number {
  const normalized = channel / 255
  if (normalized <= 0.04045) return normalized / 12.92
  return ((normalized + 0.055) / 1.055) ** 2.4
}

/** RGB 0–255 → CMYK 0–1 con sRGB lineal y fórmula estándar. */
export function rgbToCmyk(r: number, g: number, b: number): CmykCoverage {
  const rn = srgbChannelToLinear(r)
  const gn = srgbChannelToLinear(g)
  const bn = srgbChannelToLinear(b)
  const k = 1 - Math.max(rn, gn, bn)

  if (k >= 1 - 1e-9) {
    return { c: 0, m: 0, y: 0, k: 1 }
  }

  const divisor = 1 - k
  return {
    c: (1 - rn - k) / divisor,
    m: (1 - gn - k) / divisor,
    y: (1 - bn - k) / divisor,
    k,
  }
}

/** GCR simplificado: reduce CMY y concentra gris en K (comportamiento RIP offset). */
export function applySimpleGcr(
  cmyk: CmykCoverage,
  strength = ESTIMAR_TINTAS_GCR_STRENGTH
): CmykCoverage {
  const grayComponent = Math.min(cmyk.c, cmyk.m, cmyk.y)
  if (grayComponent <= 0) return cmyk

  const transfer = grayComponent * strength
  return {
    c: Math.max(0, cmyk.c - transfer),
    m: Math.max(0, cmyk.m - transfer),
    y: Math.max(0, cmyk.y - transfer),
    k: Math.min(1, cmyk.k + transfer),
  }
}

/** Limita TAC (c+m+y+k) al máximo permitido en offset. */
export function clampCmykTac(cmyk: CmykCoverage, maxTac = ESTIMAR_TINTAS_MAX_TAC): CmykCoverage {
  const tac = cmyk.c + cmyk.m + cmyk.y + cmyk.k
  if (tac <= maxTac || tac <= 0) return cmyk

  const scale = maxTac / tac
  return {
    c: cmyk.c * scale,
    m: cmyk.m * scale,
    y: cmyk.y * scale,
    k: cmyk.k * scale,
  }
}

export function computeCmykTac(cmyk: CmykCoverage): number {
  return cmyk.c + cmyk.m + cmyk.y + cmyk.k
}

export function isNearWhitePixel(r: number, g: number, b: number, threshold = ESTIMAR_TINTAS_WHITE_THRESHOLD): boolean {
  const rn = srgbChannelToLinear(r)
  const gn = srgbChannelToLinear(g)
  const bn = srgbChannelToLinear(b)
  return Math.min(rn, gn, bn) >= threshold
}

export function processPixelCmyk(r: number, g: number, b: number): CmykCoverage {
  return clampCmykTac(applySimpleGcr(rgbToCmyk(r, g, b)))
}

export function resolveSampleDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxEdge = ESTIMAR_TINTAS_MAX_SAMPLE_EDGE
): { width: number; height: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    throw new Error('invalid-image-dimensions')
  }

  const maxDim = Math.max(naturalWidth, naturalHeight)
  if (maxDim <= maxEdge) {
    return { width: naturalWidth, height: naturalHeight }
  }

  const scale = maxEdge / maxDim
  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  }
}

export const averageCmykSamples = (samples: readonly CmykCoverage[]): CmykCoverage | null => {
  if (samples.length === 0) return null

  const totals = samples.reduce(
    (acc, sample) => ({
      c: acc.c + sample.c,
      m: acc.m + sample.m,
      y: acc.y + sample.y,
      k: acc.k + sample.k,
    }),
    { c: 0, m: 0, y: 0, k: 0 }
  )

  const count = samples.length
  return {
    c: totals.c / count,
    m: totals.m / count,
    y: totals.y / count,
    k: totals.k / count,
  }
}

export function countVisibleInkedPixelsFromImageData(
  imageData: ImageData,
  alphaMin = ESTIMAR_TINTAS_ALPHA_MIN,
  whiteThreshold = ESTIMAR_TINTAS_WHITE_THRESHOLD
): number {
  const { data } = imageData
  let count = 0

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] ?? 255
    if (alpha < alphaMin) continue

    const r = data[index] ?? 0
    const g = data[index + 1] ?? 0
    const b = data[index + 2] ?? 0
    if (isNearWhitePixel(r, g, b, whiteThreshold)) continue

    count += 1
  }

  return count
}

export function averageCmykCoverageFromImageData(
  imageData: ImageData,
  alphaMin = ESTIMAR_TINTAS_ALPHA_MIN,
  whiteThreshold = ESTIMAR_TINTAS_WHITE_THRESHOLD,
  shouldSkipPixel?: (r: number, g: number, b: number) => boolean
): { coverage: CmykCoverage; inkedPixels: number; averageTac: number } {
  const { data } = imageData
  const totals: CmykCoverage = { c: 0, m: 0, y: 0, k: 0 }
  let countedPixels = 0
  let tacSum = 0

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] ?? 255
    if (alpha < alphaMin) continue

    const r = data[index] ?? 0
    const g = data[index + 1] ?? 0
    const b = data[index + 2] ?? 0
    if (isNearWhitePixel(r, g, b, whiteThreshold)) continue
    if (shouldSkipPixel?.(r, g, b)) continue

    const cmyk = processPixelCmyk(r, g, b)
    totals.c += cmyk.c
    totals.m += cmyk.m
    totals.y += cmyk.y
    totals.k += cmyk.k
    tacSum += computeCmykTac(cmyk)
    countedPixels += 1
  }

  if (countedPixels === 0) {
    return {
      coverage: { c: 0, m: 0, y: 0, k: 0 },
      inkedPixels: 0,
      averageTac: 0,
    }
  }

  return {
    coverage: {
      c: totals.c / countedPixels,
      m: totals.m / countedPixels,
      y: totals.y / countedPixels,
      k: totals.k / countedPixels,
    },
    inkedPixels: countedPixels,
    averageTac: tacSum / countedPixels,
  }
}

export function pixelsToCm(pixels: number, dpi: number): number {
  if (dpi <= 0) return 0
  return (pixels / dpi) * 2.54
}

export function convertEstimarTintasMlToG(
  ml: number,
  densityGPerMl = ESTIMAR_TINTAS_INK_DENSITY_G_ML
): number {
  return ml * densityGPerMl
}

export function convertEstimarTintasGToMl(
  g: number,
  densityGPerMl = ESTIMAR_TINTAS_INK_DENSITY_G_ML
): number {
  if (densityGPerMl <= 0) return 0
  return g / densityGPerMl
}

export function convertEstimarTintasVolumeFactorMlToG(
  factorMlCm2: number,
  densityGPerMl = ESTIMAR_TINTAS_INK_DENSITY_G_ML
): number {
  return factorMlCm2 * densityGPerMl
}

export function convertEstimarTintasVolumeFactorGToMl(
  factorGCm2: number,
  densityGPerMl = ESTIMAR_TINTAS_INK_DENSITY_G_ML
): number {
  if (densityGPerMl <= 0) return 0
  return factorGCm2 / densityGPerMl
}

export function computeInkVolumeMlFromCoverage(
  coverage: CmykCoverage,
  options: Pick<EstimarTintasEstimateOptions, 'widthCm' | 'heightCm'> & {
    conversionFactorMl: number
  }
): CmykCoverage {
  const { widthCm, heightCm, conversionFactorMl } = options

  if (widthCm <= 0 || heightCm <= 0 || conversionFactorMl < 0) {
    throw new Error('invalid-estimate-params')
  }

  const base = widthCm * heightCm * conversionFactorMl

  return {
    c: coverage.c * base,
    m: coverage.m * base,
    y: coverage.y * base,
    k: coverage.k * base,
  }
}

export function computeInkGFromCoverage(
  coverage: CmykCoverage,
  options: Pick<EstimarTintasEstimateOptions, 'widthCm' | 'heightCm' | 'conversionFactorG'>
): CmykCoverage {
  const { widthCm, heightCm, conversionFactorG } = options

  if (widthCm <= 0 || heightCm <= 0 || conversionFactorG < 0) {
    throw new Error('invalid-estimate-params')
  }

  const base = widthCm * heightCm * conversionFactorG

  return {
    c: coverage.c * base,
    m: coverage.m * base,
    y: coverage.y * base,
    k: coverage.k * base,
  }
}

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

/** Total estimado por pliego: CMYK (primarios + secundarios descompuestos) + Pantone. */
export function computeEstimarTintasTotalInkGPerPliego(
  result: Pick<EstimarTintasResult, 'inkG' | 'detectedColors'>
): number {
  return sumCmykCoverage(result.inkG) + sumDetectedPantoneInkG(result.detectedColors)
}

export interface EstimarTintasInkTotalsBreakdown {
  processInkG: number
  pantoneInkG: number
  totalInkG: number
}

export interface EstimarTintasInkTotalsSnapshot {
  perPliego: EstimarTintasInkTotalsBreakdown
  pedido: EstimarTintasInkTotalsBreakdown | null
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

/** factor = g_medidos / (área_cm² × Σ coberturas CMYK) */
export function computeConversionFactorFromTiraje(params: {
  coverage: CmykCoverage
  widthCm: number
  heightCm: number
  measuredGTotal: number
}): number {
  const { coverage, widthCm, heightCm, measuredGTotal } = params

  if (widthCm <= 0 || heightCm <= 0 || measuredGTotal <= 0) {
    throw new Error('invalid-calibration-params')
  }

  const coverageSum = sumCmykCoverage(coverage)
  if (coverageSum <= 0) {
    throw new Error('invalid-coverage-sum')
  }

  return measuredGTotal / (widthCm * heightCm * coverageSum)
}

export function formatConversionFactorForInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  if (value < 0.000001) return value.toExponential(6)
  return value.toFixed(8).replace(/0+$/, '').replace(/\.$/, '')
}

/** Formato legible en UI (es-CO): coma decimal. */
export function formatConversionFactorForDisplay(value: number): string {
  const input = formatConversionFactorForInput(value)
  return input ? input.replace('.', ',') : ''
}

export function parseConversionFactorInput(value: string): number {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) return 0
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function resolveConversionFactorG(
  value: string,
  fallback = ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G
): number {
  const parsed = parseConversionFactorInput(value)
  return parsed > 0 ? parsed : fallback
}

export interface EstimarTintasCalibrationPreview {
  currentFactorG: number
  projectedFactorG: number
  currentTotalG: number
  measuredTotalG: number
  deviationPercent: number
  factorChangePercent: number
}

export function computeCalibrationPreview(params: {
  coverage: CmykCoverage
  widthCm: number
  heightCm: number
  currentFactorG: number
  currentTotalG: number
  measuredGTotal: number
}): EstimarTintasCalibrationPreview {
  const { coverage, widthCm, heightCm, currentFactorG, currentTotalG, measuredGTotal } = params

  const projectedFactorG = computeConversionFactorFromTiraje({
    coverage,
    widthCm,
    heightCm,
    measuredGTotal,
  })

  const deviationPercent =
    currentTotalG > 0 ? ((measuredGTotal - currentTotalG) / currentTotalG) * 100 : 0

  const factorChangePercent =
    currentFactorG > 0 ? ((projectedFactorG - currentFactorG) / currentFactorG) * 100 : 0

  return {
    currentFactorG,
    projectedFactorG,
    currentTotalG,
    measuredTotalG: measuredGTotal,
    deviationPercent,
    factorChangePercent,
  }
}

export function formatCalibrationDeltaPercent(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)} %`
}

export function resolveDespiecePrintAreaCm(
  despiece: Pick<DespieceAsociado, 'ancho' | 'alto'> | null | undefined
): EstimarTintasPrintAreaCm | null {
  if (!despiece) return null

  const widthCm = Number.parseFloat(String(despiece.ancho).trim().replace(',', '.'))
  const heightCm = Number.parseFloat(String(despiece.alto).trim().replace(',', '.'))

  if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm) || widthCm <= 0 || heightCm <= 0) {
    return null
  }

  return { widthCm, heightCm }
}

export function resolvePlanchaTotalPliegos(values: {
  tamanosBuenos: number
  sobrante: number
}): number {
  const tamanosBuenos = Number.isFinite(values.tamanosBuenos) ? Math.max(0, values.tamanosBuenos) : 0
  const sobrante = Number.isFinite(values.sobrante) ? Math.max(0, values.sobrante) : 0
  return tamanosBuenos + sobrante
}

/** Total de tinta para el tiraje: consumo estimado por pliego × total pliegos. */
export function computeEstimarTintasTotalPedidoG(
  totalInkGPerPliego: number,
  totalPliegos: number
): number {
  const inkG = Number.isFinite(totalInkGPerPliego) ? Math.max(0, totalInkGPerPliego) : 0
  const pliegos = Number.isFinite(totalPliegos) ? Math.max(0, totalPliegos) : 0
  if (inkG <= 0 || pliegos <= 0) return 0
  return inkG * pliegos
}

export function formatEstimarTintasEntero(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('es-CO').format(Math.round(value))
}

export function formatEstimarTintasCoverage(value: number): string {
  return `${(value * 100).toFixed(1)} %`
}

export function formatEstimarTintasWeightG(value: number): string {
  if (value <= 0) return '—'
  if (value < 0.01) return `${value.toFixed(4)} grm`
  if (value < 1) return `${value.toFixed(3)} grm`
  if (value < 100) return `${value.toFixed(2)} grm`
  return `${value.toFixed(1)} grm`
}

/** Misma precisión que `formatEstimarTintasWeightG`, para que pedido = estimado mostrado × pliegos. */
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

export async function loadEstimarTintasImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (img.naturalWidth <= 0 || img.naturalHeight <= 0) {
        reject(new Error('invalid-image-dimensions'))
        return
      }
      resolve(img)
    }
    img.onerror = () => reject(new Error('image-load-failed'))
    img.src = url
  })
}

const yieldToUi = (): Promise<void> =>
  new Promise(resolve => {
    window.requestAnimationFrame(() => resolve())
  })

const reportProgress = (
  onProgress: EstimarTintasProgressCallback | undefined,
  update: EstimarTintasProgressUpdate
): void => {
  onProgress?.(update)
}

export async function estimateInkFromCanvas(
  sourceCanvas: HTMLCanvasElement,
  options: EstimarTintasEstimateOptions,
  onProgress?: EstimarTintasProgressCallback
): Promise<EstimarTintasResult> {
  reportProgress(onProgress, { phase: 'preparing', percent: 12, label: 'preparing-sample' })
  await yieldToUi()

  const naturalWidth = sourceCanvas.width
  const naturalHeight = sourceCanvas.height
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    throw new Error('invalid-image-dimensions')
  }

  const maxSampleEdge = options.maxSampleEdge ?? ESTIMAR_TINTAS_MAX_SAMPLE_EDGE
  const alphaMin = options.alphaMin ?? ESTIMAR_TINTAS_ALPHA_MIN
  const { width, height } = resolveSampleDimensions(naturalWidth, naturalHeight, maxSampleEdge)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('canvas-context-unavailable')

  context.drawImage(sourceCanvas, 0, 0, width, height)

  reportProgress(onProgress, { phase: 'analyzing', percent: 34, label: 'reading-pixels' })
  await yieldToUi()

  let imageData: ImageData
  try {
    imageData = context.getImageData(0, 0, width, height)
  } catch {
    throw new Error('image-data-unavailable')
  }

  return finalizeInkEstimateFromImageData(
    imageData,
    naturalWidth,
    naturalHeight,
    options,
    onProgress
  )
}

async function finalizeInkEstimateFromImageData(
  imageData: ImageData,
  naturalWidth: number,
  naturalHeight: number,
  options: EstimarTintasEstimateOptions,
  onProgress?: EstimarTintasProgressCallback
): Promise<EstimarTintasResult> {
  const alphaMin = options.alphaMin ?? ESTIMAR_TINTAS_ALPHA_MIN
  const { width, height } = imageData

  reportProgress(onProgress, { phase: 'analyzing', percent: 48, label: 'detecting-spots' })
  await yieldToUi()

  const pantoneSpotNames = options.pantoneSpotNames ?? []
  const sourceColorSpace = options.sourceColorSpace ?? 'rgb'
  const cmykOperatorSamples = options.cmykOperatorSamples ?? []
  const pdfSpotReferences = options.spotReferenceRgbs ?? []
  const imageSpotReferences = shouldExtractSpotReferenceRgbsFromImage(
    pantoneSpotNames,
    pdfSpotReferences
  )
    ? extractSpotReferenceRgbsFromImageData(
        imageData,
        pantoneSpotNames,
        alphaMin,
        ESTIMAR_TINTAS_WHITE_THRESHOLD
      )
    : []
  const spotReferenceRgbs = buildEstimarTintasSpotReferences(
    pantoneSpotNames,
    pdfSpotReferences,
    imageSpotReferences
  )

  reportProgress(onProgress, { phase: 'analyzing', percent: 58, label: 'computing-cmyk' })
  await yieldToUi()

  const {
    buildEstimarTintasPixelClassifier,
    analyzeInkPixelsFromImageData,
  } = await import('./estimarTintasImageColorsUtils')

  const classifier = buildEstimarTintasPixelClassifier({ spotReferenceRgbs, pantoneSpotNames })
  const pixelAnalysis = analyzeInkPixelsFromImageData(imageData, classifier, options, alphaMin)

  reportProgress(onProgress, { phase: 'analyzing', percent: 82, label: 'detecting-pantone' })
  await yieldToUi()

  const operatorCoverage = averageCmykSamples(cmykOperatorSamples)
  const useCmykOperators =
    sourceColorSpace === 'cmyk' &&
    operatorCoverage != null &&
    cmykOperatorSamples.length >= 2

  const colorAnalysisAlgorithm = resolveEstimarTintasColorAnalysisAlgorithm(
    sourceColorSpace,
    useCmykOperators
  )

  const coverageResult = useCmykOperators
    ? {
        coverage: operatorCoverage,
        inkedPixels: pixelAnalysis.inkedPixels,
        averageTac: computeCmykTac(operatorCoverage),
      }
    : {
        coverage: pixelAnalysis.coverage,
        inkedPixels: pixelAnalysis.inkedPixels,
        averageTac: pixelAnalysis.averageTac,
      }

  const inkG = computeInkGFromCoverage(coverageResult.coverage, options)
  const detectedColors = pixelAnalysis.detectedColors

  const visibleInkedPixels = countVisibleInkedPixelsFromImageData(
    imageData,
    ESTIMAR_TINTAS_VISIBLE_INK_ALPHA_MIN,
    ESTIMAR_TINTAS_WHITE_THRESHOLD
  )
  const pantoneMatchedPixels = (detectedColors ?? []).reduce(
    (total, color) => total + color.matchedPixels,
    0
  )

  if (visibleInkedPixels === 0 && pantoneMatchedPixels === 0) {
    throw new Error('empty-image')
  }

  reportProgress(onProgress, { phase: 'finishing', percent: 92, label: 'finishing' })
  await yieldToUi()

  const totalInkedPixels = coverageResult.inkedPixels + pantoneMatchedPixels
  const distinctInkCount = computeDistinctInkCount(coverageResult.coverage, detectedColors)

  reportProgress(onProgress, { phase: 'finishing', percent: 100, label: 'done' })

  return {
    coverage: coverageResult.coverage,
    inkG,
    sampledPixels: width * height,
    inkedPixels: totalInkedPixels > 0 ? totalInkedPixels : visibleInkedPixels,
    sampleWidth: width,
    sampleHeight: height,
    imageWidthPx: naturalWidth,
    imageHeightPx: naturalHeight,
    averageTac: coverageResult.averageTac,
    detectedColors: detectedColors.length > 0 ? detectedColors : undefined,
    sourceColorSpace,
    colorAnalysisAlgorithm,
    distinctInkCount,
  }
}

export async function estimateInkFromImageElement(
  img: HTMLImageElement,
  options: EstimarTintasEstimateOptions,
  onProgress?: EstimarTintasProgressCallback
): Promise<EstimarTintasResult> {
  reportProgress(onProgress, { phase: 'preparing', percent: 8, label: 'preparing-sample' })
  await yieldToUi()

  const maxSampleEdge = options.maxSampleEdge ?? ESTIMAR_TINTAS_MAX_SAMPLE_EDGE
  const { width, height } = resolveSampleDimensions(img.naturalWidth, img.naturalHeight, maxSampleEdge)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('canvas-context-unavailable')

  context.drawImage(img, 0, 0, width, height)

  reportProgress(onProgress, { phase: 'analyzing', percent: 28, label: 'reading-pixels' })
  await yieldToUi()

  let imageData: ImageData
  try {
    imageData = context.getImageData(0, 0, width, height)
  } catch {
    throw new Error('image-data-unavailable')
  }

  return finalizeInkEstimateFromImageData(
    imageData,
    img.naturalWidth,
    img.naturalHeight,
    options,
    onProgress
  )
}

export function mapEstimarTintasErrorCode(code: string | null | undefined): string {
  switch (code) {
    case 'invalid-type':
      return 'invalid-type'
    case 'max-size':
      return 'max-size'
    case 'image-load-failed':
      return 'image-load-failed'
    case 'pdf-load-failed':
    case 'pdf-render-failed':
      return 'pdf-load-failed'
    case 'invalid-image-dimensions':
      return 'invalid-image-dimensions'
    case 'canvas-context-unavailable':
    case 'image-data-unavailable':
      return 'canvas-unavailable'
    case 'empty-image':
      return 'empty-image'
    case 'invalid-estimate-params':
      return 'invalid-params'
    case 'invalid-calibration-params':
      return 'invalid-calibration-params'
    case 'invalid-coverage-sum':
      return 'invalid-coverage-sum'
    default:
      return 'unknown'
  }
}
