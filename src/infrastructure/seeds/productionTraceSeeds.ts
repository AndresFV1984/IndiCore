import type { ProductionTraceEvent } from '../../core/domain/entities/ProductionTrace'
import type { Order } from '../../core/domain/entities/Order'
import { PURCHASE_ORDER_PREFIX } from '../../core/domain/value-objects/PurchaseOrderId'

const orderId = (suffix: string) => `${PURCHASE_ORDER_PREFIX}${suffix}`

/** Asignaciones de operario en órdenes demo para la vista de trazabilidad. */
export const PRODUCTION_TRACE_DEMO_ASSIGNMENTS = [
  {
    orderSuffix: '001',
    operadorPreprensaId: 'user-2',
    status: 'En curso' as const,
  },
  {
    orderSuffix: '002',
    operadorCortePapelId: 'user-5',
    status: 'Listo' as const,
  },
  {
    orderSuffix: '004',
    operadorImpresionId: 'user-4',
    status: 'En curso' as const,
  },
]

export const applyProductionTraceDemoAssignments = (orders: Order[]): void => {
  for (const demo of PRODUCTION_TRACE_DEMO_ASSIGNMENTS) {
    const id = orderId(demo.orderSuffix)
    const order = orders.find(item => item.id === id)
    if (!order) continue

    if (demo.operadorPreprensaId) {
      order.specs.operadorPreprensaId = demo.operadorPreprensaId
    }
    if (demo.operadorCortePapelId) {
      order.specs.operadorCortePapelId = demo.operadorCortePapelId
    }
    if (demo.operadorImpresionId) {
      order.specs.operadorImpresionId = demo.operadorImpresionId
    }
    order.status = demo.status
  }
}

