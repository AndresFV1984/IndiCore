import React, { useMemo } from 'react'
import { Order } from '../../../core/domain/entities/Order'

interface ProductionKpiGridProps {
  orders: Order[]
}

const ProductionKpiGrid: React.FC<ProductionKpiGridProps> = ({ orders }) => {
  const stats = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const inProgressThisWeek = orders.filter(o => {
      if (o.status !== 'En curso') return false
      return new Date(o.date) >= weekAgo
    }).length

    const readyToday = orders.filter(o => {
      if (o.status !== 'Listo') return false
      return new Date(o.date) >= startOfToday
    }).length

    return {
      total: orders.length,
      inProgress: orders.filter(o => o.status === 'En curso').length,
      ready: orders.filter(o => o.status === 'Listo').length,
      inReview: orders.filter(o => o.status === 'Revisión').length,
      inProgressThisWeek,
      readyToday,
    }
  }, [orders])

  return (
    <div className="remissions-kpi-grid" aria-label="Resumen de órdenes de producción">
      <div className="remissions-kpi-card">
        <div className="remissions-kpi-label">TOTAL ÓRDENES</div>
        <div className="remissions-kpi-value">{stats.total}</div>
        <div className="remissions-kpi-sublabel">Historial completo</div>
      </div>
      <div className="remissions-kpi-card">
        <div className="remissions-kpi-label">EN CURSO</div>
        <div className="remissions-kpi-value">{stats.inProgress}</div>
        <div className="remissions-kpi-sublabel remissions-kpi-sublabel-success">
          ↑ {stats.inProgressThisWeek} esta semana
        </div>
      </div>
      <div className="remissions-kpi-card">
        <div className="remissions-kpi-label">LISTOS PARA ENTREGA</div>
        <div className="remissions-kpi-value">{stats.ready}</div>
        <div className="remissions-kpi-sublabel remissions-kpi-sublabel-success">
          ↑ {stats.readyToday} hoy
        </div>
      </div>
      <div className="remissions-kpi-card remissions-kpi-card-warning">
        <div className="remissions-kpi-label">EN REVISIÓN</div>
        <div className="remissions-kpi-value">{stats.inReview}</div>
        <div className="remissions-kpi-sublabel-danger">Requieren atención</div>
      </div>
    </div>
  )
}

export default ProductionKpiGrid
