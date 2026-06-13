export interface PlacedPiece {
  x: number
  y: number
  width: number
  height: number
  index: number
}

export type CortePliegoPackingAlgorithm = 'grid' | 'strip' | 'skyline'

export interface BinPackingCandidateMm {
  placements: PlacedPiece[]
  paperWidthMm: number
  paperHeightMm: number
  pieceWidthMm: number
  pieceHeightMm: number
  pieceRotated: boolean
  paperSwapped: boolean
  algorithm: CortePliegoPackingAlgorithm
  usedWidthMm: number
  usedHeightMm: number
  boundingAreaMm: number
  wasteAreaMm: number
  cols: number
  rows: number
  shelfCounts: number[]
}

interface PackSetupMm {
  paperWidthMm: number
  paperHeightMm: number
  pieceWidthMm: number
  pieceHeightMm: number
  pieceRotated: boolean
  paperSwapped: boolean
  totalPieces: number
}

const EPS = 1e-6

const factorPairs = (total: number): Array<[number, number]> => {
  const pairs: Array<[number, number]> = []
  for (let cols = 1; cols <= total; cols += 1) {
    if (total % cols !== 0) continue
    pairs.push([cols, total / cols])
  }
  return pairs
}

const buildMetrics = (
  setup: PackSetupMm,
  placements: PlacedPiece[],
  algorithm: CortePliegoPackingAlgorithm,
  cols: number,
  rows: number,
  shelfCounts: number[]
): BinPackingCandidateMm | null => {
  if (placements.length !== setup.totalPieces) return null

  const usedWidthMm = placements.reduce(
    (max, piece) => Math.max(max, piece.x + piece.width),
    0
  )
  const usedHeightMm = placements.reduce(
    (max, piece) => Math.max(max, piece.y + piece.height),
    0
  )

  if (
    usedWidthMm > setup.paperWidthMm + EPS ||
    usedHeightMm > setup.paperHeightMm + EPS
  ) {
    return null
  }

  const paperAreaMm = setup.paperWidthMm * setup.paperHeightMm
  const pieceAreaMm = setup.pieceWidthMm * setup.pieceHeightMm
  const wasteAreaMm = paperAreaMm - setup.totalPieces * pieceAreaMm

  return {
    placements,
    paperWidthMm: setup.paperWidthMm,
    paperHeightMm: setup.paperHeightMm,
    pieceWidthMm: setup.pieceWidthMm,
    pieceHeightMm: setup.pieceHeightMm,
    pieceRotated: setup.pieceRotated,
    paperSwapped: setup.paperSwapped,
    algorithm,
    usedWidthMm,
    usedHeightMm,
    boundingAreaMm: usedWidthMm * usedHeightMm,
    wasteAreaMm,
    cols,
    rows,
    shelfCounts,
  }
}

/** Guillotine grid: empaquetado en cuadrícula regular. */
const packGridGuillotine = (setup: PackSetupMm): BinPackingCandidateMm | null => {
  const maxCols = Math.floor(setup.paperWidthMm / setup.pieceWidthMm)
  const maxRows = Math.floor(setup.paperHeightMm / setup.pieceHeightMm)
  if (maxCols < 1 || maxRows < 1) return null

  let best: BinPackingCandidateMm | null = null

  for (const [cols, rows] of factorPairs(setup.totalPieces)) {
    if (cols > maxCols || rows > maxRows) continue

    const placements: PlacedPiece[] = Array.from({ length: setup.totalPieces }, (_, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      return {
        x: col * setup.pieceWidthMm,
        y: row * setup.pieceHeightMm,
        width: setup.pieceWidthMm,
        height: setup.pieceHeightMm,
        index,
      }
    })

    const candidate = buildMetrics(setup, placements, 'grid', cols, rows, [])
    if (!candidate) continue
    if (!best || compareCandidates(candidate, best) < 0) best = candidate
  }

  return best
}

const buildEvenShelfDistribution = (
  totalPieces: number,
  shelfCount: number,
  maxPerShelf: number
): number[] | null => {
  if (shelfCount <= 0 || totalPieces < shelfCount) return null
  const base = Math.floor(totalPieces / shelfCount)
  const remainder = totalPieces % shelfCount
  if (base < 1 || base > maxPerShelf) return null

  const counts = Array.from({ length: shelfCount }, () => base)
  for (let index = 0; index < remainder; index += 1) {
    if (counts[index] + 1 > maxPerShelf) return null
    counts[index] += 1
  }
  return counts
}

