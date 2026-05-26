import { TipoPapel } from '../../../../core/domain/entities/TipoPapel'
import type { DespieceAsociado } from '../../../../core/domain/entities/CortePapel'
import { normalizeUnidadEmpaque } from '../../../../core/domain/value-objects/UnidadEmpaque'
import { formatMedidaDisplayFrom, formatDespiecePliegoOptionLabel } from '../../catalog/cortePapelUtils'
import type { PaperRow } from '../../../../core/domain/entities/Order'

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

const despieceAssociationSummary = (item: TipoPapel): string => {
  const despieces = item.despiecesPliego ?? []
  if (despieces.length === 0) return 'sin despieces asociados'
  if (despieces.length === 1) return despieces[0].name?.trim() || '1 despiece'
  const names = despieces
    .map(d => d.name?.trim())
    .filter(Boolean)
    .slice(0, 2)
  if (names.length === 0) return `${despieces.length} despieces`
  const rest = despieces.length - names.length
  return rest > 0 ? `${names.join(', ')} +${rest}` : names.join(', ')
}

export const tipoPapelSelectOptionLabel = (
  item: TipoPapel,
  nameCounts: Map<string, number>
): string => {
  const base =
    (nameCounts.get(item.name) ?? 0) > 1
      ? `${item.name} (${formatMedidaDisplayFrom(item)})`
      : item.name
  return `${base} — ${despieceAssociationSummary(item)}`
}

/** Asegura despieces asociados y estado activo al cargar desde el repositorio o el store. */
export const normalizeTipoPapelList = (items: TipoPapel[]): TipoPapel[] =>
  items.map(item => {
    const despieces = Array.isArray(item.despiecesPliego) ? [...item.despiecesPliego] : []
    const active = item.active !== false
    return new TipoPapel(
      item.id,
      item.name,
      item.ancho,
      item.alto,
      item.unidadMedida,
      item.valorHoja ?? 0,
      normalizeUnidadEmpaque(item.unidadEmpaque),
      item.valorCorte ?? 0,
      active,
      despieces
    )
  })

export const listActiveTiposPapel = (items: TipoPapel[]): TipoPapel[] =>
  normalizeTipoPapelList(items)
    .filter(t => t.active)
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))

export const emptyPaperRow = (): PaperRow => ({
  tipoPapelId: '',
  type: '',
  size: '',
  valorHoja: 0,
  unidadEmpaque: 0,
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
  unidadEmpaque: 0,
  valorCorteUnitario: 0,
  despiece: undefined,
})

export const findDespieceInTipoPapel = (
  tipoPapel: TipoPapel | null | undefined,
  despieceId: string | undefined
): DespieceAsociado | undefined => {
  if (!tipoPapel || !despieceId) return undefined
  return tipoPapel.despiecesPliego.find(d => d.despieceId === despieceId)
}

/** Siempre devuelve el despiece del catálogo (incluye valorCorte actualizado). */
export const resolveDespieceForTipoPapel = (
  current: DespieceAsociado | undefined,
  tipoPapel: TipoPapel
): DespieceAsociado | undefined => {
  const options = tipoPapel.despiecesPliego
  if (options.length === 0) return undefined
  if (current) {
    const fromCatalog = findDespieceInTipoPapel(tipoPapel, current.despieceId)
    if (fromCatalog) return fromCatalog
  }
  return options[0]
}

/** Sincroniza fila de corte con datos vigentes del catálogo (despiece y valor corte). */
export const syncPaperRowWithTipoPapelCatalog = (
  row: PaperRow,
  tiposPapel: TipoPapel[]
): PaperRow => {
  if (!row.tipoPapelId) return row
  const item = tiposPapel.find(t => t.id === row.tipoPapelId)
  if (!item) return row
  return mergeTipoPapelIntoRow(row, item)
}

export const mergeDespiecePliegoIntoRow = (
  row: PaperRow,
  despiece: DespieceAsociado
): PaperRow => ({
  ...row,
  despiece,
  valorCorteUnitario: despiece.valorCorte ?? 0,
})

export const mergeTipoPapelIntoRow = (row: PaperRow, item: TipoPapel): PaperRow => {
  const resolved = resolveDespieceForTipoPapel(row.despiece, item)
  return {
    ...row,
    tipoPapelId: item.id,
    type: item.name,
    size: formatMedidaDisplayFrom(item),
    valorHoja: item.valorHoja,
    unidadEmpaque: item.unidadEmpaque,
    despiece: resolved,
    valorCorteUnitario: resolved?.valorCorte ?? 0,
  }
}

export const despiecePliegoSelectOptionLabel = (despiece: DespieceAsociado): string =>
  formatDespiecePliegoOptionLabel(despiece)

export const formatValorHojaDisplay = (value: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
