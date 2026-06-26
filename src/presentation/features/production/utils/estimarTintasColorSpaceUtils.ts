import {
  buildEstimarTintasDeclaredSpotPreviews,
  resolveEffectivePantoneSpotNames,
  resolvePantoneDisplaySwatchForName,
  resolvePantoneLabelAsCatalogName,
  type EstimarTintasDeclaredSpotPreview,
} from './estimarTintasPdfSpotUtils'
import { resolvePantoneDisplayHexFromName } from './estimarTintasPantoneDisplayCatalog'

/** Espacio de color detectado en el archivo fuente (no el canvas del navegador). */
export type EstimarTintasSourceColorSpace = 'rgb' | 'cmyk' | 'mixed'

export type EstimarTintasColorAnalysisAlgorithm =
  | 'rgb-raster'
  | 'cmyk-operators'
  | 'rgb-raster-cmyk-source'

export const resolveEstimarTintasColorAnalysisAlgorithm = (
  sourceColorSpace: EstimarTintasSourceColorSpace,
  hasCmykOperatorSamples: boolean
): EstimarTintasColorAnalysisAlgorithm => {
  if (sourceColorSpace === 'cmyk' && hasCmykOperatorSamples) return 'cmyk-operators'
  if (sourceColorSpace === 'cmyk' || sourceColorSpace === 'mixed') return 'rgb-raster-cmyk-source'
  return 'rgb-raster'
}

const readUint16Be = (data: Uint8Array, offset: number): number =>
  (data[offset]! << 8) | data[offset + 1]!

export const detectJpegColorSpaceFromBytes = (data: Uint8Array): EstimarTintasSourceColorSpace => {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return 'rgb'

  let offset = 2
  while (offset + 4 < data.length) {
    if (data[offset] !== 0xff) break

    const marker = data[offset + 1]!
    if (marker === 0xd9 || marker === 0xda) break

    const segmentLength = readUint16Be(data, offset + 2)
    if (segmentLength < 2 || offset + 2 + segmentLength > data.length) break

    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const components = data[offset + 9]
      return components === 4 ? 'cmyk' : 'rgb'
    }

    if (marker === 0xee && segmentLength >= 12) {
      const signature = String.fromCharCode(
        data[offset + 4]!,
        data[offset + 5]!,
        data[offset + 6]!,
        data[offset + 7]!,
        data[offset + 8]!
      )
      if (signature === 'Adobe') {
        const transform = data[offset + 11] ?? 0
        if (transform === 0) return 'cmyk'
        if (transform === 1) return 'rgb'
        if (transform === 2) return 'mixed'
      }
    }

    offset += 2 + segmentLength
  }

  return 'rgb'
}

export const detectPdfColorSpaceFromBytes = (data: Uint8Array): EstimarTintasSourceColorSpace => {
  const sample = data.slice(0, Math.min(data.length, 750_000))
  const text = new TextDecoder('latin1').decode(sample)

  const hasDeviceCmyk = /\/DeviceCMYK\b/i.test(text) || /setcmykcolor/i.test(text)
  const hasDeviceRgb = /\/DeviceRGB\b/i.test(text) || /setrgbcolor/i.test(text)
  const hasSeparation = /\/Separation\b/i.test(text) || /\bPANTONE\b/i.test(text)
  const hasIcc = /\/ICCBased\b/i.test(text)

  if (hasSeparation || (hasDeviceCmyk && (hasDeviceRgb || hasIcc))) return 'mixed'
  if (hasDeviceCmyk) return 'cmyk'
  return 'rgb'
}

export async function detectImageFileColorSpace(file: File): Promise<EstimarTintasSourceColorSpace> {
  const mime = file.type.trim().toLowerCase()
  if (mime === 'image/png' || mime === 'image/webp' || mime === 'image/gif') return 'rgb'

  const buffer = await file.slice(0, Math.min(file.size, 96 * 1024)).arrayBuffer()
  const data = new Uint8Array(buffer)

  if (mime === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
    return detectJpegColorSpaceFromBytes(data)
  }

  return 'rgb'
}

export async function detectEstimarTintasFileColorSpace(
  file: File,
  kind: 'image' | 'pdf'
): Promise<EstimarTintasSourceColorSpace> {
  if (kind === 'pdf') {
    const buffer = await file.slice(0, Math.min(file.size, 750_000)).arrayBuffer()
    return detectPdfColorSpaceFromBytes(new Uint8Array(buffer))
  }

  return detectImageFileColorSpace(file)
}

