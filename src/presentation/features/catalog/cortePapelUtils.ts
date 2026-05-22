import type { DespieceAsociado } from '@/core/domain/entities/CortePapel'
import {
  formatMedidaDisplay,
  type MedidaDimension,
  parseMedidaString,
} from '@/core/domain/value-objects/MedidaDimensions'

export type { MedidaDimension }

export { formatMedidaDisplay, parseMedidaString }

export interface MedidaParts {
  value: string
  unit: string
}

/** Compatibilidad con texto `medida` legado o campos separados. */
export const toMedidaDimension = (
  source: MedidaDimension | { medida: string } | DespieceAsociado
): MedidaDimension => {
  if ('ancho' in source && 'alto' in source && 'unidadMedida' in source) {
    return {
      ancho: source.ancho,
      alto: source.alto,
      unidadMedida: source.unidadMedida,
    }
  }
  return parseMedidaString(source.medida)
}

export const parseMedidaParts = (source: MedidaDimension | { medida: string }): MedidaParts => {
  const dim = toMedidaDimension(source)
  return {
    value: `${dim.ancho}×${dim.alto}`,
    unit: dim.unidadMedida,
  }
}

export const formatMedidaDisplayFrom = (source: MedidaDimension | { medida: string }): string =>
  formatMedidaDisplay(toMedidaDimension(source))

export const formatPiezasLabel = (piezas: number): string => {
  const n = piezas.toLocaleString('es-CO')
  return piezas === 1 ? `${n} pieza` : `${n} piezas`
}

export const formatDespieceMedidaPiezas = (d: DespieceAsociado): string => {
  const med = formatMedidaDisplayFrom(d)
  const pzs = formatPiezasLabel(d.piezasPorPliego)
  return `${pzs} — ${med}`
}

export const formatDespieceBadge = (d: DespieceAsociado): string => {
  const base = formatDespieceMedidaPiezas(d)
  const name = d.name?.trim()
  return name ? `${base} (${name})` : base
}