const buildFullShelfDistribution = (
  totalPieces: number,
  maxPerShelf: number
): number[] | null => {
  if (maxPerShelf < 1 || totalPieces < 1) return null
  const fullShelves = Math.floor(totalPieces / maxPerShelf)
  const remainder = totalPieces % maxPerShelf
  const counts = Array.from({ length: fullShelves }, () => maxPerShelf)
  if (remainder > 0) counts.push(remainder)
  return counts.length > 0 ? counts : null
}

const collectShelfCountCandidates = (
  totalPieces: number,
  maxShelves: number,
  maxPerShelf: number
): number[] => {
  const counts = new Set<number>()
  const limit = Math.min(totalPieces, maxShelves)

  for (let shelfCount = 1; shelfCount <= limit; shelfCount += 1) {
    if (totalPieces % shelfCount === 0) counts.add(shelfCount)
  }

  const fullLayout = buildFullShelfDistribution(totalPieces, maxPerShelf)
  if (fullLayout && fullLayout.length <= maxShelves) {
    counts.add(fullLayout.length)
  }

  return [...counts].sort((a, b) => a - b)
}

const buildPlacementsFromShelfCounts = (
  setup: PackSetupMm,
  shelfCounts: number[]
): PlacedPiece[] => {
  const placements: PlacedPiece[] = []
  let index = 0

  shelfCounts.forEach((count, shelfIndex) => {
    const y = shelfIndex * setup.pieceHeightMm
    for (let col = 0; col < count; col += 1) {
      placements.push({
        x: col * setup.pieceWidthMm,
        y,
        width: setup.pieceWidthMm,
        height: setup.pieceHeightMm,
        index,
      })
      index += 1
    }
  })

  return placements
}

/** Strip packing: bandas horizontales con heurísticas (sin enumeración exponencial). */
const packHorizontalStrip = (setup: PackSetupMm): BinPackingCandidateMm | null => {
  const maxPerShelf = Math.floor(setup.paperWidthMm / setup.pieceWidthMm)
  const maxShelves = Math.floor(setup.paperHeightMm / setup.pieceHeightMm)
  if (maxPerShelf < 1 || maxShelves < 1) return null

  let best: BinPackingCandidateMm | null = null
  const shelfCountsToTry = collectShelfCountCandidates(
    setup.totalPieces,
    maxShelves,
    maxPerShelf
  )

  for (const shelfCount of shelfCountsToTry) {
    const distributions: number[][] = []
    const even = buildEvenShelfDistribution(setup.totalPieces, shelfCount, maxPerShelf)
    if (even) distributions.push(even)

    const full = buildFullShelfDistribution(setup.totalPieces, maxPerShelf)
    if (full && full.length === shelfCount) {
      const alreadyAdded = distributions.some(
        current => current.length === full.length && current.every((n, i) => n === full[i])
      )
      if (!alreadyAdded) distributions.push(full)
    }

    for (const shelfCounts of distributions) {
      const placements = buildPlacementsFromShelfCounts(setup, shelfCounts)
      const cols = Math.max(...shelfCounts)
      const candidate = buildMetrics(
        setup,
        placements,
        'strip',
        cols,
        shelfCount,
        shelfCounts
      )
      if (!candidate) continue
      if (!best || compareCandidates(candidate, best) < 0) best = candidate
    }
  }

  return best
}

interface SkylineSegment {
  x: number
  y: number
  width: number
}

const getSkylineHeight = (segments: SkylineSegment[], xStart: number, xEnd: number): number => {
  let height = 0
  for (const segment of segments) {
    const segmentEnd = segment.x + segment.width
    if (segmentEnd <= xStart + EPS || segment.x >= xEnd - EPS) continue
    height = Math.max(height, segment.y)
  }
  return height
}

