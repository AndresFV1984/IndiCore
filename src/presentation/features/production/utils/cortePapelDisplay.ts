import { CortePapel } from '../../../core/domain/entities/CortePapel'
import { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import type { PaperRow } from '../../../core/domain/entities/Order'
import { formatMedidaDisplayFrom, formatPiezasLabel } from '../../catalog/cortePapelUtils'

export const buildCortePapelNameCounts = (items: CortePapel[]): Map<string, number> => {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item.name, (counts.get(item.name) ?? 0) + 1)
  }
  return counts
}

export const cortePapelSelectOptionLabel = (
  item: CortePapel,
  nameCounts: Map<string, number>,
  tiposPapelById?: Map<string, TipoPapel>
): string => {
  if ((nameCounts.get(item.name) ?? 0) > 1) {
    const tipo = item.tipoPapelId ? tiposPapelById?.get(item.tipoPapelId) : undefined
    const medidaLabel = tipo ? formatMedidaDisplayFrom(tipo) : formatMedidaDisplayFrom(item)
    return `${item.name} (${medidaLabel})`
  }
  return item.name
}

export const clearCortePapelFromRow = (row: PaperRow): PaperRow => ({
  ...row,
  cortePapelId: '',
  cut: '',
  corteAncho: '',
  corteAlto: '',
  corteUnidadMedida: '',
  despiece: undefined,
})

export const mergeCortePapelIntoRow = (row: PaperRow, item: CortePapel): PaperRow => ({
  ...row,
  cortePapelId: item.id,
  cut: item.name,
  corteAncho: item.ancho,
  corteAlto: item.alto,
  corteUnidadMedida: item.unidadMedida,
  despiece: item.despieces[0],
})

export const formatPiezasPorPliegoDisplay = (piezas: number): string => formatPiezasLabel(piezas)
