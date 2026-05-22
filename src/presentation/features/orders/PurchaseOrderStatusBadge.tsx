import React from 'react'
import type { OrderStatus } from '@/core/domain/value-objects/OrderStatus'
import {
  ORDER_STATUS_CLASS,
  PEDIDO_STATUS_LABEL,
  toPedidoDisplayStatus,
} from '@/presentation/constants/orderStatusStyles'

interface PurchaseOrderStatusBadgeProps {
  status: OrderStatus
}

const PurchaseOrderStatusBadge: React.FC<PurchaseOrderStatusBadgeProps> = ({ status }) => {
  const display = toPedidoDisplayStatus(status)
  const className = ORDER_STATUS_CLASS[status]
  const label = PEDIDO_STATUS_LABEL[display]

  return (
    <span className={`orders-status-badge ${className}`}>{label}</span>
  )
}

export { toPedidoDisplayStatus }
export default PurchaseOrderStatusBadge
