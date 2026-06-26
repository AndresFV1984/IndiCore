import type { EstimarTintasColorAnalysisAlgorithm, EstimarTintasSourceColorSpace } from './estimarTintasColorSpaceUtils'

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

export type EstimarTintasInkCategory = 'basico' | 'secundario' | 'pantone'

export interface EstimarTintasDetectedColor {
  index: number
  name: string
  category: EstimarTintasInkCategory
  swatch: string
  representativeSwatch?: string
  coverage: number
  inkG: number
  matchedPixels?: number
}

export type EstimarTintasSourceKind = 'image' | 'pdf'

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
  detectedColors?: EstimarTintasDetectedColor[]
  sourceColorSpace: EstimarTintasSourceColorSpace
  colorAnalysisAlgorithm: EstimarTintasColorAnalysisAlgorithm
  distinctInkCount: number
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

export const CMYK_CHANNELS: CmykChannel[] = ['c', 'm', 'y', 'k']

/** Volumen de referencia (ml/cm² al 100 % de cobertura sólida, offset). */
export const ESTIMAR_TINTAS_VOLUME_FACTOR_ML_CM2 = 0.0002
/** Densidad media de tinta offset (g/ml). */
export const ESTIMAR_TINTAS_INK_DENSITY_G_ML = 1.05
/** g/cm² = ml/cm² × densidad. */
export const ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G =
  ESTIMAR_TINTAS_VOLUME_FACTOR_ML_CM2 * ESTIMAR_TINTAS_INK_DENSITY_G_ML
