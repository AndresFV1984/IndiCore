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

function pct(count: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

function StateBars({ segments }: { segments: DashboardSegment[] }) {
  const totalCount = segments.reduce((sum, s) => sum + s.count, 0)

  if (totalCount <= 0) {
    return <p className="dash-panel__empty-dist">Sin registros</p>
  }

  return (
    <div className="dash-panel__state-block">
      <div className="dash-panel__state-cols" aria-hidden>
        <span className="dash-panel__state-cols-estado">Estado</span>
        <span>Cantidad</span>
        <span>Valor</span>
        <span>% registros</span>
      </div>
      <ul className="dash-panel__bars">
        {segments.map(seg => {
          const percent = pct(seg.count, totalCount)
          const width = percent > 0 ? Math.max(percent, 4) : 0
          const money = seg.money ?? 0

          return (
            <li key={seg.label} className="dash-panel__bar-row">
              <div className="dash-panel__bar-row-top">
                <span className="dash-panel__bar-label">
                  <span className="dash-panel__bar-dot" style={{ backgroundColor: seg.color }} />
                  {seg.label}
                </span>
                <dl className="dash-panel__bar-stats">
                  <div className="dash-panel__bar-stat">
                    <dt>Cantidad</dt>
                    <dd>{seg.count}</dd>
                  </div>
                  <div className="dash-panel__bar-stat">
                    <dt>Valor</dt>
                    <dd>{formatCompactCurrency(money)}</dd>
                  </div>
                  <div className="dash-panel__bar-stat dash-panel__bar-stat--pct">
                    <dt>% registros</dt>
                    <dd>{percent}%</dd>
                  </div>
                </dl>
              </div>
              <div
                className="dash-panel__bar-track"
                role="img"
                aria-label={`${seg.label}: ${percent}% de los registros`}
              >
                <span
                  className="dash-panel__bar-fill"
                  style={{ width: `${width}%`, backgroundColor: seg.color }}
                />
                {percent >= 12 && (
                  <span className="dash-panel__bar-fill-label">{percent}%</span>
                )}
              </div>
              {percent > 0 && percent < 12 && (
                <span className="dash-panel__bar-pct-outside">{percent}% del total</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
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
      <header className="dash-panel__header">
        <div className="dash-panel__header-text">
          <h2 className="dash-panel__title">{title}</h2>
          <p className="dash-panel__desc">{stats.description}</p>
        </div>
        {stats.totalMoney != null && stats.totalMoney > 0 && (
          <div className="dash-panel__total">
            <span className="dash-panel__total-label">Total</span>
            <span className="dash-panel__total-money">{formatCompactCurrency(stats.totalMoney)}</span>
          </div>
        )}
      </header>

      <div className="dash-panel__hero">
        <span className="dash-panel__hero-count">{stats.primary.value}</span>
        <div className="dash-panel__hero-text">
          <span className="dash-panel__hero-label">{stats.primary.label}</span>
          {stats.primary.money != null && stats.primary.money > 0 && (
            <span className="dash-panel__hero-money">{formatCompactCurrency(stats.primary.money)}</span>
          )}
          {stats.primary.hint && <span className="dash-panel__hero-hint">{stats.primary.hint}</span>}
        </div>
      </div>

      {stats.details.length > 0 && (
        <ul className="dash-panel__details">
          {stats.details.map(d => (
            <li key={d.label}>
              <span className="dash-panel__detail-value">{d.value}</span>
              <span className="dash-panel__detail-label">{d.label}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="dash-panel__dist">
        <span className="dash-panel__dist-label">Por estado</span>
        <p className="dash-panel__dist-hint">
          Cantidad y valor por estado. El % y la barra muestran cuántos registros hay en cada uno.
        </p>
        <StateBars segments={stats.segments} />
      </div>

      <span className="dash-panel__go">Ver módulo →</span>
    </Link>
  )
}

export default DashboardStatPanel
