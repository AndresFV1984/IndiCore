import type { PaperRow } from '../../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem, YesNoChoice } from '../../../../core/domain/entities/PreprensaDiseno'
import { createId } from '../../../../core/utils/createId'
import { resolveCantidadHojasForCorte } from './cortePapelCalculations'
import { emptyPaperRow } from './tipoPapelDisplay'

export const isFaltanteLitografiaRow = (row: PaperRow): boolean => row.esFaltanteLitografia === true

/** Id activo en UI (registro preprensa o fila faltante). */
export const getCorteRowActiveId = (row: PaperRow): string =>
  row.corteRowId ?? row.colorPlanchaId ?? ''

export const findPaperRowForActiveId = (
  paperRows: PaperRow[],
  activeId: string
): PaperRow => {
  if (!activeId) return emptyPaperRow()
  const byCorteRowId = paperRows.find(row => row.corteRowId === activeId)
  if (byCorteRowId) return byCorteRowId
  const byColorPlanchaId = paperRows.find(row => row.colorPlanchaId === activeId)
  if (byColorPlanchaId) return byColorPlanchaId
  return emptyPaperRow(activeId)
}

/** Mismo valor que Cantidad y valor › Cantidad hojas. */
export const resolveHojasCalculadasCorte = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  row: PaperRow,
  clienteSuministraPapel: YesNoChoice = 'no'
): number =>
  resolveCantidadHojasForCorte({
    coloresPlanchas,
    row,
    clienteSuministraPapel,
  })

/** @deprecated Usar {@link resolveHojasCalculadasCorte} con `clienteSuministraPapel`. */
export const resolveHojasCalculadasPreprensa = resolveHojasCalculadasCorte

export const resolveHojasFaltanteCliente = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  row: PaperRow,
  clienteSuministraPapel: YesNoChoice = 'si'
): number => {
  if (isFaltanteLitografiaRow(row)) return 0
  const calculadas = resolveHojasCalculadasCorte(coloresPlanchas, row, clienteSuministraPapel)
  const entregadas = Math.max(0, row.hojasEntregadasCliente ?? 0)
  return Math.max(0, calculadas - entregadas)
}

export const findFaltanteRowForParent = (
  paperRows: PaperRow[],
  parentColorPlanchaId: string
): PaperRow | undefined =>
  paperRows.find(
    row =>
      row.esFaltanteLitografia &&
      row.faltanteDeColorPlanchaId === parentColorPlanchaId
  )

export const createFaltanteLitografiaRow = (
  parentRow: PaperRow,
  parentColorPlanchaId: string,
  hojasFaltante: number,
  existingCorteRowId?: string
): PaperRow => {
  const cantidad = Math.max(0, Math.round(hojasFaltante))

  return {
    ...emptyPaperRow(),
    corteRowId: existingCorteRowId ?? createId(),
    esFaltanteLitografia: true,
    faltanteDeColorPlanchaId: parentColorPlanchaId,
    hojasFaltanteCantidad: cantidad,
    papelCortado: 'no',
    tamanosBuenosManual: 0,
    sobranteManual: 0,
    tipoPapelId: parentRow.tipoPapelId,
    type: parentRow.type,
    size: parentRow.size,
    valorHoja: parentRow.valorHoja,
    unidadEmpaque: parentRow.unidadEmpaque,
    valorCorteUnitario: parentRow.valorCorteUnitario,
    cortePapelId: parentRow.cortePapelId,
    cut: parentRow.cut,
    corteAncho: parentRow.corteAncho,
    corteAlto: parentRow.corteAlto,
    corteUnidadMedida: parentRow.corteUnidadMedida,
    despiece: parentRow.despiece ? { ...parentRow.despiece } : undefined,
  }
}

const parentHasPapelDetalle = (row: PaperRow): boolean =>
  Boolean(row.tipoPapelId?.trim() && row.despiece?.despieceId)

const faltanteRowsEquivalent = (a: PaperRow, b: PaperRow): boolean =>
  (a.hojasFaltanteCantidad ?? 0) === (b.hojasFaltanteCantidad ?? 0) &&
  a.tipoPapelId === b.tipoPapelId &&
  a.despiece?.despieceId === b.despiece?.despieceId &&
  (a.valorHoja ?? 0) === (b.valorHoja ?? 0) &&
  (a.valorCorteUnitario ?? 0) === (b.valorCorteUnitario ?? 0) &&
  (a.unidadEmpaque ?? 0) === (b.unidadEmpaque ?? 0)

