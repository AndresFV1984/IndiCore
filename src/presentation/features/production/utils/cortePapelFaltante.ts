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
  hojasFaltante: number
): PaperRow => {
  const cantidad = Math.max(0, Math.round(hojasFaltante))
  const piezas = parentRow.despiece?.piezasPorPliego ?? 0
  const tamanosInicial = piezas > 0 ? cantidad * piezas : 0

  return {
    ...emptyPaperRow(),
    corteRowId: createId(),
    esFaltanteLitografia: true,
    faltanteDeColorPlanchaId: parentColorPlanchaId,
    hojasFaltanteCantidad: cantidad,
    papelCortado: 'no',
    tamanosBuenosManual: tamanosInicial,
    sobranteManual: 0,
    tipoPapelId: parentRow.tipoPapelId,
    type: parentRow.type,
    size: parentRow.size,
    valorHoja: parentRow.valorHoja,
    unidadEmpaque: parentRow.unidadEmpaque,
    valorCorteUnitario: parentRow.valorCorteUnitario,
    despiece: parentRow.despiece ? { ...parentRow.despiece } : undefined,
  }
}

/** Persiste el padre y agrega (o reemplaza) la fila de faltante litografía. */
export const appendFaltanteLitografiaRow = (
  paperRows: PaperRow[],
  parent: PaperRow,
  hojasFaltante: number
): { paperRows: PaperRow[]; corteRowId: string } | null => {
  const parentColorPlanchaId = parent.colorPlanchaId
  if (!parentColorPlanchaId) return null

  const cantidadFaltante = Math.max(0, Math.round(hojasFaltante))
  if (cantidadFaltante <= 0) return null

  let rows = upsertPaperRow(paperRows, parent)
  const existing = findFaltanteRowForParent(rows, parentColorPlanchaId)
  if (existing?.corteRowId) {
    rows = rows.filter(r => r.corteRowId !== existing.corteRowId)
  }
  const faltanteRow = createFaltanteLitografiaRow(parent, parentColorPlanchaId, cantidadFaltante)
  rows = upsertPaperRow(rows, faltanteRow)
  const corteRowId = faltanteRow.corteRowId
  if (!corteRowId) return null
  return { paperRows: rows, corteRowId }
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
