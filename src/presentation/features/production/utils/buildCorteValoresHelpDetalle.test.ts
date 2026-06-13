import { describe, expect, it } from 'vitest'
import { buildCorteValoresHelpDetalle } from './buildCorteValoresHelpDetalle'
import type { CortePapelValores } from './cortePapelCalculations'

const baseValores: CortePapelValores = {
  cantidadHojas: 3100,
  margenRedondeo: 2,
  unidadEmpaqueLabel: '500 hojas',
  unidadEmpaqueCantidad: 500,
  cocienteHojasPorEmpaque: 6.2,
  valorCorteUnitario: 1200,
  valorCorte: 7440,
  valorHoja: 0,
  valorPapel: 0,
}

describe('buildCorteValoresHelpDetalle', () => {
  it('solo expone fórmulas de cantidad hojas y valor del corte', () => {
    const pasos = buildCorteValoresHelpDetalle({
      valores: baseValores,
      row: {
        papelCortado: 'no',
        tamanosBuenosManual: 3000,
        sobranteManual: 100,
        despiece: { despieceId: 'd1', piezasPorPliego: 24 },
      } as never,
      coloresPlanchas: [],
      clienteSuministra: true,
      papelSinCortar: true,
      margenRedondeo: 2,
      cantidadHojasDisplay: '3.100',
      valorCorteDisplay: '$ 7.440',
      valorUnitarioDisplay: '$ 1.200',
      unidadEmpaqueDisplay: '500',
      cocienteDisplay: '6,2',
    })

    expect(pasos).toHaveLength(2)
    expect(pasos.map(p => p.id)).toEqual(['cantidad-hojas', 'valor-total'])

    const cantidad = pasos[0]
    expect(cantidad.titulo).toBe('Cantidad hojas')
    expect(cantidad.formula).toContain('Tamaños buenos + Sobrante')
    expect(cantidad.formula).toContain('3.100')
    expect(cantidad.formula).toContain('24')
    expect(cantidad.resultado).toBe('3.100')

    const total = pasos[1]
    expect(total.titulo).toBe('Valor del corte')
    expect(total.formula).toContain('Cantidad hojas')
    expect(total.formula).toContain('6,2')
    expect(total.formula).toContain('$ 7.440')
  })

  it('indica no aplica cuando el cliente entrega papel cortado', () => {
    const pasos = buildCorteValoresHelpDetalle({
      valores: { ...baseValores, valorCorte: 0 },
      row: { despiece: { piezasPorPliego: 10 }, papelCortado: 'si' } as never,
      coloresPlanchas: [],
      clienteSuministra: true,
      papelSinCortar: false,
      margenRedondeo: 2,
      cantidadHojasDisplay: '500',
      valorCorteDisplay: 'No aplica',
      valorUnitarioDisplay: '$ 1.200',
      unidadEmpaqueDisplay: '500',
      cocienteDisplay: '1',
    })

    const total = pasos.find(p => p.id === 'valor-total')
    expect(total?.formula).toContain('cortado por el cliente')
  })
})
