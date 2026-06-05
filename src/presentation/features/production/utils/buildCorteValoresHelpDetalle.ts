import type { PaperRow } from '../../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import { CORTE_PAPEL_COPY } from '../constants/cortePapelCopy'
import { formatColoresPlanchaRegistroLabel } from './paperRowsSync'
import { resolveColoresPlanchaForRow, sumTamanosBuenosYSobrante } from './coloresPlanchasUtils'
import { isFaltanteLitografiaRow } from './cortePapelFaltante'
import { usesManualCantidadClienteSuministro } from './cortePapelCalculations'
import type { CortePapelValores } from './cortePapelCalculations'
const help = CORTE_PAPEL_COPY.sections.valores.helpDetalle

const fmtNum = (n: number, maxFrac = 0) =>
  n.toLocaleString('es-CO', { maximumFractionDigits: maxFrac })

export interface CorteValoresHelpPaso {
  id: string
  campo: string
  origen: string
  formula: string
  resultado: string
}

export interface BuildCorteValoresHelpDetalleInput {
  valores: CortePapelValores
  row: PaperRow
  coloresPlanchas: DisenoColorPlanchaItem[]
  clienteSuministra: boolean
  papelSinCortar: boolean
  registroActivo: DisenoColorPlanchaItem | null
  registroIndex: number
  margenRedondeo: number
  cantidadHojasDisplay: string
  valorCorteDisplay: string
  valorUnitarioDisplay: string
  unidadEmpaqueDisplay: string
  cocienteDisplay: string
}

export const buildCorteValoresHelpDetalle = ({
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
}: BuildCorteValoresHelpDetalleInput): CorteValoresHelpPaso[] => {
  const piezas = row.despiece?.piezasPorPliego ?? 0
  const piezasStr = piezas > 0 ? fmtNum(piezas) : '—'

  let sumaTamanos = 0
  let origenCantidad = help.cantidadHojas.origenPreprensa(
    registroActivo
      ? formatColoresPlanchaRegistroLabel(registroActivo, registroIndex >= 0 ? registroIndex : 0)
      : 'Preprensa'
  )

  if (
    isFaltanteLitografiaRow(row) ||
    usesManualCantidadClienteSuministro(clienteSuministra ? 'si' : 'no')
  ) {
    sumaTamanos = Math.max(0, row.tamanosBuenosManual ?? 0) + Math.max(0, row.sobranteManual ?? 0)
    origenCantidad = isFaltanteLitografiaRow(row)
      ? `${CORTE_PAPEL_COPY.faltante.registroCantidadTitle}\n${help.cantidadHojas.origenPiezas}`
      : `${help.cantidadHojas.origenEstadoPapel}\n${help.cantidadHojas.origenPiezas}`
  } else {
    const items = resolveColoresPlanchaForRow(coloresPlanchas, row)
    sumaTamanos = sumTamanosBuenosYSobrante(items)
    origenCantidad = `${origenCantidad}\n${help.cantidadHojas.origenPiezas}`
  }

  const sumaStr = sumaTamanos > 0 ? fmtNum(sumaTamanos) : '—'
  const cantidadFormula =
    piezas > 0 && sumaTamanos > 0
      ? help.cantidadHojas.formulaConNumeros(sumaStr, piezasStr, cantidadHojasDisplay)
      : help.cantidadHojas.formula

  const unidadOrigen =
    valores.unidadEmpaqueLabel && valores.unidadEmpaqueCantidad > 0
      ? `${help.unidadEmpaque.origen}\n(${valores.unidadEmpaqueLabel})`
      : help.unidadEmpaque.origen

  const totalFormula =
    valores.cocienteHojasPorEmpaque > 0 && valores.valorCorteUnitario > 0
      ? help.valorCorteTotal.formulaConNumeros(
          cocienteDisplay,
          valorUnitarioDisplay,
          valorCorteDisplay
        )
      : help.valorCorteTotal.formula

  const pasos: CorteValoresHelpPaso[] = [
    {
      id: 'cantidad-hojas',
      campo: help.cantidadHojas.campo,
      origen: origenCantidad,
      formula: cantidadFormula,
      resultado: cantidadHojasDisplay,
    },
    {
      id: 'unidad-empaque',
      campo: help.unidadEmpaque.campo,
      origen: unidadOrigen,
      formula: help.unidadEmpaque.formula,
      resultado: unidadEmpaqueDisplay,
    },
    {
      id: 'margen',
      campo: help.margenRedondeo.campo,
      origen: help.margenRedondeo.origen,
      formula: help.margenRedondeo.formula,
      resultado: fmtNum(margenRedondeo),
    },
    {
      id: 'valor-unitario',
      campo: help.valorCorteUnitario.campo,
      origen: help.valorCorteUnitario.origen,
      formula: help.valorCorteUnitario.formula,
      resultado: valorUnitarioDisplay,
    },
  ]

  if (clienteSuministra && !papelSinCortar && !isFaltanteLitografiaRow(row)) {
    pasos.push({
      id: 'valor-total',
      campo: help.valorCorteTotal.campo,
      origen: help.valorCorteTotal.origen,
      formula: help.valorCorteTotal.noAplicaCortado,
      resultado: valorCorteDisplay,
    })
  } else {
    pasos.push({
      id: 'valor-total',
      campo: help.valorCorteTotal.campo,
      origen: help.valorCorteTotal.origen,
      formula: `${totalFormula}\n${help.valorCorteTotal.formulaMinimo}`,
      resultado: valorCorteDisplay,
    })
  }

  return pasos
}
