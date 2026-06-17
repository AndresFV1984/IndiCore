import React from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'

const parseDigits = (value: string): number => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

const blockNonDigitKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const allowed = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]
  if (allowed.includes(e.key)) return
  if (!/^\d$/.test(e.key)) e.preventDefault()
}

const formatCantidadField = (value: number): string => (value > 0 ? String(value) : '')

export type CortePapelEstadoCorteVariant = 'cliente' | 'faltanteLitografia'

interface CortePapelEstadoCorteFieldsProps {
  row: PaperRow
  onChange: (row: PaperRow) => void
  onPapelCortadoChange?: (value: YesNoChoice) => void
  /** Sin cabecera ni borde propio (dentro de CortePapelEstadoCorteShell). */
  embedded?: boolean
  variant?: CortePapelEstadoCorteVariant
}

const CortePapelEstadoCorteFields: React.FC<CortePapelEstadoCorteFieldsProps> = ({
  row,
  onChange,
  onPapelCortadoChange,
  embedded = false,
  variant = 'cliente',
}) => {
  const estado = copy.estadoCorte
  const faltanteLitografia = variant === 'faltanteLitografia'
  const faltante = copy.faltante
  const papelCortado: YesNoChoice = row.papelCortado ?? 'si'
  const { tamanosBuenosLabel, sobranteLabel } = estado
  const hojasEntregadas = row.hojasEntregadasCliente ?? 0
  const tamanosBuenos = row.tamanosBuenosManual ?? 0
  const sobrante = row.sobranteManual ?? 0

  const setPapelCortado = (value: YesNoChoice) => {
    if (onPapelCortadoChange) {
      onPapelCortadoChange(value)
      return
    }
    onChange({
      ...row,
      papelCortado: value,
      hojasEntregadasCliente: 0,
      tamanosBuenosManual: 0,
      sobranteManual: 0,
    })
  }

  const body = (
    <>
      {!faltanteLitografia ? (
        <div
          className="production-diseno-modo production-corte-estado-corte__modo"
          role="radiogroup"
          aria-label={estado.opcionesAria}
        >
          <div className="production-diseno-modo__grid production-diseno-modo__grid--2">
            <button
              type="button"
              role="radio"
              aria-checked={papelCortado === 'si'}
              className={[
                'production-diseno-modo__card',
                'production-diseno-modo__card--si',
                papelCortado === 'si' ? 'production-diseno-modo__card--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setPapelCortado('si')}
            >
              <span className="production-diseno-modo__title">{estado.cortado.title}</span>
              <span className="production-diseno-modo__desc">{estado.cortado.description}</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={papelCortado === 'no'}
              className={[
                'production-diseno-modo__card',
                'production-diseno-modo__card--no',
                papelCortado === 'no' ? 'production-diseno-modo__card--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setPapelCortado('no')}
            >
              <span className="production-diseno-modo__title">{estado.sinCortar.title}</span>
              <span className="production-diseno-modo__desc">{estado.sinCortar.description}</span>
            </button>
          </div>
        </div>
      ) : null}

      {!faltanteLitografia ? (
        <section
          className="production-corte-material-entrada"
          aria-labelledby="prod-corte-material-entrada-title"
        >
          <header className="production-corte-material-entrada__head">
            <h4
              id="prod-corte-material-entrada-title"
              className="production-corte-material-entrada__title"
            >
              {estado.panelTitle}
            </h4>
            <p className="production-corte-material-entrada__hint">{estado.panelHint}</p>
          </header>
          <div className="production-corte-material-entrada__grid">
            <div className="production-form-field production-corte-material-entrada__field">
              <label className="production-form-label" htmlFor="prod-corte-hojas-entregadas">
                {estado.hojasEntregadasLabel}
              </label>
              <input
                id="prod-corte-hojas-entregadas"
                type="text"
                inputMode="numeric"
                className="production-form-input"
                value={formatCantidadField(hojasEntregadas)}
                onChange={e =>
                  onChange({ ...row, hojasEntregadasCliente: parseDigits(e.target.value) })
                }
                onKeyDown={blockNonDigitKey}
                placeholder={estado.cantidadPlaceholder}
              />
            </div>
            <div className="production-form-field production-corte-material-entrada__field">
              <label className="production-form-label" htmlFor="prod-corte-tamanos-buenos">
                {tamanosBuenosLabel}
              </label>
              <input
                id="prod-corte-tamanos-buenos"
                type="text"
                inputMode="numeric"
                className="production-form-input"
                value={formatCantidadField(tamanosBuenos)}
                onChange={e => onChange({ ...row, tamanosBuenosManual: parseDigits(e.target.value) })}
                onKeyDown={blockNonDigitKey}
                placeholder={estado.cantidadPlaceholder}
              />
            </div>
            <div className="production-form-field production-corte-material-entrada__field">
              <label className="production-form-label" htmlFor="prod-corte-sobrante">
                {sobranteLabel}
              </label>
              <input
                id="prod-corte-sobrante"
                type="text"
                inputMode="numeric"
                className="production-form-input"
                value={formatCantidadField(sobrante)}
                onChange={e => onChange({ ...row, sobranteManual: parseDigits(e.target.value) })}
                onKeyDown={blockNonDigitKey}
                placeholder={estado.cantidadPlaceholder}
              />
            </div>
          </div>
        </section>
      ) : (
        <div className="production-corte-estado-corte__manual-panel">
          <header className="production-corte-estado-corte__manual-head">
            <span className="production-corte-estado-corte__manual-tag">
              {faltante.registroCantidadTag}
            </span>
            <h4 className="production-corte-estado-corte__manual-title">
              {faltante.registroCantidadTitle}
            </h4>
            <p className="production-corte-estado-corte__manual-hint">
              {faltante.registroCantidadHint}
            </p>
          </header>
          <div className="production-corte-estado-corte__manual-grid production-corte-estado-corte__manual-grid--faltante">
            <div className="production-form-field">
              <label className="production-form-label" htmlFor="prod-corte-tamanos-buenos-faltante">
                {tamanosBuenosLabel}
              </label>
              <input
                id="prod-corte-tamanos-buenos-faltante"
                type="text"
                inputMode="numeric"
                className="production-form-input"
                value={formatCantidadField(tamanosBuenos)}
                onChange={e => onChange({ ...row, tamanosBuenosManual: parseDigits(e.target.value) })}
                onKeyDown={blockNonDigitKey}
                placeholder="0"
              />
            </div>
            <div className="production-form-field">
              <label className="production-form-label" htmlFor="prod-corte-sobrante-faltante">
                {sobranteLabel}
              </label>
              <input
                id="prod-corte-sobrante-faltante"
                type="text"
                inputMode="numeric"
                className="production-form-input"
                value={formatCantidadField(sobrante)}
                onChange={e => onChange({ ...row, sobranteManual: parseDigits(e.target.value) })}
                onKeyDown={blockNonDigitKey}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )

  if (embedded) {
    return (
      <div className="production-corte-estado-corte production-corte-estado-corte--embedded">
        {body}
      </div>
    )
  }

  return (
    <div
      className="production-diseno-modo-shell production-corte-estado-corte"
      role="region"
      aria-label={estado.ariaLabel}
    >
      <header className="production-diseno-modo-shell__head">
        <span className="production-diseno-modo-shell__tag">{estado.tag}</span>
        <div className="production-diseno-modo-shell__titles">
          <h3 className="production-diseno-modo-shell__title">{estado.title}</h3>
          <p className="production-diseno-modo-shell__sub">{estado.subtitle}</p>
        </div>
      </header>
      {body}
    </div>
  )
}

export default CortePapelEstadoCorteFields
