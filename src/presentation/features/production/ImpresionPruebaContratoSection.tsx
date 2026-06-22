import React from 'react'
import type { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'

const pruebaContratoCopy = copy.tintas.pruebaContrato

const parseDigits = (value: string): number => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

const blockNonDigitKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (allowed.includes(event.key)) return
  if (/^\d$/.test(event.key)) return
  event.preventDefault()
}

const SUMINISTRO_OPTIONS: {
  value: YesNoChoice
  title: string
  description: string
}[] = [
  {
    value: 'si',
    title: pruebaContratoCopy.opciones.cliente.title,
    description: pruebaContratoCopy.opciones.cliente.description,
  },
  {
    value: 'no',
    title: pruebaContratoCopy.opciones.empresa.title,
    description: pruebaContratoCopy.opciones.empresa.description,
  },
]

interface ImpresionPruebaContratoSectionProps {
  clienteSuministraPruebaSherpa: YesNoChoice
  precioPruebaSherpa: number
  onSuministroChange: (value: YesNoChoice) => void
  onPrecioChange: (value: number) => void
}

const ImpresionPruebaContratoSection: React.FC<ImpresionPruebaContratoSectionProps> = ({
  clienteSuministraPruebaSherpa,
  precioPruebaSherpa,
  onSuministroChange,
  onPrecioChange,
}) => (
  <div
    className="production-diseno-modo-shell production-impresion-prueba-contrato-shell"
    role="region"
    aria-label={pruebaContratoCopy.zoneLabel}
  >
    <header className="production-diseno-modo-shell__head">
      <span className="production-diseno-modo-shell__tag">{pruebaContratoCopy.tag}</span>
      <div className="production-diseno-modo-shell__titles">
        <h3 className="production-diseno-modo-shell__title">{pruebaContratoCopy.zoneLabel}</h3>
        <p className="production-diseno-modo-shell__sub">{pruebaContratoCopy.subtitle}</p>
      </div>
    </header>

    <div className="production-diseno-costo">
      <div
        className="production-diseno-modo production-diseno-costo__modo"
        role="radiogroup"
        aria-label={pruebaContratoCopy.ariaLabel}
      >
        <div className="production-diseno-modo__grid">
          {SUMINISTRO_OPTIONS.map(opt => {
            const selected = clienteSuministraPruebaSherpa === opt.value
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
                onClick={() => onSuministroChange(opt.value)}
              >
                <span className="production-diseno-modo__title">{opt.title}</span>
                <span className="production-diseno-modo__desc">{opt.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      {clienteSuministraPruebaSherpa !== 'si' ? (
        <div className="production-diseno-costo__valor">
          <label className="production-diseno-costo__label" htmlFor="impresion-prueba-sherpa-cobro">
            {pruebaContratoCopy.cobroLabel}
          </label>
          <div className="production-diseno-cost-input-wrap">
            <span className="production-diseno-cost-input-wrap__prefix" aria-hidden>
              $
            </span>
            <input
              id="impresion-prueba-sherpa-cobro"
              type="text"
              inputMode="numeric"
              className="production-diseno-cost-input-wrap__input"
              value={precioPruebaSherpa > 0 ? String(precioPruebaSherpa) : ''}
              onChange={event => onPrecioChange(parseDigits(event.target.value))}
              onKeyDown={blockNonDigitKey}
              placeholder="0"
            />
          </div>
        </div>
      ) : null}
    </div>
  </div>
)

export default ImpresionPruebaContratoSection
