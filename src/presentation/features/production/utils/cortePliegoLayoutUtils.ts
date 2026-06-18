import type { DespieceAsociado } from '../../../../core/domain/entities/CortePapel'
import type { TipoPapel } from '../../../../core/domain/entities/TipoPapel'
import {
  solveAllCortePliegoOrientationsMm,
  type CortePliegoPackingAlgorithm,
  type PlacedPiece,
} from './cortePliegoBinPacking'

export type { PlacedPiece, CortePliegoPackingAlgorithm }

export interface CortePliegoOccupiedBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface CortePliegoLayout {
  paperWidth: number
  paperHeight: number
  pieceWidth: number
  pieceHeight: number
  unidadMedida: string
  cols: number
  rows: number
  totalPieces: number
  pieceRotated: boolean
  paperSwapped: boolean
  occupiedBounds: CortePliegoOccupiedBounds
  usedWidth: number
  usedHeight: number
  wasteArea: number
  wastePercent: number
  paperArea: number
  algorithm: CortePliegoPackingAlgorithm
  shelfCounts: number[]
  placements: PlacedPiece[]
}

const parsePositive = (value: string | undefined): number => {
  const normalized = (value ?? '').trim().replace(',', '.')
  if (!normalized) return 0
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const toMillimeters = (value: number, unit: string): number => {
  switch (unit.trim().toLowerCase()) {
    case 'mm':
      return value
    case 'cm':
      return value * 10
    case 'm':
      return value * 1000
    case 'in':
      return value * 25.4
    default:
      return value * 10
  }
}

const fromMillimeters = (value: number, unit: string): number => {
  switch (unit.trim().toLowerCase()) {
    case 'mm':
      return value
    case 'cm':
      return value / 10
    case 'm':
      return value / 1000
    case 'in':
      return value / 25.4
    default:
      return value / 10
  }
}

export const derivePlacementBounds = (
  placements: PlacedPiece[]
): CortePliegoOccupiedBounds => {
  if (placements.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = 0
  let maxY = 0

  for (const piece of placements) {
    minX = Math.min(minX, piece.x)
    minY = Math.min(minY, piece.y)
    maxX = Math.max(maxX, piece.x + piece.width)
    maxY = Math.max(maxY, piece.y + piece.height)
  }

  return { minX, minY, maxX, maxY }
}

export const computeCortePliegoLayout = (
  tipoPapel: Pick<TipoPapel, 'ancho' | 'alto' | 'unidadMedida'>,
  despiece: Pick<
    DespieceAsociado,
    'ancho' | 'alto' | 'unidadMedida' | 'piezasPorPliego'
  >
): CortePliegoLayout | null => {
  const catalogPaperWidth = parsePositive(tipoPapel.ancho)
  const catalogPaperHeight = parsePositive(tipoPapel.alto)
  const pieceWidth = parsePositive(despiece.ancho)
  const pieceHeight = parsePositive(despiece.alto)
  const totalPieces = Math.max(0, Math.round(despiece.piezasPorPliego))

  if (
    catalogPaperWidth <= 0 ||
    catalogPaperHeight <= 0 ||
    pieceWidth <= 0 ||
    pieceHeight <= 0 ||
    totalPieces <= 0
  ) {
    return null
  }

  const paperUnit = tipoPapel.unidadMedida || 'cm'
  const pieceUnit = despiece.unidadMedida || paperUnit

  const best = solveAllCortePliegoOrientationsMm({
    catalogPaperWidthMm: toMillimeters(catalogPaperWidth, paperUnit),
    catalogPaperHeightMm: toMillimeters(catalogPaperHeight, paperUnit),
    pieceWidthMm: toMillimeters(pieceWidth, pieceUnit),
    pieceHeightMm: toMillimeters(pieceHeight, pieceUnit),
    totalPieces,
  })

  if (!best) return null

  const packPaperWidth = fromMillimeters(best.paperWidthMm, paperUnit)
  const packPaperHeight = fromMillimeters(best.paperHeightMm, paperUnit)
  const scaleX = packPaperWidth / best.paperWidthMm
  const scaleY = packPaperHeight / best.paperHeightMm

  let placements: PlacedPiece[] = best.placements.map(piece => ({
    index: piece.index,
    x: piece.x * scaleX,
    y: piece.y * scaleY,
    width: piece.width * scaleX,
    height: piece.height * scaleY,
  }))

  if (best.paperSwapped) {
    placements = placements.map(piece => ({
      index: piece.index,
      x: packPaperHeight - piece.y - piece.height,
      y: piece.x,
      width: piece.height,
      height: piece.width,
    }))
  }

  const occupiedBounds = derivePlacementBounds(placements)
  const usedWidth = occupiedBounds.maxX - occupiedBounds.minX
  const usedHeight = occupiedBounds.maxY - occupiedBounds.minY
  const paperArea = catalogPaperWidth * catalogPaperHeight
  const pieceArea = pieceWidth * pieceHeight
  const wasteArea = Math.max(0, paperArea - totalPieces * pieceArea)

  return {
    paperWidth: catalogPaperWidth,
    paperHeight: catalogPaperHeight,
    pieceWidth,
    pieceHeight,
    unidadMedida: paperUnit,
    cols: best.cols,
    rows: best.rows,
    totalPieces,
    pieceRotated: best.pieceRotated,
    paperSwapped: best.paperSwapped,
    occupiedBounds,
    usedWidth,
    usedHeight,
    wasteArea,
    wastePercent: paperArea > 0 ? (wasteArea / paperArea) * 100 : 0,
    paperArea,
    algorithm: best.algorithm,
    shelfCounts: best.shelfCounts,
    placements,
  }
}

export interface CortePliegoPlacementRow {
  y: number
  height: number
  usedWidth: number
  count: number
}

export const derivePlacementRows = (
  placements: PlacedPiece[]
): CortePliegoPlacementRow[] => {
  if (placements.length === 0) return []

  const rowMap = new Map<string, CortePliegoPlacementRow>()

  for (const piece of placements) {
    const key = `${Math.round(piece.y * 1000)}:${Math.round(piece.height * 1000)}`
    const existing = rowMap.get(key)
    if (existing) {
      existing.count += 1
      existing.usedWidth = Math.max(existing.usedWidth, piece.x + piece.width)
    } else {
      rowMap.set(key, {
        y: piece.y,
        height: piece.height,
        usedWidth: piece.x + piece.width,
        count: 1,
      })
    }
  }

  return [...rowMap.values()].sort((a, b) => a.y - b.y)
}

export const formatCortePliegoVisualLayoutLabel = (
  placements: PlacedPiece[],
  totalPieces: number
): string => {
  const rows = derivePlacementRows(placements)
  if (rows.length === 0) {
    return `${totalPieces.toLocaleString('es-CO')} pzas`
  }

  const cols = Math.max(...rows.map(row => row.count))
  const counts = rows.map(row => row.count)
  const uniform = counts.every(count => count === cols)

  if (rows.length === 1) {
    return `${totalPieces.toLocaleString('es-CO')} pza${totalPieces === 1 ? '' : 's'} en 1 fila`
  }

  if (uniform) {
    return `${rows.length} filas × ${cols} columnas · ${totalPieces.toLocaleString('es-CO')} pzas`
  }

  return `${rows.length} filas (${counts.join(' + ')}) · ${totalPieces.toLocaleString('es-CO')} pzas`
}

export const formatCortePliegoDimension = (value: number): string => {
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) return String(rounded)
  return rounded.toFixed(1).replace('.', ',')
}

export const formatCortePliegoLayoutCaption = (
  layout: CortePliegoLayout,
  despieceName: string
): string => {
  const unit = layout.unidadMedida.toLowerCase()
  const paper = `${formatCortePliegoDimension(layout.paperWidth)}×${formatCortePliegoDimension(layout.paperHeight)} ${unit}`
  const piece = `${formatCortePliegoDimension(layout.pieceWidth)}×${formatCortePliegoDimension(layout.pieceHeight)} ${unit}`
  const name = despieceName.trim() || 'Pieza'
  return `Pliego ${paper} · ${name} ${piece} · ${layout.totalPieces} pzas`
}
