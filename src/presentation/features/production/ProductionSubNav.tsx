import React from 'react'
import clsx from 'clsx'

export interface ProductionSubTabItem {
  id: string
  label: string
}

interface ProductionSubNavProps<T extends string> {
  tabs: readonly ProductionSubTabItem[]
  active: T
  onChange: (id: T) => void
  ariaLabel: string
  idPrefix: string
}

export const ProductionSubNavIcon: React.FC<{ id: string }> = ({ id }) => {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    className: 'production-specs-nav__icon',
    'aria-hidden': true as const,
  }
  const s = {
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (id === 'cliente') {
    return (
      <svg {...props}>
        <circle cx="12" cy="8" r="3.5" {...s} />
        <path d="M6 19c0-3.3 2.7-5 6-5s6 1.7 6 5" {...s} />
      </svg>
    )
  }

  /** Preprensa — arte, PDF, colores y planchas */
  if (id === 'diseno') {
    return (
      <svg {...props}>
        <rect x="4.5" y="5" width="15" height="13" rx="1.5" {...s} />
        <path d="M8 16.5l3.2-4.2 2.3 2.1L15.5 9" {...s} />
        <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
        <path
          d="M16.5 6.5l1.8 1.8M17.8 5.2l1.5 1.5"
          {...s}
          strokeWidth={1.5}
        />
      </svg>
    )
  }

  /** Responsable asignado por etapa */
  if (id === 'responsable') {
    return (
      <svg {...props}>
        <circle cx="12" cy="8.25" r="3.25" {...s} />
        <path d="M6.25 19.25c0-2.9 2.35-4.75 5.75-4.75s5.75 1.85 5.75 4.75" {...s} />
        <path d="M16.75 6.5l1.5 1.5M18.25 5l1.5 1.5" {...s} strokeWidth={1.5} />
      </svg>
    )
  }

  /** Especificaciones — cantidad y datos de la OP */
  if (id === 'detalle-op') {
    return (
      <svg {...props}>
        <path
          d="M8 4.5h8a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5z"
          {...s}
        />
        <path d="M9.25 4.5V3.25A1.25 1.25 0 0 1 10.5 2h3a1.25 1.25 0 0 1 1.25 1.25V4.5" {...s} />
        <path d="M9 10h6M9 13h6M9 16h4" {...s} strokeWidth={1.5} />
        <path d="M15.5 9.5h1.75v1.75h-1.75z" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  /** Corte de papel — tijeras (acción de cortar) */
  if (id === 'corte') {
    return (
      <svg {...props}>
        <path
          d="M4.5 19.25h15"
          {...s}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.35}
        />
        <circle cx="8.25" cy="6.75" r="2.65" {...s} />
        <circle cx="15.75" cy="6.75" r="2.65" {...s} />
        <path d="M8.25 8.75L11.75 12.25 11.75 19.25" {...s} />
        <path d="M15.75 8.75L12.25 12.25 12.25 19.25" {...s} />
        <circle cx="12" cy="12.35" r="1.05" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  /** Impresión — tintas y miles */
  if (id === 'tintas') {
    return (
      <svg {...props}>
        <path
          d="M12 3.75c-3.65 4.75-5.75 8.1-5.75 11.25a5.75 5.75 0 1 0 11.5 0C17.75 11.85 15.65 8.5 12 3.75z"
          {...s}
        />
        <path
          d="M9.75 14.25c.55 1.05 1.35 1.75 2.25 1.75s1.7-.7 2.25-1.75"
          {...s}
          strokeWidth={1.5}
          opacity={0.7}
        />
      </svg>
    )
  }

  /** Cobro — factura consolidada */
  if (id === 'factura') {
    return (
      <svg {...props}>
        <path
          d="M8 4.5h8a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5z"
          {...s}
        />
        <path d="M9.25 4.5V3.25A1.25 1.25 0 0 1 10.5 2h3a1.25 1.25 0 0 1 1.25 1.25V4.5" {...s} />
        <path d="M9 10h6M9 13.5h4.5" {...s} strokeWidth={1.5} />
        <path d="M14.75 9.25h1.5v1.5h-1.5z" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  /** Terminados / Acabados — asignación por plancha */
  if (id === 'asignacion' || id === 'acabado') {
    return (
      <svg {...props}>
        <path d="M5.5 7.5h13M5.5 12h13M5.5 16.5h8.5" {...s} />
        <path d="M7.25 5.5v13" {...s} strokeWidth={1.5} opacity={0.45} />
        <circle cx="16.75" cy="16.5" r="2.25" {...s} />
      </svg>
    )
  }

  return (
    <svg {...props}>
      <rect x="6" y="4" width="12" height="16" rx="2" {...s} />
      <path d="M9 9h6M9 13h6M9 17h4" {...s} strokeWidth={1.5} />
    </svg>
  )
}

function ProductionSubNav<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
  idPrefix,
}: ProductionSubNavProps<T>) {
  return (
    <nav className="production-specs-nav" role="tablist" aria-label={ariaLabel}>
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${idPrefix}-subtab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            className={clsx('production-specs-nav__item', {
              'production-specs-nav__item--active': isActive,
            })}
            onClick={() => onChange(tab.id as T)}
          >
            <span className="production-specs-nav__marker" aria-hidden />
            <span className="production-specs-nav__icon-wrap">
              <ProductionSubNavIcon id={tab.id} />
            </span>
            <span className="production-specs-nav__label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default ProductionSubNav
