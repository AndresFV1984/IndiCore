import React, { useId, useMemo } from 'react'
import clsx from 'clsx'
import type { ImpresionTipoBifronte } from '../../../core/domain/entities/Order'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { isImpresionConVolteo } from './constants/impresionTipoBifronte'
import {
  computeTamanosBuenos,
  computeTamanosBuenosReferencia,
  type TamanosBuenosCalcResult,
} from './utils/coloresPlanchasUtils'

const detalleCopy = copy.tintas.planchaDetalle
const volteoCopy = copy.tintas.tintasVolteo

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

interface TamanosBuenosAjusteFormulaCopy {
  formulaPatronInicioConVolteo: string
  formulaPatronContinuaConVolteo: string
  formulaPatronInicioSinVolteo: string
  formulaPatronContinuaSinVolteo: string
}

interface DatosFormulaDetailsProps {
  summary: string
  steps: FormulaStep[]
}

type DatosMetricVariant = 'neutral' | 'base' | 'colorBasico' | 'pantone'

interface DatosMetricTileProps {
  labelId: string
  label: string
  value: string
  formulaSummary?: string
  formulaSteps?: FormulaStep[]
  note?: string
  hint?: string
  badge?: string
  badgeActive?: boolean
  variant?: DatosMetricVariant
  empty?: boolean
}

const formatEntero = (value: number): string => new Intl.NumberFormat('es-CO').format(value)

const buildTamanosBuenosAjusteFormulaSteps = (
  formulaCopy: TamanosBuenosAjusteFormulaCopy,
  tamanosBuenosCalc: TamanosBuenosCalcResult,
  ajusteCalc: TamanosBuenosCalcResult,
  usarReferenciaConVolteo: boolean
): FormulaStep[] => {
  if (!ajusteCalc.ok || !tamanosBuenosCalc.ok) return []

  return [
    {
      stepRule: usarReferenciaConVolteo
        ? formulaCopy.formulaPatronInicioConVolteo
        : formulaCopy.formulaPatronInicioSinVolteo,
    },
    {
      stepRule: usarReferenciaConVolteo
        ? formulaCopy.formulaPatronContinuaConVolteo
        : formulaCopy.formulaPatronContinuaSinVolteo,
    },
  ]
}

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
  badge,
  badgeActive = false,
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
      {badge ? (
        <span
          className={clsx(
            'production-impresion-datos__tile-badge',
            badgeActive && 'production-impresion-datos__tile-badge--active'
          )}
        >
          {badge}
        </span>
      ) : null}
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

const colorBasicoAjusteCopy: TamanosBuenosAjusteFormulaCopy = {
  formulaPatronInicioConVolteo: detalleCopy.tamanosBuenosReferenciaFormulaPatronInicioConVolteo,
  formulaPatronContinuaConVolteo: detalleCopy.tamanosBuenosReferenciaFormulaPatronContinuaConVolteo,
  formulaPatronInicioSinVolteo: detalleCopy.tamanosBuenosReferenciaFormulaPatronInicioSinVolteo,
  formulaPatronContinuaSinVolteo: detalleCopy.tamanosBuenosReferenciaFormulaPatronContinuaSinVolteo,
}

const pantoneAjusteCopy: TamanosBuenosAjusteFormulaCopy = {
  formulaPatronInicioConVolteo: detalleCopy.tamanosBuenosPantoneFormulaPatronInicioConVolteo,
  formulaPatronContinuaConVolteo: detalleCopy.tamanosBuenosPantoneFormulaPatronContinuaConVolteo,
  formulaPatronInicioSinVolteo: detalleCopy.tamanosBuenosPantoneFormulaPatronInicioSinVolteo,
  formulaPatronContinuaSinVolteo: detalleCopy.tamanosBuenosPantoneFormulaPatronContinuaSinVolteo,
}

