import React from 'react'
import { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'

interface DisenoModoOption {
  value: YesNoChoice
  title: string
  description: string
  icon: React.ReactNode
}

const DISENO_MODO_OPTIONS: DisenoModoOption[] = [
  {
    value: 'si',
    title: 'Crear diseño nuevo',
    description: 'Arte original para esta orden',
    icon: (
      <svg className="production-diseno-modo__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    value: 'no',
    title: 'Diseño existente',
    description: 'Sin creación de arte nuevo',
    icon: (
      <svg className="production-diseno-modo__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M9 9h6M9 13h6M9 17h4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

interface DisenoModoSelectorProps {
  value: YesNoChoice
  onChange: (value: YesNoChoice) => void
}

const DisenoModoSelector: React.FC<DisenoModoSelectorProps> = ({ value, onChange }) => (
  <div className="production-diseno-modo" role="radiogroup" aria-label="Tipo de diseño">
    <p className="production-diseno-modo__lead">
      Elija si esta orden requiere crear arte nuevo o reutilizar un diseño ya registrado.
    </p>
    <div className="production-diseno-modo__grid">
      {DISENO_MODO_OPTIONS.map(opt => {
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

export default DisenoModoSelector
