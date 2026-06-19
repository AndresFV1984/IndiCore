import type {
  AcabadosProduccionRegistro,
  ImpresionTintasRegistro,
  PaperRow,
  TerminadosProduccionRegistro,
} from '../../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem, PreprensaDisenoSpecs, YesNoChoice } from '../../../../core/domain/entities/PreprensaDiseno'
import type { TipoPapel } from '../../../../core/domain/entities/TipoPapel'
import { IMPRESION_COPY } from '../constants/impresionCopy'
import { CORTE_PAPEL_COPY } from '../constants/cortePapelCopy'
import { PREPRENSA_DISENO_COPY } from '../constants/preprensaDisenoCopy'
import { PRODUCTION_COBRO_COPY } from '../constants/productionCobroCopy'
import { TERMINADOS_COPY } from '../constants/terminadosCopy'
import { ACABADOS_COPY } from '../constants/acabadosCopy'
import { buildAcabadosCobroResumen, buildAcabadosCorteContexts } from './acabadosUtils'
import { buildImpresionTintasResumenConsolidado } from './impresionPrecioTintaUtils'
import { buildCorteResumenConsolidado } from './paperRowsSync'
import { computeDisenoResumenTotales } from './preprensaDisenoTotales'
import { buildTerminadosCobroResumen, buildTerminadosCorteContexts } from './terminadosUtils'

export type ProductionOrderCobroSectionId =
  | 'preprensa'
  | 'corte-papel'
  | 'impresion'
  | 'terminados'
  | 'acabados'

export interface ProductionOrderCobroLine {
  key: string
  label: string
  value: number
}

export interface ProductionOrderCobroSection {
  id: ProductionOrderCobroSectionId
  title: string
  lines: ProductionOrderCobroLine[]
  subtotal: number
}

export interface ProductionOrderCobroResumen {
  sections: ProductionOrderCobroSection[]
  grandTotal: number
  hasCharges: boolean
}

export interface BuildProductionOrderCobroResumenInput {
  preprensaDiseno: PreprensaDisenoSpecs
  coloresPlanchas: DisenoColorPlanchaItem[]
  paperRows: PaperRow[]
  tiposPapel: TipoPapel[]
  margenRedondeo: number
  clienteSuministraPapel: YesNoChoice
  impresionTintasRegistros: ImpresionTintasRegistro[]
  terminadosRegistros: TerminadosProduccionRegistro[]
  acabadosRegistros: AcabadosProduccionRegistro[]
}

const preprensaCopy = PREPRENSA_DISENO_COPY.nuevo.resumen
const corteCopy = CORTE_PAPEL_COPY.resumen
const impresionCopy = IMPRESION_COPY.tintas.resumen
const terminadosResumenCopy = TERMINADOS_COPY.asignacion.resumen
const acabadosResumenCopy = ACABADOS_COPY.asignacion.resumen
const sectionCopy = PRODUCTION_COBRO_COPY.sections

const sumLines = (lines: ProductionOrderCobroLine[]): number =>
  lines.reduce((acc, line) => acc + line.value, 0)

const buildPreprensaSection = (diseno: PreprensaDisenoSpecs): ProductionOrderCobroSection => {
  const totales = computeDisenoResumenTotales(diseno)
  const lines: ProductionOrderCobroLine[] = [
    { key: 'diseno', label: preprensaCopy.valorDiseno, value: totales.costoDiseno },
    { key: 'planchas', label: preprensaCopy.valorPlanchas, value: totales.valorTotalPlanchas },
    { key: 'montaje', label: preprensaCopy.valorMontaje, value: totales.precioMontaje },
  ].filter(line => line.value > 0)

  return {
    id: 'preprensa',
    title: sectionCopy.preprensa,
    lines,
    subtotal: totales.totalDiseno,
  }
}