export type { EstimarTintasDeclaredSpotPreview } from './estimarTintasPdfSpotUtils'

export const mergeDeclaredSpotPreviews = (
  primary: readonly EstimarTintasDeclaredSpotPreview[],
  secondary: readonly EstimarTintasDeclaredSpotPreview[]
): EstimarTintasDeclaredSpotPreview[] => {
  const merged = new Map<string, EstimarTintasDeclaredSpotPreview>()

  for (const spot of primary) {
    merged.set(spot.name.toLowerCase(), spot)
  }

  for (const spot of secondary) {
    const key = spot.name.toLowerCase()
    const previous = merged.get(key)
    merged.set(key, {
      name: spot.name,
      displayLabel: spot.displayLabel || previous?.displayLabel || spot.name,
      swatch: spot.swatch ?? previous?.swatch,
    })
  }

  return [...merged.values()]
}

export const buildDeclaredSpotPreviewsFromDetectedColors = (
  detectedColors:
    | readonly {
        name: string
        category: string
        representativeSwatch?: string
        swatch?: string
      }[]
    | undefined,
  pantoneSpotNames: readonly string[] = [],
  spotReferenceRgbs: readonly [number, number, number][] = []
): EstimarTintasDeclaredSpotPreview[] => {
  if (!detectedColors?.length) return []

  return detectedColors
    .filter(color => color.category === 'pantone')
    .map(color => {
      const catalogName = resolvePantoneLabelAsCatalogName(color.name)
      const swatch =
        resolvePantoneDisplayHexFromName(catalogName) ??
        resolvePantoneDisplaySwatchForName(
          catalogName,
          spotReferenceRgbs,
          pantoneSpotNames.length > 0 ? pantoneSpotNames : [catalogName],
          color.representativeSwatch?.trim() || color.swatch?.trim()
        )

      return {
        name: catalogName,
        displayLabel: color.name,
        swatch: swatch && swatch !== 'pantone-mix' ? swatch : undefined,
      }
    })
}

export const syncFileColorProfileSpotsFromEstimate = (
  profile: EstimarTintasFileColorProfile,
  detectedColors:
    | readonly {
        name: string
        category: string
        representativeSwatch?: string
        swatch?: string
      }[]
    | undefined
): EstimarTintasFileColorProfile => {
  const fromDetected = buildDeclaredSpotPreviewsFromDetectedColors(
    detectedColors,
    profile.pantoneSpotNames,
    profile.spotReferenceRgbs
  )
  if (fromDetected.length === 0) return profile

  return {
    ...profile,
    pantoneSpotNames: fromDetected.map(spot => spot.name),
    declaredSpots: fromDetected,
    hasSpotMetadata: true,
  }
}

export interface EstimarTintasFileColorProfile {
  sourceColorSpace: EstimarTintasSourceColorSpace
  pantoneSpotNames: readonly string[]
  declaredSpots: readonly EstimarTintasDeclaredSpotPreview[]
  spotReferenceRgbs: readonly [number, number, number][]
  hasSpotMetadata: boolean
  hasCmykOperatorSamples: boolean
  spotReferenceCount: number
}

export const buildEstimarTintasFileColorProfile = (params: {
  sourceColorSpace: EstimarTintasSourceColorSpace
  pantoneSpotNames?: readonly string[]
  spotReferenceRgbs?: readonly [number, number, number][]
  spotReferenceCount?: number
  cmykOperatorSampleCount?: number
}): EstimarTintasFileColorProfile => {
  const spotReferenceRgbs = params.spotReferenceRgbs ?? []
  const pantoneSpotNames = resolveEffectivePantoneSpotNames(
    params.pantoneSpotNames ?? [],
    spotReferenceRgbs
  )
  const declaredSpots = buildEstimarTintasDeclaredSpotPreviews(pantoneSpotNames, spotReferenceRgbs)

  return {
    sourceColorSpace: params.sourceColorSpace,
    pantoneSpotNames,
    declaredSpots,
    spotReferenceRgbs,
    hasSpotMetadata: pantoneSpotNames.length > 0,
    hasCmykOperatorSamples: (params.cmykOperatorSampleCount ?? 0) >= 2,
    spotReferenceCount: params.spotReferenceCount ?? spotReferenceRgbs.length,
  }
}
