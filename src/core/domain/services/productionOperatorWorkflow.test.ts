import { describe, expect, it } from 'vitest'
import { Order } from '../entities/Order.js'
import type { OrderSpecs } from '../entities/Order.js'
import type { ProductionTraceEvent } from '../entities/ProductionTrace.js'
import { Money } from '../value-objects/Money.js'
import { emptyPreprensaDiseno } from '../entities/PreprensaDiseno.js'
import {
  buildOperatorProcessRows,
  validateOperatorUnitsSubmission,
} from './productionOperatorWorkflow.js'

const baseSpecs = (): OrderSpecs => ({
  paperRows: [],
  quantity: 1000,
  cantidadHojas: 0,
  margenRedondeo: 2,
  valorCorte: 0,
  clienteSuministraPapel: 'no',
  mounting: false,
  design: false,
  preprensaDiseno: emptyPreprensaDiseno(),
  plates: 0,
  platesValue: new Money(0),
  thousands: 0,
  inks: '',
  impresionTintasRegistros: [],
  impresionEstimarTintasRegistros: [],
  terminadosRegistros: [],
  acabadosRegistros: [],
  machineOutputValue: new Money(0),
  chapoliado: false,
  finishes: [],
  operations: [],
  operadorPreprensaId: 'user-3',
  operadorCortePapelId: 'user-3',
  operadorImpresionId: 'user-3',
})

const order = new Order(
  'order-1',
  'client-1',
  'Trabajo demo',
  new Date('2026-04-16'),
  baseSpecs(),
  'En curso',
  new Money(0),
  'vendedor-1',
  'En Proceso Preprensa'
)

describe('buildOperatorProcessRows', () => {
  it('bloquea corte e impresión sin avance en preprensa', () => {
    const rows = buildOperatorProcessRows({
      order,
      events: [],
      userId: 'user-3',
      activeProductionStatus: order.productionStatus,
    })

    const preprensa = rows.find(row => row.processKey === 'preprensa')
    const corte = rows.find(row => row.processKey === 'corte-papel')
    const impresion = rows.find(row => row.processKey === 'impresion')

    expect(preprensa?.canOperate).toBe(true)
    expect(corte?.canOperate).toBe(false)
    expect(impresion?.canOperate).toBe(false)
    expect(preprensa?.status).toBe('en-proceso')
    expect(corte?.status).toBe('pendiente')
    expect(impresion?.status).toBe('pendiente')
  })

  it('no marca procesos finales en curso solo por el estado global de la orden', () => {
    const orderEnImpresion = new Order(
      'order-2',
      'client-1',
      'Trabajo en impresión',
      new Date('2026-04-16'),
      baseSpecs(),
      'En curso',
      new Money(0),
      'vendedor-1',
      'En Proceso Impresion'
    )

    const rows = buildOperatorProcessRows({
      order: orderEnImpresion,
      events: [],
      userId: 'user-3',
    })

    expect(rows.find(row => row.processKey === 'preprensa')?.status).toBe('en-proceso')
    expect(rows.find(row => row.processKey === 'corte-papel')?.status).toBe('pendiente')
    expect(rows.find(row => row.processKey === 'impresion')?.status).toBe('pendiente')
  })

  it('habilita el siguiente proceso según unidades terminadas en el anterior', () => {
    const events: ProductionTraceEvent[] = [
      {
        id: 'e1',
        orderId: order.id,
        workName: order.workName,
        phase: 'preprensa',
        userId: 'user-3',
        type: 'avance_unidades',
        at: '2026-04-16T10:00:00.000Z',
        unidades: 1000,
        processKey: 'preprensa',
      },
    ]

    const rows = buildOperatorProcessRows({
      order,
      events,
      userId: 'user-3',
      activeProductionStatus: order.productionStatus,
    })

    expect(rows.find(row => row.processKey === 'corte-papel')?.canOperate).toBe(true)
    expect(rows.find(row => row.processKey === 'impresion')?.canOperate).toBe(false)
  })

  it('no desbloquea el siguiente proceso con entregas parciales sin avance de procesamiento', () => {
    const events: ProductionTraceEvent[] = [
      {
        id: 'e1',
        orderId: order.id,
        workName: order.workName,
        phase: 'preprensa',
        userId: 'user-3',
        type: 'entrega_parcial',
        at: '2026-04-16T10:00:00.000Z',
        unidades: 1000,
        processKey: 'preprensa',
      },
    ]

    const rows = buildOperatorProcessRows({
      order,
      events,
      userId: 'user-3',
      activeProductionStatus: order.productionStatus,
    })

    const preprensa = rows.find(row => row.processKey === 'preprensa')
    const corte = rows.find(row => row.processKey === 'corte-papel')

    expect(preprensa?.completedUnits).toBe(0)
    expect(preprensa?.deliveredUnits).toBe(0)
    expect(preprensa?.canRegisterDelivery).toBe(false)
    expect(corte?.canOperate).toBe(false)
  })

  it('permite entrega parcial de lo procesado sin afectar la secuencia del siguiente proceso', () => {
    const events: ProductionTraceEvent[] = [
      {
        id: 'e1',
        orderId: order.id,
        workName: order.workName,
        phase: 'preprensa',
        userId: 'user-3',
        type: 'avance_unidades',
        at: '2026-04-16T10:00:00.000Z',
        unidades: 400,
        processKey: 'preprensa',
      },
      {
        id: 'e2',
        orderId: order.id,
        workName: order.workName,
        phase: 'preprensa',
        userId: 'user-3',
        type: 'entrega_parcial',
        at: '2026-04-16T11:00:00.000Z',
        unidades: 200,
        processKey: 'preprensa',
      },
    ]

    const rows = buildOperatorProcessRows({
      order,
      events,
      userId: 'user-3',
      activeProductionStatus: order.productionStatus,
    })

    const preprensa = rows.find(row => row.processKey === 'preprensa')
    const corte = rows.find(row => row.processKey === 'corte-papel')

    expect(preprensa?.completedUnits).toBe(400)
    expect(preprensa?.deliveredUnits).toBe(200)
    expect(preprensa?.canRegisterDelivery).toBe(true)
    expect(corte?.availableUnits).toBe(400)
    expect(corte?.canOperate).toBe(true)
  })
})

describe('validateOperatorUnitsSubmission', () => {
  it('rechaza unidades que superan el avance del proceso anterior', () => {
    const rows = buildOperatorProcessRows({
      order,
      events: [],
      userId: 'user-3',
    })

    const result = validateOperatorUnitsSubmission({
      rows,
      processKey: 'corte-papel',
      units: 100,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toContain('proceso anterior')
    }
  })

  it('permite entrega parcial solo de unidades ya procesadas en el proceso', () => {
    const events: ProductionTraceEvent[] = [
      {
        id: 'e1',
        orderId: order.id,
        workName: order.workName,
        phase: 'preprensa',
        userId: 'user-3',
        type: 'avance_unidades',
        at: '2026-04-16T10:00:00.000Z',
        unidades: 300,
        processKey: 'preprensa',
      },
    ]

    const rows = buildOperatorProcessRows({
      order,
      events,
      userId: 'user-3',
    })

    const ok = validateOperatorUnitsSubmission({
      rows,
      processKey: 'preprensa',
      units: 200,
      mode: 'delivery',
    })
    const tooMuch = validateOperatorUnitsSubmission({
      rows,
      processKey: 'preprensa',
      units: 400,
      mode: 'delivery',
    })

    expect(ok.ok).toBe(true)
    expect(tooMuch.ok).toBe(false)
  })
})
