import type { OrderStatus } from '@/core/domain/value-objects/OrderStatus'

/** Clases CSS compartidas entre pedidos y órdenes de producción. */
export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  'En curso': 'orders-status-en-curso',
  Revisión: 'orders-status-revision',
  Listo: 'orders-status-confirmado',
  Entregado: 'orders-status-entregado',
  Cancelado: 'orders-status-cancelado',
}

export const PRODUCTION_STATUS_LABEL: Record<OrderStatus, string> = {
  'En curso': 'En curso',
  Revisión: 'Revisión',
  Listo: 'Listo',
  Entregado: 'Entregado',
  Cancelado: 'Cancelado',
}

export type PedidoDisplayStatus = 'Confirmado' | 'En revisión' | 'Pendiente' | 'Cancelado' | 'Entregado'

export function toPedidoDisplayStatus(status: OrderStatus): PedidoDisplayStatus {
  switch (status) {
    case 'Revisión':
      return 'En revisión'
    case 'Listo':
      return 'Confirmado'
    case 'Entregado':
      return 'Entregado'
    case 'Cancelado':
      return 'Cancelado'
    default:
      return 'Pendiente'
  }
}

export const PEDIDO_STATUS_LABEL: Record<PedidoDisplayStatus, string> = {
  Confirmado: 'Confirmado',
  'En revisión': 'En revisión',
  Pendiente: 'Pendiente',
  Entregado: 'Entregado',
  Cancelado: 'Cancelado',
}
