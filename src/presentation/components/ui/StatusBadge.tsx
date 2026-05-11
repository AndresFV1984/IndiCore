import React from 'react'
import Badge from './Badge'

type OrderStatus = 'En curso' | 'Revisión' | 'Listo' | 'Entregado' | 'Cancelado'

const statusConfig: Record<OrderStatus, { variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple', label: string }> = {
  'En curso': { variant: 'warning', label: 'En curso' },
  'Revisión': { variant: 'info', label: 'Revisión' },
  'Listo': { variant: 'success', label: 'Listo' },
  'Entregado': { variant: 'neutral', label: 'Entregado' },
  'Cancelado': { variant: 'danger', label: 'Cancelado' },
}

interface StatusBadgeProps {
  status: OrderStatus
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status]
  return <Badge variant={config.variant} label={config.label} />
}

export default StatusBadge