/** Sincroniza la fila de faltante litografía según el padre y las hojas faltantes. */
export const syncFaltanteLitografiaForParent = (
  paperRows: PaperRow[],
  parent: PaperRow,
  hojasFaltante: number
): { paperRows: PaperRow[]; changed: boolean } => {
  const parentColorPlanchaId = parent.colorPlanchaId
  if (!parentColorPlanchaId) return { paperRows, changed: false }

  const cantidad = Math.max(0, Math.round(hojasFaltante))
  const existing = findFaltanteRowForParent(paperRows, parentColorPlanchaId)

  if (cantidad <= 0) {
    if (!existing?.corteRowId) return { paperRows, changed: false }
    return { paperRows: removeFaltanteRow(paperRows, existing.corteRowId), changed: true }
  }

  if (!parentHasPapelDetalle(parent)) {
    return { paperRows, changed: false }
  }

  const nextFaltante = createFaltanteLitografiaRow(
    parent,
    parentColorPlanchaId,
    cantidad,
    existing?.corteRowId
  )

  if (existing && faltanteRowsEquivalent(existing, nextFaltante)) {
    const parentIndex = paperRows.findIndex(
      row => !isFaltanteLitografiaRow(row) && row.colorPlanchaId === parentColorPlanchaId
    )
    const parentSaved = parentIndex >= 0 ? paperRows[parentIndex] : undefined
    const parentMatches =
      parentSaved &&
      parentSaved.tipoPapelId === parent.tipoPapelId &&
      parentSaved.despiece?.despieceId === parent.despiece?.despieceId &&
      (parentSaved.hojasEntregadasCliente ?? 0) === (parent.hojasEntregadasCliente ?? 0) &&
      (parentSaved.tamanosBuenosManual ?? 0) === (parent.tamanosBuenosManual ?? 0) &&
      (parentSaved.sobranteManual ?? 0) === (parent.sobranteManual ?? 0)
    if (parentMatches) return { paperRows, changed: false }
  }

  let rows = upsertPaperRow(paperRows, parent)
  rows = upsertPaperRow(rows, nextFaltante)
  return { paperRows: rows, changed: true }
}

/** Persiste el padre y agrega (o reemplaza) la fila de faltante litografía. */
export const appendFaltanteLitografiaRow = (
  paperRows: PaperRow[],
  parent: PaperRow,
  hojasFaltante: number
): { paperRows: PaperRow[]; corteRowId: string } | null => {
  const synced = syncFaltanteLitografiaForParent(paperRows, parent, hojasFaltante)
  if (!synced.changed) {
    const existing = parent.colorPlanchaId
      ? findFaltanteRowForParent(synced.paperRows, parent.colorPlanchaId)
      : undefined
    if (!existing?.corteRowId) return null
    return { paperRows: synced.paperRows, corteRowId: existing.corteRowId }
  }
  const existing = parent.colorPlanchaId
    ? findFaltanteRowForParent(synced.paperRows, parent.colorPlanchaId)
    : undefined
  if (!existing?.corteRowId) return null
  return { paperRows: synced.paperRows, corteRowId: existing.corteRowId }
}

export const upsertPaperRow = (paperRows: PaperRow[], row: PaperRow): PaperRow[] => {
  const next = [...paperRows]

  if (isFaltanteLitografiaRow(row)) {
    const corteRowId = row.corteRowId
    if (!corteRowId) {
      next.push(row)
      return next
    }
    const index = next.findIndex(r => r.corteRowId === corteRowId)
    if (index >= 0) {
      next[index] = row
      return next
    }
    next.push(row)
    return next
  }

  const registroId = row.colorPlanchaId
  if (!registroId) return paperRows.length > 0 ? paperRows : [row]

  const index = next.findIndex(
    r => !isFaltanteLitografiaRow(r) && r.colorPlanchaId === registroId
  )
  if (index >= 0) {
    next[index] = row
    return next
  }
  next.push(row)
  return next
}

export const removeFaltanteRow = (
  paperRows: PaperRow[],
  corteRowId: string
): PaperRow[] => paperRows.filter(row => row.corteRowId !== corteRowId)

/** Restablece un registro de corte (preprensa o faltante) a valores vacíos. */
export const resetPaperRowForActiveId = (
  paperRows: PaperRow[],
  activeId: string
): PaperRow[] => {
  if (!activeId.trim()) return paperRows

  const row = findPaperRowForActiveId(paperRows, activeId)
  if (isFaltanteLitografiaRow(row) && row.corteRowId) {
    return removeFaltanteRow(paperRows, row.corteRowId)
  }

  const registroId = row.colorPlanchaId ?? activeId
  return upsertPaperRow(paperRows, emptyPaperRow(registroId))
}

/** Filas de preprensa (sin faltantes) alineadas con colores/planchas. */
export const syncPreprensaPaperRows = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[]
): PaperRow[] => {
  if (coloresPlanchas.length === 0) return []

  const byRegistroId = new Map(
    paperRows
      .filter(row => row.colorPlanchaId && !isFaltanteLitografiaRow(row))
      .map(row => [row.colorPlanchaId as string, row])
  )

  return coloresPlanchas.map(item => {
    const existing = byRegistroId.get(item.id)
    return existing
      ? { ...existing, colorPlanchaId: item.id }
      : { ...emptyPaperRow(item.id) }
  })
}

export const listFaltantePaperRows = (paperRows: PaperRow[]): PaperRow[] =>
  paperRows.filter(isFaltanteLitografiaRow)

export const listAllCortePaperRows = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[]
): PaperRow[] => [...syncPreprensaPaperRows(coloresPlanchas, paperRows), ...listFaltantePaperRows(paperRows)]