export const createProductionTraceSeeds = (): ProductionTraceEvent[] => [
  {
    id: 'trace-demo-1-asignacion',
    orderId: orderId('001'),
    workName: 'Trabajo 1',
    phase: 'preprensa',
    userId: 'user-2',
    type: 'asignacion',
    at: '2026-06-17T08:15:00.000Z',
    orderStatus: 'En curso',
  },
  {
    id: 'trace-demo-1-parcial',
    orderId: orderId('001'),
    workName: 'Trabajo 1',
    phase: 'preprensa',
    userId: 'user-2',
    type: 'entrega_parcial',
    at: '2026-06-17T10:30:00.000Z',
    unidades: 1200,
    nota: 'Primera entrega de planchas a revisión',
  },
  {
    id: 'trace-demo-1-avance',
    orderId: orderId('001'),
    workName: 'Trabajo 1',
    phase: 'preprensa',
    userId: 'user-2',
    type: 'avance_unidades',
    at: '2026-06-17T11:45:00.000Z',
    unidades: 800,
  },
  {
    id: 'trace-demo-1-estado',
    orderId: orderId('001'),
    workName: 'Trabajo 1',
    phase: 'preprensa',
    userId: 'user-2',
    type: 'cambio_estado_orden',
    at: '2026-06-17T12:00:00.000Z',
    orderStatus: 'En curso',
  },
  {
    id: 'trace-demo-1-paro-almuerzo',
    orderId: orderId('001'),
    workName: 'Trabajo 1',
    phase: 'preprensa',
    userId: 'user-2',
    type: 'paro',
    at: '2026-06-17T12:05:00.000Z',
    pauseReason: 'descanso_almuerzo',
  },
  {
    id: 'trace-demo-1-reanudacion-almuerzo',
    orderId: orderId('001'),
    workName: 'Trabajo 1',
    phase: 'preprensa',
    userId: 'user-2',
    type: 'reanudacion',
    at: '2026-06-17T13:05:00.000Z',
  },
  {
    id: 'trace-demo-1-paro-insumos',
    orderId: orderId('001'),
    workName: 'Trabajo 1',
    phase: 'preprensa',
    userId: 'user-2',
    type: 'paro',
    at: '2026-06-17T14:20:00.000Z',
    pauseReason: 'insumos_pendientes',
    nota: 'Esperando positivo del proveedor',
  },
  {
    id: 'trace-demo-1-reanudacion-insumos',
    orderId: orderId('001'),
    workName: 'Trabajo 1',
    phase: 'preprensa',
    userId: 'user-2',
    type: 'reanudacion',
    at: '2026-06-17T15:10:00.000Z',
  },
  {
    id: 'trace-demo-2-asignacion',
    orderId: orderId('002'),
    workName: 'Trabajo 2',
    phase: 'corte-papel',
    userId: 'user-5',
    type: 'asignacion',
    at: '2026-06-16T07:00:00.000Z',
    orderStatus: 'En curso',
  },
  {
    id: 'trace-demo-2-avance',
    orderId: orderId('002'),
    workName: 'Trabajo 2',
    phase: 'corte-papel',
    userId: 'user-5',
    type: 'avance_unidades',
    at: '2026-06-16T11:20:00.000Z',
    unidades: 3500,
  },
  {
    id: 'trace-demo-2-paro-maquina',
    orderId: orderId('002'),
    workName: 'Trabajo 2',
    phase: 'corte-papel',
    userId: 'user-5',
    type: 'paro',
    at: '2026-06-16T11:45:00.000Z',
    pauseReason: 'problema_maquina',
    nota: 'Atasco en alimentador de la guillotina',
  },
  {
    id: 'trace-demo-2-reanudacion-maquina',
    orderId: orderId('002'),
    workName: 'Trabajo 2',
    phase: 'corte-papel',
    userId: 'user-5',
    type: 'reanudacion',
    at: '2026-06-16T12:15:00.000Z',
  },
  {
    id: 'trace-demo-2-parcial',
    orderId: orderId('002'),
    workName: 'Trabajo 2',
    phase: 'corte-papel',
    userId: 'user-5',
    type: 'entrega_parcial',
    at: '2026-06-16T13:10:00.000Z',
    unidades: 3500,
    nota: 'Corte completo entregado a impresión',
  },
  {
    id: 'trace-demo-2-fin',
    orderId: orderId('002'),
    workName: 'Trabajo 2',
    phase: 'corte-papel',
    userId: 'user-5',
    type: 'fin_fase',
    at: '2026-06-16T13:15:00.000Z',
    orderStatus: 'Listo',
  },
  {
    id: 'trace-demo-3-asignacion',
    orderId: orderId('004'),
    workName: 'Trabajo 4',
    phase: 'impresion',
    userId: 'user-4',
    type: 'asignacion',
    at: '2026-06-18T06:30:00.000Z',
    orderStatus: 'En curso',
  },
  {
    id: 'trace-demo-3-parcial',
    orderId: orderId('004'),
    workName: 'Trabajo 4',
    phase: 'impresion',
    userId: 'user-4',
    type: 'entrega_parcial',
    at: '2026-06-18T09:45:00.000Z',
    unidades: 500,
    nota: 'Primer millar revisado en máquina',
  },
  {
    id: 'trace-demo-3-paro-desayuno',
    orderId: orderId('004'),
    workName: 'Trabajo 4',
    phase: 'impresion',
    userId: 'user-4',
    type: 'paro',
    at: '2026-06-18T10:00:00.000Z',
    pauseReason: 'descanso_desayuno',
  },
  {
    id: 'trace-demo-3-reanudacion-desayuno',
    orderId: orderId('004'),
    workName: 'Trabajo 4',
    phase: 'impresion',
    userId: 'user-4',
    type: 'reanudacion',
    at: '2026-06-18T10:25:00.000Z',
  },
  {
    id: 'trace-demo-3-paro-horario',
    orderId: orderId('004'),
    workName: 'Trabajo 4',
    phase: 'impresion',
    userId: 'user-4',
    type: 'paro',
    at: '2026-06-18T11:30:00.000Z',
    pauseReason: 'fin_horario',
    nota: 'Fin de turno matutino',
  },
  {
    id: 'trace-demo-3-avance',
    orderId: orderId('004'),
    workName: 'Trabajo 4',
    phase: 'impresion',
    userId: 'user-4',
    type: 'avance_unidades',
    at: '2026-06-18T11:00:00.000Z',
    unidades: 1500,
  },
  {
    id: 'trace-demo-3-estado',
    orderId: orderId('004'),
    workName: 'Trabajo 4',
    phase: 'impresion',
    userId: 'user-4',
    type: 'cambio_estado_orden',
    at: '2026-06-18T11:30:00.000Z',
    orderStatus: 'En curso',
  },
]
