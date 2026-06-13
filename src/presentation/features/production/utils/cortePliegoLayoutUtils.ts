import type { DespieceAsociado } from '../../../../core/domain/entities/CortePapel'
import type { TipoPapel } from '../../../../core/domain/entities/TipoPapel'
import {
  solveAllCortePliegoOrientationsMm,
  type CortePliegoPackingAlgorithm,
  type PlacedPiece,
} from './cortePliegoBinPacking'

export type { PlacedPiece, CortePliegoPackingAlgorithm }

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

  const usedWidth = best.paperSwapped
    ? fromMillimeters(best.usedHeightMm, paperUnit)
    : fromMillimeters(best.usedWidthMm, paperUnit)
  const usedHeight = best.paperSwapped
    ? fromMillimeters(best.usedWidthMm, paperUnit)
    : fromMillimeters(best.usedHeightMm, paperUnit)
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
  const paper = `${formatCortePliegoDimension(layout.paperWidth)}×${formatCortePliegoDimension(layout.paperHeight)} ${unit} (ancho×largo)`
  const piece = `${formatCortePliegoDimension(layout.pieceWidth)}×${formatCortePliegoDimension(layout.pieceHeight)} ${unit}`
  const name = despieceName.trim() || 'Pieza'
  return `Pliego ${paper} · ${name} ${piece} · ${layout.totalPieces} piezas`
}
