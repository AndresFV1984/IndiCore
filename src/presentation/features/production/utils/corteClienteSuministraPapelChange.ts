import type { OrderSpecs } from '../../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import type { YesNoChoice } from '../../../../core/domain/entities/PreprensaDiseno'
import { buildOperationsFromAcabadosRegistros } from './acabadosUtils'
import { isFaltanteLitografiaRow } from './cortePapelFaltante'
import { emptyPaperRow } from './tipoPapelDisplay'

export function cortePapelRowHasRegisteredContent(
  row: OrderSpecs['paperRows'][number]
): boolean {
  if (isFaltanteLitografiaRow(row)) return true
  if (row.tipoPapelId?.trim()) return true
  if (row.despiece?.despieceId) return true
  if (row.cortePapelId?.trim()) return true
  if (row.type?.trim() || row.cut?.trim()) return true
  if ((row.hojasEntregadasCliente ?? 0) > 0) return true
  if ((row.tamanosBuenosManual ?? 0) > 0) return true
  if ((row.sobranteManual ?? 0) > 0) return true
  if (row.papelCortado === 'no') return true
  return false
}

/** Hay datos de corte que se perderían al cambiar el suministro de papel. */
export function cortePapelHasRegisteredContent(
  paperRows: OrderSpecs['paperRows'] = [],
  additionalRows: OrderSpecs['paperRows'] = []
): boolean {
  return [...paperRows, ...additionalRows].some(cortePapelRowHasRegisteredContent)
}

export const resetCortePaperRowsForSuministroChange = (
  value: YesNoChoice,
  coloresPlanchas: DisenoColorPlanchaItem[] = []
): OrderSpecs['paperRows'] =>
  coloresPlanchas.map(item => {
    const base = emptyPaperRow(item.id)
    if (value !== 'si') return base
    return {
      ...base,
      papelCortado: 'si',
      hojasEntregadasCliente: 0,
      tamanosBuenosManual: 0,
      sobranteManual: 0,
    }
  })

export function patchCorteClienteSuministraPapel(
  value: YesNoChoice,
  coloresPlanchas: DisenoColorPlanchaItem[] = [],
  _currentRows: OrderSpecs['paperRows'] = []
): Partial<OrderSpecs> {
  return {
    clienteSuministraPapel: value,
    paperRows: resetCortePaperRowsForSuministroChange(value, coloresPlanchas),
    terminadosRegistros: [],
    acabadosRegistros: [],
    operations: buildOperationsFromAcabadosRegistros([]),
  }
}
