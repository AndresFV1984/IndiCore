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

const TabIcon: React.FC<{ id: string }> = ({ id }) => {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    className: 'production-specs-nav__icon',
    'aria-hidden': true as const,
  }

  if (id === 'cliente') {
    return (
      <svg {...props}>
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M6 19c0-3.3 2.7-5 6-5s6 1.7 6 5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (id === 'diseno') {
    return (
      <svg {...props}>
        <path
          d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M5 19c1.5-2 3.5-3 7-3s5.5 1 7 3"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M17 5l2 2M19 3l2 2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg {...props}>
      <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 9h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
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
              <TabIcon id={tab.id} />
            </span>
            <span className="production-specs-nav__label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default ProductionSubNav
