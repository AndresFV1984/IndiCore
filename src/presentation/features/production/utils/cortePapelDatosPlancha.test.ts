import { describe, expect, it } from 'vitest'
import { emptyPaperRow } from './tipoPapelDisplay'
import { buildCortePapelDatosPlancha } from './cortePapelDatosPlancha'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'

const baseItem = (overrides: Partial<DisenoColorPlanchaItem> = {}): DisenoColorPlanchaItem => ({
  id: 'plancha-a',
  colores: '4-colores',
  planchaId: 'tp-1',
  planchaNombreMedida: '50 × 70 cm',
  planchaValor: 12000,
  cantidad: 12000,
  numeroCavidades: 4,
  tamanosBuenos: 3000,
  sobrante: 100,
  numeroPlanchas: 2,
  valorTotal: 24000,
  detalle: 'Frente',
  observacion: '',
  ...overrides,
})

describe('buildCortePapelDatosPlancha', () => {
  it('expone tamaños buenos y sobrante desde Preprensa', () => {
    const viewModel = buildCortePapelDatosPlancha({
      coloresPlanchas: [baseItem()],
      row: {
        ...emptyPaperRow('plancha-a'),
        colorPlanchaId: 'plancha-a',
        despiece: { despieceId: 'd1', name: 'A', piezasPorPliego: 8 } as never,
      },
    })

    expect(viewModel.source).toBe('preprensa')
    expect(viewModel.lineas).toHaveLength(1)
    expect(viewModel.lineas[0]?.tamanosBuenos).toBe(3000)
    expect(viewModel.lineas[0]?.sobrante).toBe(100)
    expect(viewModel.totalSuma).toBe(3100)
    expect(viewModel.cantidadHojasPreview).toBe(388)
    expect(viewModel.lineas[0]?.formula).toContain('12.000')
  })

  it('expone valores manuales cuando el cliente suministra papel', () => {
    const viewModel = buildCortePapelDatosPlancha({
      coloresPlanchas: [baseItem()],
      row: {
        ...emptyPaperRow('plancha-a'),
        colorPlanchaId: 'plancha-a',
        tamanosBuenosManual: 5000,
        sobranteManual: 200,
        despiece: { despieceId: 'd1', name: 'A', piezasPorPliego: 10 } as never,
      },
      clienteSuministraPapel: 'si',
    })

    expect(viewModel.source).toBe('manual-cliente')
    expect(viewModel.lineas[0]?.tamanosBuenos).toBe(5000)
    expect(viewModel.lineas[0]?.sobrante).toBe(200)
    expect(viewModel.totalSuma).toBe(5200)
    expect(viewModel.cantidadHojasPreview).toBe(520)
  })
})
