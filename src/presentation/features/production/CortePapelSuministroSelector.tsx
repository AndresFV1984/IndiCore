import React from 'react'
import { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'

interface SuministroOption {
  value: YesNoChoice
  title: string
  description: string
  icon: React.ReactNode
}

const SUMINISTRO_OPTIONS: SuministroOption[] = [
  {
    value: 'no',
    title: copy.suministro.opciones.empresa.title,
    description: copy.suministro.opciones.empresa.description,
    icon: (
      <svg className="production-diseno-modo__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M8 10h8M8 14h5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: 'si',
    title: copy.suministro.opciones.cliente.title,
    description: copy.suministro.opciones.cliente.description,
    icon: (
      <svg className="production-diseno-modo__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M6 20v-1a6 6 0 0 1 12 0v1"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

interface CortePapelSuministroSelectorProps {
  value: YesNoChoice
  onChange: (value: YesNoChoice) => void | Promise<void>
  hideLead?: boolean
}

const CortePapelSuministroSelector: React.FC<CortePapelSuministroSelectorProps> = ({
  value,
  onChange,
  hideLead = false,
}) => (
  <div
    className="production-diseno-modo production-corte-suministro-modo"
    role="radiogroup"
    aria-label={copy.suministro.ariaLabel}
  >
    {!hideLead && <p className="production-diseno-modo__lead">{copy.suministro.lead}</p>}
    <div className="production-diseno-modo__grid">
      {SUMINISTRO_OPTIONS.map(opt => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={[
              'production-diseno-modo__card',
              `production-diseno-modo__card--${opt.value}`,
              selected ? 'production-diseno-modo__card--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              if (selected) return
              void onChange(opt.value)
            }}
          >
            <span className="production-diseno-modo__icon-wrap">{opt.icon}</span>
            <span className="production-diseno-modo__title">{opt.title}</span>
            <span className="production-diseno-modo__desc">{opt.description}</span>
          </button>
        )
      })}
    </div>
  </div>
)

export default CortePapelSuministroSelector
