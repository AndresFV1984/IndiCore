import { describe, expect, it } from 'vitest'
import { Order } from '../../../../core/domain/entities/Order'
import { Money } from '../../../../core/domain/value-objects/Money'
import type { ProductionTraceEvent } from '../../../../core/domain/entities/ProductionTrace'
import { buildOperarioTraceReport, buildSessionPauses } from './buildOperarioTraceReport'

const baseOrder = (): Order =>
  new Order(
    'op-100',
    'client-1',
    'Tarjetas corporativas',
    new Date('2026-06-01T10:00:00.000Z'),
    {
      paperRows: [],
      quantity: 5000,
      cantidadHojas: 0,
      margenRedondeo: 2,
      valorCorte: 0,
      clienteSuministraPapel: 'no',
      mounting: false,
      design: false,
      preprensaDiseno: {} as never,
      plates: 0,
      platesValue: new Money(0),
      thousands: 0,
      inks: '',
      impresionTintasRegistros: [],
      terminadosRegistros: [],
      acabadosRegistros: [],
      machineOutputValue: new Money(0),
      chapoliado: false,
      finishes: [],
      operations: [],
      operadorPreprensaId: 'user-1',
    },
    'En curso',
    new Money(0),
    '',
    'Pendiente'
  )

describe('buildOperarioTraceReport', () => {
  it('consolida sesiones por operario y calcula tiempos/unidades', () => {
    const events: ProductionTraceEvent[] = [
      {
        id: 'e1',
        orderId: 'op-100',
        workName: 'Tarjetas corporativas',
        phase: 'preprensa',
        userId: 'user-1',
        type: 'asignacion',
        at: '2026-06-01T08:00:00.000Z',
        orderStatus: 'En curso',
      },
      {
        id: 'e2',
        orderId: 'op-100',
        workName: 'Tarjetas corporativas',
        phase: 'preprensa',
        userId: 'user-1',
        type: 'entrega_parcial',
        at: '2026-06-01T10:00:00.000Z',
        unidades: 1200,
      },
      {
        id: 'e3',
        orderId: 'op-100',
        workName: 'Tarjetas corporativas',
        phase: 'preprensa',
        userId: 'user-1',
        type: 'avance_unidades',
        at: '2026-06-01T11:00:00.000Z',
        unidades: 800,
      },
    ]

    const { rows, summary } = buildOperarioTraceReport({
      orders: [baseOrder()],
      events,
      users: [{ id: 'user-1', name: 'Ana Operaria' } as never],
      clientsById: { 'client-1': 'Cliente Demo' },
      userId: 'user-1',
      now: '2026-06-01T12:00:00.000Z',
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]?.userName).toBe('Ana Operaria')
    expect(rows[0]?.unidadesEntregaParcial).toBe(1200)
    expect(rows[0]?.unidadesProcesadas).toBe(2000)
    expect(rows[0]?.tiempoLaboradoMs).toBeGreaterThan(0)
    expect(summary.unidadesProcesadas).toBe(2000)
  })

  it('resta paradas del tiempo neto y conserva el historial con motivo', () => {
    const events: ProductionTraceEvent[] = [
      {
        id: 'e1',
        orderId: 'op-100',
        workName: 'Tarjetas corporativas',
        phase: 'preprensa',
        userId: 'user-1',
        type: 'asignacion',
        at: '2026-06-01T08:00:00.000Z',
      },
      {
        id: 'e2',
        orderId: 'op-100',
        workName: 'Tarjetas corporativas',
        phase: 'preprensa',
        userId: 'user-1',
        type: 'paro',
        at: '2026-06-01T09:00:00.000Z',
        pauseReason: 'descanso_almuerzo',
      },
      {
        id: 'e3',
        orderId: 'op-100',
        workName: 'Tarjetas corporativas',
        phase: 'preprensa',
        userId: 'user-1',
        type: 'reanudacion',
        at: '2026-06-01T10:00:00.000Z',
      },
      {
        id: 'e4',
        orderId: 'op-100',
        workName: 'Tarjetas corporativas',
        phase: 'preprensa',
        userId: 'user-1',
        type: 'fin_fase',
        at: '2026-06-01T12:00:00.000Z',
      },
    ]

    const { rows } = buildOperarioTraceReport({
      orders: [baseOrder()],
      events,
      users: [{ id: 'user-1', name: 'Ana Operaria' } as never],
      clientsById: { 'client-1': 'Cliente Demo' },
      now: '2026-06-01T12:00:000Z',
    })

    expect(rows[0]?.endedAt).toBe('2026-06-01T12:00:00.000Z')
    expect(rows[0]?.pausaCount).toBe(1)
    expect(rows[0]?.pausas[0]?.reasonLabel).toBe('Descanso (almuerzo)')
    expect(rows[0]?.tiempoPausadoMs).toBe(60 * 60 * 1000)
    expect(rows[0]?.tiempoLaboradoMs).toBe(3 * 60 * 60 * 1000)
    expect(rows[0]?.operationStatus).toBe('Completado')
  })

  it('marca sesión en pausa cuando hay un paro abierto', () => {
    const pausas = buildSessionPauses(
      [
        {
          id: 'p1',
          orderId: 'op-100',
          workName: 'Tarjetas corporativas',
          phase: 'preprensa',
          userId: 'user-1',
          type: 'paro',
          at: '2026-06-01T09:00:00.000Z',
          pauseReason: 'problema_maquina',
          nota: 'Falla en alimentador',
        },
      ],
      null,
      '2026-06-01T10:30:00.000Z'
    )

    expect(pausas).toHaveLength(1)
    expect(pausas[0]?.isOpen).toBe(true)
    expect(pausas[0]?.reasonLabel).toBe('Problema de máquina')
    expect(pausas[0]?.note).toBe('Falla en alimentador')
  })
})
