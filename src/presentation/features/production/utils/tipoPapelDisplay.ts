import { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import type { DespieceAsociado } from '../../../core/domain/entities/CortePapel'
import { formatMedidaDisplayFrom, formatDespiecePliegoOptionLabel } from '../../catalog/cortePapelUtils'
import type { PaperRow } from '../../../core/domain/entities/Order'

export const formatTipoPapelOptionLabel = (item: TipoPapel): string =>
  `${item.name} · ${formatMedidaDisplayFrom(item)}`

/** Etiqueta del select: nombre; si hay nombres repetidos, incluye medida. */
export const buildTipoPapelNameCounts = (items: TipoPapel[]): Map<string, number> => {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item.name, (counts.get(item.name) ?? 0) + 1)
  }
  return counts
}

export const tipoPapelSelectOptionLabel = (
  item: TipoPapel,
  nameCounts: Map<string, number>
): string => {
  if ((nameCounts.get(item.name) ?? 0) > 1) {
    return `${item.name} (${formatMedidaDisplayFrom(item)})`
  }
  return item.name
}

export const emptyPaperRow = (): PaperRow => ({
  tipoPapelId: '',
  type: '',
  size: '',
  valorHoja: 0,
  unidadEmpaque: '',
  cortePapelId: '',
  cut: '',
  corteAncho: '',
  corteAlto: '',
  corteUnidadMedida: '',
})

export const clearTipoPapelFromRow = (row: PaperRow): PaperRow => ({
  ...row,
  tipoPapelId: '',
  type: '',
  size: '',
  valorHoja: 0,
  unidadEmpaque: '',
  despiece: undefined,
})

export const resolveDespieceForTipoPapel = (
  current: DespieceAsociado | undefined,
  tipoPapel: TipoPapel
): DespieceAsociado | undefined => {
  const options = tipoPapel.despiecesPliego
  if (options.length === 0) return undefined
  if (current && options.some(d => d.despieceId === current.despieceId)) {
    return current
  }
  return options[0]
}

export const mergeDespiecePliegoIntoRow = (
  row: PaperRow,
  despiece: DespieceAsociado
): PaperRow => ({
  ...row,
  despiece,
})

export const mergeTipoPapelIntoRow = (row: PaperRow, item: TipoPapel): PaperRow => ({
  ...row,
  tipoPapelId: item.id,
  type: item.name,
  size: formatMedidaDisplayFrom(item),
  valorHoja: item.valorHoja,
  unidadEmpaque: item.unidadEmpaque,
  despiece: resolveDespieceForTipoPapel(row.despiece, item),
})

export const despiecePliegoSelectOptionLabel = (despiece: DespieceAsociado): string =>
  formatDespiecePliegoOptionLabel(despiece)

export const formatValorHojaDisplay = (value: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
