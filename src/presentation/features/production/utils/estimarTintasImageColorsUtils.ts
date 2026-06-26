import {
  DISENO_INK_PALETTE,
  DISENO_INK_PANTONE_INDEX,
  isDisenoInkPantoneMix,
} from '../constants/preprensaDisenoColors'
import {
  ESTIMAR_TINTAS_SPOT_REFERENCE_MATCH_DISTANCE_SQUARED,
  dedupeCanonicalPantoneSpotNames,
  canonicalizePantoneSpotName,
  isNearProcessPrimaryRgb,
  isPantoneSpotInkName,
  isSecondaryInkLikeRgb,
  matchesKnownCatalogSpotRgbFromReferences,
  resolveActivePantoneNamesForReferences,
  resolveKnownPantoneDisplaySwatch,
  resolveKnownPantoneReferenceRgbs,
  resolvePantoneDisplaySwatchForName,
  resolvePantoneDisplayLabel,
  resolvePantoneLabelAsCatalogName,
  resolveSpotNameForReference,
  resolveSpotReferencesCentroidSwatch,
  resolveSpotReferencesForCanonicalPantoneName,
  matchesKnownCatalogSpotRgb,
  type EstimarTintasSpotRgb,
} from './estimarTintasPdfSpotUtils'
import { resolvePantoneDisplayHexFromName } from './estimarTintasPantoneDisplayCatalog'
import {
  ESTIMAR_TINTAS_ALPHA_MIN,
  ESTIMAR_TINTAS_WHITE_THRESHOLD,
  computeCmykTac,
  isNearWhitePixel,
  processPixelCmyk,
  type CmykCoverage,
  type EstimarTintasEstimateOptions,
} from './estimarTintasUtils'

export type EstimarTintasInkCategory = 'basico' | 'secundario' | 'pantone'

export interface EstimarTintasDetectedColor {
  index: number
  name: string
  category: EstimarTintasInkCategory
  swatch: string
  /** Color dominante del spot detectado en el archivo. */
  representativeSwatch?: string
  coverage: number
  inkG: number
  matchedPixels: number
}

export interface EstimarTintasPixelClassificationOptions {
  exactMatchDistanceSquared?: number
  fallbackDistanceSquared?: number
  minChroma?: number
  spotReferenceRgbs?: readonly EstimarTintasSpotRgb[]
  pantoneSpotNames?: readonly string[]
}

/** Cobertura mínima para listar Pantone detectado en el archivo. */
export const ESTIMAR_TINTAS_DETECTED_COLOR_MIN_COVERAGE = 0.001

export const ESTIMAR_TINTAS_PALETTE_INK_INDICES = DISENO_INK_PALETTE.map((_, index) => index)

export const ESTIMAR_TINTAS_STANDARD_INK_INDICES = ESTIMAR_TINTAS_PALETTE_INK_INDICES.filter(
  index => index !== DISENO_INK_PANTONE_INDEX
)

export const ESTIMAR_TINTAS_PALETTE_EXACT_MATCH_DISTANCE = 55

export const ESTIMAR_TINTAS_PALETTE_EXACT_MATCH_DISTANCE_SQUARED =
  ESTIMAR_TINTAS_PALETTE_EXACT_MATCH_DISTANCE * ESTIMAR_TINTAS_PALETTE_EXACT_MATCH_DISTANCE

export const ESTIMAR_TINTAS_PANTONE_FALLBACK_DISTANCE = 150

export const ESTIMAR_TINTAS_PANTONE_FALLBACK_DISTANCE_SQUARED =
  ESTIMAR_TINTAS_PANTONE_FALLBACK_DISTANCE * ESTIMAR_TINTAS_PANTONE_FALLBACK_DISTANCE

export const ESTIMAR_TINTAS_PANTONE_MIN_CHROMA = 35

const PANTONE_SWATCH_BUCKET_STEP = 24

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export const rgbToEstimarTintasHex = (r: number, g: number, b: number): string => {
  const clamp = (channel: number) => Math.max(0, Math.min(255, Math.round(channel)))
  return `#${[clamp(r), clamp(g), clamp(b)].map(channel => channel.toString(16).padStart(2, '0')).join('')}`
}

