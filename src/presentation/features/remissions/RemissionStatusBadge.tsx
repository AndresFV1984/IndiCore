import React from 'react'
import type { RemissionStatus } from '@/core/domain/entities/Remission'

type RemissionDisplayStatus = 'Entregada' | 'Pendiente' | 'Cancelada'

const displayConfig: Record<
  RemissionDisplayStatus,
  { label: string; className: string }
> = {
  Entregada: { label: 'Entregada', className: 'orders-status-entregado' },
  Pendiente: { label: 'Pendiente', className: 'orders-status-en-curso' },
  Cancelada: { label: 'Cancelada', className: 'orders-status-cancelado' },
}

function toRemissionDisplayStatus(status: RemissionStatus): RemissionDisplayStatus {
  switch (status) {
    case 'Entregado':
      return 'Entregada'
    case 'Cancelado':
      return 'Cancelada'
    default:
      return 'Pendiente'
  }
}

interface RemissionStatusBadgeProps {
  status: RemissionStatus
}

const RemissionStatusBadge: React.FC<RemissionStatusBadgeProps> = ({ status }) => {
  const display = toRemissionDisplayStatus(status)
  const config = displayConfig[display]
  return (
    <span className={`orders-status-badge ${config.className}`}>{config.label}</span>
  )
}

export { toRemissionDisplayStatus }
export default RemissionStatusBadge
