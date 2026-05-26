import { describe, expect, it } from 'vitest'
import {
  applyColoresPlanchasForHistorialReuse,
  computeTamanosBuenos,
  deriveCantidadHojas,
  roundDivision,
  sumTamanosBuenosYSobrante,
  resolveTamanosBuenosValue,
  syncColoresPlanchasCantidadFromOrder,
} from './coloresPlanchasUtils'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'

const baseItem = (): DisenoColorPlanchaItem => ({
  id: '1',
  colores: '2-colores',
  planchaId: 'tp1',
  planchaNombreMedida: 'Plancha — 70x100',
  planchaValor: 0,
  cantidad: 0,
  numeroPlanchas: 2,
  valorTotal: 0,
  numeroCavidades: 2,
  tamanosBuenos: 0,
  sobrante: 0,
  detalle: '',
  observacion: '',
  reposicionPlancha: false,
  cantidadReposicion: 0,
  registroManual: false,
})

describe('roundDivision', () => {
  it('rounds to nearest integer', () => {
    expect(roundDivision(3850, 24)).toBe(160)
    expect(roundDivision(5001, 2)).toBe(2501)
    expect(roundDivision(5000, 3)).toBe(1667)
  })
})

describe('computeTamanosBuenos', () => {
  it('returns cantidad divided by cavidades with math rounding', () => {
    expect(computeTamanosBuenos(5000, 2)).toEqual({ ok: true, value: 2500 })
    expect(computeTamanosBuenos(5001, 2)).toEqual({ ok: true, value: 2501 })
    expect(computeTamanosBuenos(5000, 3)).toEqual({ ok: true, value: 1667 })
    expect(resolveTamanosBuenosValue(5000, 2)).toBe(2500)
  })

  it('does not calculate without cavidades', () => {
    expect(computeTamanosBuenos(5000, 0)).toEqual({ ok: false, reason: 'sin-cavidad' })
    expect(resolveTamanosBuenosValue(5000, 0)).toBe(0)
  })
})

describe('sumTamanosBuenosYSobrante', () => {
  it('sums recalculated tamanos buenos and sobrante per registro', () => {
    expect(
      sumTamanosBuenosYSobrante([
        { ...baseItem(), cantidad: 5000, numeroCavidades: 2, tamanosBuenos: 0, sobrante: 100 },
        { ...baseItem(), id: '2', cantidad: 2400, numeroCavidades: 2, tamanosBuenos: 9999, sobrante: 50 },
      ])
    ).toBe(3850)
  })
})

describe('deriveCantidadHojas', () => {
  it('divides total piezas by piezas por pliego (redondeo matemático)', () => {
    const items = [
      { ...baseItem(), cantidad: 5000, numeroCavidades: 2, sobrante: 100 },
      { ...baseItem(), id: '2', cantidad: 2400, numeroCavidades: 2, sobrante: 50 },
    ]
    expect(deriveCantidadHojas(items, 24)).toBe(160)
    expect(deriveCantidadHojas(items, 32)).toBe(120)
  })

  it('returns 0 without piezas por pliego or sin total', () => {
    expect(deriveCantidadHojas([{ ...baseItem(), tamanosBuenos: 100 }], 0)).toBe(0)
    expect(deriveCantidadHojas([], 24)).toBe(0)
  })
})

describe('syncColoresPlanchasCantidadFromOrder', () => {
  it('fills cantidad on historial rows that were left at zero', () => {
    const items = [baseItem(), { ...baseItem(), id: '2', registroManual: true, cantidad: 0 }]
    const synced = syncColoresPlanchasCantidadFromOrder(items, 5000)
    expect(synced).not.toBeNull()
    expect(synced![0].cantidad).toBe(5000)
    expect(synced![0].tamanosBuenos).toBe(2500)
    expect(synced![1].cantidad).toBe(0)
  })

  it('returns null when order quantity is zero or rows already have cantidad', () => {
    expect(syncColoresPlanchasCantidadFromOrder([baseItem()], 0)).toBeNull()
    expect(
      syncColoresPlanchasCantidadFromOrder([{ ...baseItem(), cantidad: 3000 }], 5000)
    ).toBeNull()
  })
})

describe('applyColoresPlanchasForHistorialReuse', () => {
  it('uses order quantity when provided at load time', () => {
    const items = applyColoresPlanchasForHistorialReuse(
      { coloresPlanchas: [baseItem()] },
      8000
    )
    expect(items[0].cantidad).toBe(8000)
  })
})
