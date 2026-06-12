import React, { useMemo } from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import { formatValorHojaDisplay } from './utils/tipoPapelDisplay'
import { parseMargenRedondeoInput } from './utils/cortePapelCalculations'
import type { CortePapelValores } from './utils/cortePapelCalculations'
import { buildCorteValoresHelpDetalle } from './utils/buildCorteValoresHelpDetalle'

interface ProductionCorteValoresSectionProps {
  row: PaperRow
  coloresPlanchas: DisenoColorPlanchaItem[]
  valores: CortePapelValores
  cantidadHojasDisplay: string
  valorCorteDisplay: string
  margenRedondeo: number
  onMargenRedondeoChange: (value: number) => void
  clienteSuministra: boolean
  esFaltanteLitografia?: boolean
  papelSinCortar: boolean
  registroActivo: DisenoColorPlanchaItem | null
  registroIndex: number
}

const helpLabels = copy.sections.valores.helpDetalle

const valoresCopy = copy.sections.valores

const ProductionCorteValoresSection: React.FC<ProductionCorteValoresSectionProps> = ({
  row,
  coloresPlanchas,
  valores,
  cantidadHojasDisplay,
  valorCorteDisplay,
  margenRedondeo,
  onMargenRedondeoChange,
  clienteSuministra,
  esFaltanteLitografia = false,
  papelSinCortar,
  registroActivo,
  registroIndex,
}) => {
  const litografiaSuministra = !clienteSuministra || esFaltanteLitografia
  const unidadEmpaqueDisplay =
    valores.unidadEmpaqueCantidad > 0
      ? valores.unidadEmpaqueCantidad.toLocaleString('es-CO')
      : copy.sections.unidadEmpaque.empty

  const valorUnitarioDisplay =
    valores.valorCorteUnitario > 0
      ? formatValorHojaDisplay(valores.valorCorteUnitario)
      : copy.sections.valorCorteUnitario.empty

  const cocienteDisplay =
    valores.unidadEmpaqueCantidad > 0 && valores.cantidadHojas > 0
      ? valores.cocienteHojasPorEmpaque.toLocaleString('es-CO', { maximumFractionDigits: 4 })
      : '—'

  const totalReady = valores.valorCorte > 0
  const valorPapelReady = valores.valorPapel > 0
  const valorPapelDisplay =
    valores.valorPapel > 0 ? formatValorHojaDisplay(valores.valorPapel) : '$ 0'
  const helpPasos = useMemo(
    () =>
      buildCorteValoresHelpDetalle({
        valores,
        row,
        coloresPlanchas,
        clienteSuministra,
        papelSinCortar,
        registroActivo,
        registroIndex,
        margenRedondeo,
        cantidadHojasDisplay,
        valorCorteDisplay,
        valorUnitarioDisplay,
        unidadEmpaqueDisplay,
        cocienteDisplay,
      }),
    [
      valores,
      row,
      coloresPlanchas,
      clienteSuministra,
      papelSinCortar,
      registroActivo,
      registroIndex,
      margenRedondeo,
      cantidadHojasDisplay,
      valorCorteDisplay,
      valorUnitarioDisplay,
      unidadEmpaqueDisplay,
      cocienteDisplay,
    ]
  )

  return (
    <div className="production-corte-valores">
      <div className="production-corte-valores__campos" aria-label={valoresCopy.grupoCalculo}>
        <div className="production-corte-valores__campo">
          <span className="production-corte-valores__campo-label">
            {copy.sections.cantidadHojas.label}
          </span>
          <span
            className={[
              'production-corte-valores__campo-value',
              valores.cantidadHojas > 0 ? '' : 'production-corte-valores__campo-value--muted',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {cantidadHojasDisplay}
          </span>
        </div>

        <div className="production-corte-valores__campo">
          <span className="production-corte-valores__campo-label">Unidad empaque</span>
          <span
            className={[
              'production-corte-valores__campo-value',
              valores.unidadEmpaqueCantidad > 0 ? '' : 'production-corte-valores__campo-value--muted',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {unidadEmpaqueDisplay}
          </span>
        </div>

        <div className="production-corte-valores__campo">
          <span className="production-corte-valores__campo-label">Valor corte unit.</span>
          <span
            className={[
              'production-corte-valores__campo-value',
              valores.valorCorteUnitario > 0 ? '' : 'production-corte-valores__campo-value--muted',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {valorUnitarioDisplay}
          </span>
        </div>
      </div>

      {litografiaSuministra ? (
        <div
          className={[
            'production-corte-valores__total',
            'production-corte-valores__total--papel',
            valorPapelReady ? 'production-corte-valores__total--ready' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-live="polite"
        >
          <div className="production-corte-valores__total-text">
            <span className="production-corte-valores__total-label">
              {copy.resumen.valorPapelLabel}
            </span>
            <span className="production-corte-valores__total-formula">
              {copy.resumen.valorPapelHint}
            </span>
          </div>
          <strong className="production-corte-valores__total-value">{valorPapelDisplay}</strong>
        </div>
      ) : null}

      <div
        className={[
          'production-corte-valores__total',
          totalReady ? 'production-corte-valores__total--ready' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-live="polite"
      >
        <div className="production-corte-valores__total-text">
          <span className="production-corte-valores__total-label">{valoresCopy.grupoResultado}</span>
          <span className="production-corte-valores__total-formula">{valoresCopy.formulaTotal}</span>
        </div>
        <strong className="production-corte-valores__total-value">{valorCorteDisplay}</strong>
      </div>

      <details className="production-corte-valores__collapsible production-corte-valores__adjust">
        <summary>{valoresCopy.pasoAjuste}</summary>
        <div className="production-corte-valores__adjust-body">
          <div className="production-form-field production-corte-valores__margen-field">
            <label className="production-form-label" htmlFor="prod-margen-redondeo">
              {copy.sections.margenRedondeo.label}
            </label>
            <input
              id="prod-margen-redondeo"
              type="number"
              min={0}
              step={1}
              className="production-form-input production-corte-valores__margen-input"
              value={margenRedondeo}
              onChange={e => onMargenRedondeoChange(parseMargenRedondeoInput(e.target.value))}
              aria-describedby="prod-margen-redondeo-hint"
            />
            <p id="prod-margen-redondeo-hint" className="production-corte-valores__margen-hint">
              {copy.sections.margenRedondeo.hint}
            </p>
          </div>
        </div>
      </details>

      <details className="production-corte-valores__collapsible production-corte-valores__help">
        <summary>{valoresCopy.helpSummary}</summary>
        <ol className="production-corte-valores__help-steps">
          {helpPasos.map((paso, index) => (
            <li key={paso.id} className="production-corte-valores__help-step">
              <div className="production-corte-valores__help-step-head">
                <span className="production-corte-valores__help-step-num">{index + 1}</span>
                <strong className="production-corte-valores__help-step-campo">{paso.campo}</strong>
              </div>
              <dl className="production-corte-valores__help-step-dl">
                <div className="production-corte-valores__help-step-row">
                  <dt>{helpLabels.etiquetaOrigen}</dt>
                  <dd className="production-corte-valores__help-step-origen">
                    {paso.origen.split('\n').map((linea, i) => (
                      <span key={i}>{linea}</span>
                    ))}
                  </dd>
                </div>
                <div className="production-corte-valores__help-step-row">
                  <dt>{helpLabels.etiquetaFormula}</dt>
                  <dd className="production-corte-valores__help-step-formula">
                    {paso.formula.split('\n').map((linea, i) => (
                      <span key={i}>{linea}</span>
                    ))}
                  </dd>
                </div>
                <div className="production-corte-valores__help-step-row">
                  <dt>{helpLabels.etiquetaResultado}</dt>
                  <dd>
                    <strong className="production-corte-valores__help-step-valor">{paso.resultado}</strong>
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      </details>
    </div>
  )
}

export default ProductionCorteValoresSection
