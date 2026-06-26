import type { OrderStatus } from '../value-objects/OrderStatus'
import type { ProductionOrderStatus } from '../value-objects/ProductionOrderStatus'

export type ProductionTracePhaseId =
  | 'preprensa'
  | 'corte-papel'
  | 'impresion'
  | 'terminados'
  | 'acabados'
  | 'cobro'

export const PRODUCTION_TRACE_PAUSE_REASONS = {
  fin_horario: 'Fin de horario / turno',
  problema_maquina: 'Problema de máquina',
  descanso_almuerzo: 'Descanso (almuerzo)',
  descanso_desayuno: 'Descanso (desayuno)',
  descanso_general: 'Descanso general',
  insumos_pendientes: 'Insumos pendientes',
  otro: 'Otro',
} as const

export type ProductionTracePauseReasonId = keyof typeof PRODUCTION_TRACE_PAUSE_REASONS

export type ProductionTraceEventType =
  | 'asignacion'
  | 'cambio_estado_orden'
  | 'entrega_parcial'
  | 'avance_unidades'
  | 'fin_fase'
  | 'paro'
  | 'reanudacion'

export interface ProductionTraceEvent {
  id: string
  orderId: string
  workName: string
  phase: ProductionTracePhaseId
  userId: string
  type: ProductionTraceEventType
  at: string
  orderStatus?: OrderStatus
  productionStatus?: ProductionOrderStatus
  unidades?: number
  nota?: string
  pauseReason?: ProductionTracePauseReasonId
}

export interface RecordProductionTraceEventDTO {
  orderId: string
  workName: string
  phase: ProductionTracePhaseId
  userId: string
  type: ProductionTraceEventType
  at?: string
  orderStatus?: OrderStatus
  productionStatus?: ProductionOrderStatus
  unidades?: number
  nota?: string
  pauseReason?: ProductionTracePauseReasonId
}

export interface ProductionTraceFilter {
  userId?: string
  orderId?: string
  phase?: ProductionTracePhaseId
  from?: string
  to?: string
}

export interface RegisterPartialDeliveryDTO {
  orderId: string
  workName: string
  phase: ProductionTracePhaseId
  userId: string
  unidades: number
  orderStatus?: OrderStatus
  productionStatus?: ProductionOrderStatus
  nota?: string
}

export interface RegisterProductionPauseDTO {
  orderId: string
  workName: string
  phase: ProductionTracePhaseId
  userId: string
  pauseReason: ProductionTracePauseReasonId
  orderStatus?: OrderStatus
  productionStatus?: ProductionOrderStatus
  nota?: string
}

export interface RegisterProductionResumeDTO {
  orderId: string
  workName: string
  phase: ProductionTracePhaseId
  userId: string
  orderStatus?: OrderStatus
  productionStatus?: ProductionOrderStatus
  nota?: string
}
