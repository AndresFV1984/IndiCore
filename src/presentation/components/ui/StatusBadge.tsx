import React from 'react'
import type { OrderStatus } from '@/core/domain/value-objects/OrderStatus'
import {
  ORDER_STATUS_CLASS,
  PRODUCTION_STATUS_LABEL,
} from '@/presentation/constants/orderStatusStyles'
import '@/presentation/styles/order-status-badges.css'

interface StatusBadgeProps {
  status: OrderStatus
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const className = ORDER_STATUS_CLASS[status]
  const label = PRODUCTION_STATUS_LABEL[status]

  return (
    <span className={`orders-status-badge ${className}`}>{label}</span>
  )
}

export default StatusBadge
