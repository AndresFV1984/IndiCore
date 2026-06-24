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

export interface EstimarTintasFileColorProfile {
  sourceColorSpace: EstimarTintasSourceColorSpace
  pantoneSpotNames: readonly string[]
  hasSpotMetadata: boolean
  hasCmykOperatorSamples: boolean
  spotReferenceCount: number
}

export const buildEstimarTintasFileColorProfile = (params: {
  sourceColorSpace: EstimarTintasSourceColorSpace
  pantoneSpotNames?: readonly string[]
  spotReferenceCount?: number
  cmykOperatorSampleCount?: number
}): EstimarTintasFileColorProfile => {
  const pantoneSpotNames = params.pantoneSpotNames ?? []
  return {
    sourceColorSpace: params.sourceColorSpace,
    pantoneSpotNames,
    hasSpotMetadata: pantoneSpotNames.length > 0,
    hasCmykOperatorSamples: (params.cmykOperatorSampleCount ?? 0) >= 2,
    spotReferenceCount: params.spotReferenceCount ?? 0,
  }
}
