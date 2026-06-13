import type { PaperRow } from '../../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import { CORTE_PAPEL_COPY } from '../constants/cortePapelCopy'
import { resolveColoresPlanchaForRow, sumTamanosBuenosYSobrante } from './coloresPlanchasUtils'
import { isFaltanteLitografiaRow } from './cortePapelFaltante'
import { usesManualCantidadClienteSuministro } from './cortePapelCalculations'
import type { CortePapelValores } from './cortePapelCalculations'

const help = CORTE_PAPEL_COPY.sections.valores.helpDetalle

const fmtNum = (n: number, maxFrac = 0) =>
  n.toLocaleString('es-CO', { maximumFractionDigits: maxFrac })

export interface CorteValoresHelpPaso {
  id: 'cantidad-hojas' | 'valor-total'
  titulo: string
  formula: string
  resultado: string
}

export interface BuildCorteValoresHelpDetalleInput {
  valores: CortePapelValores
  row: PaperRow
  coloresPlanchas: DisenoColorPlanchaItem[]
  clienteSuministra: boolean
  papelSinCortar: boolean
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
  if (
    isFaltanteLitografiaRow(row) ||
    usesManualCantidadClienteSuministro(clienteSuministra ? 'si' : 'no')
  ) {
    sumaTamanos = Math.max(0, row.tamanosBuenosManual ?? 0) + Math.max(0, row.sobranteManual ?? 0)
  } else {
    const items = resolveColoresPlanchaForRow(coloresPlanchas, row)
    sumaTamanos = sumTamanosBuenosYSobrante(items)
  }

  const sumaStr = sumaTamanos > 0 ? fmtNum(sumaTamanos) : '—'
  const cantidadFormula =
    piezas > 0 && sumaTamanos > 0 && valores.cantidadHojas > 0
      ? [
          help.cantidadHojas.formulaBase,
          help.cantidadHojas.formulaConNumeros(sumaStr, piezasStr, cantidadHojasDisplay),
        ].join('\n')
      : help.cantidadHojas.formulaBase

  const cobraCorte =
    isFaltanteLitografiaRow(row) || !(clienteSuministra && !papelSinCortar)

  let valorFormula = help.valorCorteTotal.formulaBase
  if (!cobraCorte) {
    valorFormula = help.valorCorteTotal.noAplicaCortado
  } else if (
    valores.cantidadHojas > 0 &&
    valores.unidadEmpaqueCantidad > 0 &&
    valores.cocienteHojasPorEmpaque > 0 &&
    valores.valorCorteUnitario > 0
  ) {
    valorFormula = [
      help.valorCorteTotal.formulaBase,
      help.valorCorteTotal.formulaConNumeros(
        cantidadHojasDisplay,
        unidadEmpaqueDisplay,
        cocienteDisplay,
        fmtNum(margenRedondeo),
        valorUnitarioDisplay,
        valorCorteDisplay
      ),
      help.valorCorteTotal.formulaMinimo,
    ].join('\n')
  }

  return [
    {
      id: 'cantidad-hojas',
      titulo: help.cantidadHojas.titulo,
      formula: cantidadFormula,
      resultado: cantidadHojasDisplay,
    },
    {
      id: 'valor-total',
      titulo: help.valorCorteTotal.titulo,
      formula: valorFormula,
      resultado: valorCorteDisplay,
    },
  ]
}