const buildCorteSection = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[],
  tiposPapel: TipoPapel[],
  margenRedondeo: number,
  clienteSuministraPapel: YesNoChoice
): ProductionOrderCobroSection => {
  const { registros } = buildCorteResumenConsolidado(
    coloresPlanchas,
    paperRows,
    tiposPapel,
    margenRedondeo,
    clienteSuministraPapel
  )

  const lines = registros.flatMap(line => {
    if (!line.completo) return []
    const items: ProductionOrderCobroLine[] = []
    if (line.valorPapel > 0) {
      items.push({
        key: `${line.corteRowId ?? line.colorPlanchaId}-papel`,
        label: `${corteCopy.totalValorPapel} · ${line.shortLabel}`,
        value: line.valorPapel,
      })
    }
    if (line.valorCorte > 0) {
      items.push({
        key: `${line.corteRowId ?? line.colorPlanchaId}-corte`,
        label: `${corteCopy.valorCorte} · ${line.shortLabel}`,
        value: line.valorCorte,
      })
    }
    return items
  })

  return {
    id: 'corte-papel',
    title: sectionCopy.cortePapel,
    lines,
    subtotal: sumLines(lines),
  }
}

const buildImpresionSection = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  registros: ImpresionTintasRegistro[]
): ProductionOrderCobroSection => {
  const resumen = buildImpresionTintasResumenConsolidado(coloresPlanchas, registros)
  const lines: ProductionOrderCobroLine[] = [
    {
      key: 'color-basico',
      label: impresionCopy.valorColorBasico,
      value: resumen.totales.precioTintaColorBasico,
    },
    {
      key: 'pantone',
      label: impresionCopy.valorPantone,
      value: resumen.totales.precioTintaPantone,
    },
  ].filter(line => line.value > 0)

  return {
    id: 'impresion',
    title: sectionCopy.impresion,
    lines,
    subtotal: resumen.totales.precioTintaColorBasico + resumen.totales.precioTintaPantone,
  }
}

const buildTerminadosSection = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[],
  tiposPapel: TipoPapel[],
  margenRedondeo: number,
  clienteSuministraPapel: YesNoChoice,
  registros: TerminadosProduccionRegistro[]
): ProductionOrderCobroSection => {
  const contexts = buildTerminadosCorteContexts(
    coloresPlanchas,
    paperRows,
    tiposPapel,
    margenRedondeo,
    clienteSuministraPapel
  )
  const resumen = buildTerminadosCobroResumen(contexts, registros)
  const lines = resumen.lineas.map(linea => ({
    key: linea.corteRowKey,
    label: terminadosResumenCopy.valorPlancha(linea.planchaLabel),
    value: linea.totalCobro,
  }))

  return {
    id: 'terminados',
    title: sectionCopy.terminados,
    lines,
    subtotal: resumen.totalCobro,
  }
}

const buildAcabadosSection = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[],
  tiposPapel: TipoPapel[],
  margenRedondeo: number,
  clienteSuministraPapel: YesNoChoice,
  registros: AcabadosProduccionRegistro[]
): ProductionOrderCobroSection => {
  const contexts = buildAcabadosCorteContexts(
    coloresPlanchas,
    paperRows,
    tiposPapel,
    margenRedondeo,
    clienteSuministraPapel
  )
  const resumen = buildAcabadosCobroResumen(contexts, registros)
  const lines = resumen.lineas.map(linea => ({
    key: linea.corteRowKey,
    label: acabadosResumenCopy.valorPlancha(linea.planchaLabel),
    value: linea.totalCobro,
  }))

  return {
    id: 'acabados',
    title: sectionCopy.acabados,
    lines,
    subtotal: resumen.totalCobro,
  }
}

export const buildProductionOrderCobroResumen = (
  input: BuildProductionOrderCobroResumenInput
): ProductionOrderCobroResumen => {
  const sections = [
    buildPreprensaSection(input.preprensaDiseno),
    buildCorteSection(
      input.coloresPlanchas,
      input.paperRows,
      input.tiposPapel,
      input.margenRedondeo,
      input.clienteSuministraPapel
    ),
    buildImpresionSection(input.coloresPlanchas, input.impresionTintasRegistros),
    buildTerminadosSection(
      input.coloresPlanchas,
      input.paperRows,
      input.tiposPapel,
      input.margenRedondeo,
      input.clienteSuministraPapel,
      input.terminadosRegistros
    ),
    buildAcabadosSection(
      input.coloresPlanchas,
      input.paperRows,
      input.tiposPapel,
      input.margenRedondeo,
      input.clienteSuministraPapel,
      input.acabadosRegistros
    ),
  ]

  const grandTotal = sections.reduce((acc, section) => acc + section.subtotal, 0)

  return {
    sections,
    grandTotal,
    hasCharges: grandTotal > 0,
  }
}
