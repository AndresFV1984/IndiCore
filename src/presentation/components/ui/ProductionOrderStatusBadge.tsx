import React from 'react'
import type { ProductionOrderStatus } from '@/core/domain/value-objects/ProductionOrderStatus'
import {
  PRODUCTION_ORDER_STATUS_CLASS,
  PRODUCTION_ORDER_STATUS_LABEL,
} from '@/presentation/constants/productionOrderStatusStyles'
import '@/presentation/styles/order-status-badges.css'

interface ProductionOrderStatusBadgeProps {
  status: ProductionOrderStatus
}

const ProductionOrderStatusBadge: React.FC<ProductionOrderStatusBadgeProps> = ({ status }) => {
  const className = PRODUCTION_ORDER_STATUS_CLASS[status]
  const label = PRODUCTION_ORDER_STATUS_LABEL[status]

  return <span className={`orders-status-badge ${className}`}>{label}</span>
}

export default ProductionOrderStatusBadge
