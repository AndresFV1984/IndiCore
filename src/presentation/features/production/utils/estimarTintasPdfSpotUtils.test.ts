import { describe, expect, it } from 'vitest'
import {
  clusterSpotReferenceCandidatesForPantoneNames,
  extractPantoneSpotNamesFromPdfBytes,
  filterRgbForDeclaredPantoneSpots,
  isNearProcessPrimaryRgb,
  isPantoneSpotInkName,
  isPantoneVioletSpotRgb,
  isSecondaryInkLikeRgb,
  isYellowFamilyRgb,
  resolveActivePantoneNamesForReferences,
  resolveKnownPantoneDisplaySwatch,
  resolvePdfSpotReferenceRgbs,
  shouldExtractSpotReferenceRgbsFromImage,
} from './estimarTintasPdfSpotUtils'

describe('estimarTintasPdfSpotUtils', () => {
  it('detecta nombres Pantone spot y excluye process yellow', () => {
    const bytes = new TextEncoder().encode(
      '<< /Separation/PANTONE#20Yellow#20C >> PANTONE P Process Yellow C'
    )

    expect(isPantoneSpotInkName('PANTONE Yellow C')).toBe(true)
    expect(isPantoneSpotInkName('PANTONE P Process Yellow C')).toBe(false)
    expect(extractPantoneSpotNamesFromPdfBytes(bytes)).toEqual(['PANTONE Yellow C'])
  })

  it('normaliza ruido PDF en nombres Pantone duplicados', () => {
    const bytes = new TextEncoder().encode(
      'PANTONE Yellow C PANTONE Yellow C 15 0 R'
    )

    expect(extractPantoneSpotNamesFromPdfBytes(bytes)).toEqual(['PANTONE Yellow C'])
  })

  it('resuelve referencias RGB amarillas para Pantone Yellow C', () => {
    const references = resolvePdfSpotReferenceRgbs(['PANTONE Yellow C'], [
      [255, 217, 0],
      [57, 135, 201],
      [247, 201, 68],
    ])

    expect(references.some(([r, g, b]) => isYellowFamilyRgb(r, g, b))).toBe(true)
    expect(references).toContainEqual([247, 201, 68])
    expect(references.some(([r, g, b]) => r === 57 && g === 135 && b === 201)).toBe(false)
  })

  it('usa catálogo Pantone cuando el PDF no expone colores RGB en operadores', () => {
    const references = resolvePdfSpotReferenceRgbs(['PANTONE Yellow C'], [])

    expect(references.length).toBeGreaterThan(0)
    expect(references.some(([r, g, b]) => isYellowFamilyRgb(r, g, b))).toBe(true)
  })

  it('resuelve referencias violetas para Pantone Violet C y excluye cian del diseño', () => {
    const references = resolvePdfSpotReferenceRgbs(['PANTONE Violet C'], [
      [68, 0, 153],
      [0, 169, 224],
      [255, 212, 0],
      [87, 39, 141],
    ])

    expect(references).toContainEqual([68, 0, 153])
    expect(references).toContainEqual([87, 39, 141])
    expect(references.some(([r, g, b]) => r === 0 && g === 169 && b === 224)).toBe(false)
    expect(references.some(([r, g, b]) => r === 255 && g === 212)).toBe(false)
    expect(isPantoneVioletSpotRgb(0, 169, 224)).toBe(false)
  })

  it('acepta cualquier Pantone desconocido con croma suficiente y excluye primarios CMYK', () => {
    expect(filterRgbForDeclaredPantoneSpots(134, 49, 143, ['PANTONE 375 C'])).toBe(true)
    expect(filterRgbForDeclaredPantoneSpots(0, 169, 224, ['PANTONE 375 C'])).toBe(false)
    expect(isNearProcessPrimaryRgb(0, 169, 224)).toBe(true)
  })

  it('excluye secundarios del diseño salvo que coincidan con catálogo Pantone declarado', () => {
    expect(isSecondaryInkLikeRgb(228, 0, 43)).toBe(true)
    expect(filterRgbForDeclaredPantoneSpots(228, 0, 43, ['PANTONE Violet C'])).toBe(false)
    expect(filterRgbForDeclaredPantoneSpots(228, 0, 43, ['PANTONE 185 C'])).toBe(true)
  })

  it('agrupa referencias spot del PDF al color Pantone dominante y no al naranja decorativo', () => {
    const references = resolvePdfSpotReferenceRgbs(['PANTONE Violet C'], [
      [68, 0, 153],
      [255, 128, 0],
      [0, 169, 224],
    ])

    expect(references).toContainEqual([68, 0, 153])
    expect(references.some(([r, g, b]) => r === 255 && g === 128)).toBe(false)
    expect(references.some(([r, g, b]) => r === 0 && g === 169)).toBe(false)
  })

  it('expone swatch sólido de catálogo para Pantone 485 C y Yellow C', () => {
    expect(resolveKnownPantoneDisplaySwatch('PANTONE 485 C')).toBe('#da291c')
    expect(resolveKnownPantoneDisplaySwatch('PANTONE Yellow C')).toBe('#fedd00')
  })

  it('incluye referencias 485 C y las distingue de secundarios genéricos', () => {
    expect(filterRgbForDeclaredPantoneSpots(218, 41, 28, ['PANTONE 485 C'])).toBe(true)
    expect(filterRgbForDeclaredPantoneSpots(228, 0, 43, ['PANTONE Violet C'])).toBe(false)

    const references = resolvePdfSpotReferenceRgbs(['PANTONE 485 C'], [
      [218, 41, 28],
      [0, 169, 224],
    ])

    expect(references).toContainEqual([218, 41, 28])
    expect(references.some(([r, g, b]) => r === 0 && g === 169)).toBe(false)
  })

  it('limita referencias activas cuando el PDF declara varios Pantone pero solo usa uno', () => {
    const declaredNames = [
      'PANTONE 485 C',
      'PANTONE Rubine Red C',
      'PANTONE Strong Red C',
      'PANTONE 206 C',
      'PANTONE 704 C',
    ]
    const pdfFillColors = [[218, 41, 28], [0, 169, 224], [255, 212, 0]] as const

    const references = resolvePdfSpotReferenceRgbs(declaredNames, pdfFillColors)
    const activeNames = resolveActivePantoneNamesForReferences(references, declaredNames)

    expect(references.some(([r, g, b]) => r === 218 && g === 41 && b === 28)).toBe(true)
    expect(references.some(([r, g, b]) => r === 0 && g === 169 && b === 224)).toBe(false)
    expect(activeNames).toEqual(['PANTONE 485 C'])
    expect(references.length).toBeLessThanOrEqual(6)
  })

  it('conserva referencias de varios Pantone cuando el PDF usa colores distintos', () => {
    const declaredNames = ['PANTONE Yellow C', 'PANTONE 485 C']
    const pdfFillColors = [
      [255, 217, 0],
      [247, 201, 68],
      [218, 41, 28],
      [0, 169, 224],
    ] as const

    const clustered = clusterSpotReferenceCandidatesForPantoneNames(
      declaredNames,
      pdfFillColors.filter(([r, g, b]) => filterRgbForDeclaredPantoneSpots(r, g, b, declaredNames))
    )
    const references = resolvePdfSpotReferenceRgbs(declaredNames, pdfFillColors)
    const activeNames = resolveActivePantoneNamesForReferences(references, declaredNames)

    expect(clustered.some(([r, g, b]) => isYellowFamilyRgb(r, g, b))).toBe(true)
    expect(clustered.some(([r, g, b]) => r === 218 && g === 41 && b === 28)).toBe(true)
    expect(activeNames).toEqual(expect.arrayContaining(['PANTONE Yellow C', 'PANTONE 485 C']))
    expect(activeNames).toHaveLength(2)
  })

  it('no barrer la imagen cuando el PDF ya evidencia varios spots activos', () => {
    const declaredNames = ['PANTONE Yellow C', 'PANTONE 485 C']
    const references = resolvePdfSpotReferenceRgbs(declaredNames, [
      [255, 217, 0],
      [218, 41, 28],
    ])

    expect(shouldExtractSpotReferenceRgbsFromImage(declaredNames, references)).toBe(false)
  })

  it('no barrer la imagen cuando hay muchos Pantone declarados pero uno solo en uso', () => {
    const declaredNames = [
      'PANTONE 485 C',
      'PANTONE Rubine Red C',
      'PANTONE Strong Red C',
      'PANTONE 206 C',
      'PANTONE 704 C',
    ]

    expect(
      shouldExtractSpotReferenceRgbsFromImage(declaredNames, [[218, 41, 28]])
    ).toBe(false)
  })
})
