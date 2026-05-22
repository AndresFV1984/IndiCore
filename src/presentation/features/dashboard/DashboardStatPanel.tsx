import React from 'react'
import { Link } from 'react-router-dom'
import type { DashboardModuleStats, DashboardSegment } from './dashboardStats'
import { formatCompactCurrency } from '@/presentation/utils/formatCurrency'

interface DashboardStatPanelProps {
  title: string
  to: string
  accentClass: string
  stats: DashboardModuleStats
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

function StateBars({
  segments,
  distributionTotal,
}: {
  segments: DashboardSegment[]
  distributionTotal: number
}) {
  const visible = segments.filter(s => s.count > 0 || s.money > 0)

  if (visible.length === 0 || distributionTotal <= 0) {
    return <p className="dash-panel__empty">Sin valor en los estados mostrados</p>
  }

  return (
    <>
      <p className="dash-panel__dist-title">Distribución del valor</p>
      <ul className="dash-panel__states">
        {visible.map(seg => {
          const moneyPercent = pct(seg.money, distributionTotal)
          const barWidth = moneyPercent > 0 ? Math.max(moneyPercent, 4) : 0

          return (
            <li key={seg.label} className="dash-panel__state">
              <div className="dash-panel__state-head">
                <span className="dash-panel__state-label">
                  <span className="dash-panel__state-dot" style={{ backgroundColor: seg.color }} />
                  {seg.label}
                </span>
                <span className="dash-panel__state-meta">
                  <span className="dash-panel__state-money">
                    {formatCompactCurrency(seg.money)}
                  </span>
                  <span className="dash-panel__state-pct">{moneyPercent}%</span>
                </span>
              </div>
              <div className="dash-panel__state-sub">
                <span>{seg.count} registros</span>
                <span>del total del módulo</span>
              </div>
              <div
                className="dash-panel__state-track"
                role="img"
                aria-label={`${seg.label}: ${formatCompactCurrency(seg.money)}, ${moneyPercent}% del valor`}
              >
                <span
                  className="dash-panel__state-fill"
                  style={{ width: `${barWidth}%`, backgroundColor: seg.color }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}

const DashboardStatPanel: React.FC<DashboardStatPanelProps> = ({
  title,
  to,
  accentClass,
  stats,
}) => {
  return (
    <Link to={to} className={`dash-panel ${accentClass} dash-panel--link`}>
      <h2 className="dash-panel__title">{title}</h2>

      <div className="dash-panel__kpi">
        <div className="dash-panel__kpi-row">
          <span className="dash-panel__kpi-value">{stats.primary.value}</span>
          <span className="dash-panel__kpi-label">{stats.primary.label}</span>
        </div>
        <p className="dash-panel__kpi-money">{formatCompactCurrency(stats.primary.money)}</p>
        <p className="dash-panel__kpi-caption">{stats.primary.moneyCaption}</p>
      </div>

      <StateBars segments={stats.segments} distributionTotal={stats.distributionTotal} />

      <span className="dash-panel__go">Ver módulo →</span>
    </Link>
  )
}

export default DashboardStatPanel
