import React from 'react'
import { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import { PREPRENSA_DISENO_COPY as copy } from './constants/preprensaDisenoCopy'

interface SuministroOption {
  value: YesNoChoice
  title: string
  description: string
  icon: React.ReactNode
}

const SUMINISTRO_OPTIONS: SuministroOption[] = [
  {
    value: 'no',
    title: copy.planchaSuministro.opciones.empresa.title,
    description: copy.planchaSuministro.opciones.empresa.description,
    icon: (
      <svg className="production-diseno-modo__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M7 9h10M7 13h6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: 'si',
    title: copy.planchaSuministro.opciones.cliente.title,
    description: copy.planchaSuministro.opciones.cliente.description,
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

interface PreprensaPlanchaSuministroSelectorProps {
  value: YesNoChoice
  onChange: (value: YesNoChoice) => void
}

const PreprensaPlanchaSuministroSelector: React.FC<PreprensaPlanchaSuministroSelectorProps> = ({
  value,
  onChange,
}) => (
  <div
    className="production-diseno-modo production-corte-suministro-modo"
    role="radiogroup"
    aria-label={copy.planchaSuministro.ariaLabel}
  >
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
            onClick={() => onChange(opt.value)}
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

export default PreprensaPlanchaSuministroSelector