const resolveStandardInkRgb = (index: number): [number, number, number] | null => {
  const entry = DISENO_INK_PALETTE[index]
  if (!entry || index === DISENO_INK_PANTONE_INDEX) return null
  return hexToRgb(entry.swatch)
}

const colorDistanceSquared = (
  r: number,
  g: number,
  b: number,
  target: [number, number, number]
): number => {
  const dr = r - target[0]
  const dg = g - target[1]
  const db = b - target[2]
  return dr * dr + dg * dg + db * db
}

const resolvePixelChroma = (r: number, g: number, b: number): number =>
  Math.max(r, g, b) - Math.min(r, g, b)

const findNearestStandardInk = (
  r: number,
  g: number,
  b: number
): { index: number; distanceSquared: number } => {
  let nearestIndex = ESTIMAR_TINTAS_STANDARD_INK_INDICES[0] ?? DISENO_INK_PANTONE_INDEX
  let nearestDistanceSquared = Number.POSITIVE_INFINITY

  for (const index of ESTIMAR_TINTAS_STANDARD_INK_INDICES) {
    const rgb = resolveStandardInkRgb(index)
    if (!rgb) continue

    const distanceSquared = colorDistanceSquared(r, g, b, rgb)
    if (distanceSquared < nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared
      nearestIndex = index
    }
  }

  return { index: nearestIndex, distanceSquared: nearestDistanceSquared }
}

const resolveMinSpotReferenceDistanceSquared = (
  r: number,
  g: number,
  b: number,
  spotReferenceRgbs: readonly EstimarTintasSpotRgb[]
): number => {
  if (spotReferenceRgbs.length === 0) return Number.POSITIVE_INFINITY

  let minDistanceSquared = Number.POSITIVE_INFINITY
  for (const reference of spotReferenceRgbs) {
    const distanceSquared = colorDistanceSquared(r, g, b, reference)
    if (distanceSquared < minDistanceSquared) {
      minDistanceSquared = distanceSquared
    }
  }

  return minDistanceSquared
}

export interface EstimarTintasPixelClassifier {
  spotReferenceRgbs: readonly EstimarTintasSpotRgb[]
  pantoneSpotNames: readonly string[]
  canonicalSpotNames: readonly string[]
  isPantonePixel: (r: number, g: number, b: number) => boolean
  nearestSpotReferenceIndex: (r: number, g: number, b: number) => number | null
}

export const buildEstimarTintasPixelClassifier = (
  options?: EstimarTintasPixelClassificationOptions
): EstimarTintasPixelClassifier => {
  const spotReferenceRgbs = options?.spotReferenceRgbs ?? []
  const pantoneSpotNames = options?.pantoneSpotNames ?? []
  const canonicalSpotNames = dedupeCanonicalPantoneSpotNames(pantoneSpotNames)
  const activeNames = resolveActivePantoneNamesForReferences(spotReferenceRgbs, canonicalSpotNames)
  const catalogReferences =
    activeNames.length > 0
      ? resolveKnownPantoneReferenceRgbs(activeNames)
      : canonicalSpotNames.length === 1
        ? resolveKnownPantoneReferenceRgbs(canonicalSpotNames)
        : []
  const relaxedSpotDistanceSquared =
    ESTIMAR_TINTAS_SPOT_REFERENCE_MATCH_DISTANCE_SQUARED * 1.44

  const isPantonePixel = (r: number, g: number, b: number): boolean => {
    if (pantoneSpotNames.length === 0 || spotReferenceRgbs.length === 0) return false

    const chroma = resolvePixelChroma(r, g, b)
    if (chroma < ESTIMAR_TINTAS_PANTONE_MIN_CHROMA) return false

    const minSpotDistanceSquared = resolveMinSpotReferenceDistanceSquared(r, g, b, spotReferenceRgbs)
    if (minSpotDistanceSquared > relaxedSpotDistanceSquared) return false

    if (matchesKnownCatalogSpotRgbFromReferences(r, g, b, catalogReferences)) return true

    const { distanceSquared: nearestStandardDistanceSquared } = findNearestStandardInk(r, g, b)
    const matchesDeclaredSpotReference =
      canonicalSpotNames.length > 0 &&
      minSpotDistanceSquared <= relaxedSpotDistanceSquared &&
      minSpotDistanceSquared < nearestStandardDistanceSquared

    if (matchesDeclaredSpotReference) return true

    if (isNearProcessPrimaryRgb(r, g, b) || isSecondaryInkLikeRgb(r, g, b)) return false

    return minSpotDistanceSquared < nearestStandardDistanceSquared
  }

  const nearestSpotReferenceIndex = (r: number, g: number, b: number): number | null => {
    if (spotReferenceRgbs.length === 0) return null

    let nearestIndex = 0
    let nearestDistanceSquared = Number.POSITIVE_INFINITY

    spotReferenceRgbs.forEach((reference, index) => {
      const distanceSquared = colorDistanceSquared(r, g, b, reference)
      if (distanceSquared < nearestDistanceSquared) {
        nearestDistanceSquared = distanceSquared
        nearestIndex = index
      }
    })

    return nearestDistanceSquared <= relaxedSpotDistanceSquared ? nearestIndex : null
  }

  return {
    spotReferenceRgbs,
    pantoneSpotNames,
    canonicalSpotNames,
    isPantonePixel,
    nearestSpotReferenceIndex,
  }
}

