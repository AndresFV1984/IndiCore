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
  it('incluye origen de Estado del papel y fórmula con números para cantidad hojas', () => {
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
      registroActivo: null,
      registroIndex: -1,
      margenRedondeo: 2,
      cantidadHojasDisplay: '3.100',
      valorCorteDisplay: '$ 7.440',
      valorUnitarioDisplay: '$ 1.200',
      unidadEmpaqueDisplay: '500',
      cocienteDisplay: '6,2',
    })

    const cantidad = pasos.find(p => p.id === 'cantidad-hojas')
    expect(cantidad?.campo).toBe('Cantidad hojas')
    expect(cantidad?.origen).toContain('Tamaños buenos')
    expect(cantidad?.origen).toContain('Piezas por pliego')
    expect(cantidad?.formula).toContain('3.100')
    expect(cantidad?.formula).toContain('24')
    expect(pasos.some(p => p.id === 'cociente')).toBe(false)
  })

  it('indica no aplica cuando el cliente entrega papel cortado', () => {
    const pasos = buildCorteValoresHelpDetalle({
      valores: { ...baseValores, valorCorte: 0 },
      row: { despiece: { piezasPorPliego: 10 }, papelCortado: 'si' } as never,
      coloresPlanchas: [],
      clienteSuministra: true,
      papelSinCortar: false,
      registroActivo: null,
      registroIndex: -1,
      margenRedondeo: 2,
      cantidadHojasDisplay: '500',
      valorCorteDisplay: 'No aplica',
      valorUnitarioDisplay: '$ 1.200',
      unidadEmpaqueDisplay: '500',
      cocienteDisplay: '1',
    })

    const total = pasos.find(p => p.id === 'valor-total')
    expect(total?.formula).toContain('ya cortado')
  })
})
