import type { PaperRow } from '../../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import { isFaltanteLitografiaRow } from './cortePapelFaltante'

export const listCortePlanchaSelectableIds = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[]
): { preprensaIds: string[]; faltanteIds: string[]; allowedIds: Set<string> } => {
  const preprensaIds = coloresPlanchas.map(item => item.id)
  const faltanteIds = paperRows
    .filter(row => isFaltanteLitografiaRow(row) && row.corteRowId)
    .map(row => row.corteRowId as string)
  const allowedIds = new Set([...preprensaIds, ...faltanteIds])
  return { preprensaIds, faltanteIds, allowedIds }
}

export const resolveCorteActivePlanchaId = (
  currentId: string,
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[],
  preferIncompleteIds?: ReadonlySet<string>
): string => {
  const { preprensaIds, faltanteIds, allowedIds } = listCortePlanchaSelectableIds(
    coloresPlanchas,
    paperRows
  )

  if (currentId && allowedIds.has(currentId)) return currentId

  if (preferIncompleteIds) {
    const nextPreprensa = preprensaIds.find(id => !preferIncompleteIds.has(id))
    if (nextPreprensa) return nextPreprensa
    const nextFaltante = faltanteIds.find(id => !preferIncompleteIds.has(id))
    if (nextFaltante) return nextFaltante
  }

  return preprensaIds[0] ?? faltanteIds[0] ?? ''
}
