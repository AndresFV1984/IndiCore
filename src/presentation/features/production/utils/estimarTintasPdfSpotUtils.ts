import type { PDFPageProxy } from 'pdfjs-dist'
import * as pdfjs from 'pdfjs-dist'
import {
  DISENO_INK_PALETTE,
  DISENO_INK_PANTONE_INDEX,
  DISENO_INK_PRIMARIES_COUNT,
} from '../constants/preprensaDisenoColors'

export type EstimarTintasSpotRgb = readonly [number, number, number]

/** Distancia RGB para emparejar píxeles con un spot detectado en el PDF. */
export const ESTIMAR_TINTAS_SPOT_REFERENCE_MATCH_DISTANCE = 110

export const ESTIMAR_TINTAS_SPOT_REFERENCE_MATCH_DISTANCE_SQUARED =
  ESTIMAR_TINTAS_SPOT_REFERENCE_MATCH_DISTANCE * ESTIMAR_TINTAS_SPOT_REFERENCE_MATCH_DISTANCE

const PROCESS_PRIMARY_MATCH_DISTANCE = 72

const PROCESS_PRIMARY_MATCH_DISTANCE_SQUARED =
  PROCESS_PRIMARY_MATCH_DISTANCE * PROCESS_PRIMARY_MATCH_DISTANCE

const SECONDARY_INK_MATCH_DISTANCE = 78

const SECONDARY_INK_MATCH_DISTANCE_SQUARED =
  SECONDARY_INK_MATCH_DISTANCE * SECONDARY_INK_MATCH_DISTANCE

const SPOT_COLOR_CLUSTER_DISTANCE = 120

const SPOT_COLOR_CLUSTER_DISTANCE_SQUARED =
  SPOT_COLOR_CLUSTER_DISTANCE * SPOT_COLOR_CLUSTER_DISTANCE

const MIN_SPOT_REFERENCE_CHROMA = 35

/** RGB aproximados de spots Pantone frecuentes (cuando el PDF no expone setFillRGBColor). */
export const KNOWN_PANTONE_REFERENCE_RGBS: Readonly<Record<string, readonly EstimarTintasSpotRgb[]>> = {
  'yellow c': [[254, 221, 0], [255, 209, 0], [255, 217, 0], [255, 205, 0], [247, 201, 68]],
  '485 c': [[218, 41, 28], [218, 45, 32], [206, 17, 38], [228, 0, 43]],
  '206 c': [[218, 28, 92], [206, 15, 105], [230, 0, 126], [199, 0, 88]],
  '704 c': [[155, 39, 67], [159, 35, 62], [140, 30, 55], [128, 24, 48]],
  'rubine red c': [[206, 0, 88], [210, 10, 90], [199, 0, 85], [220, 0, 95]],
  'strong red c': [[255, 0, 60], [239, 0, 54], [245, 0, 50], [228, 0, 43]],
  '185 c': [[228, 0, 43], [230, 0, 38], [200, 16, 46]],
  '286 c': [[0, 56, 168], [0, 48, 135], [0, 94, 184]],
  '348 c': [[0, 122, 51], [0, 104, 56], [0, 166, 81]],
  '021 c': [[254, 80, 0], [255, 88, 15], [255, 128, 0]],
  'violet c': [[68, 0, 153], [98, 53, 153], [87, 39, 141], [75, 0, 130]],
}

const spotRgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b]
    .map(channel => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'))
    .join('')}`

const PANTONE_NAME_PATTERN = /PANTONE\s+[^<\r\n)\]]{1,48}/gi

const normalizePantoneName = (raw: string): string =>
  raw
    .replace(/#20/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const isPantoneSpotInkName = (name: string): boolean => {
  const normalized = normalizePantoneName(name)
  if (!/^PANTONE\b/i.test(normalized)) return false
  if (/process\s+yellow/i.test(normalized)) return false
  return true
}

const trimPantoneCandidate = (raw: string): string => {
  const normalized = normalizePantoneName(raw)
  const head = normalized.split(/[>/]/, 1)[0] ?? normalized
  return head.trim()
}

export const extractPantoneSpotNamesFromPdfBytes = (data: Uint8Array): string[] => {
  const text = normalizePantoneName(new TextDecoder('latin1').decode(data))
  const names = new Set<string>()

  for (const match of text.matchAll(PANTONE_NAME_PATTERN)) {
    const normalized = trimPantoneCandidate(match[0] ?? '')
    if (isPantoneSpotInkName(normalized)) {
      names.add(canonicalizePantoneSpotName(normalized))
    }
  }

  return dedupeCanonicalPantoneSpotNames([...names])
}

const readRgbChannel = (args: unknown, index: number): number | null => {
  if (Array.isArray(args)) {
    const value = args[index]
    return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null
  }

  if (args && typeof args === 'object') {
    const record = args as Record<string, unknown>
    const value = record[String(index)] ?? record[index]
    return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null
  }

  return null
}

export const extractRgbFillColorsFromPdfPage = async (
  page: PDFPageProxy
): Promise<EstimarTintasSpotRgb[]> => {
  const operatorList = await page.getOperatorList()
  const rgbOps = new Set<number>([pdfjs.OPS.setFillRGBColor, pdfjs.OPS.setStrokeRGBColor])
  const colors = new Set<string>()

  for (let index = 0; index < operatorList.fnArray.length; index += 1) {
    const fn = operatorList.fnArray[index]
    if (!rgbOps.has(fn)) continue

    const args = operatorList.argsArray[index]
    const r = readRgbChannel(args, 0)
    const g = readRgbChannel(args, 1)
    const b = readRgbChannel(args, 2)
    if (r == null || g == null || b == null) continue
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) continue

    colors.add(`${r},${g},${b}`)
  }

  return [...colors].map(entry => {
    const [r, g, b] = entry.split(',').map(Number)
    return [r, g, b] as EstimarTintasSpotRgb
  })
}

export const isYellowFamilyRgb = (r: number, g: number, b: number): boolean => {
  const chroma = Math.max(r, g, b) - Math.min(r, g, b)
  return r >= 150 && g >= 90 && b <= 140 && r >= g && chroma >= 35
}

/** Violeta / púrpura (familia Pantone Violet C). Excluye cian, verde y naranja. */
export const isVioletFamilyRgb = (r: number, g: number, b: number): boolean => {
  const chroma = Math.max(r, g, b) - Math.min(r, g, b)
  if (chroma < 35) return false
  if (b < 70) return false
  if (b <= g + 15) return false
  if (r + b < g * 2 + 40) return false
  return true
}

/** Amarillo Pantone spot (excluye naranjas/marrones de anti-aliasing). */
export const isPantoneYellowSpotRgb = (r: number, g: number, b: number): boolean => {
  if (!isYellowFamilyRgb(r, g, b)) return false
  if (r - g > 65) return false
  if (g < 150) return false
  if (b > 90) return false
  return true
}

/** Violeta Pantone spot (excluye cian, verde y colores cálidos del diseño). */
export const isPantoneVioletSpotRgb = (r: number, g: number, b: number): boolean => {
  if (!isVioletFamilyRgb(r, g, b)) return false
  if (g > r + 30 && g > 100) return false
  if (r > 200 && b < 100) return false
  return true
}

export const canonicalizePantoneSpotName = (name: string): string => {
  const normalized = normalizePantoneName(name)
  if (/PANTONE\s+Yellow\s+C/i.test(normalized)) return 'PANTONE Yellow C'
  if (/PANTONE\s+Violet\s+C/i.test(normalized)) return 'PANTONE Violet C'
  if (/PANTONE\s+Rubine\s+R/i.test(normalized)) return 'PANTONE Rubine Red C'
  if (/PANTONE\s+Strong\s+R/i.test(normalized)) return 'PANTONE Strong Red C'

  const numbered = normalized.match(/^PANTONE\s+(\d+)\s+([A-Za-z]+(?:\s+C)?)/i)
  if (numbered) {
    return `PANTONE ${numbered[1]} ${numbered[2]?.trim()}`
  }

  const simple = normalized.match(/^(PANTONE\s+[A-Za-z]+(?:\s+[A-Z])?)/i)
  if (simple?.[1]) return simple[1].trim()

  return normalized.replace(/\s+\d+(?:\s+\d+)*\s*[A-Z]?$/i, '').trim()
}

export const dedupeCanonicalPantoneSpotNames = (names: readonly string[]): string[] => {
  const unique = new Map<string, string>()
  for (const name of names) {
    const canonical = canonicalizePantoneSpotName(name)
    const key = canonical.toLowerCase()
    if (!unique.has(key)) unique.set(key, canonical)
  }
  return [...unique.values()]
}

const dedupeSpotReferences = (colors: EstimarTintasSpotRgb[]): EstimarTintasSpotRgb[] => {
  const unique: EstimarTintasSpotRgb[] = []

  for (const candidate of colors) {
    const isDuplicate = unique.some(existing => {
      const dr = candidate[0] - existing[0]
      const dg = candidate[1] - existing[1]
      const db = candidate[2] - existing[2]
      return dr * dr + dg * dg + db * db <= 35 * 35
    })
    if (!isDuplicate) unique.push(candidate)
  }

  return unique
}

const resolveKnownPantoneCatalogKey = (name: string): string | null => {
  const normalized = normalizePantoneName(name).replace(/^PANTONE\s+/i, '').trim().toLowerCase()
  if (KNOWN_PANTONE_REFERENCE_RGBS[normalized]) return normalized

  const suffixMatch = Object.keys(KNOWN_PANTONE_REFERENCE_RGBS).find(key =>
    normalized.endsWith(` ${key}`)
  )
  return suffixMatch ?? null
}

export const resolveKnownPantoneReferenceRgbs = (
  pantoneNames: readonly string[]
): EstimarTintasSpotRgb[] => {
  const references: EstimarTintasSpotRgb[] = []

  for (const name of pantoneNames) {
    const key = resolveKnownPantoneCatalogKey(name)
    if (!key) continue
    references.push(...(KNOWN_PANTONE_REFERENCE_RGBS[key] ?? []))
  }

  return dedupeSpotReferences(references)
}

/** Color sólido de referencia para mostrar un Pantone conocido en la UI. */
export const resolveKnownPantoneDisplaySwatch = (name: string): string | undefined => {
  const references = resolveKnownPantoneReferenceRgbs([name])
  if (references.length === 0) return undefined
  const [r, g, b] = references[0]!
  return spotRgbToHex(r, g, b)
}

export const resolvePantoneLabelAsCatalogName = (label: string): string => {
  const trimmed = label.trim()
  if (/^PANTONE\b/i.test(trimmed)) return canonicalizePantoneSpotName(trimmed)
  return canonicalizePantoneSpotName(`PANTONE ${trimmed.replace(/^Pantone\s+/i, '')}`)
}

export const mergeSpotReferenceRgbs = (
  ...groups: readonly (readonly EstimarTintasSpotRgb[])[]
): EstimarTintasSpotRgb[] => dedupeSpotReferences(groups.flat())

const colorDistanceSquared = (
  r: number,
  g: number,
  b: number,
  target: EstimarTintasSpotRgb
): number => {
  const dr = r - target[0]
  const dg = g - target[1]
  const db = b - target[2]
  return dr * dr + dg * dg + db * db
}

const paletteIndexToRgb = (index: number): EstimarTintasSpotRgb | null => {
  const entry = DISENO_INK_PALETTE[index]
  if (!entry || index >= DISENO_INK_PANTONE_INDEX) return null
  const hex = entry.swatch.replace('#', '')
  const value = Number.parseInt(hex, 16)
  if (!Number.isFinite(value)) return null
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const resolvePixelChroma = (r: number, g: number, b: number): number =>
  Math.max(r, g, b) - Math.min(r, g, b)

const resolveMinPaletteDistanceSquared = (
  r: number,
  g: number,
  b: number,
  indices: readonly number[]
): number => {
  let minDistanceSquared = Number.POSITIVE_INFINITY

  for (const index of indices) {
    const rgb = paletteIndexToRgb(index)
    if (!rgb) continue
    const distanceSquared = colorDistanceSquared(r, g, b, rgb)
    if (distanceSquared < minDistanceSquared) {
      minDistanceSquared = distanceSquared
    }
  }

  return minDistanceSquared
}

/** Cian, magenta, amarillo o negro de proceso (van a CMYK, no a Pantone). */
export const isNearProcessPrimaryRgb = (r: number, g: number, b: number): boolean => {
  const indices = Array.from({ length: DISENO_INK_PRIMARIES_COUNT }, (_, index) => index)
  return (
    resolveMinPaletteDistanceSquared(r, g, b, indices) <= PROCESS_PRIMARY_MATCH_DISTANCE_SQUARED
  )
}

/** Rojo, azul o verde de la paleta preprensa (se descomponen en CMYK). */
export const isSecondaryInkLikeRgb = (r: number, g: number, b: number): boolean => {
  const indices = Array.from(
    { length: DISENO_INK_PANTONE_INDEX - DISENO_INK_PRIMARIES_COUNT },
    (_, offset) => DISENO_INK_PRIMARIES_COUNT + offset
  )
  return (
    resolveMinPaletteDistanceSquared(r, g, b, indices) <= SECONDARY_INK_MATCH_DISTANCE_SQUARED
  )
}

export const matchesKnownCatalogSpotRgbFromReferences = (
  r: number,
  g: number,
  b: number,
  catalogReferences: readonly EstimarTintasSpotRgb[]
): boolean => {
  for (const reference of catalogReferences) {
    if (
      colorDistanceSquared(r, g, b, reference) <=
      ESTIMAR_TINTAS_SPOT_REFERENCE_MATCH_DISTANCE_SQUARED
    ) {
      return true
    }
  }
  return false
}

export const matchesKnownCatalogSpotRgb = (
  r: number,
  g: number,
  b: number,
  pantoneNames: readonly string[]
): boolean =>
  matchesKnownCatalogSpotRgbFromReferences(r, g, b, resolveKnownPantoneReferenceRgbs(pantoneNames))

export const filterRgbForDeclaredPantoneSpotsFast = (
  r: number,
  g: number,
  b: number,
  catalogReferences: readonly EstimarTintasSpotRgb[]
): boolean => {
  if (resolvePixelChroma(r, g, b) < MIN_SPOT_REFERENCE_CHROMA) return false

  if (
    catalogReferences.length > 0 &&
    matchesKnownCatalogSpotRgbFromReferences(r, g, b, catalogReferences)
  ) {
    return true
  }

  if (isNearProcessPrimaryRgb(r, g, b)) return false
  if (isSecondaryInkLikeRgb(r, g, b)) return false

  return true
}

export const filterRgbForDeclaredPantoneSpots = (
  r: number,
  g: number,
  b: number,
  pantoneNames: readonly string[]
): boolean => {
  if (pantoneNames.length === 0) return false
  return filterRgbForDeclaredPantoneSpotsFast(r, g, b, resolveKnownPantoneReferenceRgbs(pantoneNames))
}

export const shouldExtractSpotReferenceRgbsFromImage = (
  pantoneNames: readonly string[],
  existingReferences: readonly EstimarTintasSpotRgb[]
): boolean => {
  const canonicalNames = dedupeCanonicalPantoneSpotNames(pantoneNames)
  if (canonicalNames.length === 0) return false

  const mergedReferences = dedupeSpotReferences([...existingReferences])
  if (mergedReferences.length === 0) return true
  if (canonicalNames.length === 1) return false

  const activeNames = resolveActivePantoneNamesForReferences(mergedReferences, canonicalNames)
  if (activeNames.length >= 2) return false

  return (
    canonicalNames.length <= ESTIMAR_TINTAS_EXTRACT_IMAGE_SPOT_MAX_DECLARED &&
    activeNames.length < canonicalNames.length
  )
}

const resolveSpotReferenceSeed = (
  candidates: readonly EstimarTintasSpotRgb[]
): EstimarTintasSpotRgb | null => {
  if (candidates.length === 0) return null

  return candidates.reduce<EstimarTintasSpotRgb>((best, candidate) => {
    const bestPrimaryDistance = Math.sqrt(
      resolveMinPaletteDistanceSquared(
        best[0],
        best[1],
        best[2],
        Array.from({ length: DISENO_INK_PRIMARIES_COUNT }, (_, index) => index)
      )
    )
    const candidatePrimaryDistance = Math.sqrt(
      resolveMinPaletteDistanceSquared(
        candidate[0],
        candidate[1],
        candidate[2],
        Array.from({ length: DISENO_INK_PRIMARIES_COUNT }, (_, index) => index)
      )
    )
    return candidatePrimaryDistance > bestPrimaryDistance ? candidate : best
  })
}

const clusterSpotReferenceCandidatesNearSeed = (
  candidates: readonly EstimarTintasSpotRgb[]
): EstimarTintasSpotRgb[] => {
  if (candidates.length <= 1) return [...candidates]

  const seed = resolveSpotReferenceSeed(candidates)
  if (!seed) return [...candidates]

  return candidates.filter(
    candidate =>
      colorDistanceSquared(candidate[0], candidate[1], candidate[2], seed) <=
      SPOT_COLOR_CLUSTER_DISTANCE_SQUARED
  )
}

export const filterSpotReferenceRgbsForDeclaredPantone = (
  pantoneNames: readonly string[],
  references: readonly EstimarTintasSpotRgb[]
): EstimarTintasSpotRgb[] => dedupeSpotReferences([...references])

const IMAGE_SPOT_BUCKET_STEP = 16

export const extractSpotReferenceRgbsFromImageData = (
  imageData: ImageData,
  pantoneNames: readonly string[],
  alphaMin = 1,
  whiteThreshold = 0.985
): EstimarTintasSpotRgb[] => {
  if (pantoneNames.length === 0) return []

  const canonicalNames = dedupeCanonicalPantoneSpotNames(pantoneNames)
  const catalogReferences =
    canonicalNames.length === 1 ||
    canonicalNames.length <= ESTIMAR_TINTAS_EXTRACT_IMAGE_SPOT_MAX_DECLARED
      ? resolveKnownPantoneReferenceRgbs(canonicalNames)
      : []
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>()
  const { data } = imageData

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] ?? 255
    if (alpha < alphaMin) continue

    const r = data[index] ?? 0
    const g = data[index + 1] ?? 0
    const b = data[index + 2] ?? 0
    if (Math.min(r, g, b) / 255 >= whiteThreshold) continue

    if (!filterRgbForDeclaredPantoneSpotsFast(r, g, b, catalogReferences)) continue

    const bucketKey = `${Math.round(r / IMAGE_SPOT_BUCKET_STEP) * IMAGE_SPOT_BUCKET_STEP},${Math.round(g / IMAGE_SPOT_BUCKET_STEP) * IMAGE_SPOT_BUCKET_STEP},${Math.round(b / IMAGE_SPOT_BUCKET_STEP) * IMAGE_SPOT_BUCKET_STEP}`
    const bucket = buckets.get(bucketKey) ?? { count: 0, r: 0, g: 0, b: 0 }
    bucket.count += 1
    bucket.r += r
    bucket.g += g
    bucket.b += b
    buckets.set(bucketKey, bucket)
  }

  return [...buckets.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, 8)
    .map(bucket => {
      const count = bucket.count
      return [
        Math.round(bucket.r / count),
        Math.round(bucket.g / count),
        Math.round(bucket.b / count),
      ] as EstimarTintasSpotRgb
    })
}

export const ESTIMAR_TINTAS_MAX_ACTIVE_SPOT_REFERENCES = 12

/** Máximo de Pantone declarados para barrer la imagen buscando un segundo spot. */
export const ESTIMAR_TINTAS_EXTRACT_IMAGE_SPOT_MAX_DECLARED = 3

export const resolveActivePantoneNamesForReferences = (
  references: readonly EstimarTintasSpotRgb[],
  pantoneNames: readonly string[]
): string[] => {
  const canonicalNames = dedupeCanonicalPantoneSpotNames(pantoneNames)
  if (references.length === 0 || canonicalNames.length === 0) return []

  const activeKeys = new Set<string>()
  for (const reference of references) {
    const label = resolveSpotNameForReference(reference, canonicalNames)
    activeKeys.add(canonicalizePantoneSpotName(label).toLowerCase())
  }

  return canonicalNames.filter(name => activeKeys.has(name.toLowerCase()))
}

export const buildEstimarTintasSpotReferences = (
  pantoneSpotNames: readonly string[],
  pdfSpotReferences: readonly EstimarTintasSpotRgb[],
  imageSpotReferences: readonly EstimarTintasSpotRgb[]
): EstimarTintasSpotRgb[] => {
  const canonicalNames = dedupeCanonicalPantoneSpotNames(pantoneSpotNames)
  if (canonicalNames.length === 0) return []

  const mergedReferences = dedupeSpotReferences([...pdfSpotReferences, ...imageSpotReferences])

  if (mergedReferences.length > 0) {
    const activeNames = resolveActivePantoneNamesForReferences(mergedReferences, canonicalNames)
    const catalogReferences =
      activeNames.length > 0
        ? resolveKnownPantoneReferenceRgbs(activeNames)
        : canonicalNames.length === 1
          ? resolveKnownPantoneReferenceRgbs(canonicalNames)
          : []

    return dedupeSpotReferences([...mergedReferences, ...catalogReferences]).slice(
      0,
      ESTIMAR_TINTAS_MAX_ACTIVE_SPOT_REFERENCES
    )
  }

  if (canonicalNames.length === 1) {
    return resolveKnownPantoneReferenceRgbs(canonicalNames).slice(
      0,
      ESTIMAR_TINTAS_MAX_ACTIVE_SPOT_REFERENCES
    )
  }

  return []
}

export const resolvePantoneDisplayLabel = (name: string, fallbackIndex = 0): string => {
  const normalized = canonicalizePantoneSpotName(normalizePantoneName(name))
  if (!normalized) return fallbackIndex === 0 ? 'Pantone' : `Pantone ${fallbackIndex + 1}`
  return normalized.replace(/^PANTONE\s+/i, 'Pantone ')
}

export const resolveSpotNameForReference = (
  reference: EstimarTintasSpotRgb,
  pantoneNames: readonly string[]
): string => {
  const canonicalNames = dedupeCanonicalPantoneSpotNames(pantoneNames)
  if (canonicalNames.length === 0) return 'Pantone'
  if (canonicalNames.length === 1) return resolvePantoneDisplayLabel(canonicalNames[0]!)

  const [r, g, b] = reference
  let bestName = canonicalNames[0]!
  let bestScore = Number.POSITIVE_INFINITY

  for (const name of canonicalNames) {
    const catalogKey = resolveKnownPantoneCatalogKey(name)
    if (!catalogKey) continue
    const catalogRefs = KNOWN_PANTONE_REFERENCE_RGBS[catalogKey] ?? []
    const score = Math.min(...catalogRefs.map(ref => {
      const dr = r - ref[0]
      const dg = g - ref[1]
      const db = b - ref[2]
      return dr * dr + dg * dg + db * db
    }))
    if (score < bestScore) {
      bestScore = score
      bestName = name
    }
  }

  return resolvePantoneDisplayLabel(bestName)
}

export const clusterSpotReferenceCandidatesForPantoneNames = (
  pantoneNames: readonly string[],
  candidates: readonly EstimarTintasSpotRgb[]
): EstimarTintasSpotRgb[] => {
  if (candidates.length <= 1) return [...candidates]

  const canonicalNames = dedupeCanonicalPantoneSpotNames(pantoneNames)
  if (canonicalNames.length <= 1) {
    return clusterSpotReferenceCandidatesNearSeed(candidates)
  }

  const grouped = new Map<string, EstimarTintasSpotRgb[]>()
  for (const candidate of candidates) {
    const label = resolveSpotNameForReference(candidate, canonicalNames)
    const key = canonicalizePantoneSpotName(label).toLowerCase()
    const group = grouped.get(key) ?? []
    group.push(candidate)
    grouped.set(key, group)
  }

  const clustered: EstimarTintasSpotRgb[] = []
  for (const group of grouped.values()) {
    clustered.push(...clusterSpotReferenceCandidatesNearSeed(group))
  }

  return dedupeSpotReferences(clustered)
}

export const resolveCanonicalSpotGroupKey = (
  reference: EstimarTintasSpotRgb | undefined,
  pantoneSpotNames: readonly string[]
): string => {
  const canonicalNames = dedupeCanonicalPantoneSpotNames(pantoneSpotNames)
  if (canonicalNames.length === 1) {
    return canonicalNames[0]!.toLowerCase()
  }
  if (!reference) return 'pantone'
  return canonicalizePantoneSpotName(
    resolveSpotNameForReference(reference, canonicalNames)
  ).toLowerCase()
}

export const resolvePdfSpotReferenceRgbs = (
  pantoneNames: readonly string[],
  fillColors: readonly EstimarTintasSpotRgb[]
): EstimarTintasSpotRgb[] => {
  if (pantoneNames.length === 0) return []

  const fillCandidates = fillColors.filter(([r, g, b]) =>
    filterRgbForDeclaredPantoneSpots(r, g, b, pantoneNames)
  )
  const clusteredFillCandidates = clusterSpotReferenceCandidatesForPantoneNames(
    pantoneNames,
    fillCandidates
  )

  return buildEstimarTintasSpotReferences(pantoneNames, clusteredFillCandidates, [])
}

export const loadPdfSpotReferenceRgbs = async (
  pdf: pdfjs.PDFDocumentProxy,
  pageNumber = 1
): Promise<EstimarTintasSpotRgb[]> => {
  const pantoneNames = extractPantoneSpotNamesFromPdfBytes(await pdf.getData())
  if (pantoneNames.length === 0) return []

  const page = await pdf.getPage(pageNumber)
  const fillColors = await extractRgbFillColorsFromPdfPage(page)
  return resolvePdfSpotReferenceRgbs(pantoneNames, fillColors)
}