export interface EstimarTintasInkPixelAnalysis {
  coverage: CmykCoverage
  inkedPixels: number
  averageTac: number
  detectedColors: EstimarTintasDetectedColor[]
}

/** Cobertura mínima relativa dentro de los píxeles Pantone para listar un segundo color. */
export const ESTIMAR_TINTAS_DETECTED_PANTONE_MIN_RELATIVE_SHARE = 0.06

const resolvePantoneInkCatalogSwatchForLabel = (label: string): string | undefined =>
  resolvePantoneDisplayHexFromName(resolvePantoneLabelAsCatalogName(label))

const resolvePantoneInkDisplaySwatchForLabel = (
  label: string,
  fileSwatch?: string
): string | undefined => {
  const catalogName = resolvePantoneLabelAsCatalogName(label)
  const catalogHex = resolvePantoneDisplayHexFromName(catalogName)
  if (catalogHex) return catalogHex
  if (isPantoneSpotInkName(catalogName)) return undefined

  const trimmedFileSwatch = fileSwatch?.trim()
  if (trimmedFileSwatch && trimmedFileSwatch.startsWith('#')) {
    return trimmedFileSwatch
  }

  return undefined
}

export const consolidateDetectedPantoneColors = (
  colors: EstimarTintasDetectedColor[],
  totalPixels: number,
  areaBase: number
): EstimarTintasDetectedColor[] => {
  if (colors.length === 0 || totalPixels <= 0) return colors

  const sorted = [...colors].sort((left, right) => right.matchedPixels - left.matchedPixels)
  const totalPantonePixels = sorted.reduce((total, item) => total + item.matchedPixels, 0)
  if (totalPantonePixels <= 0) return []

  const normalizeKey = (name: string) =>
    canonicalizePantoneSpotName(resolvePantoneLabelAsCatalogName(name)).toLowerCase()

  const significant = sorted.filter(
    item =>
      item.matchedPixels / totalPantonePixels >=
      ESTIMAR_TINTAS_DETECTED_PANTONE_MIN_RELATIVE_SHARE
  )

  const mergeIntoSingle = (
    representative: EstimarTintasDetectedColor
  ): EstimarTintasDetectedColor[] => {
    const mergedCoverage = totalPantonePixels / totalPixels
    const displaySwatch =
      resolvePantoneInkCatalogSwatchForLabel(representative.name) ??
      resolvePantoneInkDisplaySwatchForLabel(
        representative.name,
        representative.representativeSwatch ?? representative.swatch
      ) ??
      (isPantoneSpotInkName(resolvePantoneLabelAsCatalogName(representative.name))
        ? 'pantone-mix'
        : representative.representativeSwatch ?? representative.swatch ?? 'pantone-mix')
    return [
      {
        ...representative,
        index: DISENO_INK_PANTONE_INDEX,
        name: representative.name,
        category: 'pantone',
        swatch: displaySwatch,
        representativeSwatch: displaySwatch,
        coverage: mergedCoverage,
        inkG: mergedCoverage * areaBase,
        matchedPixels: totalPantonePixels,
      },
    ]
  }

  if (significant.length === 0) {
    return mergeIntoSingle(sorted[0]!)
  }

  if (significant.length === 1) {
    return mergeIntoSingle(significant[0]!)
  }

  const distinctKeys = new Set(significant.map(item => normalizeKey(item.name)))
  if (distinctKeys.size === 1) {
    return mergeIntoSingle(significant[0]!)
  }

  return significant
    .filter(item => item.coverage >= ESTIMAR_TINTAS_DETECTED_COLOR_MIN_COVERAGE)
    .map((item, index) => {
      const displaySwatch =
        resolvePantoneInkCatalogSwatchForLabel(item.name) ??
        resolvePantoneInkDisplaySwatchForLabel(
          item.name,
          item.representativeSwatch ?? item.swatch
        ) ??
        (isPantoneSpotInkName(resolvePantoneLabelAsCatalogName(item.name))
          ? 'pantone-mix'
          : item.representativeSwatch ?? item.swatch ?? 'pantone-mix')
      return {
        ...item,
        index: DISENO_INK_PANTONE_INDEX + index,
        swatch: displaySwatch,
        representativeSwatch: displaySwatch,
      }
    })
}

