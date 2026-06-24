import { describe, expect, it } from 'vitest'
import {
  buildEstimarTintasFileColorProfile,
  detectJpegColorSpaceFromBytes,
  detectPdfColorSpaceFromBytes,
  resolveEstimarTintasColorAnalysisAlgorithm,
} from './estimarTintasColorSpaceUtils'

describe('estimarTintasColorSpaceUtils', () => {
  it('detecta PDF CMYK y mixto', () => {
    const cmykBytes = new TextEncoder().encode('<< /ColorSpace /DeviceCMYK >>')
    const mixedBytes = new TextEncoder().encode(
      '<< /Separation/PANTONE#20Yellow#20C /DeviceCMYK /DeviceRGB >>'
    )

    expect(detectPdfColorSpaceFromBytes(cmykBytes)).toBe('cmyk')
    expect(detectPdfColorSpaceFromBytes(mixedBytes)).toBe('mixed')
  })

  it('detecta JPEG CMYK por componentes SOF', () => {
    const jpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xc0, 0x00, 0x08, 0x08, 0x00, 0x01, 0x00, 0x01, 0x04,
    ])

    expect(detectJpegColorSpaceFromBytes(jpeg)).toBe('cmyk')
  })

  it('resuelve algoritmo según espacio de color y muestras CMYK', () => {
    expect(resolveEstimarTintasColorAnalysisAlgorithm('rgb', false)).toBe('rgb-raster')
    expect(resolveEstimarTintasColorAnalysisAlgorithm('cmyk', true)).toBe('cmyk-operators')
    expect(resolveEstimarTintasColorAnalysisAlgorithm('mixed', false)).toBe('rgb-raster-cmyk-source')
  })

  it('construye perfil de color del archivo con spots Pantone', () => {
    const profile = buildEstimarTintasFileColorProfile({
      sourceColorSpace: 'mixed',
      pantoneSpotNames: ['PANTONE Yellow C'],
      spotReferenceCount: 3,
      cmykOperatorSampleCount: 4,
    })

    expect(profile.hasSpotMetadata).toBe(true)
    expect(profile.hasCmykOperatorSamples).toBe(true)
    expect(profile.spotReferenceCount).toBe(3)
  })
})
