import { describe, expect, it } from 'vitest'
import {
  applySimpleGcr,
  averageCmykCoverageFromImageData,
  countVisibleInkedPixelsFromImageData,
  computeCalibrationPreview,
  computeConversionFactorFromTiraje,
  computeInkGFromCoverage,
  computeInkVolumeMlFromCoverage,
  convertEstimarTintasMlToG,
  convertEstimarTintasVolumeFactorMlToG,
  ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G,
  ESTIMAR_TINTAS_INK_DENSITY_G_ML,
  ESTIMAR_TINTAS_VOLUME_FACTOR_ML_CM2,
  formatCalibrationDeltaPercent,
  formatConversionFactorForInput,
  formatEstimarTintasEntero,
  computeEstimarTintasInkTotalsSnapshot,
  computeEstimarTintasTotalInkGPerPliego,
  formatEstimarTintasWeightG,
  buildEstimarTintasEstimateOptions,
  ESTIMAR_TINTAS_ALGORITHM_DEFAULTS,
  ESTIMAR_TINTAS_MAX_SAMPLE_EDGE,
  getEstimarTintasDefaultPrintArea,
  getEstimarTintasSourceKind,
  rescaleEstimarTintasInkG,
  parseConversionFactorInput,
  pixelsToCm,
  processPixelCmyk,
  resolveDespiecePrintAreaCm,
  resolvePlanchaTotalPliegos,
  resolveSampleDimensions,
  rgbToCmyk,
  sumCmykCoverage,
  validateEstimarTintasFile,
} from './estimarTintasUtils'
import { pdfPointsToCm } from './estimarTintasPdfUtils'

const mockImageData = (width: number, height: number, rgba: number[]): ImageData =>
  ({
    width,
    height,
    data: new Uint8ClampedArray(rgba),
  }) as ImageData