export const analyzeInkPixelsFromImageData = (
  imageData: ImageData,
  classifier: EstimarTintasPixelClassifier,
  options: Pick<
    EstimarTintasEstimateOptions,
    'widthCm' | 'heightCm' | 'conversionFactorG'
  >,
  alphaMin = ESTIMAR_TINTAS_ALPHA_MIN,
  whiteThreshold = ESTIMAR_TINTAS_WHITE_THRESHOLD
): EstimarTintasInkPixelAnalysis => {
  const { widthCm, heightCm, conversionFactorG } = options
  if (widthCm <= 0 || heightCm <= 0 || conversionFactorG < 0) {
    throw new Error('invalid-estimate-params')
  }

  const areaBase = widthCm * heightCm * conversionFactorG
  const { data, width, height } = imageData
  const totalPixels = width * height
  const totals: CmykCoverage = { c: 0, m: 0, y: 0, k: 0 }
  let countedPixels = 0
  let tacSum = 0

  const spotGroupsByName = new Map<string, Map<string, PantoneBucket>>()

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] ?? 255
    if (alpha < alphaMin) continue

    const r = data[index] ?? 0
    const g = data[index + 1] ?? 0
    const b = data[index + 2] ?? 0
    if (isNearWhitePixel(r, g, b, whiteThreshold)) continue

    if (classifier.isPantonePixel(r, g, b)) {
      const spotReferenceIndex = classifier.nearestSpotReferenceIndex(r, g, b)
      const spotReference =
        spotReferenceIndex != null ? classifier.spotReferenceRgbs[spotReferenceIndex] : undefined
      const nameKey = spotReference
        ? canonicalizePantoneSpotName(
            resolveSpotNameForReference(spotReference, classifier.canonicalSpotNames)
          ).toLowerCase()
        : classifier.canonicalSpotNames.length === 1
          ? classifier.canonicalSpotNames[0]!.toLowerCase()
          : 'pantone'
      const groupBuckets = spotGroupsByName.get(nameKey) ?? new Map<string, PantoneBucket>()
      const bucketKey = `${Math.round(r / PANTONE_SWATCH_BUCKET_STEP) * PANTONE_SWATCH_BUCKET_STEP},${Math.round(g / PANTONE_SWATCH_BUCKET_STEP) * PANTONE_SWATCH_BUCKET_STEP},${Math.round(b / PANTONE_SWATCH_BUCKET_STEP) * PANTONE_SWATCH_BUCKET_STEP}`
      const bucket = groupBuckets.get(bucketKey) ?? { count: 0, r: 0, g: 0, b: 0 }
      bucket.count += 1
      bucket.r += r
      bucket.g += g
      bucket.b += b
      groupBuckets.set(bucketKey, bucket)
      spotGroupsByName.set(nameKey, groupBuckets)
      continue
    }

    const cmyk = processPixelCmyk(r, g, b)
    totals.c += cmyk.c
    totals.m += cmyk.m
    totals.y += cmyk.y
    totals.k += cmyk.k
    tacSum += computeCmykTac(cmyk)
    countedPixels += 1
  }

  const coverage =
    countedPixels > 0
      ? {
          c: totals.c / countedPixels,
          m: totals.m / countedPixels,
          y: totals.y / countedPixels,
          k: totals.k / countedPixels,
        }
      : { c: 0, m: 0, y: 0, k: 0 }

  const detectedColors: EstimarTintasDetectedColor[] = []
  if (spotGroupsByName.size > 0 && totalPixels > 0) {
    ;[...spotGroupsByName.entries()]
      .sort((left, right) => {
        const leftPixels = [...left[1].values()].reduce((total, bucket) => total + bucket.count, 0)
        const rightPixels = [...right[1].values()].reduce((total, bucket) => total + bucket.count, 0)
        return rightPixels - leftPixels
      })
      .forEach(([nameKey, buckets], groupIndex) => {
        const matchedPixels = [...buckets.values()].reduce((total, bucket) => total + bucket.count, 0)
        const coverageValue = matchedPixels / totalPixels
        if (coverageValue < ESTIMAR_TINTAS_DETECTED_COLOR_MIN_COVERAGE) return

        const canonicalName =
          classifier.canonicalSpotNames.find(name => name.toLowerCase() === nameKey) ??
          classifier.canonicalSpotNames[0]
        const representativeSwatch = resolvePantoneRepresentativeSwatch({
          buckets,
          spotReferences: classifier.spotReferenceRgbs,
          catalogName: canonicalName,
          pantoneSpotNames: classifier.pantoneSpotNames,
        })
        const displaySwatch =
          (canonicalName
            ? resolvePantoneDisplayHexFromName(canonicalName)
            : undefined) ??
          (canonicalName && isPantoneSpotInkName(canonicalName)
            ? undefined
            : representativeSwatch)
        const name = canonicalName
          ? resolvePantoneDisplayLabel(canonicalName)
          : resolvePantoneDisplayLabel('', groupIndex)
        const resolvedSwatch =
          displaySwatch ??
          (canonicalName && isPantoneSpotInkName(canonicalName)
            ? 'pantone-mix'
            : representativeSwatch ?? 'pantone-mix')

        detectedColors.push({
          index: DISENO_INK_PANTONE_INDEX + groupIndex,
          name,
          category: 'pantone',
          swatch: resolvedSwatch,
          representativeSwatch: resolvedSwatch,
          coverage: coverageValue,
          inkG: coverageValue * areaBase,
          matchedPixels,
        })
      })
  }

  return {
    coverage,
    inkedPixels: countedPixels,
    averageTac: countedPixels > 0 ? tacSum / countedPixels : 0,
    detectedColors: consolidateDetectedPantoneColors(detectedColors, totalPixels, areaBase),
  }
}

