import type { PaperRow } from '../../../../core/domain/entities/Order'
import type { YesNoChoice } from '../../../../core/domain/entities/PreprensaDiseno'
import { findFaltanteRowForParent, isFaltanteLitografiaRow } from './cortePapelFaltante'
import { emptyPaperRow } from './tipoPapelDisplay'

/** Datos del registro que se perderían al cambiar cortado / sin cortar (sin contar solo el estado). */
export function cortePapelRowHasEstadoCorteContent(row: PaperRow): boolean {
  if (isFaltanteLitografiaRow(row)) return true
  if (row.tipoPapelId?.trim()) return true
  if (row.despiece?.despieceId) return true
  if (row.cortePapelId?.trim()) return true
  if (row.type?.trim() || row.cut?.trim()) return true
  if ((row.hojasEntregadasCliente ?? 0) > 0) return true
  if ((row.tamanosBuenosManual ?? 0) > 0) return true
  if ((row.sobranteManual ?? 0) > 0) return true
  return false
}

export function corteRegistroHasEstadoCorteContent(
  colorPlanchaId: string,
  paperRows: PaperRow[] = [],
  draftRow?: PaperRow
): boolean {
  if (!colorPlanchaId.trim()) return false

  const saved = paperRows.find(
    row => !isFaltanteLitografiaRow(row) && row.colorPlanchaId === colorPlanchaId
  )
  if (saved && cortePapelRowHasEstadoCorteContent(saved)) return true
  if (findFaltanteRowForParent(paperRows, colorPlanchaId)) return true
  if (
    draftRow?.colorPlanchaId === colorPlanchaId &&
    cortePapelRowHasEstadoCorteContent(draftRow)
  ) {
    return true
  }
  return false
}

export const applyPapelCortadoToRow = (row: PaperRow, papelCortado: YesNoChoice): PaperRow => {
  const registroId = row.colorPlanchaId ?? ''
  return {
    ...emptyPaperRow(registroId),
    colorPlanchaId: registroId || undefined,
    papelCortado,
    hojasEntregadasCliente: 0,
    tamanosBuenosManual: 0,
    sobranteManual: 0,
  }
}

export const removeCorteRegistroFromPaperRows = (
  paperRows: PaperRow[],
  colorPlanchaId: string
): PaperRow[] =>
  paperRows.filter(row => {
    if (isFaltanteLitografiaRow(row)) {
      return row.faltanteDeColorPlanchaId !== colorPlanchaId
    }
    return row.colorPlanchaId !== colorPlanchaId
  })
