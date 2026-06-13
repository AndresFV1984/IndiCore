import { describe, expect, it } from 'vitest'
import { computeCortePliegoLayout } from './cortePliegoLayoutUtils'
import { solveCortePliegoBinPackingMm } from './cortePliegoBinPacking'

describe('cortePliegoBinPacking', () => {
  it('strip packing coloca 24 piezas en estantes horizontales', () => {
    const result = solveCortePliegoBinPackingMm({
      paperWidthMm: 700,
      paperHeightMm: 1000,
      pieceWidthMm: 100,
      pieceHeightMm: 50,
      pieceRotated: false,
      paperSwapped: false,
      totalPieces: 24,
    })

    expect(result).not.toBeNull()
    expect(result?.placements).toHaveLength(24)
    expect(result?.wasteAreaMm).toBe(700 * 1000 - 24 * 100 * 50)
  })

  it('skyline bottom-left coloca todas las piezas sin salir del pliego', () => {
    const result = solveCortePliegoBinPackingMm({
      paperWidthMm: 900,
      paperHeightMm: 650,
      pieceWidthMm: 450,
      pieceHeightMm: 325,
      pieceRotated: false,
      paperSwapped: false,
      totalPieces: 4,
    })

    expect(result?.placements).toHaveLength(4)
    for (const piece of result?.placements ?? []) {
      expect(piece.x + piece.width).toBeLessThanOrEqual(900 + 1e-6)
      expect(piece.y + piece.height).toBeLessThanOrEqual(650 + 1e-6)
    }
  })

  it('resuelve 32 piezas en menos de 200 ms', () => {
    const started = performance.now()
    const result = solveCortePliegoBinPackingMm({
      paperWidthMm: 640,
      paperHeightMm: 900,
      pieceWidthMm: 90,
      pieceHeightMm: 50,
      pieceRotated: false,
      paperSwapped: false,
      totalPieces: 32,
    })
    const elapsed = performance.now() - started

    expect(result).not.toBeNull()
    expect(result?.placements).toHaveLength(32)
    expect(elapsed).toBeLessThan(200)
  })
})

describe('computeCortePliegoLayout', () => {
  it('distribuye 24 etiquetas 10×5 en pliego 70×100 con mínimo desperdicio', () => {
    const layout = computeCortePliegoLayout(
      { ancho: '70', alto: '100', unidadMedida: 'cm' },
      {
        ancho: '10',
        alto: '5',
        unidadMedida: 'cm',
        piezasPorPliego: 24,
      }
    )

    expect(layout).not.toBeNull()
    expect(layout?.placements).toHaveLength(24)
    expect(layout?.usedWidth).toBeLessThanOrEqual(70)
    expect(layout?.usedHeight).toBeLessThanOrEqual(100)
  })

  it('distribuye 4 piezas 45×32.5 en pliego 65×90 rotando el papel (como 90×65)', () => {
    const layout = computeCortePliegoLayout(
      { ancho: '65', alto: '90', unidadMedida: 'cm' },
      {
        ancho: '45',
        alto: '32.5',
        unidadMedida: 'cm',
        piezasPorPliego: 4,
      }
    )

    expect(layout).not.toBeNull()
    expect(layout?.paperSwapped).toBe(true)
    expect(layout?.paperWidth).toBe(65)
    expect(layout?.paperHeight).toBe(90)
    expect(layout?.wasteArea).toBe(0)
    expect(layout?.placements).toHaveLength(4)
    for (const piece of layout?.placements ?? []) {
      expect(piece.x + piece.width).toBeLessThanOrEqual(65 + 1e-6)
      expect(piece.y + piece.height).toBeLessThanOrEqual(90 + 1e-6)
    }
  })

  it('distribuye 4 flyers 21×14.8 en pliego 70×100 en cuadrícula 2×2', () => {
    const layout = computeCortePliegoLayout(
      { ancho: '70', alto: '100', unidadMedida: 'cm' },
      {
        ancho: '21',
        alto: '14.8',
        unidadMedida: 'cm',
        piezasPorPliego: 4,
      }
    )

    expect(layout).not.toBeNull()
    expect(layout?.cols).toBe(2)
    expect(layout?.rows).toBe(2)
    expect(layout?.placements).toHaveLength(4)
  })

  it('retorna null si faltan medidas válidas', () => {
    expect(
      computeCortePliegoLayout(
        { ancho: '', alto: '100', unidadMedida: 'cm' },
        { ancho: '10', alto: '5', unidadMedida: 'cm', piezasPorPliego: 4 }
      )
    ).toBeNull()
  })

  it('calcula desperdicio en cm² como área pliego menos área útil de piezas', () => {
    const layout = computeCortePliegoLayout(
      { ancho: '70', alto: '100', unidadMedida: 'cm' },
      {
        ancho: '10',
        alto: '5',
        unidadMedida: 'cm',
        piezasPorPliego: 24,
      }
    )

    expect(layout?.paperArea).toBe(7000)
    expect(layout?.wasteArea).toBe(5800)
    expect(layout?.wastePercent).toBeCloseTo((5800 / 7000) * 100, 5)
  })

  it('reporta 0 desperdicio cuando el pliego se aprovecha por completo', () => {
    const layout = computeCortePliegoLayout(
      { ancho: '65', alto: '90', unidadMedida: 'cm' },
      {
        ancho: '45',
        alto: '32.5',
        unidadMedida: 'cm',
        piezasPorPliego: 4,
      }
    )

    expect(layout?.wasteArea).toBe(0)
    expect(layout?.wastePercent).toBe(0)
  })
})