const matchesDeclaredPantoneSpotPixel = (
  r: number,
  g: number,
  b: number,
  pantoneSpotNames: readonly string[],
  spotReferenceRgbs: readonly EstimarTintasSpotRgb[]
): boolean => {
  if (pantoneSpotNames.length === 0 || spotReferenceRgbs.length === 0) return false

  const chroma = resolvePixelChroma(r, g, b)
  if (chroma < ESTIMAR_TINTAS_PANTONE_MIN_CHROMA) return false

  const minSpotDistanceSquared = resolveMinSpotReferenceDistanceSquared(r, g, b, spotReferenceRgbs)
  const relaxedSpotDistanceSquared =
    ESTIMAR_TINTAS_SPOT_REFERENCE_MATCH_DISTANCE_SQUARED * 1.44

  if (minSpotDistanceSquared > relaxedSpotDistanceSquared) return false

  if (matchesKnownCatalogSpotRgb(r, g, b, pantoneSpotNames)) return true

  const { distanceSquared: nearestStandardDistanceSquared } = findNearestStandardInk(r, g, b)
  const matchesDeclaredSpotReference =
    pantoneSpotNames.length > 0 &&
    minSpotDistanceSquared <= relaxedSpotDistanceSquared &&
    minSpotDistanceSquared < nearestStandardDistanceSquared

  if (matchesDeclaredSpotReference) return true

  if (isNearProcessPrimaryRgb(r, g, b) || isSecondaryInkLikeRgb(r, g, b)) return false

  return minSpotDistanceSquared < nearestStandardDistanceSquared
}

