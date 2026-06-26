import React, { useMemo } from 'react'
import { Order } from '../../../core/domain/entities/Order'
import {
  DEFAULT_PRODUCTION_ORDER_STATUS,
  PHASE_PRODUCTION_STATUSES,
  type ProductionOrderStatus,
} from '../../../core/domain/value-objects/ProductionOrderStatus'

interface ProductionKpiGridProps {
  orders: Order[]
}

const isInPlantProgress = (status: ProductionOrderStatus): boolean =>
  status === 'En Proceso' ||
  (PHASE_PRODUCTION_STATUSES as readonly string[]).includes(status)

const ProductionKpiGrid: React.FC<ProductionKpiGridProps> = ({ orders }) => {
  const stats = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const resolveStatus = (order: Order): ProductionOrderStatus =>
      order.productionStatus ?? DEFAULT_PRODUCTION_ORDER_STATUS

    const inProgressThisWeek = orders.filter(o => {
      const status = resolveStatus(o)
      if (!isInPlantProgress(status)) return false
      return new Date(o.date) >= weekAgo
    }).length

    const finishedToday = orders.filter(o => {
      if (resolveStatus(o) !== 'Finalizada') return false
      return new Date(o.date) >= startOfToday
    }).length

    return {
      total: orders.length,
      pending: orders.filter(o => resolveStatus(o) === 'Pendiente').length,
      inProgress: orders.filter(o => isInPlantProgress(resolveStatus(o))).length,
      paused: orders.filter(o => resolveStatus(o) === 'Pausada').length,
      inReview: orders.filter(o => resolveStatus(o) === 'En Revisión').length,
      finished: orders.filter(o => resolveStatus(o) === 'Finalizada').length,
      inProgressThisWeek,
      finishedToday,
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
        <div className="remissions-kpi-label">EN PLANTA</div>
        <div className="remissions-kpi-value">{stats.inProgress}</div>
        <div className="remissions-kpi-sublabel remissions-kpi-sublabel-success">
          ↑ {stats.inProgressThisWeek} esta semana
        </div>
      </div>
      <div className="remissions-kpi-card">
        <div className="remissions-kpi-label">PENDIENTES</div>
        <div className="remissions-kpi-value">{stats.pending}</div>
        <div className="remissions-kpi-sublabel">Por iniciar</div>
      </div>
      <div className="remissions-kpi-card remissions-kpi-card-warning">
        <div className="remissions-kpi-label">PAUSADAS / REVISIÓN</div>
        <div className="remissions-kpi-value">{stats.paused + stats.inReview}</div>
        <div className="remissions-kpi-sublabel-danger">
          {stats.paused} pausadas · {stats.inReview} en revisión
        </div>
      </div>
      <div className="remissions-kpi-card">
        <div className="remissions-kpi-label">FINALIZADAS</div>
        <div className="remissions-kpi-value">{stats.finished}</div>
        <div className="remissions-kpi-sublabel remissions-kpi-sublabel-success">
          ↑ {stats.finishedToday} hoy
        </div>
      </div>
    </div>
  )
}

export default ProductionKpiGrid
