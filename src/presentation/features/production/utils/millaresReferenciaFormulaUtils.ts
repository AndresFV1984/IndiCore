import {
  DEFAULT_UMBRAL_DECIMAL_MILLAR,
  TARIFA_MILLAR_UNIDAD,
} from '../../../../core/domain/entities/TarifaMillar'
import { IMPRESION_COPY as copy } from '../constants/impresionCopy'
import {
  applyMillarDecimalRounding,
  getMillarParteDecimal,
} from './tarifaMillarPricingUtils'
import { formatMillaresFactor, type ImpresionGrupoMillaresPreview } from './impresionPrecioTintaUtils'

const millaresCopy = copy.tintas.millaresCalculados

const EPSILON = 1e-9

export interface MillaresFormulaStepDisplay {
  stepRule: string
  stepCalc: string
}

const formatUmbralDecimal = (umbral: number): string =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(umbral)

export const buildMillaresReferenciaFormulaSteps = (
  preview: ImpresionGrupoMillaresPreview,
  millarMinimoVenta = 0,
  umbralDecimalMillar = DEFAULT_UMBRAL_DECIMAL_MILLAR,
  topeMinimoMillar = 0
): MillaresFormulaStepDisplay[] => {
  const { millaresBase, millaresCalculados } = preview
  if (millaresBase <= 0 || millaresCalculados <= 0) return []

  const steps: MillaresFormulaStepDisplay[] = []
  const baseLabel = formatMillaresFactor(millaresBase)
  const resultLabel = formatMillaresFactor(millaresCalculados)
  const umbralLabel = formatUmbralDecimal(umbralDecimalMillar)
  const topeEnMillares =
    topeMinimoMillar > 0 ? topeMinimoMillar / TARIFA_MILLAR_UNIDAD : 0
  const topeLabel = formatMillaresFactor(topeEnMillares)
  const millarMinEnMillares =
    millarMinimoVenta > 0 ? millarMinimoVenta / TARIFA_MILLAR_UNIDAD : 0
  const millarMinLabel = formatMillaresFactor(millarMinEnMillares)
  const topeConfigured = topeMinimoMillar > 0 && millarMinimoVenta > 0
  const topeApplied =
    topeConfigured &&
    millaresBase < topeEnMillares - EPSILON &&
    Math.abs(millaresCalculados - millarMinEnMillares) < EPSILON

  steps.push({
    stepRule: millaresCopy.referenciaPasoOrigen,
    stepCalc: `= ${baseLabel}`,
  })

  if (topeConfigured) {
    if (topeApplied) {
      steps.push({
        stepRule: millaresCopy.referenciaPasoTope,
        stepCalc: `${baseLabel} < ${topeLabel}`,
      })
      steps.push({
        stepRule: millaresCopy.referenciaPasoMinimoVenta,
        stepCalc: `${millarMinimoVenta.toLocaleString('es-CO')} ÷ 1.000 = ${millarMinLabel}`,
      })
    } else {
      steps.push({
        stepRule: millaresCopy.referenciaPasoTope,
        stepCalc: `${baseLabel} ≥ ${topeLabel} → ${millaresCopy.referenciaPasoUmbralSiguiente}`,
      })
    }
  }

  if (!topeApplied) {
    const trasDecimal = applyMillarDecimalRounding(millaresBase, umbralDecimalMillar)
    const trasLabel = formatMillaresFactor(trasDecimal)
    const decimal = getMillarParteDecimal(millaresBase)

    steps.push({
      stepRule: `${millaresCopy.referenciaPasoUmbral} (${umbralLabel})`,
      stepCalc:
        decimal <= EPSILON
          ? millaresCopy.referenciaUmbralSinDecimal
          : decimal > umbralDecimalMillar + EPSILON
            ? millaresCopy.referenciaUmbralEnteroSiguiente.replace('{umbral}', umbralLabel)
            : millaresCopy.referenciaUmbralParteEntera.replace('{umbral}', umbralLabel),
    })

    if (Math.abs(trasDecimal - millaresBase) > EPSILON) {
      steps.push({
        stepRule: millaresCopy.referenciaPasoAjuste,
        stepCalc: `${baseLabel} → ${trasLabel}`,
      })
    }
  }

  steps.push({
    stepRule: millaresCopy.referenciaPasoResultado,
    stepCalc: `= ${resultLabel}`,
  })

  return steps
}
