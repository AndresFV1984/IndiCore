import React, { useId, useMemo } from 'react'
import clsx from 'clsx'
import type { ImpresionTipoBifronte } from '../../../core/domain/entities/Order'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { isImpresionConVolteo } from './constants/impresionTipoBifronte'
import {
  computeTamanosBuenos,
  computeTamanosBuenosReferencia,
  resolveUsarReferenciaTamanosBuenosConVolteo,
} from './utils/coloresPlanchasUtils'

const detalleCopy = copy.tintas.planchaDetalle

interface ImpresionPlanchaDetalleFieldsProps {
  cantidad: number
  numeroCavidades: number
  tipoBifronteColorBasico?: ImpresionTipoBifronte | ''
  tipoBifrontePantone?: ImpresionTipoBifronte | ''
}

interface FormulaStep {
  stepRule: string
  stepCalc?: string
}

interface DatosFormulaDetailsProps {
  summary: string
  steps: FormulaStep[]
}

interface DatosMetricTileProps {
  labelId: string
  label: string
  value: string
  formulaSummary?: string
  formulaSteps?: FormulaStep[]
  note?: string
  accent?: boolean
  empty?: boolean
}

const formatEntero = (value: number): string => new Intl.NumberFormat('es-CO').format(value)

const DatosFormulaDetails: React.FC<DatosFormulaDetailsProps> = ({ summary, steps }) => (
  <details className="production-impresion-datos__formula">
    <summary>{summary}</summary>
    <div className="production-impresion-datos__formula-body">
      {steps.map((step, index) => (
        <p key={index} className="production-impresion-datos__formula-line">
          <span className="production-impresion-datos__formula-line-label">{step.stepRule}</span>
          {step.stepCalc ? (
            <code className="production-impresion-datos__formula-line-calc">{step.stepCalc}</code>
          ) : null}
        </p>
      ))}
    </div>
  </details>
)

const DatosMetricTile: React.FC<DatosMetricTileProps> = ({
  labelId,
  label,
  value,
  formulaSummary,
  formulaSteps,
  note,
  accent = false,
  empty = false,
}) => (
  <article
    className={clsx(
      'production-impresion-datos__tile',
      accent && 'production-impresion-datos__tile--accent',
      empty && 'production-impresion-datos__tile--empty'
    )}
  >
    <span className="production-impresion-datos__tile-label" id={labelId}>
      {label}
    </span>
    <p className="production-impresion-datos__tile-value" aria-labelledby={labelId} role="status">
      {value}
    </p>
    {formulaSummary && formulaSteps && formulaSteps.length > 0 && !empty ? (
      <DatosFormulaDetails summary={formulaSummary} steps={formulaSteps} />
    ) : note ? (
      <span className="production-impresion-datos__tile-note">{note}</span>
    ) : null}
  </article>
)

