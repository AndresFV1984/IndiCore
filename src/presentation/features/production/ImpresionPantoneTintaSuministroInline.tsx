import React, { useId } from 'react'
import type { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'

const tintaCopy = copy.tintas.tintaPantoneSuministro

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

interface ImpresionPantoneTintaSuministroInlineProps {
  clienteSuministraTintaPantone: YesNoChoice
  precioCobroTintaPantone: number
  onSuministroChange: (value: YesNoChoice) => void
  onPrecioChange: (value: number) => void
}

const ImpresionPantoneTintaSuministroInline: React.FC<ImpresionPantoneTintaSuministroInlineProps> = ({
  clienteSuministraTintaPantone,
  precioCobroTintaPantone,
  onSuministroChange,
  onPrecioChange,
}) => {
  const cobroId = useId()
  const litografiaSuministra = clienteSuministraTintaPantone !== 'si'

  return (
    <div
      className="production-impresion-pantone-tinta-row"
      role="group"
      aria-label={tintaCopy.ariaLabel}
    >
      <span className="production-impresion-pantone-tinta-row__label">{tintaCopy.label}</span>
      <div
        className="production-diseno-sino production-diseno-sino--compact production-impresion-pantone-tinta-row__sino"
        role="radiogroup"
        aria-label={tintaCopy.ariaLabel}
      >
        <button
          type="button"
          role="radio"
          aria-checked={clienteSuministraTintaPantone === 'si'}
          className={[
            'production-diseno-sino__btn',
            clienteSuministraTintaPantone === 'si' ? 'production-diseno-sino__btn--on' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSuministroChange('si')}
        >
          {tintaCopy.opcionCliente}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={litografiaSuministra}
          className={[
            'production-diseno-sino__btn',
            litografiaSuministra ? 'production-diseno-sino__btn--on' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSuministroChange('no')}
        >
          {tintaCopy.opcionLitografia}
        </button>
      </div>
      {litografiaSuministra ? (
        <div className="production-impresion-pantone-tinta-row__cobro">
          <label className="production-impresion-pantone-tinta-row__cobro-label" htmlFor={cobroId}>
            {tintaCopy.cobroLabel}
          </label>
          <div className="production-diseno-cost-input-wrap production-impresion-pantone-tinta-row__cobro-input">
            <span className="production-diseno-cost-input-wrap__prefix" aria-hidden>
              $
            </span>
            <input
              id={cobroId}
              type="text"
              inputMode="numeric"
              className="production-diseno-cost-input-wrap__input"
              value={precioCobroTintaPantone > 0 ? String(precioCobroTintaPantone) : ''}
              onChange={event => onPrecioChange(parseDigits(event.target.value))}
              onKeyDown={blockNonDigitKey}
              placeholder="0"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ImpresionPantoneTintaSuministroInline