describe('estimarTintasUtils', () => {
  it('expone valores por defecto de litografía offset en Colombia', () => {
    expect(getEstimarTintasDefaultPrintArea()).toEqual({
      widthCm: 70,
      heightCm: 100,
      dpi: 300,
      conversionFactorG: ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G,
    })
    expect(ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G).toBeCloseTo(
      ESTIMAR_TINTAS_VOLUME_FACTOR_ML_CM2 * ESTIMAR_TINTAS_INK_DENSITY_G_ML,
      10
    )
    expect(ESTIMAR_TINTAS_ALGORITHM_DEFAULTS.maxSampleEdge).toBe(ESTIMAR_TINTAS_MAX_SAMPLE_EDGE)
    expect(ESTIMAR_TINTAS_MAX_SAMPLE_EDGE).toBeGreaterThanOrEqual(1024)
  })

  it('aplica opciones por defecto del algoritmo al estimar', () => {
    expect(
      buildEstimarTintasEstimateOptions({
        widthCm: 21,
        heightCm: 29.7,
        dpi: 300,
        conversionFactorG: ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G,
      })
    ).toEqual({
      widthCm: 21,
      heightCm: 29.7,
      dpi: 300,
      conversionFactorG: ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G,
      referenceDpi: 300,
      maxSampleEdge: ESTIMAR_TINTAS_MAX_SAMPLE_EDGE,
      alphaMin: 64,
      sourceColorSpace: 'rgb',
      spotReferenceRgbs: undefined,
      pantoneSpotNames: undefined,
      cmykOperatorSamples: undefined,
    })
  })

  it('reescala gramos sin alterar la cobertura muestreada', () => {
    const coverage = { c: 0.2, m: 0.1, y: 0.05, k: 0.15 }
    const params = {
      widthCm: 10,
      heightCm: 20,
      conversionFactorG: ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G,
    }
    const inkG = computeInkGFromCoverage(coverage, params)
    const base = {
      coverage,
      inkG,
      sampledPixels: 100,
      inkedPixels: 80,
      sampleWidth: 10,
      sampleHeight: 10,
      imageWidthPx: 1000,
      imageHeightPx: 1000,
      averageTac: 0.5,
    }

    const rescaled = rescaleEstimarTintasInkG(base, {
      ...params,
      conversionFactorG: ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G * 2,
    })

    expect(rescaled.coverage).toEqual(base.coverage)
    expect(sumCmykCoverage(rescaled.inkG)).toBeCloseTo(sumCmykCoverage(base.inkG) * 2, 10)
  })

  it('convierte ml a gramos con densidad offset', () => {
    expect(convertEstimarTintasMlToG(1)).toBeCloseTo(1.05, 6)
    expect(convertEstimarTintasVolumeFactorMlToG(0.0002)).toBeCloseTo(0.00021, 10)
  })

  it('suma tamaños buenos y sobrante de la plancha', () => {
    expect(resolvePlanchaTotalPliegos({ tamanosBuenos: 1200, sobrante: 150 })).toBe(1350)
    expect(formatEstimarTintasEntero(1350)).toBe('1.350')
  })

  it('resuelve el área de impresión desde el despiece', () => {
    expect(
      resolveDespiecePrintAreaCm({ ancho: '21', alto: '14,8', unidadMedida: 'cm' } as never)
    ).toEqual({ widthCm: 21, heightCm: 14.8 })
    expect(resolveDespiecePrintAreaCm(null)).toBeNull()
    expect(resolveDespiecePrintAreaCm({ ancho: '0', alto: '10' } as never)).toBeNull()
  })

  it('coincide gramos directos con volumen × densidad', () => {
    const coverage = { c: 0.5, m: 0.25, y: 0.1, k: 0.05 }
    const params = { widthCm: 10, heightCm: 20 }

    const inkG = computeInkGFromCoverage(coverage, {
      ...params,
      conversionFactorG: convertEstimarTintasVolumeFactorMlToG(0.001),
    })
    const volumeMl = computeInkVolumeMlFromCoverage(coverage, {
      ...params,
      conversionFactorMl: 0.001,
    })

    expect(inkG.c).toBeCloseTo(convertEstimarTintasMlToG(volumeMl.c), 10)
    expect(sumCmykCoverage(inkG)).toBeCloseTo(
      convertEstimarTintasMlToG(sumCmykCoverage(volumeMl)),
      10
    )
  })

  it('formatea pesos siempre en gramos', () => {
    expect(formatEstimarTintasWeightG(0)).toBe('—')
    expect(formatEstimarTintasWeightG(0.0023)).toBe('0.0023 grm')
    expect(formatEstimarTintasWeightG(0.045)).toBe('0.045 grm')
    expect(formatEstimarTintasWeightG(1.234)).toBe('1.23 grm')
  })

  it('cuantiza pedido desde Total estimado mostrado × pliegos', () => {
    const snapshot = computeEstimarTintasInkTotalsSnapshot(
      {
        inkG: { c: 0.004, m: 0, y: 0, k: 0 },
        detectedColors: [
          {
            index: 5,
            name: '485 C',
            category: 'pantone' as const,
            swatch: '#e4002b',
            coverage: 0.12,
            inkG: 0.002546,
          },
        ],
      },
      2600
    )

    expect(snapshot.perPliego.processInkG).toBeCloseTo(0.004, 6)
    expect(snapshot.perPliego.pantoneInkG).toBeCloseTo(0.0025, 6)
    expect(snapshot.pedido!.processInkG).toBeCloseTo(10.4, 6)
    expect(snapshot.pedido!.pantoneInkG).toBeCloseTo(6.5, 6)
    expect(snapshot.pedido!.totalInkG).toBeCloseTo(16.9, 6)
  })

  it('desglosa totales CMYK, Pantone y unificado por pliego y pedido', () => {
    const result = {
      inkG: { c: 1.2, m: 0.9, y: 0.5, k: 1.4 },
      detectedColors: [
        {
          index: 5,
          name: '485 C',
          category: 'pantone' as const,
          swatch: '#e4002b',
          coverage: 0.12,
          inkG: 0.8,
        },
      ],
    }

    const snapshot = computeEstimarTintasInkTotalsSnapshot(result, 100)

    expect(snapshot.perPliego.processInkG).toBeCloseTo(4, 6)
    expect(snapshot.perPliego.pantoneInkG).toBeCloseTo(0.8, 6)
    expect(snapshot.perPliego.totalInkG).toBeCloseTo(4.8, 6)
    expect(snapshot.perPliego.totalInkG).toBeCloseTo(
      computeEstimarTintasTotalInkGPerPliego(result),
      6
    )

    expect(snapshot.pedido).not.toBeNull()
    expect(snapshot.pedido!.processInkG).toBeCloseTo(400, 6)
    expect(snapshot.pedido!.pantoneInkG).toBeCloseTo(80, 6)
    expect(snapshot.pedido!.totalInkG).toBeCloseTo(480, 6)
  })

  it('omite pedido cuando no hay pliegos', () => {
    const snapshot = computeEstimarTintasInkTotalsSnapshot(
      {
        inkG: { c: 1, m: 1, y: 1, k: 1 },
        detectedColors: [],
      },
      0
    )

    expect(snapshot.pedido).toBeNull()
    expect(snapshot.perPliego.totalInkG).toBeCloseTo(4, 6)
  })

  it('convierte blanco a CMYK cero', () => {
    expect(rgbToCmyk(255, 255, 255)).toEqual({ c: 0, m: 0, y: 0, k: 0 })
  })

  it('convierte negro a K pleno', () => {
    expect(rgbToCmyk(0, 0, 0)).toEqual({ c: 0, m: 0, y: 0, k: 1 })
  })

  it('aplica GCR simplificado sobre grises ricos en CMY', () => {
    expect(applySimpleGcr({ c: 0.4, m: 0.4, y: 0.4, k: 0.2 })).toEqual({
      c: 0.06,
      m: 0.06,
      y: 0.06,
      k: 0.54,
    })
  })

  it('calcula cobertura promedio sobre píxeles con tinta', () => {
    const imageData = mockImageData(2, 1, [
      255, 0, 0, 255,
      0, 0, 0, 255,
    ])

    expect(averageCmykCoverageFromImageData(imageData, 0).coverage).toEqual({
      c: 0,
      m: 0.5,
      y: 0.5,
      k: 0.5,
    })
  })

  it('ignora píxeles transparentes y papel blanco al promediar', () => {
    const imageData = mockImageData(3, 1, [
      255, 255, 255, 255,
      255, 255, 255, 0,
      0, 0, 0, 255,
    ])

    const result = averageCmykCoverageFromImageData(imageData, 64)
    expect(result.coverage).toEqual({ c: 0, m: 0, y: 0, k: 1 })
    expect(result.inkedPixels).toBe(1)
  })

  it('devuelve CMYK cero cuando todos los píxeles con tinta son Pantone', async () => {
    const imageData = mockImageData(3, 1, [
      255, 255, 255, 0,
      68, 0, 153, 255,
      87, 39, 141, 255,
    ])
    const { isEstimarTintasPantonePixel } = await import('./estimarTintasImageColorsUtils')
    const options = {
      spotReferenceRgbs: [[68, 0, 153], [87, 39, 141]] as const,
      pantoneSpotNames: ['PANTONE Violet C'],
    }

    const result = averageCmykCoverageFromImageData(
      imageData,
      0,
      0.985,
      (r, g, b) => isEstimarTintasPantonePixel(r, g, b, options)
    )

    expect(result.coverage).toEqual({ c: 0, m: 0, y: 0, k: 0 })
    expect(result.inkedPixels).toBe(0)
    expect(countVisibleInkedPixelsFromImageData(imageData, 0)).toBe(2)
  })

  it('reduce dimensiones de muestreo conservando proporción', () => {
    expect(resolveSampleDimensions(2000, 1000, 512)).toEqual({
      width: 512,
      height: 256,
    })
  })

  it('convierte píxeles a centímetros según DPI', () => {
    expect(pixelsToCm(300, 300)).toBeCloseTo(2.54, 4)
  })

  it('estima gramos por canal usando área física y cobertura', () => {
    const coverage = { c: 0.5, m: 0.25, y: 0.1, k: 0.05 }
    const inkG = computeInkGFromCoverage(coverage, {
      widthCm: 10,
      heightCm: 20,
      conversionFactorG: 0.001,
    })

    expect(inkG.c).toBeCloseTo(0.1, 6)
    expect(inkG.m).toBeCloseTo(0.05, 6)
    expect(inkG.y).toBeCloseTo(0.02, 6)
    expect(inkG.k).toBeCloseTo(0.01, 6)
    expect(sumCmykCoverage(inkG)).toBeCloseTo(0.18, 6)
  })

  it('procesa píxeles con TAC acotado', () => {
    const processed = processPixelCmyk(50, 50, 50)
    expect(processed.c + processed.m + processed.y + processed.k).toBeLessThanOrEqual(3.001)
  })

  it('acepta imágenes y PDF para estimar tintas', () => {
    expect(getEstimarTintasSourceKind({ name: 'arte.jpg', type: 'image/jpeg' } as File)).toBe('image')
    expect(getEstimarTintasSourceKind({ name: 'arte.pdf', type: 'application/pdf' } as File)).toBe('pdf')
    expect(getEstimarTintasSourceKind({ name: 'arte.txt', type: 'text/plain' } as File)).toBeNull()
    expect(validateEstimarTintasFile({ name: 'arte.pdf', type: 'application/pdf', size: 1024 } as File)).toBeNull()
  })

  it('convierte puntos PDF a centímetros', () => {
    expect(pdfPointsToCm(72)).toBeCloseTo(2.54, 4)
  })

  it('calibra el factor de conversión a partir del tiraje medido', () => {
    const coverage = { c: 0.2, m: 0.15, y: 0.1, k: 0.05 }
    const factor = computeConversionFactorFromTiraje({
      coverage,
      widthCm: 70,
      heightCm: 100,
      measuredGTotal: 12.5,
    })

    const inkG = computeInkGFromCoverage(coverage, {
      widthCm: 70,
      heightCm: 100,
      conversionFactorG: factor,
    })

    expect(sumCmykCoverage(inkG)).toBeCloseTo(12.5, 6)
  })

  it('formatea y parsea el factor de conversión sin perder precisión', () => {
    const formatted = formatConversionFactorForInput(0.0002375)
    expect(formatted).toBe('0.0002375')
    expect(parseConversionFactorInput(formatted)).toBeCloseTo(0.0002375, 10)
    expect(parseConversionFactorInput('1,25e-4')).toBeCloseTo(0.000125, 10)
  })

  it('previsualiza el ajuste de calibración antes de aplicarlo', () => {
    const coverage = { c: 0.2, m: 0.15, y: 0.1, k: 0.05 }
    const currentFactorG = ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G
    const inkG = computeInkGFromCoverage(coverage, {
      widthCm: 70,
      heightCm: 100,
      conversionFactorG: currentFactorG,
    })
    const currentTotalG = sumCmykCoverage(inkG)

    const preview = computeCalibrationPreview({
      coverage,
      widthCm: 70,
      heightCm: 100,
      currentFactorG,
      currentTotalG,
      measuredGTotal: currentTotalG * 1.5,
    })

    expect(preview.projectedFactorG).toBeCloseTo(currentFactorG * 1.5, 10)
    expect(preview.deviationPercent).toBeCloseTo(50, 4)
    expect(formatCalibrationDeltaPercent(preview.deviationPercent)).toBe('+50.0 %')
  })
})
