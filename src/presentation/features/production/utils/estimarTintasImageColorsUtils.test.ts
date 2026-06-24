import { describe, expect, it } from 'vitest'
import { DISENO_INK_PANTONE_INDEX } from '../constants/preprensaDisenoColors'
import {
  consolidateDetectedPantoneColors,
  computeDetectedInkColorsFromImageData,
  classifyPixelToInkIndex,
  filterPantoneDetectedColorsForDisplay,
  isEstimarTintasPantonePixel,
  resolveEstimarTintasInkCategory,
  resolveEstimarTintasInkDisplayName,
  resolveEstimarTintasPantoneDisplaySwatch,
  sortPantoneDetectedColorsForDisplay,
} from './estimarTintasImageColorsUtils'
import { buildEstimarTintasSpotReferences } from './estimarTintasPdfSpotUtils'
import {
  averageCmykCoverageFromImageData,
  computeEstimarTintasTotalInkGPerPliego,
  ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G as DEFAULT_FACTOR,
} from './estimarTintasUtils'

const mockImageData = (width: number, height: number, rgba: number[]): ImageData =>
  ({
    width,
    height,
    data: new Uint8ClampedArray(rgba),
  }) as ImageData

describe('estimarTintasImageColorsUtils', () => {
  it('no infiere Pantone en imágenes sin spot del PDF; el color va a CMYK', () => {
    const imageData = mockImageData(4, 1, [
      255, 217, 0, 255,
      0, 94, 184, 255,
      228, 0, 43, 255,
      255, 255, 255, 255,
    ])

    const colors = computeDetectedInkColorsFromImageData(
      imageData,
      { widthCm: 10, heightCm: 10, conversionFactorG: DEFAULT_FACTOR },
      0
    )

    expect(colors).toHaveLength(0)
    expect(isEstimarTintasPantonePixel(255, 128, 0)).toBe(false)
    expect(classifyPixelToInkIndex(255, 217, 0)).toBe(2)
    expect(classifyPixelToInkIndex(228, 0, 43)).toBe(4)
  })

  it('clasifica Pantone Yellow C del PDF como Pantone con tono dominante amarillo', () => {
    const imageData = mockImageData(3, 1, [
      255, 217, 0, 255,
      247, 201, 68, 255,
      255, 255, 255, 255,
    ])

    const colors = computeDetectedInkColorsFromImageData(
      imageData,
      {
        widthCm: 10,
        heightCm: 10,
        conversionFactorG: DEFAULT_FACTOR,
        spotReferenceRgbs: [[255, 217, 0], [247, 201, 68]],
        pantoneSpotNames: ['PANTONE Yellow C'],
      },
      0
    )

    expect(colors).toHaveLength(1)
    const pantone = colors[0]
    expect(pantone?.name).toBe('Pantone Yellow C')
    expect(pantone?.representativeSwatch).toBe('#fedd00')
    expect(pantone?.matchedPixels).toBe(2)
  })

  it('agrupa variantes del mismo Pantone Yellow C en una sola entrada', () => {
    const imageData = mockImageData(5, 1, [
      255, 217, 0, 255,
      247, 201, 68, 255,
      252, 208, 8, 255,
      255, 128, 0, 255,
      255, 255, 255, 255,
    ])

    const colors = computeDetectedInkColorsFromImageData(
      imageData,
      {
        widthCm: 10,
        heightCm: 10,
        conversionFactorG: DEFAULT_FACTOR,
        spotReferenceRgbs: [
          [255, 217, 0],
          [247, 201, 68],
          [252, 208, 8],
          [200, 160, 40],
        ],
        pantoneSpotNames: ['PANTONE Yellow C', 'PANTONE Yellow C 15 0 R'],
      },
      0
    )

    expect(colors).toHaveLength(1)
    expect(colors[0]?.name).toBe('Pantone Yellow C')
    expect(colors[0]?.matchedPixels).toBeGreaterThanOrEqual(3)
  })

  it('separa varios Pantone cuando hay referencias spot distintas', () => {
    const imageData = mockImageData(6, 1, [
      255, 217, 0, 255,
      254, 221, 0, 255,
      228, 0, 43, 255,
      230, 0, 38, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
    ])

    const colors = computeDetectedInkColorsFromImageData(
      imageData,
      {
        widthCm: 10,
        heightCm: 10,
        conversionFactorG: DEFAULT_FACTOR,
        spotReferenceRgbs: [
          [255, 217, 0],
          [228, 0, 43],
        ],
        pantoneSpotNames: ['PANTONE Yellow C', 'PANTONE 185 C'],
      },
      0
    )

    expect(colors.length).toBeGreaterThanOrEqual(2)
    expect(colors.some(item => /yellow/i.test(item.name))).toBe(true)
    expect(colors.some(item => /185/i.test(item.name))).toBe(true)
  })

  it('detecta Pantone amarillo rasterizado aunque el RGB difiera levemente del catálogo', () => {
    const imageData = mockImageData(4, 1, [
      252, 208, 8, 255,
      251, 207, 10, 255,
      250, 205, 12, 255,
      255, 255, 255, 255,
    ])

    const colors = computeDetectedInkColorsFromImageData(
      imageData,
      {
        widthCm: 10,
        heightCm: 10,
        conversionFactorG: DEFAULT_FACTOR,
        spotReferenceRgbs: [[254, 221, 0]],
        pantoneSpotNames: ['PANTONE Yellow C'],
      },
      0
    )

    expect(colors).toHaveLength(1)
    expect(colors[0]?.matchedPixels).toBe(3)
  })

  it('excluye píxeles Pantone del promedio CMYK', () => {
    const imageData = mockImageData(2, 1, [
      255, 217, 0, 255,
      228, 0, 43, 255,
    ])
    const spotReferenceRgbs = [[255, 217, 0]] as const
    const options = {
      spotReferenceRgbs,
      pantoneSpotNames: ['PANTONE Yellow C'],
    }

    const withPantoneSkip = averageCmykCoverageFromImageData(
      imageData,
      0,
      0.985,
      (r, g, b) => isEstimarTintasPantonePixel(r, g, b, options)
    )
    const withoutSkip = averageCmykCoverageFromImageData(imageData, 0, 0.985)

    expect(withPantoneSkip.coverage.y).toBeLessThan(withoutSkip.coverage.y)
    expect(withPantoneSkip.inkedPixels).toBe(1)
  })

  it('suma CMYK y Pantone en el total estimado por pliego', () => {
    const result = {
      inkG: { c: 0.1, m: 0.1, y: 0.1, k: 0.1 },
      detectedColors: [
        {
          index: DISENO_INK_PANTONE_INDEX,
          name: 'Pantone',
          category: 'pantone' as const,
          swatch: 'pantone-mix',
          coverage: 0.5,
          inkG: 0.2,
          matchedPixels: 100,
        },
      ],
    }

    expect(computeEstimarTintasTotalInkGPerPliego(result)).toBeCloseTo(0.6, 6)
  })

  it('detecta PANTONE Violet C cuando el PDF declara el spot', () => {
    const imageData = mockImageData(3, 1, [
      255, 255, 255, 0,
      68, 0, 153, 255,
      87, 39, 141, 255,
    ])

    const colors = computeDetectedInkColorsFromImageData(
      imageData,
      {
        widthCm: 14,
        heightCm: 25.1,
        conversionFactorG: DEFAULT_FACTOR,
        spotReferenceRgbs: [[68, 0, 153], [87, 39, 141]],
        pantoneSpotNames: ['PANTONE Violet C'],
      },
      0
    )

    expect(colors).toHaveLength(1)
    expect(colors[0]?.name).toBe('Pantone Violet C')
    expect(colors[0]?.matchedPixels).toBe(2)
  })

  it('mantiene cian y otros colores básicos en CMYK cuando hay Pantone Violet C', () => {
    const imageData = mockImageData(4, 1, [
      68, 0, 153, 255,
      0, 169, 224, 255,
      255, 212, 0, 255,
      255, 255, 255, 0,
    ])
    const options = {
      spotReferenceRgbs: [[68, 0, 153], [87, 39, 141]] as const,
      pantoneSpotNames: ['PANTONE Violet C'],
    }

    const withPantoneSkip = averageCmykCoverageFromImageData(
      imageData,
      0,
      0.985,
      (r, g, b) => isEstimarTintasPantonePixel(r, g, b, options)
    )

    expect(withPantoneSkip.inkedPixels).toBe(2)
    expect(withPantoneSkip.coverage.c).toBeGreaterThan(0)
    expect(isEstimarTintasPantonePixel(0, 169, 224, options)).toBe(false)
    expect(isEstimarTintasPantonePixel(68, 0, 153, options)).toBe(true)
  })

  it('descompone secundarios en CMYK y no los lista como Pantone aunque haya spot en el PDF', () => {
    const options = {
      spotReferenceRgbs: [[68, 0, 153]] as const,
      pantoneSpotNames: ['PANTONE Violet C'],
    }

    expect(isEstimarTintasPantonePixel(228, 0, 43, options)).toBe(false)
    expect(classifyPixelToInkIndex(228, 0, 43, options)).toBe(4)
    expect(classifyPixelToInkIndex(0, 94, 184, options)).toBe(5)
  })

  it('detecta un Pantone genérico no catalogado cuando el PDF lo declara', () => {
    const imageData = mockImageData(2, 1, [
      134, 49, 143, 255,
      255, 255, 255, 255,
    ])

    const colors = computeDetectedInkColorsFromImageData(
      imageData,
      {
        widthCm: 10,
        heightCm: 10,
        conversionFactorG: DEFAULT_FACTOR,
        spotReferenceRgbs: [[134, 49, 143]],
        pantoneSpotNames: ['PANTONE 375 C'],
      },
      0
    )

    expect(colors).toHaveLength(1)
    expect(colors[0]?.name).toBe('Pantone 375 C')
  })

  it('marca Pantone solo cuando el píxel coincide con un spot declarado en el PDF', () => {
    const spotReferenceRgbs = [[255, 128, 0]] as const
    expect(
      isEstimarTintasPantonePixel(255, 128, 0, {
        spotReferenceRgbs,
        pantoneSpotNames: ['PANTONE 021 C'],
      })
    ).toBe(true)
    expect(isEstimarTintasPantonePixel(255, 128, 0)).toBe(false)
  })

  it('detecta Pantone 485 C con swatch de catálogo', () => {
    const imageData = mockImageData(2, 1, [
      218, 41, 28, 255,
      255, 255, 255, 255,
    ])

    const colors = computeDetectedInkColorsFromImageData(
      imageData,
      {
        widthCm: 10,
        heightCm: 10,
        conversionFactorG: DEFAULT_FACTOR,
        spotReferenceRgbs: [[218, 41, 28]],
        pantoneSpotNames: ['PANTONE 485 C'],
      },
      0
    )

    expect(colors).toHaveLength(1)
    expect(colors[0]?.name).toBe('Pantone 485 C')
    expect(colors[0]?.representativeSwatch).toBe('#da291c')
    expect(resolveEstimarTintasPantoneDisplaySwatch(colors[0]!)).toBe('#da291c')
  })

  it('colapsa ruido de antialiasing pero conserva varios Pantone reales', () => {
    const dominant = {
      index: DISENO_INK_PANTONE_INDEX,
      name: 'Pantone 485 C',
      category: 'pantone' as const,
      swatch: 'pantone-mix',
      representativeSwatch: '#da291c',
      coverage: 0.45,
      inkG: 1,
      matchedPixels: 700,
    }
    const secondary = {
      index: DISENO_INK_PANTONE_INDEX + 1,
      name: 'Pantone Yellow C',
      category: 'pantone' as const,
      swatch: 'pantone-mix',
      representativeSwatch: '#fedd00',
      coverage: 0.25,
      inkG: 0.5,
      matchedPixels: 250,
    }
    const noise = {
      index: DISENO_INK_PANTONE_INDEX + 2,
      name: 'Pantone 185 C',
      category: 'pantone' as const,
      swatch: 'pantone-mix',
      representativeSwatch: '#e4002b',
      coverage: 0.02,
      inkG: 0.1,
      matchedPixels: 40,
    }

    const consolidated = consolidateDetectedPantoneColors(
      [dominant, secondary, noise],
      1000,
      10
    )

    expect(consolidated).toHaveLength(2)
    expect(consolidated.some(item => /485/i.test(item.name))).toBe(true)
    expect(consolidated.some(item => /yellow/i.test(item.name))).toBe(true)
  })

  it('colapsa a un solo Pantone cuando el resto es ruido por debajo del umbral', () => {
    const dominant = {
      index: DISENO_INK_PANTONE_INDEX,
      name: 'Pantone 485 C',
      category: 'pantone' as const,
      swatch: 'pantone-mix',
      representativeSwatch: '#da291c',
      coverage: 0.45,
      inkG: 1,
      matchedPixels: 900,
    }
    const noise = {
      index: DISENO_INK_PANTONE_INDEX + 1,
      name: 'Pantone 185 C',
      category: 'pantone' as const,
      swatch: 'pantone-mix',
      representativeSwatch: '#e4002b',
      coverage: 0.02,
      inkG: 0.1,
      matchedPixels: 40,
    }

    const consolidated = consolidateDetectedPantoneColors([dominant, noise], 1000, 10)

    expect(consolidated).toHaveLength(1)
    expect(consolidated[0]?.name).toBe('Pantone 485 C')
    expect(consolidated[0]?.matchedPixels).toBe(940)
  })

  it('muestra dos Pantone cuando ambos tienen presencia significativa en la imagen', () => {
    const imageData = mockImageData(100, 1, [
      ...Array.from({ length: 70 }, () => [218, 41, 28, 255]).flat(),
      ...Array.from({ length: 25 }, () => [255, 217, 0, 255]).flat(),
      ...Array.from({ length: 5 }, () => [255, 255, 255, 255]).flat(),
    ])
    const declaredNames = ['PANTONE 485 C', 'PANTONE Yellow C']
    const spotReferenceRgbs = buildEstimarTintasSpotReferences(
      declaredNames,
      [
        [218, 41, 28],
        [255, 217, 0],
      ],
      []
    )

    const colors = computeDetectedInkColorsFromImageData(
      imageData,
      {
        widthCm: 10,
        heightCm: 10,
        conversionFactorG: DEFAULT_FACTOR,
        spotReferenceRgbs,
        pantoneSpotNames: declaredNames,
      },
      0
    )

    expect(colors).toHaveLength(2)
    expect(colors.some(item => /485/i.test(item.name))).toBe(true)
    expect(colors.some(item => /yellow/i.test(item.name))).toBe(true)
  })

  it('declara varios Pantone en PDF pero detecta solo el usado en la imagen (485 C)', () => {
    const declaredNames = [
      'PANTONE 485 C',
      'PANTONE Rubine Red C',
      'PANTONE Strong Red C',
      'PANTONE 206 C',
      'PANTONE 704 C',
    ]
    const pdfSpotReferences = [[218, 41, 28] as const]
    const spotReferenceRgbs = buildEstimarTintasSpotReferences(
      declaredNames,
      pdfSpotReferences,
      []
    )

    expect(spotReferenceRgbs.some(([r, g, b]) => r === 218 && g === 41 && b === 28)).toBe(true)
    expect(spotReferenceRgbs.length).toBeLessThanOrEqual(6)

    const imageData = mockImageData(20, 1, [
      ...Array.from({ length: 18 }, () => [218, 41, 28, 255]).flat(),
      228, 0, 43, 255,
      255, 255, 255, 255,
    ])

    const colors = computeDetectedInkColorsFromImageData(
      imageData,
      {
        widthCm: 10,
        heightCm: 10,
        conversionFactorG: DEFAULT_FACTOR,
        spotReferenceRgbs,
        pantoneSpotNames: declaredNames,
      },
      0
    )

    expect(colors).toHaveLength(1)
    expect(colors[0]?.name).toBe('Pantone 485 C')
    expect(colors[0]?.matchedPixels).toBeGreaterThanOrEqual(18)
  })

  it('filtra la UI a solo entradas Pantone', () => {
    const colors = sortPantoneDetectedColorsForDisplay([
      {
        index: DISENO_INK_PANTONE_INDEX,
        name: 'Pantone',
        category: 'pantone',
        swatch: 'pantone-mix',
        representativeSwatch: '#ffd900',
        coverage: 0.4,
        inkG: 1,
        matchedPixels: 10,
      },
    ])

    expect(filterPantoneDetectedColorsForDisplay(colors)).toHaveLength(1)
  })
})