const ImpresionPlanchaDetalleFields: React.FC<ImpresionPlanchaDetalleFieldsProps> = ({
  cantidad,
  numeroCavidades,
  tipoBifronteColorBasico = 'diferente-plancha',
  tipoBifrontePantone = 'diferente-plancha',
}) => {
  const headId = useId()
  const cavidadesId = useId()
  const tamanosBuenosId = useId()
  const tamanosBuenosReferenciaId = useId()
  const usarReferenciaConVolteo = resolveUsarReferenciaTamanosBuenosConVolteo({
    conVolteoColorBasico: isImpresionConVolteo(tipoBifronteColorBasico),
    conVolteoPantone: isImpresionConVolteo(tipoBifrontePantone),
  })
  const tamanosBuenosCalc = computeTamanosBuenos(cantidad, numeroCavidades)
  const tamanosBuenosReferenciaCalc = computeTamanosBuenosReferencia(
    cantidad,
    numeroCavidades,
    usarReferenciaConVolteo
  )
  const tamanosBuenosPendingMessage = !tamanosBuenosCalc.ok
    ? tamanosBuenosCalc.reason === 'sin-cavidad'
      ? detalleCopy.tamanosBuenosNeedCavidades
      : detalleCopy.tamanosBuenosNeedCantidad
    : ''

  const tamanosBuenosFormulaSteps = useMemo<FormulaStep[]>(() => {
    if (!tamanosBuenosCalc.ok) return []
    return [
      {
        stepRule: detalleCopy.tamanosBuenosFormula,
        stepCalc: `${formatEntero(cantidad)} ÷ ${formatEntero(numeroCavidades)} = ${formatEntero(tamanosBuenosCalc.value)}`,
      },
    ]
  }, [cantidad, numeroCavidades, tamanosBuenosCalc])

  const tamanosBuenosReferenciaFormulaSteps = useMemo<FormulaStep[]>(() => {
    if (!tamanosBuenosReferenciaCalc.ok || !tamanosBuenosCalc.ok) return []
    const formulaLines = usarReferenciaConVolteo
      ? detalleCopy.tamanosBuenosReferenciaFormulaLinesConVolteo
      : detalleCopy.tamanosBuenosReferenciaFormulaLinesSinVolteo
    const formulaDescripcion = usarReferenciaConVolteo
      ? detalleCopy.tamanosBuenosReferenciaFormulaConVolteo
      : detalleCopy.tamanosBuenosReferenciaFormulaSinVolteo
    return [
      { stepRule: detalleCopy.tamanosBuenosReferenciaFormula },
      { stepRule: formulaDescripcion },
      ...formulaLines.map(line => ({ stepRule: line })),
      {
        stepRule: 'Resultado aplicado',
        stepCalc: `${formatEntero(tamanosBuenosCalc.value)} → ${formatEntero(tamanosBuenosReferenciaCalc.value)}`,
      },
    ]
  }, [tamanosBuenosCalc, tamanosBuenosReferenciaCalc, usarReferenciaConVolteo])

  return (
    <section className="production-impresion-datos" aria-labelledby={headId}>
      <header className="production-impresion-datos__head">
        <div className="production-impresion-datos__head-main">
          <h4 className="production-impresion-datos__title" id={headId}>
            {detalleCopy.zoneLabel}
          </h4>
          <p className="production-impresion-datos__subtitle">{detalleCopy.sectionPlanchaHint}</p>
        </div>
        <span className="production-impresion-datos__source">{detalleCopy.sourceBadge}</span>
      </header>

      <div className="production-impresion-datos__grid">
        <DatosMetricTile
          labelId={cavidadesId}
          label={detalleCopy.cavidadesLabel}
          value={numeroCavidades > 0 ? numeroCavidades.toLocaleString('es-CO') : detalleCopy.cavidadesEmpty}
          note={numeroCavidades > 0 ? detalleCopy.cavidadesHint : undefined}
          empty={numeroCavidades <= 0}
        />

        <DatosMetricTile
          labelId={tamanosBuenosId}
          label={detalleCopy.tamanosBuenosLabel}
          value={
            tamanosBuenosCalc.ok
              ? tamanosBuenosCalc.value.toLocaleString('es-CO')
              : detalleCopy.tamanosBuenosEmpty
          }
          formulaSummary={detalleCopy.tamanosBuenosFormulaSummary}
          formulaSteps={tamanosBuenosFormulaSteps}
          note={!tamanosBuenosCalc.ok ? tamanosBuenosPendingMessage : undefined}
          accent={tamanosBuenosCalc.ok}
          empty={!tamanosBuenosCalc.ok}
        />

        <DatosMetricTile
          labelId={tamanosBuenosReferenciaId}
          label={detalleCopy.tamanosBuenosReferenciaLabel}
          value={
            tamanosBuenosReferenciaCalc.ok
              ? tamanosBuenosReferenciaCalc.value.toLocaleString('es-CO')
              : detalleCopy.tamanosBuenosReferenciaEmpty
          }
          formulaSummary={detalleCopy.tamanosBuenosReferenciaFormulaSummary}
          formulaSteps={tamanosBuenosReferenciaFormulaSteps}
          note={!tamanosBuenosReferenciaCalc.ok ? tamanosBuenosPendingMessage : undefined}
          accent={tamanosBuenosReferenciaCalc.ok}
          empty={!tamanosBuenosReferenciaCalc.ok}
        />
      </div>
    </section>
  )
}

export default ImpresionPlanchaDetalleFields