const ImpresionPlanchaDetalleFields: React.FC<ImpresionPlanchaDetalleFieldsProps> = ({
  cantidad,
  numeroCavidades,
  tipoBifronteColorBasico = 'diferente-plancha',
  tipoBifrontePantone = 'diferente-plancha',
}) => {
  const headId = useId()
  const cavidadesId = useId()
  const tamanosBuenosId = useId()
  const tamanosBuenosColorBasicoId = useId()
  const tamanosBuenosPantoneId = useId()
  const usarReferenciaConVolteoColorBasico = isImpresionConVolteo(tipoBifronteColorBasico)
  const usarReferenciaConVolteoPantone = isImpresionConVolteo(tipoBifrontePantone)
  const tamanosBuenosCalc = computeTamanosBuenos(cantidad, numeroCavidades)
  const tamanosBuenosColorBasicoCalc = computeTamanosBuenosReferencia(
    cantidad,
    numeroCavidades,
    usarReferenciaConVolteoColorBasico
  )
  const tamanosBuenosPantoneCalc = computeTamanosBuenosReferencia(
    cantidad,
    numeroCavidades,
    usarReferenciaConVolteoPantone
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

  const tamanosBuenosColorBasicoFormulaSteps = useMemo(
    () =>
      buildTamanosBuenosAjusteFormulaSteps(
        colorBasicoAjusteCopy,
        tamanosBuenosCalc,
        tamanosBuenosColorBasicoCalc,
        usarReferenciaConVolteoColorBasico
      ),
    [tamanosBuenosCalc, tamanosBuenosColorBasicoCalc, usarReferenciaConVolteoColorBasico]
  )

  const tamanosBuenosPantoneFormulaSteps = useMemo(
    () =>
      buildTamanosBuenosAjusteFormulaSteps(
        pantoneAjusteCopy,
        tamanosBuenosCalc,
        tamanosBuenosPantoneCalc,
        usarReferenciaConVolteoPantone
      ),
    [tamanosBuenosCalc, tamanosBuenosPantoneCalc, usarReferenciaConVolteoPantone]
  )

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
          value={
            numeroCavidades > 0
              ? numeroCavidades.toLocaleString('es-CO')
              : detalleCopy.cavidadesEmpty
          }
          hint={numeroCavidades > 0 ? detalleCopy.cavidadesHint : undefined}
          note={numeroCavidades <= 0 ? detalleCopy.cavidadesEmpty : undefined}
          variant="neutral"
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
          variant="base"
          empty={!tamanosBuenosCalc.ok}
        />

        <DatosMetricTile
          labelId={tamanosBuenosColorBasicoId}
          label={detalleCopy.tamanosBuenosReferenciaLabel}
          value={
            tamanosBuenosColorBasicoCalc.ok
              ? tamanosBuenosColorBasicoCalc.value.toLocaleString('es-CO')
              : detalleCopy.tamanosBuenosReferenciaEmpty
          }
          formulaSummary={detalleCopy.tamanosBuenosReferenciaFormulaSummary}
          formulaSteps={tamanosBuenosColorBasicoFormulaSteps}
          note={!tamanosBuenosColorBasicoCalc.ok ? tamanosBuenosPendingMessage : undefined}
          badge={
            tamanosBuenosColorBasicoCalc.ok
              ? usarReferenciaConVolteoColorBasico
                ? volteoCopy.volteoStatusCon
                : volteoCopy.volteoStatusSin
              : undefined
          }
          badgeActive={usarReferenciaConVolteoColorBasico}
          variant="colorBasico"
          empty={!tamanosBuenosColorBasicoCalc.ok}
        />

        <DatosMetricTile
          labelId={tamanosBuenosPantoneId}
          label={detalleCopy.tamanosBuenosPantoneLabel}
          value={
            tamanosBuenosPantoneCalc.ok
              ? tamanosBuenosPantoneCalc.value.toLocaleString('es-CO')
              : detalleCopy.tamanosBuenosPantoneEmpty
          }
          formulaSummary={detalleCopy.tamanosBuenosPantoneFormulaSummary}
          formulaSteps={tamanosBuenosPantoneFormulaSteps}
          note={!tamanosBuenosPantoneCalc.ok ? tamanosBuenosPendingMessage : undefined}
          badge={
            tamanosBuenosPantoneCalc.ok
              ? usarReferenciaConVolteoPantone
                ? volteoCopy.volteoStatusCon
                : volteoCopy.volteoStatusSin
              : undefined
          }
          badgeActive={usarReferenciaConVolteoPantone}
          variant="pantone"
          empty={!tamanosBuenosPantoneCalc.ok}
        />
      </div>
    </section>
  )
}

export default ImpresionPlanchaDetalleFields