const mergeSkyline = (segments: SkylineSegment[]): SkylineSegment[] => {
  const sorted = [...segments].sort((a, b) => a.x - b.x)
  const merged: SkylineSegment[] = []

  for (const segment of sorted) {
    const last = merged[merged.length - 1]
    if (last && Math.abs(last.y - segment.y) < EPS && Math.abs(last.x + last.width - segment.x) < EPS) {
      last.width += segment.width
      continue
    }
    merged.push({ ...segment })
  }

  return merged
}

const updateSkyline = (
  segments: SkylineSegment[],
  x: number,
  y: number,
  width: number,
  height: number
): SkylineSegment[] => {
  const pieceTop = y + height
  const next: SkylineSegment[] = []

  for (const segment of segments) {
    const segmentEnd = segment.x + segment.width
    if (segmentEnd <= x + EPS || segment.x >= x + width - EPS) {
      next.push({ ...segment })
      continue
    }

    if (segment.x < x - EPS) {
      next.push({ x: segment.x, y: segment.y, width: x - segment.x })
    }

    next.push({
      x: Math.max(segment.x, x),
      y: pieceTop,
      width: Math.min(segmentEnd, x + width) - Math.max(segment.x, x),
    })

    if (segmentEnd > x + width + EPS) {
      next.push({ x: x + width, y: segment.y, width: segmentEnd - (x + width) })
    }
  }

  return mergeSkyline(next)
}

/** 2D bin packing: Skyline + Bottom-Left Fill para piezas idénticas. */
const packSkylineBottomLeft = (setup: PackSetupMm): BinPackingCandidateMm | null => {
  const { paperWidthMm, paperHeightMm, pieceWidthMm, pieceHeightMm, totalPieces } = setup
  if (pieceWidthMm > paperWidthMm + EPS || pieceHeightMm > paperHeightMm + EPS) return null

  let segments: SkylineSegment[] = [{ x: 0, y: 0, width: paperWidthMm }]
  const placements: PlacedPiece[] = []

  for (let index = 0; index < totalPieces; index += 1) {
    let bestX = Number.POSITIVE_INFINITY
    let bestY = Number.POSITIVE_INFINITY

    const candidateXs = new Set<number>([0])
    for (const segment of segments) {
      candidateXs.add(segment.x)
      if (segment.x + pieceWidthMm <= paperWidthMm + EPS) {
        candidateXs.add(segment.x)
      }
      if (segment.x + segment.width - pieceWidthMm >= -EPS) {
        candidateXs.add(Math.max(0, segment.x + segment.width - pieceWidthMm))
      }
    }

    for (const x of [...candidateXs].sort((a, b) => a - b)) {
      if (x + pieceWidthMm > paperWidthMm + EPS) continue
      const y = getSkylineHeight(segments, x, x + pieceWidthMm)
      if (y + pieceHeightMm > paperHeightMm + EPS) continue
      if (y < bestY - EPS || (Math.abs(y - bestY) <= EPS && x < bestX - EPS)) {
        bestX = x
        bestY = y
      }
    }

    if (!Number.isFinite(bestX) || !Number.isFinite(bestY)) return null

    placements.push({
      x: bestX,
      y: bestY,
      width: pieceWidthMm,
      height: pieceHeightMm,
      index,
    })
    segments = updateSkyline(segments, bestX, bestY, pieceWidthMm, pieceHeightMm)
  }

  const shelfMap = new Map<number, number>()
  for (const piece of placements) {
    shelfMap.set(piece.y, (shelfMap.get(piece.y) ?? 0) + 1)
  }
  const rows = shelfMap.size || 1
  const cols = Math.max(1, ...shelfMap.values())

  return buildMetrics(setup, placements, 'skyline', cols, rows, [])
}

const compareCandidates = (
  left: BinPackingCandidateMm,
  right: BinPackingCandidateMm
): number => {
  if (Math.abs(left.wasteAreaMm - right.wasteAreaMm) > EPS) {
    return left.wasteAreaMm - right.wasteAreaMm
  }
  if (Math.abs(left.boundingAreaMm - right.boundingAreaMm) > EPS) {
    return left.boundingAreaMm - right.boundingAreaMm
  }
  if (left.pieceRotated !== right.pieceRotated) {
    return left.pieceRotated ? 1 : -1
  }
  const leftBalance = Math.abs(left.cols - left.rows)
  const rightBalance = Math.abs(right.cols - right.rows)
  if (leftBalance !== rightBalance) {
    return leftBalance - rightBalance
  }
  const algorithmRank: Record<CortePliegoPackingAlgorithm, number> = {
    strip: 0,
    grid: 1,
    skyline: 2,
  }
  if (algorithmRank[left.algorithm] !== algorithmRank[right.algorithm]) {
    return algorithmRank[left.algorithm] - algorithmRank[right.algorithm]
  }
  return right.cols - left.cols
}

