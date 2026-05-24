import React from 'react'

export interface DirectoryKpiGridProps {
  sectionLabel: string
  sectionSubtitle: string
  total: number
  active: number
  inactive: number
  className?: string
}

/** Fila de KPIs: intro + total + activos + inactivos (mismo patrón que Gestión). */
const DirectoryKpiGrid: React.FC<DirectoryKpiGridProps> = ({
  sectionLabel,
  sectionSubtitle,
  total,
  active,
  inactive,
  className,
}) => (
  <div className={['remissions-kpi-grid directory-kpi-grid', className].filter(Boolean).join(' ')}>
    <div className="remissions-kpi-card remissions-kpi-card--intro">
      <div className="remissions-kpi-label">{sectionLabel}</div>
      <div className="remissions-kpi-sublabel">{sectionSubtitle}</div>
    </div>
    <div className="remissions-kpi-card remissions-kpi-card--stat-total">
      <div className="remissions-kpi-label">TOTAL</div>
      <div className="remissions-kpi-value">{total}</div>
    </div>
    <div className="remissions-kpi-card remissions-kpi-card--stat-active">
      <div className="remissions-kpi-label">ACTIVOS</div>
      <div className="remissions-kpi-value">{active}</div>
    </div>
    <div className="remissions-kpi-card remissions-kpi-card--stat-inactive">
      <div className="remissions-kpi-label">INACTIVOS</div>
      <div className="remissions-kpi-value">{inactive}</div>
    </div>
  </div>
)

export default DirectoryKpiGrid
