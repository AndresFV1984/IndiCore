import React from 'react'
import clsx from 'clsx'
import { PreprensaDisenoSpecs } from '../../../core/domain/entities/PreprensaDiseno'
import { PREPRENSA_DISENO_COPY as copy } from './constants/preprensaDisenoCopy'

type AcabadoKey = 'lineaTroquel' | 'reservaUv' | 'estampado' | 'repuje'

const ACABADOS_OPTIONS: {
  key: AcabadoKey
  label: string
  description: string
  icon: 'troquel' | 'uv' | 'estampado' | 'repuje'
}[] = [
  {
    key: 'lineaTroquel',
    label: copy.acabados.lineaTroquel,
    description: copy.acabados.lineaTroquelDesc,
    icon: 'troquel',
  },
  {
    key: 'reservaUv',
    label: copy.acabados.reservaUv,
    description: copy.acabados.reservaUvDesc,
    icon: 'uv',
  },
  {
    key: 'estampado',
    label: copy.acabados.estampado,
    description: copy.acabados.estampadoDesc,
    icon: 'estampado',
  },
  {
    key: 'repuje',
    label: copy.acabados.repuje,
    description: copy.acabados.repujeDesc,
    icon: 'repuje',
  },
]

const AcabadoIcon: React.FC<{ id: (typeof ACABADOS_OPTIONS)[number]['icon'] }> = ({ id }) => {
  switch (id) {
    case 'troquel':
      return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden>
          <path
            d="M4 8.5h16M4 15.5h16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeDasharray="3 3"
          />
          <path
            d="M8 6v12M16 6v12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'uv':
      return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden>
          <circle cx="12" cy="12" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M12 3.5v2.25M12 18.25V20.5M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M3.5 12h2.25M18.25 12H20.5M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'estampado':
      return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden>
          <rect
            x="5.5"
            y="9"
            width="13"
            height="8"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M8.5 6.5h7l1.25 2.5H7.25L8.5 6.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 12.5h5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'repuje':
      return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden>
          <path
            d="M5 14.5h14v3.5H5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 10.5h9v4H7.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M10 6.5h4v4h-4z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return null
  }
}

interface DisenoAcabadosPickerProps {
  values: Pick<PreprensaDisenoSpecs, AcabadoKey>
  onToggle: (key: AcabadoKey) => void
  ariaLabel: string
}

const DisenoAcabadosPicker: React.FC<DisenoAcabadosPickerProps> = ({
  values,
  onToggle,
  ariaLabel,
}) => {
  const selectedCount = ACABADOS_OPTIONS.filter(({ key }) => values[key]).length
  const summary = copy.acabados.summary(selectedCount)

  return (
    <div className="production-diseno-acabados">
      {summary ? (
        <p className="production-diseno-acabados__summary" role="status">
          {summary}
        </p>
      ) : null}

      <div className="production-diseno-acabados__grid" role="group" aria-label={ariaLabel}>
        {ACABADOS_OPTIONS.map(({ key, label, description, icon }) => {
          const isOn = values[key]

          return (
            <button
              key={key}
              type="button"
              className={clsx(
                'production-diseno-acabados__card',
                isOn && 'production-diseno-acabados__card--on'
              )}
              aria-pressed={isOn}
              aria-label={`${label}. ${description}${isOn ? '. Activo' : ''}`}
              onClick={() => onToggle(key)}
            >
              <span className="production-diseno-acabados__icon-wrap" aria-hidden>
                <AcabadoIcon id={icon} />
              </span>
              <span className="production-diseno-acabados__label">{label}</span>
              <span
                className={clsx(
                  'production-diseno-acabados__check',
                  isOn && 'production-diseno-acabados__check--on'
                )}
                aria-hidden
              >
                {isOn ? (
                  <svg viewBox="0 0 16 16" focusable="false">
                    <path
                      d="M3.5 8.25 6.4 11.1 12.5 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default DisenoAcabadosPicker
