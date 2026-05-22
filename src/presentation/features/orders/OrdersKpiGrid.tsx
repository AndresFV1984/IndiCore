import React, { useMemo } from 'react'
import { Order } from '@/core/domain/entities/Order'

interface OrdersKpiGridProps {
  orders: Order[]
}

function formatCompactCurrency(total: number): string {
  if (total >= 1_000_000) {
    const m = total / 1_000_000
    const rounded = Math.round(m * 10) / 10
    return `$${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}M`
  }
  if (total >= 1_000) {
    return `$${Math.round(total / 1_000)}K`
  }
  return `$${total.toLocaleString('es-CO')}`
}

const OrdersKpiGrid: React.FC<OrdersKpiGridProps> = ({ orders }) => {
  const stats = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const pending = orders.filter((o) => o.status === 'En curso').length
    const inReview = orders.filter((o) => o.status === 'Revisión').length
    const totalValue = orders.reduce((sum, o) => sum + o.total.getValue(), 0)

    const thisMonth = orders
      .filter((o) => new Date(o.date) >= startOfMonth)
      .reduce((sum, o) => sum + o.total.getValue(), 0)
    const prevMonth = orders
      .filter((o) => {
        const d = new Date(o.date)
        return d >= startOfPrevMonth && d < startOfMonth
      })
      .reduce((sum, o) => sum + o.total.getValue(), 0)

    const monthGrowth =
      prevMonth > 0 ? Math.round(((thisMonth - prevMonth) / prevMonth) * 100) : thisMonth > 0 ? 100 : 0

    return {
      total: orders.length,
      pending,
      inReview,
      totalValue,
      monthGrowth,
    }
  }, [orders])

  return (
    <div className="remissions-kpi-grid" aria-label="Resumen de pedidos">
      <div className="remissions-kpi-card">
        <div className="remissions-kpi-label">TOTAL PEDIDOS</div>
        <div className="remissions-kpi-value">{stats.total}</div>
        <div className="remissions-kpi-sublabel">Historial</div>
      </div>
      <div className="remissions-kpi-card">
        <div className="remissions-kpi-label">PENDIENTES</div>
        <div className="remissions-kpi-value">{stats.pending}</div>
        <div className="remissions-kpi-sublabel remissions-kpi-sublabel-danger">Por procesar</div>
      </div>
      <div className="remissions-kpi-card remissions-kpi-card-warning">
        <div className="remissions-kpi-label">EN REVISIÓN</div>
        <div className="remissions-kpi-value">{stats.inReview}</div>
        <div className="remissions-kpi-sublabel">Con cliente</div>
      </div>
      <div className="remissions-kpi-card">
        <div className="remissions-kpi-label">VALOR TOTAL</div>
        <div className="remissions-kpi-value">{formatCompactCurrency(stats.totalValue)}</div>
        <div className="remissions-kpi-sublabel remissions-kpi-sublabel-success">
          {stats.monthGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.monthGrowth)}% mes
        </div>
      </div>
    </div>
  )
}

export default OrdersKpiGrid
