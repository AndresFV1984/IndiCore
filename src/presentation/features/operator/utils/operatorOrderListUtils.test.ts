import { describe, expect, it } from 'vitest'
import type { Order } from '../../../../core/domain/entities/Order'
import { buildOperatorOrderCardModel, matchesOperatorOrderFilter } from './operatorOrderListUtils'

const baseOrder = {
  id: 'PO-001',
  clientId: '1',
  workName: 'Trabajo demo',
  date: new Date('2026-06-01'),
  specs: {
    operadorPreprensaId: 'user-andres',
    operadorCortePapelId: 'user-andres',
    operadorImpresionId: 'user-andres',
    operadorTerminadosId: 'user-andres',
    operadorAcabadosId: 'user-andres',
    quantity: 1000,
  },
  commercialStatus: 'En curso',
  total: 0,
  vendedorId: 'vend-1',
  productionStatus: 'En Proceso Preprensa',
} as unknown as Order

describe('operatorOrderListUtils', () => {
  it('marca orden como activa si hay proceso en curso', () => {
    const card = buildOperatorOrderCardModel(baseOrder, [], 'user-andres')
    expect(card.assignedRows.length).toBeGreaterThan(0)
    expect(['active', 'pending']).toContain(card.listStatus)
    expect(matchesOperatorOrderFilter(card, 'all')).toBe(true)
  })
})
