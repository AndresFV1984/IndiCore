import React, { useMemo } from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import { formatValorHojaDisplay } from './utils/tipoPapelDisplay'
import { parseMargenRedondeoInput } from './utils/cortePapelCalculations'
import type { CortePapelValores } from './utils/cortePapelCalculations'
import {
  buildCorteValoresHelpDetalle,
  type CorteValoresHelpPaso,
} from './utils/buildCorteValoresHelpDetalle'

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
}

interface FormulaSection {
  title: string
  description: string
  calcs: string[]
  result: string
}

const buildHelpFormulaSections = (pasos: CorteValoresHelpPaso[]): FormulaSection[] =>
  pasos.map(paso => {
    const lines = paso.formula.split('\n').filter(Boolean)
    return {
      title: paso.titulo,
      description: lines[0] ?? '',
      calcs: lines.slice(1),
      result: paso.resultado,
    }
  })

interface CorteFormulaDetailsProps {
  summary: string
  children: React.ReactNode
}

const CorteFormulaDetails: React.FC<CorteFormulaDetailsProps> = ({ summary, children }) => (
  <details className="production-corte-valores__formula">
    <summary>{summary}</summary>
    <div className="production-corte-valores__formula-body">{children}</div>
  </details>
)

interface CorteFormulaHelpDetailsProps {
  summary: string
  sections: FormulaSection[]
}

const CorteFormulaHelpDetails: React.FC<CorteFormulaHelpDetailsProps> = ({ summary, sections }) => (
  <details className="production-corte-valores__formula">
    <summary>{summary}</summary>
    <div className="production-corte-valores__formula-body production-corte-valores__formula-body--help">
      {sections.map(section => (
        <article key={section.title} className="production-corte-valores__formula-group">
          <h5 className="production-corte-valores__formula-group-title">{section.title}</h5>
          {section.description ? (
            <p className="production-corte-valores__formula-desc">{section.description}</p>
          ) : null}
          {section.calcs.length > 0 ? (
            <ul className="production-corte-valores__formula-calcs">
              {section.calcs.map(line => (
                <li key={line}>
                  <code className="production-corte-valores__formula-calc">{line}</code>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="production-corte-valores__formula-result">
            <span className="production-corte-valores__formula-result-label">Resultado aplicado</span>
            <strong className="production-corte-valores__formula-result-value">{section.result}</strong>
          </div>
        </article>
      ))}
    </div>
  </details>
)

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
}) => {
  const litografiaSuministra = !clienteSuministra || esFaltanteLitografia
  const clienteResumen = clienteSuministra && !esFaltanteLitografia
  const faltanteHojas = Math.max(0, row.hojasFaltanteCantidad ?? 0)
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

  const cantidadReady = valores.cantidadHojas > 0
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
      margenRedondeo,
      cantidadHojasDisplay,
      valorCorteDisplay,
      valorUnitarioDisplay,
      unidadEmpaqueDisplay,
      cocienteDisplay,
    ]
  )

  const helpFormulaSections = useMemo(() => buildHelpFormulaSections(helpPasos), [helpPasos])

  const clienteMetaParts = [
    valores.unidadEmpaqueCantidad > 0 ? `Unidad empaque ${unidadEmpaqueDisplay}` : '',
    valores.valorCorteUnitario > 0 ? `Corte unit. ${valorUnitarioDisplay}` : '',
  ].filter(Boolean)

  const formulasFooter = (
    <div className="production-corte-valores__formulas">
      <CorteFormulaDetails summary={valoresCopy.pasoAjuste}>
        <p className="production-corte-valores__formula-desc">{copy.sections.margenRedondeo.hint}</p>
        <div className="production-corte-valores__formula-field">
          <label className="production-corte-valores__formula-field-label" htmlFor="prod-margen-redondeo">
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
          />
        </div>
      </CorteFormulaDetails>

      {helpFormulaSections.length > 0 ? (
        <CorteFormulaHelpDetails summary={valoresCopy.helpSummary} sections={helpFormulaSections} />
      ) : null}
    </div>
  )

  return (
    <div
      className={[
        'production-corte-valores',
        clienteResumen ? 'production-corte-valores--cliente' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {clienteResumen ? (
        <>
          <div
            className="production-corte-valores__cliente-metrics"
            aria-label={`${valoresCopy.grupoCalculo} y ${valoresCopy.grupoResultado}`}
          >
            <article
              className={[
                'production-corte-valores__cliente-metric',
                cantidadReady ? 'production-corte-valores__cliente-metric--ready' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="production-corte-valores__cliente-metric-label">
                {copy.sections.cantidadHojas.label}
              </span>
              <strong
                className={[
                  'production-corte-valores__cliente-metric-value',
                  cantidadReady ? '' : 'production-corte-valores__cliente-metric-value--muted',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {cantidadHojasDisplay}
              </strong>
            </article>

            <article
              className={[
                'production-corte-valores__cliente-metric',
                'production-corte-valores__cliente-metric--resultado',
                totalReady ? 'production-corte-valores__cliente-metric--ready' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="production-corte-valores__cliente-metric-label">
                {valoresCopy.grupoResultado}
              </span>
              <strong
                className={[
                  'production-corte-valores__cliente-metric-value',
                  totalReady || valorCorteDisplay.includes('No aplica')
                    ? ''
                    : 'production-corte-valores__cliente-metric-value--muted',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {valorCorteDisplay}
              </strong>
            </article>
          </div>

          {clienteMetaParts.length > 0 ? (
            <p className="production-corte-valores__cliente-meta">
              {clienteMetaParts.join(` ${valoresCopy.cliente.metaSeparator} `)}
            </p>
          ) : null}
        </>
      ) : (
        <>
          {esFaltanteLitografia && faltanteHojas > 0 ? (
            <p className="production-corte-valores__faltante-nota">
              {copy.faltante.cantidadHojasFaltanteNota}:{' '}
              <strong>{faltanteHojas.toLocaleString('es-CO')} hojas</strong>
            </p>
          ) : null}

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
                  valores.unidadEmpaqueCantidad > 0
                    ? ''
                    : 'production-corte-valores__campo-value--muted',
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
                  valores.valorCorteUnitario > 0
                    ? ''
                    : 'production-corte-valores__campo-value--muted',
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
              <span className="production-corte-valores__total-label">
                {valoresCopy.grupoResultado}
              </span>
              <span className="production-corte-valores__total-formula">
                {valoresCopy.formulaTotal}
              </span>
            </div>
            <strong className="production-corte-valores__total-value">{valorCorteDisplay}</strong>
          </div>
        </>
      )}

      {formulasFooter}
    </div>
  )
}

export default ProductionCorteValoresSection
