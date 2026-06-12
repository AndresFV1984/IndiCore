import React from 'react'
import { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import { PREPRENSA_DISENO_COPY } from './constants/preprensaDisenoCopy'

const copy = PREPRENSA_DISENO_COPY.nuevo.costoDiseno

const COSTO_OPTIONS: {
  value: YesNoChoice
  title: string
  description: string
}[] = [
  {
    value: 'no',
    title: copy.opciones.sinCosto.title,
    description: copy.opciones.sinCosto.description,
  },
  {
    value: 'si',
    title: copy.opciones.conCosto.title,
    description: copy.opciones.conCosto.description,
  },
]

interface DisenoCrearCostoPanelProps {
  incluir: YesNoChoice
  costo: number
  onIncluirChange: (value: YesNoChoice) => void
  onCostoInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCostoKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const DisenoCrearCostoPanel: React.FC<DisenoCrearCostoPanelProps> = ({
  incluir,
  costo,
  onIncluirChange,
  onCostoInputChange,
  onCostoKeyDown,
}) => (
  <div className="production-diseno-costo">
    <div
      className="production-diseno-modo production-diseno-costo__modo"
      role="radiogroup"
      aria-label={copy.ariaLabel}
    >
      <div className="production-diseno-modo__grid">
        {COSTO_OPTIONS.map(opt => {
          const selected = incluir === opt.value
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
              onClick={() => onIncluirChange(opt.value)}
            >
              <span className="production-diseno-modo__title">{opt.title}</span>
              <span className="production-diseno-modo__desc">{opt.description}</span>
            </button>
          )
        })}
      </div>
    </div>

    {incluir === 'si' && (
      <div className="production-diseno-costo__valor">
        <label className="production-diseno-costo__label" htmlFor="diseno-costo">
          {copy.valorLabel}
        </label>
        <div className="production-diseno-cost-input-wrap">
          <span className="production-diseno-cost-input-wrap__prefix" aria-hidden>
            $
          </span>
          <input
            id="diseno-costo"
            type="text"
            inputMode="numeric"
            className="production-diseno-cost-input-wrap__input"
            value={costo > 0 ? String(costo) : ''}
            onChange={onCostoInputChange}
            onKeyDown={onCostoKeyDown}
            placeholder="0"
            autoFocus
          />
        </div>
      </div>
    )}
  </div>
)

export default DisenoCrearCostoPanel