export const classifyPixelToInkIndex = (
  r: number,
  g: number,
  b: number,
  options?: EstimarTintasPixelClassificationOptions
): number => {
  const spotReferenceRgbs = options?.spotReferenceRgbs ?? []
  const pantoneSpotNames = options?.pantoneSpotNames ?? []

  if (matchesDeclaredPantoneSpotPixel(r, g, b, pantoneSpotNames, spotReferenceRgbs)) {
    return DISENO_INK_PANTONE_INDEX
  }

  return findNearestStandardInk(r, g, b).index
}

export const isEstimarTintasPantonePixel = (
  r: number,
  g: number,
  b: number,
  options?: EstimarTintasPixelClassificationOptions
): boolean => classifyPixelToInkIndex(r, g, b, options) === DISENO_INK_PANTONE_INDEX

export const resolveEstimarTintasInkCategory = (index: number): EstimarTintasInkCategory => {
  if (index < DISENO_INK_PANTONE_INDEX) {
    return index < 4 ? 'basico' : 'secundario'
  }
  return 'pantone'
}

interface PantoneBucket {
  count: number
  r: number
  g: number
  b: number
}

const resolvePantonePixelCentroidSwatch = (
  buckets: Map<string, PantoneBucket>
): string | undefined => {
  let totalCount = 0
  let totalR = 0
  let totalG = 0
  let totalB = 0

  for (const bucket of buckets.values()) {
    totalCount += bucket.count
    totalR += bucket.r
    totalG += bucket.g
    totalB += bucket.b
  }

  if (totalCount <= 0) return undefined

  return rgbToEstimarTintasHex(totalR / totalCount, totalG / totalCount, totalB / totalCount)
}

const resolvePantoneDominantSwatch = (
  buckets: Map<string, PantoneBucket>,
  spotReferenceRgbs: readonly EstimarTintasSpotRgb[]
): string | undefined => {
  const pixelCentroidSwatch = resolvePantonePixelCentroidSwatch(buckets)
  if (buckets.size === 0) return undefined

  if (spotReferenceRgbs.length > 0 && pixelCentroidSwatch) {
    const [centroidR, centroidG, centroidB] = hexToRgb(pixelCentroidSwatch)
    let nearestReference = spotReferenceRgbs[0]!
    let nearestDistanceSquared = Number.POSITIVE_INFINITY

    for (const reference of spotReferenceRgbs) {
      const distanceSquared = colorDistanceSquared(centroidR, centroidG, centroidB, reference)
      if (distanceSquared < nearestDistanceSquared) {
        nearestDistanceSquared = distanceSquared
        nearestReference = reference
      }
    }

    if (
      nearestDistanceSquared <= ESTIMAR_TINTAS_SPOT_REFERENCE_MATCH_DISTANCE_SQUARED * 1.44
    ) {
      return rgbToEstimarTintasHex(nearestReference[0], nearestReference[1], nearestReference[2])
    }
  }

  if (pixelCentroidSwatch) return pixelCentroidSwatch

  const rankedBuckets = [...buckets.values()].sort((a, b) => b.count - a.count)
  const dominantBucket = rankedBuckets[0]
  if (!dominantBucket) return undefined

  return rgbToEstimarTintasHex(
    dominantBucket.r / dominantBucket.count,
    dominantBucket.g / dominantBucket.count,
    dominantBucket.b / dominantBucket.count
  )
}

export const resolvePantoneRepresentativeSwatch = (params: {
  buckets?: Map<string, PantoneBucket>
  spotReferences?: readonly EstimarTintasSpotRgb[]
  catalogName?: string
  pantoneSpotNames?: readonly string[]
}): string | undefined => {
  const spotReferences = params.spotReferences ?? []
  const fileSwatch = params.buckets
    ? resolvePantoneDominantSwatch(params.buckets, spotReferences)
    : resolveSpotReferencesCentroidSwatch(spotReferences)

  if (params.catalogName?.trim()) {
    return resolvePantoneDisplaySwatchForName(
      params.catalogName,
      spotReferences,
      params.pantoneSpotNames ?? [params.catalogName],
      fileSwatch
    )
  }

  return fileSwatch
}

