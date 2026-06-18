import React, { useId, useMemo } from 'react'
import type { DespieceAsociado } from '../../../core/domain/entities/CortePapel'
import type { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import { CORTE_PAPEL_COPY } from './constants/cortePapelCopy'
import { deriveCutLinesFromPlacements } from './utils/cortePliegoBinPacking'
import {
  computeCortePliegoLayout,
  derivePlacementRows,
  formatCortePliegoDimension,
  formatCortePliegoLayoutCaption,
  formatCortePliegoVisualLayoutLabel,
} from './utils/cortePliegoLayoutUtils'

const copy = CORTE_PAPEL_COPY.sections.papel.pliegoDiagram

const MAX_DIAGRAM_WIDTH = 640
const MAX_DIAGRAM_HEIGHT = 440
const LABEL_PADDING = 22
const RIGHT_LABEL_PADDING = 40
const EPS = 1e-6

interface ProductionCortePliegoDiagramProps {
  tipoPapel: TipoPapel
  despiece: DespieceAsociado
}

const ProductionCortePliegoDiagram: React.FC<ProductionCortePliegoDiagramProps> = ({
  tipoPapel,
  despiece,
}) => {
  const titleId = useId()
  const layout = useMemo(
    () => computeCortePliegoLayout(tipoPapel, despiece),
    [tipoPapel, despiece]
  )

  const displaySize = useMemo(() => {
    if (!layout) return { width: MAX_DIAGRAM_WIDTH, height: MAX_DIAGRAM_HEIGHT }
    const horizontalPad = Math.max(LABEL_PADDING, RIGHT_LABEL_PADDING)
    const viewWidth = layout.paperWidth + horizontalPad * 2
    const viewHeight = layout.paperHeight + LABEL_PADDING * 2
    const ratio = viewWidth / viewHeight
    let width = MAX_DIAGRAM_WIDTH
    let height = width / ratio
    if (height > MAX_DIAGRAM_HEIGHT) {
      height = MAX_DIAGRAM_HEIGHT
      width = height * ratio
    }
    return { width: Math.round(width), height: Math.round(height) }
  }, [layout])

  const occupied = layout?.occupiedBounds

  const cutLines = useMemo(
    () =>
      layout && occupied
        ? deriveCutLinesFromPlacements(layout.placements, occupied)
        : { vertical: [], horizontal: [], verticalSegments: [] },
    [layout, occupied]
  )

  const placementRows = useMemo(
    () => (layout ? derivePlacementRows(layout.placements) : []),
    [layout]
  )

  const sortedPlacements = useMemo(
    () =>
      layout
        ? [...layout.placements].sort((a, b) => a.y - b.y || a.x - b.x)
        : [],
    [layout]
  )

  const displayNumberByIndex = useMemo(() => {
    const map = new Map<number, number>()
    sortedPlacements.forEach((piece, index) => {
      map.set(piece.index, index + 1)
    })
    return map
  }, [sortedPlacements])

  const wastePatternId = `${titleId}-waste-pattern`

  if (!layout || !occupied) {
    return (
      <p className="production-corte-pliego-diagram__unavailable">{copy.unavailable}</p>
    )
  }

  const caption = formatCortePliegoLayoutCaption(layout, despiece.name)
  const visualLayoutLabel = formatCortePliegoVisualLayoutLabel(
    layout.placements,
    layout.totalPieces
  )
  const unit = layout.unidadMedida.toLowerCase()
  const pieceAncho = formatCortePliegoDimension(layout.pieceWidth)
  const pieceLargo = formatCortePliegoDimension(layout.pieceHeight)
  const labelSize = Math.max(layout.paperWidth, layout.paperHeight) * 0.058
  const pieceLabelSize = Math.min(layout.pieceWidth, layout.pieceHeight) * 0.28
  const rowLabelSize = Math.max(layout.paperWidth, layout.paperHeight) * 0.045
  const showRowCounts = placementRows.length > 1
  const horizontalPad = showRowCounts
    ? Math.max(LABEL_PADDING, RIGHT_LABEL_PADDING)
    : LABEL_PADDING
  const viewMinX = -horizontalPad
  const viewMinY = -LABEL_PADDING
  const viewWidth = layout.paperWidth + horizontalPad * 2
  const viewHeight = layout.paperHeight + LABEL_PADDING * 2

  const hasLeftWaste = occupied.minX > EPS
  const hasRightWaste = occupied.maxX < layout.paperWidth - EPS
  const hasBottomWaste = occupied.maxY < layout.paperHeight - EPS

  return (
    <figure
      className="production-corte-pliego-diagram"
      aria-labelledby={titleId}
      role="img"
      aria-label={caption}
    >
      <div className="production-corte-pliego-diagram__head">
        <span id={titleId} className="production-corte-pliego-diagram__title">
          {copy.title}
        </span>
        <span className="production-corte-pliego-diagram__badge">
          {copy.pieceSizeLabel(pieceAncho, pieceLargo, unit)}
        </span>
        {layout.pieceRotated ? (
          <span className="production-corte-pliego-diagram__badge">{copy.rotatedHint}</span>
        ) : null}
        {layout.paperSwapped ? (
          <span className="production-corte-pliego-diagram__badge">
            {copy.paperSwappedHint}
          </span>
        ) : null}
      </div>

      <p className="production-corte-pliego-diagram__hint">{copy.readHint}</p>

      <div className="production-corte-pliego-diagram__visual">
        <div
          className="production-corte-pliego-diagram__canvas-wrap"
          style={{
            width: displaySize.width,
            height: displaySize.height,
            maxWidth: 'min(100%, 640px)',
          }}
        >
        <svg
          className="production-corte-pliego-diagram__svg"
          viewBox={`${viewMinX} ${viewMinY} ${viewWidth} ${viewHeight}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <pattern
              id={wastePatternId}
              patternUnits="userSpaceOnUse"
              width="5"
              height="5"
              patternTransform="rotate(45)"
            >
              <rect width="5" height="5" className="production-corte-pliego-diagram__waste-pattern-base" />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="5"
                className="production-corte-pliego-diagram__waste-pattern-line"
              />
            </pattern>
          </defs>

          <rect
            className="production-corte-pliego-diagram__sheet"
            x={0}
            y={0}
            width={layout.paperWidth}
            height={layout.paperHeight}
            rx={Math.min(layout.paperWidth, layout.paperHeight) * 0.012}
          />

          {hasLeftWaste ? (
            <rect
              className="production-corte-pliego-diagram__waste"
              fill={`url(#${wastePatternId})`}
              x={0}
              y={0}
              width={occupied.minX}
              height={layout.paperHeight}
            />
          ) : null}

          {hasRightWaste ? (
            <rect
              className="production-corte-pliego-diagram__waste"
              fill={`url(#${wastePatternId})`}
              x={occupied.maxX}
              y={0}
              width={layout.paperWidth - occupied.maxX}
              height={layout.paperHeight}
            />
          ) : null}

          {hasBottomWaste ? (
            <rect
              className="production-corte-pliego-diagram__waste"
              fill={`url(#${wastePatternId})`}
              x={occupied.minX}
              y={occupied.maxY}
              width={occupied.maxX - occupied.minX}
              height={layout.paperHeight - occupied.maxY}
            />
          ) : null}

          {layout.placements.map(piece => {
            const displayNumber = displayNumberByIndex.get(piece.index) ?? piece.index + 1
            return (
              <g key={piece.index}>
                <rect
                  className="production-corte-pliego-diagram__piece"
                  x={piece.x}
                  y={piece.y}
                  width={piece.width}
                  height={piece.height}
                />
                {piece.width >= 6 && piece.height >= 4 ? (
                  <text
                    className="production-corte-pliego-diagram__piece-label"
                    x={piece.x + piece.width / 2}
                    y={piece.y + piece.height / 2}
                    fontSize={pieceLabelSize}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {displayNumber}
                  </text>
                ) : null}
              </g>
            )
          })}

          <rect
            className="production-corte-pliego-diagram__occupied-outline"
            x={occupied.minX}
            y={occupied.minY}
            width={occupied.maxX - occupied.minX}
            height={occupied.maxY - occupied.minY}
          />

          {cutLines.verticalSegments.map(segment => (
            <line
              key={`cut-v-${segment.x}-${segment.y1}-${segment.y2}`}
              className="production-corte-pliego-diagram__cut-line"
              x1={segment.x}
              y1={segment.y1}
              x2={segment.x}
              y2={segment.y2}
            />
          ))}

          {cutLines.horizontal.map(y => (
            <line
              key={`cut-h-${y}`}
              className="production-corte-pliego-diagram__cut-line"
              x1={occupied.minX}
              y1={y}
              x2={occupied.maxX}
              y2={y}
            />
          ))}

          {showRowCounts
            ? placementRows.map(row => (
                <text
                  key={`row-count-${row.y}`}
                  className="production-corte-pliego-diagram__row-count"
                  x={occupied.maxX + 5}
                  y={row.y + row.height / 2}
                  fontSize={rowLabelSize}
                  textAnchor="start"
                  dominantBaseline="middle"
                >
                  {copy.rowCountLabel(row.count)}
                </text>
              ))
            : null}

          <text
            className="production-corte-pliego-diagram__dim-label"
            x={layout.paperWidth / 2}
            y={-3}
            fontSize={labelSize}
            textAnchor="middle"
          >
            {copy.dimAnchoLabel(
              formatCortePliegoDimension(layout.paperWidth),
              unit
            )}
          </text>

          <text
            className="production-corte-pliego-diagram__dim-label production-corte-pliego-diagram__dim-label--vertical"
            x={-3}
            y={layout.paperHeight / 2}
            fontSize={labelSize}
            textAnchor="middle"
            transform={`rotate(-90 ${-3} ${layout.paperHeight / 2})`}
          >
            {copy.dimLargoLabel(
              formatCortePliegoDimension(layout.paperHeight),
              unit
            )}
          </text>
        </svg>
        </div>

        <div className="production-corte-pliego-diagram__summary">
        <ul className="production-corte-pliego-diagram__legend" aria-label="Leyenda del diagrama">
          <li className="production-corte-pliego-diagram__legend-item">
            <span
              className="production-corte-pliego-diagram__legend-swatch production-corte-pliego-diagram__legend-swatch--piece"
              aria-hidden
            />
            {copy.legendPiece}
          </li>
          <li className="production-corte-pliego-diagram__legend-item">
            <span
              className="production-corte-pliego-diagram__legend-swatch production-corte-pliego-diagram__legend-swatch--cut"
              aria-hidden
            />
            {copy.legendCut}
          </li>
          <li className="production-corte-pliego-diagram__legend-item">
            <span
              className="production-corte-pliego-diagram__legend-swatch production-corte-pliego-diagram__legend-swatch--waste"
              aria-hidden
            />
            {copy.legendWaste}
          </li>
        </ul>

        <figcaption className="production-corte-pliego-diagram__caption">{caption}</figcaption>
        <p className="production-corte-pliego-diagram__grid">{visualLayoutLabel}</p>
        <p className="production-corte-pliego-diagram__waste-label">
          {copy.wasteLabel(
            layout.wasteArea,
            layout.wastePercent,
            layout.unidadMedida
          )}
        </p>
      </div>
      </div>
    </figure>
  )
}

export default ProductionCortePliegoDiagram
