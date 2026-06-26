export const PRODUCTION_ORDER_STATUSES = [
  'Pendiente',
  'Pausada',
  'En Revisión',
  'En Proceso',
  'Finalizada',
  'Cancelada',
  'En Proceso Preprensa',
  'En Proceso Corte de papel',
  'En Proceso Impresion',
  'En Proceso Terminados',
  'En Proceso Acabados',
] as const

export type ProductionOrderStatus = (typeof PRODUCTION_ORDER_STATUSES)[number]

export const DEFAULT_PRODUCTION_ORDER_STATUS: ProductionOrderStatus = 'Pendiente'

export const SUPERVISOR_ONLY_PRODUCTION_STATUSES = [
  'Pendiente',
  'Pausada',
  'En Revisión',
  'En Proceso',
  'Finalizada',
  'Cancelada',
] as const satisfies readonly ProductionOrderStatus[]

export const PHASE_PRODUCTION_STATUSES = [
  'En Proceso Preprensa',
  'En Proceso Corte de papel',
  'En Proceso Impresion',
  'En Proceso Terminados',
  'En Proceso Acabados',
] as const satisfies readonly ProductionOrderStatus[]

export const isProductionOrderStatus = (value: string): value is ProductionOrderStatus =>
  (PRODUCTION_ORDER_STATUSES as readonly string[]).includes(value)
