import React from 'react'

interface KpiCardProps {
  label: string
  value: string | number
  trend?: number
  trendDirection?: 'up' | 'down'
  icon?: React.ReactNode
  accentColor?: string
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, trend, trendDirection, icon, accentColor }) => {
  return (
    <div className="kpi-card" style={{ borderLeftColor: accentColor || 'var(--orange)' }}>
      <div className="kpi-card-header">
        <span className="kpi-card-label">{label}</span>
        {icon && <div className="kpi-card-icon">{icon}</div>}
      </div>
      <div className="kpi-card-value">{value}</div>
      {trend !== undefined && (
        <div className={`kpi-card-trend ${trendDirection === 'up' ? 'trend-up' : 'trend-down'}`}>
          {trendDirection === 'up' ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}

export default KpiCard
