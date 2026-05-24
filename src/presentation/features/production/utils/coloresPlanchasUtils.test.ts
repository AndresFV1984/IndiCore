import { describe, expect, it } from 'vitest'
import {
  applyColoresPlanchasForHistorialReuse,
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
  detalle: '',
  observacion: '',
  reposicionPlancha: false,
  cantidadReposicion: 0,
  registroManual: false,
})

describe('syncColoresPlanchasCantidadFromOrder', () => {
  it('fills cantidad on historial rows that were left at zero', () => {
    const items = [baseItem(), { ...baseItem(), id: '2', registroManual: true, cantidad: 0 }]
    const synced = syncColoresPlanchasCantidadFromOrder(items, 5000)
    expect(synced).not.toBeNull()
    expect(synced![0].cantidad).toBe(5000)
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
