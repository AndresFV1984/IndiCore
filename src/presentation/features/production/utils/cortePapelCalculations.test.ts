import { describe, expect, it } from 'vitest'
import {
  applyMargenRedondeoToHojasPorEmpaque,
  computeCortePapelValores,
  deriveValorCorte,
  deriveValorPapel,
  parseUnidadEmpaqueCantidad,
} from './cortePapelCalculations'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'

describe('parseUnidadEmpaqueCantidad', () => {
  it('extracts sheet count from packaging label', () => {
    expect(parseUnidadEmpaqueCantidad('Resma 250 hojas')).toBe(250)
    expect(parseUnidadEmpaqueCantidad('Paquete 100 hojas')).toBe(100)
    expect(parseUnidadEmpaqueCantidad('')).toBe(0)
  })
})

describe('applyMargenRedondeoToHojasPorEmpaque', () => {
  it('con cociente < 1 sube si las centésimas superan el margen', () => {
    expect(applyMargenRedondeoToHojasPorEmpaque(14, 500, 2)).toBe(1)
  })

  it('con cociente ≥ 1 sube al entero si la primera decimal supera el margen (1,3 → 2)', () => {
    expect(applyMargenRedondeoToHojasPorEmpaque(325, 250, 2)).toBe(2)
    expect(applyMargenRedondeoToHojasPorEmpaque(160, 250, 2)).toBe(1)
  })

  it('con cociente ≥ 1 conserva decimales si la primera decimal es ≤ margen (1,1 → 1,1)', () => {
    expect(applyMargenRedondeoToHojasPorEmpaque(275, 250, 2)).toBeCloseTo(1.1, 5)
    expect(applyMargenRedondeoToHojasPorEmpaque(250, 250, 2)).toBe(1)
    expect(applyMargenRedondeoToHojasPorEmpaque(500, 250, 2)).toBe(2)
  })
})

describe('deriveValorCorte con cociente decimal', () => {
  it('total = cociente × valor corte cuando el cociente conserva decimales', () => {
    expect(deriveValorCorte(275, 250, 350, 2)).toBe(385)
  })

  it('total = ceil(cociente) × valor cuando la primera decimal supera el margen', () => {
    expect(deriveValorCorte(325, 250, 350, 2)).toBe(700)
  })
})

describe('deriveValorPapel', () => {
  it('multiplies cantidad hojas by valor hoja', () => {
    expect(deriveValorPapel(14, 890)).toBe(12460)
    expect(deriveValorPapel(0, 890)).toBe(0)
  })
})

describe('deriveValorCorte', () => {
  it('applies margen en hojas÷empaque y redondea el total', () => {
    expect(deriveValorCorte(14, 500, 380, 2)).toBe(380)
    expect(deriveValorCorte(250, 250, 420, 2)).toBe(420)
    expect(deriveValorCorte(500, 250, 420, 2)).toBe(840)
  })

  it('no deja el total por debajo del valor corte del catálogo', () => {
    expect(deriveValorCorte(14, 500, 380, 10)).toBe(380)
    expect(deriveValorCorte(500, 250, 420, 2)).toBe(840)
  })

  it('returns 0 when inputs are incomplete', () => {
    expect(deriveValorCorte(0, 250, 420)).toBe(0)
    expect(deriveValorCorte(100, 0, 420)).toBe(0)
    expect(deriveValorCorte(100, 250, 0)).toBe(0)
  })
})

const coloresBase = (): DisenoColorPlanchaItem[] => [
  {
    id: '1',
    colores: '2-colores',
    planchaId: 'tp1',
    planchaNombreMedida: 'Plancha',
    planchaValor: 0,
    cantidad: 6000,
    numeroPlanchas: 2,
    valorTotal: 0,
    numeroCavidades: 2,
    tamanosBuenos: 3000,
    sobrante: 100,
    detalle: '',
    observacion: '',
    reposicionPlancha: false,
    cantidadReposicion: 0,
    registroManual: false,
  },
]

describe('computeCortePapelValores', () => {
  it('no suma margen a cantidad hojas; lo usa solo en valor corte', () => {
    const result = computeCortePapelValores({
      coloresPlanchas: coloresBase(),
      row: {
        tipoPapelId: 'p1',
        type: 'Couché',
        size: '70×100 cm',
        unidadEmpaque: 250,
        valorHoja: 890,
        valorCorteUnitario: 420,
        despiece: {
          despieceId: 'dp-1',
          name: 'Etiqueta',
          ancho: '10',
          alto: '5',
          unidadMedida: 'cm',
          piezasPorPliego: 24,
          valorCorte: 420,
        },
        cut: '',
      },
      margenRedondeo: 2,
    })
    expect(result.cantidadHojas).toBe(129)
    expect(result.valorPapel).toBe(114810)
    expect(result.cocienteHojasPorEmpaque).toBe(1)
    expect(result.valorCorte).toBe(420)
  })
})
