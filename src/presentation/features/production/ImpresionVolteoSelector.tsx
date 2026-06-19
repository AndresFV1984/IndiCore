import React, { useId } from 'react'
import clsx from 'clsx'
import type { ImpresionTipoBifronte } from '../../../core/domain/entities/Order'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { IMPRESION_VOLTEO_TIPO_OPTIONS, isImpresionConVolteo } from './constants/impresionTipoBifronte'

const volteoCopy = copy.tintas.tintasVolteo

const SUBTIPO_SHORT: Record<'volteo-pinza' | 'volteo-escuadra', string> = {
  'volteo-pinza': volteoCopy.volteoPinzaShort,
  'volteo-escuadra': volteoCopy.volteoEscuadraShort,
}

const SUBTIPO_DESC: Record<'volteo-pinza' | 'volteo-escuadra', string> = {
  'volteo-pinza': volteoCopy.opcionPinzaDesc,
  'volteo-escuadra': volteoCopy.opcionEscuadraDesc,
}

const VolteoPinzaIcon = () => (
  <svg className="production-impresion-volteo-subtipo-track__icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M6 9h12M6 15h12M8 7v10M16 7v10"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <rect x="5" y="8.5" width="14" height="2" rx="0.5" fill="currentColor" opacity="0.35" />
    <rect x="5" y="13.5" width="14" height="2" rx="0.5" fill="currentColor" opacity="0.35" />
  </svg>
)

const VolteoEscuadraIcon = () => (
  <svg className="production-impresion-volteo-subtipo-track__icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M7 7h10v10H7V7z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M7 12h5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

interface ImpresionVolteoSelectorProps {
  value: ImpresionTipoBifronte | ''
  onChange: (value: ImpresionTipoBifronte) => void
  disabled?: boolean
  conVolteoPermitido?: boolean
  conVolteoBloqueadoHint?: string | null
}

const ImpresionVolteoSelector: React.FC<ImpresionVolteoSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  conVolteoPermitido = true,
  conVolteoBloqueadoHint = null,
}) => {
  const groupId = useId()
  const conVolteo = isImpresionConVolteo(value)
  const subtipoVolteo: Extract<ImpresionTipoBifronte, 'volteo-pinza' | 'volteo-escuadra'> =
    value === 'volteo-escuadra' ? 'volteo-escuadra' : 'volteo-pinza'
  const subtipoGroupId = useId()
  const conVolteoBloqueado = !conVolteoPermitido

  return (
    <fieldset className="production-impresion-volteo-selector" disabled={disabled}>
      <legend className="production-impresion-volteo-selector__legend" id={groupId}>
        {volteoCopy.volteoSelectLabel}
      </legend>
      <p className="production-impresion-volteo-selector__hint">{volteoCopy.volteoSelectHint}</p>
      {conVolteoBloqueado ? (
        <p className="production-impresion-volteo-selector__cavidades-hint" role="status">
          {conVolteoBloqueadoHint ?? volteoCopy.volteoRequiereCavidadesPares}
        </p>
      ) : null}

      <div className="production-impresion-volteo-selector__modo" role="radiogroup" aria-labelledby={groupId}>
        <label
          className={clsx(
            'production-impresion-volteo-option',
            !conVolteo && 'production-impresion-volteo-option--selected'
          )}
        >
          <input
            type="radio"
            className="production-impresion-volteo-option__input"
            name={`${groupId}-modo`}
            value="diferente-plancha"
            checked={!conVolteo}
            disabled={disabled}
            onChange={() => onChange('diferente-plancha')}
          />
          <span className="production-impresion-volteo-option__icon-wrap" aria-hidden>
            <svg className="production-impresion-volteo-option__icon-svg" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.6" />
              <rect x="13" y="8" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </span>
          <span className="production-impresion-volteo-option__body">
            <span className="production-impresion-volteo-option__title">{volteoCopy.volteoModoSin}</span>
            <span className="production-impresion-volteo-option__desc">{volteoCopy.opcionSinVolteoDesc}</span>
          </span>
          <span className="production-impresion-volteo-option__check" aria-hidden>
            ✓
          </span>
        </label>

        <label
          className={clsx(
            'production-impresion-volteo-option',
            'production-impresion-volteo-option--con',
            conVolteo && 'production-impresion-volteo-option--selected',
            conVolteoBloqueado && 'production-impresion-volteo-option--blocked'
          )}
        >
          <input
            type="radio"
            className="production-impresion-volteo-option__input"
            name={`${groupId}-modo`}
            value="con-volteo"
            checked={conVolteo}
            disabled={disabled || conVolteoBloqueado}
            onChange={() => onChange(subtipoVolteo)}
          />
          <span className="production-impresion-volteo-option__icon-wrap" aria-hidden>
            <svg className="production-impresion-volteo-option__icon-svg" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 8h10M7 16h10M9 6v12M15 6v12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M5 12h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray="2 3"
              />
            </svg>
          </span>
          <span className="production-impresion-volteo-option__body">
            <span className="production-impresion-volteo-option__title">{volteoCopy.volteoModoCon}</span>
            <span className="production-impresion-volteo-option__desc">{volteoCopy.opcionConVolteoDesc}</span>
          </span>
          <span className="production-impresion-volteo-option__check" aria-hidden>
            ✓
          </span>
        </label>
      </div>

      {conVolteo ? (
        <div className="production-impresion-volteo-selector__subtipo">
          <span className="production-impresion-volteo-selector__subtipo-label" id={subtipoGroupId}>
            {volteoCopy.volteoSubtipoLabel}
          </span>
          <div
            className="production-impresion-volteo-subtipo-track"
            role="radiogroup"
            aria-labelledby={subtipoGroupId}
            data-active={subtipoVolteo}
          >
            <span className="production-impresion-volteo-subtipo-track__indicator" aria-hidden />
            {IMPRESION_VOLTEO_TIPO_OPTIONS.map(option => {
              const selected = subtipoVolteo === option.value
              return (
                <label
                  key={option.value}
                  className={clsx(
                    'production-impresion-volteo-subtipo-track__option',
                    selected && 'production-impresion-volteo-subtipo-track__option--selected'
                  )}
                >
                  <input
                    type="radio"
                    className="production-impresion-volteo-subtipo-track__input"
                    name={`${subtipoGroupId}-subtipo`}
                    value={option.value}
                    checked={selected}
                    disabled={disabled}
                    onChange={() => onChange(option.value)}
                  />
                  <span className="production-impresion-volteo-subtipo-track__content">
                    <span className="production-impresion-volteo-subtipo-track__icon" aria-hidden>
                      {option.value === 'volteo-pinza' ? <VolteoPinzaIcon /> : <VolteoEscuadraIcon />}
                    </span>
                    <span className="production-impresion-volteo-subtipo-track__label">
                      {SUBTIPO_SHORT[option.value]}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
          <p className="production-impresion-volteo-subtipo-track__hint">{SUBTIPO_DESC[subtipoVolteo]}</p>
        </div>
      ) : null}
    </fieldset>
  )
}

export default ImpresionVolteoSelector
