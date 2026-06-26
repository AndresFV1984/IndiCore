import type { ProductionOrderStatus } from '@/core/domain/value-objects/ProductionOrderStatus'

export const PRODUCTION_ORDER_STATUS_CLASS: Record<ProductionOrderStatus, string> = {
  Pendiente: 'production-order-status-pendiente',
  Pausada: 'production-order-status-pausada',
  'En Revisión': 'production-order-status-revision',
  'En Proceso': 'production-order-status-en-proceso',
  Finalizada: 'production-order-status-finalizada',
  Cancelada: 'production-order-status-cancelada',
  'En Proceso Preprensa': 'production-order-status-preprensa',
  'En Proceso Corte de papel': 'production-order-status-corte-papel',
  'En Proceso Impresion': 'production-order-status-impresion',
  'En Proceso Terminados': 'production-order-status-terminados',
  'En Proceso Acabados': 'production-order-status-acabados',
}

export const PRODUCTION_ORDER_STATUS_LABEL: Record<ProductionOrderStatus, string> = {
  Pendiente: 'Pendiente',
  Pausada: 'Pausada',
  'En Revisión': 'En Revisión',
  'En Proceso': 'En Proceso',
  Finalizada: 'Finalizada',
  Cancelada: 'Cancelada',
  'En Proceso Preprensa': 'En Proceso Preprensa',
  'En Proceso Corte de papel': 'En Proceso Corte de papel',
  'En Proceso Impresion': 'En Proceso Impresion',
  'En Proceso Terminados': 'En Proceso Terminados',
  'En Proceso Acabados': 'En Proceso Acabados',
}

export const PRODUCTION_ORDER_STATUS_SHORT_LABEL: Partial<Record<ProductionOrderStatus, string>> = {
  'En Revisión': 'Revisión',
  'En Proceso Preprensa': 'Preprensa',
  'En Proceso Corte de papel': 'Corte',
  'En Proceso Impresion': 'Impresión',
  'En Proceso Terminados': 'Terminados',
  'En Proceso Acabados': 'Acabados',
}
