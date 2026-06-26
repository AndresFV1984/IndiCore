import React from 'react'
import clsx from 'clsx'
import type { ProductionOrderStatus } from '@/core/domain/value-objects/ProductionOrderStatus'
import { PRODUCTION_STATUS_TO_PHASE } from '@/core/domain/policies/productionOrderStatusPolicy'
import {
  PRODUCTION_WORKFLOW_TABS,
  ProductionWorkflowTabId,
} from './productionTabs'

interface ProductionWorkflowNavProps {
  active: ProductionWorkflowTabId
  onChange: (id: ProductionWorkflowTabId) => void
  productionStatus?: ProductionOrderStatus
  statusPanel?: React.ReactNode
}

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className="production-workflow-step-check">
    <path
      d="M3.5 8.2 6.4 11 12.5 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const StepIcon: React.FC<{ id: ProductionWorkflowTabId }> = ({ id }) => {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    className: 'production-workflow-step-glyph',
    'aria-hidden': true as const,
  }

  switch (id) {
    case 'especificaciones':
      return (
        <svg {...props}>
          <path d="M8 6h8M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      )
    case 'preprensa':
      return (
        <svg {...props}>
          <path d="M12 4l6 3.5v9L12 20l-6-3.5v-9L12 4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        </svg>
      )
    case 'corte-papel':
      return (
        <svg {...props}>
          <path d="M7 8l5-3 5 3v8l-5 3-5-3V8z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        </svg>
      )
    case 'impresion':
      return (
        <svg {...props}>
          <rect x="6" y="7" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 5h8v2H8V5zM9 14h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      )
    case 'terminados':
      return (
        <svg {...props}>
          <path
            d="M12 6l1.4 2.8 3.1.4-2.2 2.2.5 3.1L12 13l-2.8 1.5.5-3.1-2.2-2.2 3.1-.4L12 6z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'acabados':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      )
    case 'cobro':
      return (
        <svg {...props}>
          <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="16" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      )
    default:
      return null
  }
}

const ProductionWorkflowNav: React.FC<ProductionWorkflowNavProps> = ({
  active,
  onChange,
  productionStatus,
  statusPanel,
}) => {
  const activeIndex = PRODUCTION_WORKFLOW_TABS.findIndex(t => t.id === active)
  const activeTab = PRODUCTION_WORKFLOW_TABS[activeIndex]
  const total = PRODUCTION_WORKFLOW_TABS.length
  const progressPct = Math.round(((activeIndex + 1) / total) * 100)
  const productionPhase = productionStatus ? PRODUCTION_STATUS_TO_PHASE[productionStatus] : undefined
  const isFinished = productionStatus === 'Finalizada'

  return (
    <div className="production-workflow-nav" role="presentation">
      <div className="production-workflow-nav__head">
        <div className="production-workflow-nav__head-text">
          <span className="production-workflow-nav__eyebrow">Flujo de la orden</span>
          <span className="production-workflow-nav__current">
            Paso {activeIndex + 1} de {total} · {activeTab.label}
          </span>
          <span className="production-workflow-nav__hint">{activeTab.description}</span>
        </div>
        <span className="production-workflow-nav__badge" aria-hidden>
          {activeIndex + 1}/{total}
        </span>
      </div>

      {statusPanel ? (
        <div className="production-workflow-nav__status">{statusPanel}</div>
      ) : null}

      <div
        className="production-workflow-nav__track"
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso del flujo: ${progressPct}%`}
      >
        <span className="production-workflow-nav__track-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div
        className="production-workflow-steps"
        role="tablist"
        aria-label="Etapas de la orden de producción"
      >
        <div className="production-workflow-steps__scroll">
          {PRODUCTION_WORKFLOW_TABS.map((tab, index) => {
            const isActive = tab.id === active
            const isCompleted = index < activeIndex
            const isUpcoming = index > activeIndex
            const isProductionStep = productionPhase === tab.id
            const isFinishedStep = isFinished && tab.id === 'cobro'

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`production-tab-${tab.id}`}
                aria-selected={isActive}
                aria-current={isActive ? 'step' : undefined}
                aria-controls={`production-panel-${tab.id}`}
                className={clsx('production-workflow-step', {
                  'production-workflow-step--active': isActive,
                  'production-workflow-step--completed': isCompleted,
                  'production-workflow-step--upcoming': isUpcoming,
                  'production-workflow-step--production': isProductionStep,
                  'production-workflow-step--finished': isFinishedStep,
                })}
                onClick={() => onChange(tab.id)}
              >
                {index > 0 && (
                  <span
                    className={clsx('production-workflow-step__connector', {
                      'production-workflow-step__connector--done': isCompleted || isActive,
                    })}
                    aria-hidden
                  />
                )}
                <span className="production-workflow-step__marker" aria-hidden>
                  {isCompleted ? (
                    <CheckIcon />
                  ) : (
                    <span className="production-workflow-step__number">{index + 1}</span>
                  )}
                </span>
                <span className="production-workflow-step__body">
                  <span className="production-workflow-step__icon-wrap">
                    <StepIcon id={tab.id} />
                  </span>
                  <span className="production-workflow-step__label">{tab.label}</span>
                  <span className="production-workflow-step__desc">{tab.description}</span>
                  {isProductionStep && (
                    <span className="production-workflow-step__live">En planta</span>
                  )}
                  {isFinishedStep && (
                    <span className="production-workflow-step__live production-workflow-step__live--done">
                      Finalizada
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ProductionWorkflowNav