export const solveCortePliegoBinPackingMm = (
  setup: PackSetupMm
): BinPackingCandidateMm | null => {
  const candidates = [
    packHorizontalStrip(setup),
    packGridGuillotine(setup),
    packSkylineBottomLeft(setup),
  ].filter((candidate): candidate is BinPackingCandidateMm => Boolean(candidate))

  if (candidates.length === 0) return null

  return candidates.reduce((best, current) =>
    compareCandidates(current, best) < 0 ? current : best
  )
}

export const solveAllCortePliegoOrientationsMm = (input: {
  catalogPaperWidthMm: number
  catalogPaperHeightMm: number
  pieceWidthMm: number
  pieceHeightMm: number
  totalPieces: number
}): BinPackingCandidateMm | null => {
  const paperSetups = [
    {
      widthMm: input.catalogPaperWidthMm,
      heightMm: input.catalogPaperHeightMm,
      swapped: false,
    },
    {
      widthMm: input.catalogPaperHeightMm,
      heightMm: input.catalogPaperWidthMm,
      swapped: true,
    },
  ]

  const pieceSetups = [
    { widthMm: input.pieceWidthMm, heightMm: input.pieceHeightMm, rotated: false },
    { widthMm: input.pieceHeightMm, heightMm: input.pieceWidthMm, rotated: true },
  ]

  let best: BinPackingCandidateMm | null = null

  for (const paper of paperSetups) {
    for (const piece of pieceSetups) {
      const setup: PackSetupMm = {
        paperWidthMm: paper.widthMm,
        paperHeightMm: paper.heightMm,
        pieceWidthMm: piece.widthMm,
        pieceHeightMm: piece.heightMm,
        pieceRotated: piece.rotated,
        paperSwapped: paper.swapped,
        totalPieces: input.totalPieces,
      }
      const candidate = solveCortePliegoBinPackingMm(setup)
      if (candidate && (!best || compareCandidates(candidate, best) < 0)) {
        best = candidate
      }
    }
  }

  return best
}

export const deriveCutLinesFromPlacements = (
  placements: PlacedPiece[],
  bounds?: { usedWidth: number; usedHeight: number }
): { vertical: number[]; horizontal: number[]; verticalSegments: Array<{ x: number; y1: number; y2: number }> } => {
  const horizontal = new Set<number>()
  const vertical = new Set<number>()
  const verticalSegments: Array<{ x: number; y1: number; y2: number }> = []

  for (const piece of placements) {
    const right = piece.x + piece.width
    const bottom = piece.y + piece.height

    if (piece.y > EPS) horizontal.add(piece.y)
    if (bounds && bottom < bounds.usedHeight - EPS) horizontal.add(bottom)
    if (!bounds && bottom > EPS) horizontal.add(bottom)

    if (piece.x > EPS) {
      vertical.add(piece.x)
      verticalSegments.push({ x: piece.x, y1: piece.y, y2: bottom })
    }
    if (right > EPS && (!bounds || right < bounds.usedWidth - EPS)) {
      vertical.add(right)
      verticalSegments.push({ x: right, y1: piece.y, y2: bottom })
    }
  }

  const dedupedSegments = verticalSegments.filter(
    (segment, index, list) =>
      list.findIndex(
        item =>
          Math.abs(item.x - segment.x) < EPS &&
          Math.abs(item.y1 - segment.y1) < EPS &&
          Math.abs(item.y2 - segment.y2) < EPS
      ) === index
  )

  return {
    vertical: [...vertical].sort((a, b) => a - b),
    horizontal: [...horizontal].sort((a, b) => a - b),
    verticalSegments: dedupedSegments,
  }
}
