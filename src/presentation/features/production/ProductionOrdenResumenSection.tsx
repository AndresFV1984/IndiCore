import React from 'react'
import clsx from 'clsx'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import type { ProductionWorkspaceTone } from './constants/productionWorkspaceColors'

export interface ProductionOrdenResumenRow {
  key: string
  label: string
  value: React.ReactNode
  inactive?: boolean
  className?: string
  valueTitle?: string
  labelExtra?: React.ReactNode
}

interface ProductionOrdenResumenSectionProps {
  rows: ProductionOrdenResumenRow[]
  totalLabel?: string
  totalValue: React.ReactNode
  totalHint?: React.ReactNode
  hint?: React.ReactNode
  tone?: ProductionWorkspaceTone
  className?: string
  subtitle?: string
  children?: React.ReactNode
  totalExtra?: React.ReactNode
}

const ProductionOrdenResumenSection: React.FC<ProductionOrdenResumenSectionProps> = ({
  rows,
  totalLabel = 'Total',
  totalValue,
  totalHint,
  hint,
  tone = 2,
  className,
  subtitle,
  children,
  totalExtra,
}) => (
  <ProductionWorkspaceSection
    className={clsx(
      'production-diseno-resumen',
      'production-diseno-nuevo-panel',
      'production-diseno-nuevo-panel--resumen',
      className
    )}
    title="Resumen"
    subtitle={subtitle}
    tone={tone}
  >
    {children}
    <ul className="production-diseno-resumen__rows">
      {rows.map(row => (
        <li
          key={row.key}
          className={clsx(
            'production-diseno-resumen__row',
            row.inactive && 'production-diseno-resumen__row--inactive',
            row.className
          )}
        >
          <span className="production-diseno-resumen__row-label">
            {row.label}
            {row.labelExtra}
          </span>
          <span className="production-diseno-resumen__row-value" title={row.valueTitle}>
            {row.value}
          </span>
        </li>
      ))}
    </ul>
    {hint ? (
      <p className="production-diseno-resumen__hint production-diseno-cliente-hint production-diseno-cliente-hint--aviso">
        {hint}
      </p>
    ) : null}
    <div className="production-diseno-resumen__total" aria-live="polite">
      <div className="production-diseno-resumen__total-info">
        <span className="production-diseno-resumen__total-label">{totalLabel}</span>
        {totalHint ? (
          <span className="production-diseno-resumen__total-hint">{totalHint}</span>
        ) : null}
        {totalExtra}
      </div>
      <strong className="production-diseno-resumen__total-value">{totalValue}</strong>
    </div>
  </ProductionWorkspaceSection>
)

export default ProductionOrdenResumenSection
