import React, { useId, useMemo } from 'react'
import clsx from 'clsx'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { formatMillaresFactor, buildValorImpresionFormulaSteps, resolveValorImpresionPrecioUnitario } from './utils/impresionPrecioTintaUtils'
import type { ImpresionGrupoMillaresPreview } from './utils/impresionPrecioTintaUtils'
import { formatPrecioMillar } from './utils/impresionVolteoTarifaUtils'

const millaresCopy = copy.tintas.millaresCalculados
const colorBasicoCopy = copy.tintas.colorBasico
const pantoneCopy = copy.tintas.pantone

interface ImpresionTintasMillaresCalculadosFieldProps {
  preview: ImpresionGrupoMillaresPreview | null
  variant: 'colorBasico' | 'pantone'
  valorImpresion?: number
  conVolteo?: boolean
  precioInicial?: number
  precioPorMillar?: number
  precioConVolteoMillar?: number
  usaPrecioConVolteoColorBasico?: boolean
  usaPrecioConVolteoPantone?: boolean
  topeMinimoMillarActivo?: number
  showTotal?: boolean
}

interface MillaresFormulaDetailsProps {
  stepTag?: string
  steps: Array<{ stepRule: string; stepCalc: string }>
  compact?: boolean
  summary?: string
}

const formatEntero = (value: number): string => new Intl.NumberFormat('es-CO').format(value)

const MillaresFormulaDetails: React.FC<MillaresFormulaDetailsProps> = ({
  stepTag,
  steps,
  compact = false,
  summary = millaresCopy.formulaSummary,
}) => (
  <details className="production-impresion-millares-calculados__formula">
    <summary>{summary}</summary>
    {compact ? (
      <p className="production-impresion-millares-calculados__formula-resumen">
        <code className="production-impresion-millares-calculados__step-calc">{steps[0]?.stepCalc}</code>
      </p>
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
  precioConVolteoMillar = 0,
  usaPrecioConVolteoColorBasico = false,
  usaPrecioConVolteoPantone = false,
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
              stepRule:
                preview!.tamanosBuenosFuente === 'referencia'
                  ? variant === 'pantone'
                    ? millaresCopy.baseFormulaPantone
                    : millaresCopy.baseFormula
                  : millaresCopy.baseFormulaTamanosBuenos,
              stepCalc: `(${formatEntero(preview!.tintasTiro)} + ${formatEntero(preview!.tintasRetiro)}) × ${formatEntero(preview!.tamanosBuenos)} ÷ 1.000 = ${formatMillaresFactor(preview!.millaresBase)}`,
            },
          ]
        : [],
    [hasPreview, preview, variant]
  )

  const valorImpresionFormulaSteps = useMemo(() => {
    if (!hasPreview || !preview || preview.millaresCalculados <= 0 || valorImpresion <= 0) {
      return []
    }
    const { precioUnitario, usaPrecioInicial } = resolveValorImpresionPrecioUnitario({
      variant,
      conVolteo,
      usaPrecioConVolteoColorBasico,
      usaPrecioConVolteoPantone,
      millaresCalculados: preview.millaresCalculados,
      topeMinimoMillarActivo,
      precioInicial,
      precioPorMillar,
      precioConVolteoMillar,
    })

    const priceLabels =
      variant === 'colorBasico'
        ? {
            precioConVolteo: colorBasicoCopy.precioConVolteoLabel,
            precioSinVolteo: colorBasicoCopy.precioInicialLabel,
          }
        : {
            precioConVolteo: pantoneCopy.precioConVolteoLabel,
            precioSinVolteo: pantoneCopy.precioInicialLabel,
          }

    return buildValorImpresionFormulaSteps({
      variant,
      conVolteo,
      usaPrecioConVolteoColorBasico,
      usaPrecioConVolteoPantone,
      usaPrecioInicial,
      millaresCalculados: preview.millaresCalculados,
      precioUnitario,
      valorImpresion,
      copy: {
        millaresReferencia: millaresCopy.label,
        precioImpresion: millaresCopy.valorImpresionLabel,
        operacion: millaresCopy.valorImpresionFormulaOperacion,
        tarifaConVolteo: millaresCopy.valorImpresionTarifaConVolteo,
        tarifaSinVolteo: millaresCopy.valorImpresionTarifaSinVolteo,
        motivoRef500: millaresCopy.valorImpresionMotivoRef500,
        motivoRef1000: millaresCopy.valorImpresionMotivoRef1000,
        motivoVolteoBajoTope: millaresCopy.valorImpresionMotivoVolteoBajoTope,
        motivoVolteoSobreTope: millaresCopy.valorImpresionMotivoVolteoSobreTope,
      },
      priceLabels,
      formatPrecio: formatPrecioMillar,
    })
  }, [
    conVolteo,
    hasPreview,
    precioConVolteoMillar,
    precioInicial,
    precioPorMillar,
    preview,
    topeMinimoMillarActivo,
    usaPrecioConVolteoColorBasico,
    usaPrecioConVolteoPantone,
    valorImpresion,
    variant,
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
              <MillaresFormulaDetails
                steps={valorImpresionFormulaSteps}
                compact
                summary={millaresCopy.valorImpresionFormulaSummary}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default ImpresionTintasMillaresCalculadosField
