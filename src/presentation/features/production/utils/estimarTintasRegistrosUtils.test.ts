import { describe, expect, it } from 'vitest'
import type { ImpresionEstimarTintasRegistro } from '../../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import {
  buildEstimarTintasCobroResumen,
  buildEstimarTintasTableRows,
  createImpresionEstimarTintasEntrada,
  emptyImpresionEstimarTintasRegistro,
  isImpresionEstimarTintasPlanchaCompleta,
  patchImpresionEstimarTintasRegistro,
  resolveEstimarTintasCompletedPlanchaIds,
  syncImpresionEstimarTintasRegistros,
} from './estimarTintasRegistrosUtils'

const plancha = (id: string): DisenoColorPlanchaItem =>
  ({
    id,
    colores: 4,
    planchaNombreMedida: `Plancha ${id}`,
  }) as DisenoColorPlanchaItem

const sampleResult = {
  coverage: { c: 0.1, m: 0.08, y: 0.05, k: 0.12 },
  inkG: { c: 1.2, m: 0.9, y: 0.5, k: 1.4 },
  sampledPixels: 1000,
  inkedPixels: 800,
  sampleWidth: 100,
  sampleHeight: 100,
  imageWidthPx: 200,
  imageHeightPx: 200,
  averageTac: 0.35,
}

describe('estimarTintasRegistrosUtils', () => {
  it('sync creates one registro slot per plancha like tintas', () => {
    const synced = syncImpresionEstimarTintasRegistros([plancha('a'), plancha('b')])
    expect(synced).toHaveLength(2)
    expect(synced.every(item => item.entradas.length === 0)).toBe(true)
  })

  it('patches entrada into registro and builds table rows', () => {
    const synced = syncImpresionEstimarTintasRegistros([plancha('a')])
    const entrada = createImpresionEstimarTintasEntrada({
      fileName: 'arte.pdf',
      sourceKind: 'pdf',
      widthCm: 21,
      heightCm: 29.7,
      dpi: 300,
      conversionFactorG: 0.00021,
      result: sampleResult,
      totalPliegos: 1200,
    })

    const next = patchImpresionEstimarTintasRegistro(synced, {
      ...emptyImpresionEstimarTintasRegistro('a'),
      entradas: [entrada],
    })

    expect(isImpresionEstimarTintasPlanchaCompleta(next[0]!)).toBe(true)
    expect(resolveEstimarTintasCompletedPlanchaIds(next)).toEqual(['a'])
    expect(buildEstimarTintasTableRows([plancha('a')], next)).toHaveLength(1)
  })

  it('migrates legacy flat registro shape into entradas', () => {
    const legacy = {
      id: 'legacy-1',
      colorPlanchaId: 'a',
      fileName: 'legacy.jpg',
      sourceKind: 'image' as const,
      widthCm: 10,
      heightCm: 15,
      dpi: 300,
      conversionFactorG: 0.00021,
      coverage: sampleResult.coverage,
      inkG: sampleResult.inkG,
      totalInkG: 4,
      totalPliegos: 100,
      averageTac: 0.35,
      calculatedAt: '2026-01-01T00:00:00.000Z',
    }

    const synced = syncImpresionEstimarTintasRegistros([plancha('a')], [legacy])
    expect(synced[0]?.entradas).toHaveLength(1)
    expect(synced[0]?.entradas[0]?.fileName).toBe('legacy.jpg')
  })

  it('removes orphan registros when plancha is deleted from preprensa', () => {
    const registros: ImpresionEstimarTintasRegistro[] = syncImpresionEstimarTintasRegistros(
      [plancha('a'), plancha('b')],
      [
        {
          colorPlanchaId: 'a',
          entradas: [
            createImpresionEstimarTintasEntrada({
              fileName: 'a.jpg',
              sourceKind: 'image',
              widthCm: 10,
              heightCm: 15,
              dpi: 300,
              conversionFactorG: 0.00021,
              result: sampleResult,
              totalPliegos: 100,
            }),
          ],
        },
        {
          colorPlanchaId: 'b',
          entradas: [
            createImpresionEstimarTintasEntrada({
              fileName: 'b.jpg',
              sourceKind: 'image',
              widthCm: 10,
              heightCm: 15,
              dpi: 300,
              conversionFactorG: 0.00021,
              result: sampleResult,
              totalPliegos: 200,
            }),
          ],
        },
      ]
    )

    const synced = syncImpresionEstimarTintasRegistros([plancha('a')], registros)
    expect(synced).toHaveLength(1)
    expect(synced[0]?.colorPlanchaId).toBe('a')
  })

  it('consolida gramos pedidos por canal para el resumen a cobrar', () => {
    const rows = buildEstimarTintasTableRows(
      [plancha('a'), plancha('b')],
      [
        {
          colorPlanchaId: 'a',
          entradas: [
            createImpresionEstimarTintasEntrada({
              fileName: 'a.jpg',
              sourceKind: 'image',
              widthCm: 10,
              heightCm: 15,
              dpi: 300,
              conversionFactorG: 0.00021,
              result: sampleResult,
              totalPliegos: 100,
            }),
          ],
        },
        {
          colorPlanchaId: 'b',
          entradas: [
            createImpresionEstimarTintasEntrada({
              fileName: 'b.jpg',
              sourceKind: 'image',
              widthCm: 10,
              heightCm: 15,
              dpi: 300,
              conversionFactorG: 0.00021,
              result: sampleResult,
              totalPliegos: 50,
            }),
          ],
        },
      ]
    )

    const resumen = buildEstimarTintasCobroResumen(rows)

    expect(resumen.registrosCount).toBe(2)
    expect(resumen.pedidoPorCanal.c).toBeCloseTo(1.2 * 100 + 1.2 * 50, 6)
    expect(resumen.totalPedido).toBeCloseTo(4 * 100 + 4 * 50, 6)
  })
})
