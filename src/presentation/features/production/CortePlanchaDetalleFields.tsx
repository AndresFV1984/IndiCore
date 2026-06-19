import React, { useId, useMemo } from 'react'
import clsx from 'clsx'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem, YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import { buildCortePapelDatosPlancha } from './utils/cortePapelDatosPlancha'

const detalleCopy = copy.sections.datosPlancha

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
  hint?: string
  variant?: 'neutral' | 'base'
  empty?: boolean
}

const formatEntero = (value: number): string => new Intl.NumberFormat('es-CO').format(value)

const DatosFormulaDetails: React.FC<DatosFormulaDetailsProps> = ({ summary, steps }) => (
  <details className="production-impresion-datos__formula">
    <summary>
      <span className="production-impresion-datos__formula-summary">{summary}</span>
    </summary>
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
  hint,
  variant = 'neutral',
  empty = false,
}) => (
  <article
    className={clsx(
      'production-impresion-datos__tile',
      variant !== 'neutral' && `production-impresion-datos__tile--${variant}`,
      empty && 'production-impresion-datos__tile--empty'
    )}
  >
    <div className="production-impresion-datos__tile-head">
      <span className="production-impresion-datos__tile-label" id={labelId}>
        {label}
      </span>
    </div>
    <p className="production-impresion-datos__tile-value" aria-labelledby={labelId} role="status">
      {value}
    </p>
    {formulaSummary && formulaSteps && formulaSteps.length > 0 && !empty ? (
      <DatosFormulaDetails summary={formulaSummary} steps={formulaSteps} />
    ) : note ? (
      <span className="production-impresion-datos__tile-note">{note}</span>
    ) : hint ? (
      <span className="production-impresion-datos__tile-hint">{hint}</span>
    ) : null}
  </article>
)

const resolveSourceBadge = (source: ReturnType<typeof buildCortePapelDatosPlancha>['source']): string => {
  switch (source) {
    case 'manual-cliente':
      return detalleCopy.sourceBadgeManualCliente
    case 'faltante-hojas':
      return detalleCopy.sourceBadgeFaltante
    case 'manual-faltante':
      return detalleCopy.sourceBadgeManualFaltante
    default:
      return detalleCopy.sourceBadgePreprensa
  }
}

interface CortePlanchaDetalleFieldsProps {
  row: PaperRow
  coloresPlanchas: DisenoColorPlanchaItem[]
  clienteSuministraPapel: YesNoChoice
}

const CortePlanchaDetalleFields: React.FC<CortePlanchaDetalleFieldsProps> = ({
  row,
  coloresPlanchas,
  clienteSuministraPapel,
}) => {
  const headId = useId()
  const tamanosBuenosId = useId()
  const sobranteId = useId()

  const viewModel = useMemo(
    () =>
      buildCortePapelDatosPlancha({
        coloresPlanchas,
        row,
        clienteSuministraPapel,
      }),
    [coloresPlanchas, row, clienteSuministraPapel]
  )

  const tamanosBuenos = viewModel.lineas.reduce((sum, linea) => sum + (linea.tamanosBuenos ?? 0), 0)
  const sobrante = viewModel.lineas.reduce((sum, linea) => sum + linea.sobrante, 0)
  const formulaLinea = viewModel.lineas.find(linea => linea.formula)

  const tamanosBuenosFormulaSteps = useMemo<FormulaStep[]>(() => {
    if (!formulaLinea?.formula) return []
    return [
      {
        stepRule: detalleCopy.tamanosBuenosFormula,
        stepCalc: formulaLinea.formula,
      },
    ]
  }, [formulaLinea?.formula])

  const tamanosBuenosEmpty = tamanosBuenos <= 0
  const sobranteEmpty = sobrante <= 0

  const tamanosBuenosNote =
    tamanosBuenosEmpty && viewModel.emptyMessage ? viewModel.emptyMessage : undefined

  return (
    <section className="production-impresion-datos" aria-labelledby={headId}>
      <header className="production-impresion-datos__head">
        <div className="production-impresion-datos__head-main">
          <h4 className="production-impresion-datos__title" id={headId}>
            {detalleCopy.zoneLabel}
          </h4>
          <p className="production-impresion-datos__subtitle">{viewModel.sourceHint}</p>
        </div>
        <span className="production-impresion-datos__source">{resolveSourceBadge(viewModel.source)}</span>
      </header>

      <div className="production-impresion-datos__grid production-corte-datos-plancha__grid">
        <DatosMetricTile
          labelId={tamanosBuenosId}
          label={detalleCopy.tamanosBuenosLabel}
          value={tamanosBuenosEmpty ? detalleCopy.tamanosBuenosEmpty : formatEntero(tamanosBuenos)}
          formulaSummary={detalleCopy.formulaSummary}
          formulaSteps={tamanosBuenosFormulaSteps}
          note={tamanosBuenosNote}
          hint={!tamanosBuenosEmpty ? detalleCopy.tamanosBuenosHint : undefined}
          variant="base"
          empty={tamanosBuenosEmpty}
        />

        <DatosMetricTile
          labelId={sobranteId}
          label={detalleCopy.sobranteLabel}
          value={sobranteEmpty ? detalleCopy.sobranteEmpty : formatEntero(sobrante)}
          note={sobranteEmpty && !tamanosBuenosNote ? viewModel.emptyMessage : undefined}
          hint={!sobranteEmpty ? detalleCopy.sobranteHint : undefined}
          variant="neutral"
          empty={sobranteEmpty}
        />
      </div>
    </section>
  )
}

export default CortePlanchaDetalleFields