export const enrichDetectedPantoneColors = (
  colors: EstimarTintasDetectedColor[],
  pantoneSpotNames: readonly string[],
  spotReferenceRgbs: readonly EstimarTintasSpotRgb[]
): EstimarTintasDetectedColor[] =>
  colors.map(color => {
    if (color.category !== 'pantone') return color

    const swatch =
      resolvePantoneInkCatalogSwatchForLabel(color.name) ??
      resolvePantoneDisplaySwatchForName(
        resolvePantoneLabelAsCatalogName(color.name),
        spotReferenceRgbs,
        pantoneSpotNames,
        color.representativeSwatch?.trim() || color.swatch?.trim()
      )

    if (!swatch) return color

    return { ...color, swatch, representativeSwatch: swatch }
  })

/** Devuelve entradas Pantone (1 o varias). Primarios y secundarios van al desglose CMYK. */
export function computeDetectedInkColorsFromImageData(
  imageData: ImageData,
  options: Pick<
    EstimarTintasEstimateOptions,
    'widthCm' | 'heightCm' | 'conversionFactorG' | 'spotReferenceRgbs' | 'pantoneSpotNames'
  >,
  alphaMin = ESTIMAR_TINTAS_ALPHA_MIN,
  whiteThreshold = ESTIMAR_TINTAS_WHITE_THRESHOLD
): EstimarTintasDetectedColor[] {
  const { spotReferenceRgbs = [], pantoneSpotNames = [] } = options
  if (spotReferenceRgbs.length === 0 && pantoneSpotNames.length === 0) return []

  const classifier = buildEstimarTintasPixelClassifier({ spotReferenceRgbs, pantoneSpotNames })
  return analyzeInkPixelsFromImageData(
    imageData,
    classifier,
    options,
    alphaMin,
    whiteThreshold
  ).detectedColors
}

const isEstimarTintasHexSwatch = (value: string | undefined): value is string =>
  Boolean(value?.trim() && !isDisenoInkPantoneMix(value))

export const resolveEstimarTintasPantoneDisplaySwatch = (
  color: Pick<EstimarTintasDetectedColor, 'name' | 'representativeSwatch' | 'swatch'>,
  context?: {
    spotReferenceRgbs?: readonly EstimarTintasSpotRgb[]
    pantoneSpotNames?: readonly string[]
  }
): string => {
  const catalogName = resolvePantoneLabelAsCatalogName(color.name)
  const catalogHex = resolvePantoneDisplayHexFromName(catalogName)
  if (catalogHex) return catalogHex

  if (isPantoneSpotInkName(catalogName)) {
    return 'pantone-mix'
  }

  const resolved = resolvePantoneDisplaySwatchForName(
    catalogName,
    context?.spotReferenceRgbs ?? [],
    context?.pantoneSpotNames ?? [catalogName],
    color.representativeSwatch?.trim() || color.swatch?.trim()
  )

  if (resolved) return resolved

  return color.representativeSwatch ?? color.swatch ?? 'pantone-mix'
}

export const resolveEstimarTintasInkDisplayName = (index: number): string => {
  const entry = DISENO_INK_PALETTE[index]
  if (!entry) return '—'
  if (index === DISENO_INK_PANTONE_INDEX) return 'Pantone'
  return entry.name
}

export const filterPantoneDetectedColorsForDisplay = (
  colors: EstimarTintasDetectedColor[]
): EstimarTintasDetectedColor[] => colors.filter(color => color.category === 'pantone')

/** @deprecated Usar filterPantoneDetectedColorsForDisplay */
export const filterDetectedInkColorsForSpotDisplay = filterPantoneDetectedColorsForDisplay

export const sortPantoneDetectedColorsForDisplay = (
  colors: EstimarTintasDetectedColor[]
): EstimarTintasDetectedColor[] =>
  filterPantoneDetectedColorsForDisplay(colors).sort((left, right) => right.coverage - left.coverage)

/** @deprecated Usar sortPantoneDetectedColorsForDisplay */
export const sortSpotDetectedInkColorsForDisplay = sortPantoneDetectedColorsForDisplay
