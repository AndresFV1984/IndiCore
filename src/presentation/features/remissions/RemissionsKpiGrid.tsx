import React, { useMemo } from 'react'
import { Remission } from '@/core/domain/entities/Remission'

interface RemissionsKpiGridProps {
  remissions: Remission[]
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

const RemissionsKpiGrid: React.FC<RemissionsKpiGridProps> = ({ remissions }) => {
  const stats = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const incomplete = remissions.filter((r) => r.status === 'Pendiente').length

    const thisMonthList = remissions.filter((r) => new Date(r.date) >= startOfMonth)
    const prevMonthList = remissions.filter((r) => {
      const d = new Date(r.date)
      return d >= startOfPrevMonth && d < startOfMonth
    })

    const thisMonthCount = thisMonthList.length
    const prevMonthCount = prevMonthList.length
    const monthCountDelta = thisMonthCount - prevMonthCount

    const valueThisMonth = thisMonthList.reduce((sum, r) => sum + r.total.getValue(), 0)

    return {
      total: remissions.length,
      incomplete,
      thisMonthCount,
      monthCountDelta,
      valueThisMonth,
    }
  }, [remissions])

  return (
    <div className="remissions-kpi-grid" aria-label="Resumen de remisiones">
      <div className="remissions-kpi-card">
        <div className="remissions-kpi-label">TOTAL REMISIONES</div>
        <div className="remissions-kpi-value">{stats.total}</div>
        <div className="remissions-kpi-sublabel">Historial</div>
      </div>
      <div className="remissions-kpi-card">
        <div className="remissions-kpi-label">SIN COMPLETAR</div>
        <div className="remissions-kpi-value">{stats.incomplete}</div>
        <div className="remissions-kpi-sublabel remissions-kpi-sublabel-danger">Requiere datos</div>
      </div>
      <div className="remissions-kpi-card">
        <div className="remissions-kpi-label">ESTE MES</div>
        <div className="remissions-kpi-value">{stats.thisMonthCount}</div>
        <div className="remissions-kpi-sublabel remissions-kpi-sublabel-success">
          {stats.monthCountDelta >= 0 ? '↑' : '↓'} {Math.abs(stats.monthCountDelta)} vs anterior
        </div>
      </div>
      <div className="remissions-kpi-card">
        <div className="remissions-kpi-label">VALOR REMITIDO</div>
        <div className="remissions-kpi-value">{formatCompactCurrency(stats.valueThisMonth)}</div>
        <div className="remissions-kpi-sublabel remissions-kpi-sublabel-success">Este mes</div>
      </div>
    </div>
  )
}

export default RemissionsKpiGrid
