import React, { useId, useMemo } from 'react'
import clsx from 'clsx'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { TARIFA_MILLAR_UNIDAD } from '../../../core/domain/entities/TarifaMillar'
import { formatMillaresFactor } from './utils/impresionPrecioTintaUtils'
import type { ImpresionGrupoMillaresPreview } from './utils/impresionPrecioTintaUtils'
import { formatPrecioMillar } from './utils/impresionVolteoTarifaUtils'

const millaresCopy = copy.tintas.millaresCalculados

interface ImpresionTintasMillaresCalculadosFieldProps {
  preview: ImpresionGrupoMillaresPreview | null
  variant: 'colorBasico' | 'pantone'
  valorImpresion?: number
  conVolteo?: boolean
  precioInicial?: number
  precioPorMillar?: number
  topeMinimoMillarActivo?: number
  showTotal?: boolean
}

interface MillaresFormulaDetailsProps {
  stepTag?: string
  steps: Array<{ stepRule: string; stepCalc: string }>
  compact?: boolean
}

const formatEntero = (value: number): string => new Intl.NumberFormat('es-CO').format(value)

const MillaresFormulaDetails: React.FC<MillaresFormulaDetailsProps> = ({
  stepTag,
  steps,
  compact = false,
}) => (
  <details className="production-impresion-millares-calculados__formula">
    <summary>{millaresCopy.formulaSummary}</summary>
    {compact ? (
      <div className="production-impresion-millares-calculados__formula-compact">
        {steps.map((step, index) => (
          <p key={index} className="production-impresion-millares-calculados__formula-line">
            <span className="production-impresion-millares-calculados__formula-line-label">
              {step.stepRule}
            </span>
            <code className="production-impresion-millares-calculados__step-calc">{step.stepCalc}</code>
          </p>
        ))}
      </div>
    ) : (
      <ol className="production-impresion-millares-calculados__steps">
        {steps.map((step, index) => (
          <li key={index} className="production-impresion-millares-calculados__step">
            {stepTag ? (
              <span className="production-impresion-millares-calculados__step-tag">{stepTag}</span>
            ) : null}
            <span className="production-impresion-millares-calculados__step-rule">{step.stepRule}</span>
            <code className="production-impresion-millares-calculados__step-calc">{step.stepCalc}</code>
          </li>
        ))}
      </ol>
    )}
  </details>
)

const ImpresionTintasMillaresCalculadosField: React.FC<
  ImpresionTintasMillaresCalculadosFieldProps
> = ({
  preview,
  variant,
  valorImpresion = 0,
  conVolteo = false,
  precioInicial = 0,
  precioPorMillar = 0,
  topeMinimoMillarActivo = 0,
  showTotal = true,
}) => {
  const calculadosFieldId = useId()
  const valorImpresionFieldId = useId()
  const hasPreview = Boolean(preview && preview.cantidadTintas > 0)
  const millaresCalculadosDisplay = hasPreview
    ? formatMillaresFactor(preview!.millaresBase)
    : millaresCopy.empty

  const calculadosFormulaSteps = useMemo(
    () =>
      hasPreview
        ? [
            {
              stepRule: millaresCopy.baseFormula,
              stepCalc: `(${formatEntero(preview!.tintasTiro)} + ${formatEntero(preview!.tintasRetiro)}) × ${formatEntero(preview!.tamanosBuenos)} ÷ 1.000 = ${formatMillaresFactor(preview!.millaresBase)}`,
            },
          ]
        : [],
    [hasPreview, preview]
  )

  const valorImpresionFormulaSteps = useMemo(() => {
    if (!hasPreview || !preview || preview.millaresCalculados <= 0 || valorImpresion <= 0) {
      return []
    }
    const topeEnMillares =
      topeMinimoMillarActivo > 0 ? topeMinimoMillarActivo / TARIFA_MILLAR_UNIDAD : 0
    const usaPrecioInicial =
      conVolteo &&
      topeEnMillares > 0 &&
      preview.millaresCalculados >= topeEnMillares - 0.000001
    const precioUnitario = usaPrecioInicial ? precioInicial : precioPorMillar
    const formulaRule =
      usaPrecioInicial || !conVolteo
        ? millaresCopy.valorImpresionFormulaPrecioSinVolteo
        : millaresCopy.valorImpresionFormulaPrecioConVolteo
    return [
      {
        stepRule: formulaRule,
        stepCalc: `${formatMillaresFactor(preview.millaresCalculados)} × ${formatPrecioMillar(precioUnitario)} = ${formatPrecioMillar(valorImpresion)}`,
      },
    ]
  }, [
    conVolteo,
    hasPreview,
    precioInicial,
    precioPorMillar,
    preview,
    topeMinimoMillarActivo,
    valorImpresion,
  ])

  const valorImpresionDisplay =
    hasPreview && valorImpresion > 0 ? formatPrecioMillar(valorImpresion) : millaresCopy.empty

  if (!hasPreview) {
    return (
      <p className="production-impresion-millares-calculados__empty" role="status">
        {millaresCopy.empty}
      </p>
    )
  }

  return (
    <div
      className={clsx(
        'production-impresion-millares-calculados',
        `production-impresion-millares-calculados--${variant}`
      )}
    >
      <div className="production-impresion-millares-calculados__fields">
        <div className="production-impresion-millares-calculados__field-col">
          <div
            className={clsx(
              'production-impresion-millares-calculados__field',
              'production-impresion-millares-calculados__field--calculados'
            )}
          >
            <span
              className="production-impresion-millares-calculados__label"
              id={calculadosFieldId}
            >
              {millaresCopy.label}
            </span>
            <span
              className="production-impresion-millares-calculados__value"
              role="status"
              aria-labelledby={calculadosFieldId}
            >
              {millaresCalculadosDisplay}
            </span>
          </div>
          {calculadosFormulaSteps.length > 0 ? (
            <MillaresFormulaDetails
              stepTag={millaresCopy.formulaPasoCalculadosTitulo}
              steps={calculadosFormulaSteps}
            />
          ) : null}
        </div>

        {showTotal ? (
          <div className="production-impresion-millares-calculados__field-col">
            <div
              className={clsx(
                'production-impresion-millares-calculados__field',
                'production-impresion-millares-calculados__field--valor-impresion'
              )}
            >
              <span
                className="production-impresion-millares-calculados__label"
                id={valorImpresionFieldId}
              >
                {millaresCopy.valorImpresionLabel}
              </span>
              <span
                className="production-impresion-millares-calculados__value production-impresion-millares-calculados__value--total"
                role="status"
                aria-labelledby={valorImpresionFieldId}
              >
                {valorImpresionDisplay}
              </span>
            </div>
            {valorImpresionFormulaSteps.length > 0 ? (
              <MillaresFormulaDetails steps={valorImpresionFormulaSteps} compact />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default ImpresionTintasMillaresCalculadosField
