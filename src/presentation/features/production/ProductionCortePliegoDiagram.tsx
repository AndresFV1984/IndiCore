import React, { useId, useMemo } from 'react'
import type { DespieceAsociado } from '../../../core/domain/entities/CortePapel'
import type { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import { CORTE_PAPEL_COPY } from './constants/cortePapelCopy'
import { deriveCutLinesFromPlacements } from './utils/cortePliegoBinPacking'
import {
  computeCortePliegoLayout,
  formatCortePliegoDimension,
  formatCortePliegoLayoutCaption,
} from './utils/cortePliegoLayoutUtils'

const copy = CORTE_PAPEL_COPY.sections.papel.pliegoDiagram

const MAX_DIAGRAM_WIDTH = 390
const MAX_DIAGRAM_HEIGHT = 244
const LABEL_PADDING = 14

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
    const ratio = layout.paperWidth / layout.paperHeight
    let width = MAX_DIAGRAM_WIDTH
    let height = width / ratio
    if (height > MAX_DIAGRAM_HEIGHT) {
      height = MAX_DIAGRAM_HEIGHT
      width = height * ratio
    }
    return { width: Math.round(width), height: Math.round(height) }
  }, [layout])

  const cutLines = useMemo(
    () =>
      layout
        ? deriveCutLinesFromPlacements(layout.placements, {
            usedWidth: layout.usedWidth,
            usedHeight: layout.usedHeight,
          })
        : { vertical: [], horizontal: [], verticalSegments: [] },
    [layout]
  )

  const wastePatternId = `${titleId}-waste-pattern`

  if (!layout) {
    return (
      <p className="production-corte-pliego-diagram__unavailable">{copy.unavailable}</p>
    )
  }

  const caption = formatCortePliegoLayoutCaption(layout, despiece.name)
  const unit = layout.unidadMedida.toLowerCase()
  const pieceAncho = formatCortePliegoDimension(layout.pieceWidth)
  const pieceLargo = formatCortePliegoDimension(layout.pieceHeight)
  const labelSize = Math.max(layout.paperWidth, layout.paperHeight) * 0.045
  const pieceLabelSize = Math.min(layout.pieceWidth, layout.pieceHeight) * 0.2
  const viewMinX = -LABEL_PADDING
  const viewMinY = -LABEL_PADDING
  const viewWidth = layout.paperWidth + LABEL_PADDING * 2
  const viewHeight = layout.paperHeight + LABEL_PADDING * 2

  const hasRightWaste = layout.usedWidth < layout.paperWidth - 1e-6
  const hasBottomWaste = layout.usedHeight < layout.paperHeight - 1e-6

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
          {copy.algorithmLabel(layout.algorithm)}
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

      <div
        className="production-corte-pliego-diagram__canvas-wrap"
        style={{ width: displaySize.width, height: displaySize.height }}
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

          {hasRightWaste ? (
            <rect
              className="production-corte-pliego-diagram__waste"
              fill={`url(#${wastePatternId})`}
              x={layout.usedWidth}
              y={0}
              width={layout.paperWidth - layout.usedWidth}
              height={layout.paperHeight}
            />
          ) : null}

          {hasBottomWaste ? (
            <rect
              className="production-corte-pliego-diagram__waste"
              fill={`url(#${wastePatternId})`}
              x={0}
              y={layout.usedHeight}
              width={layout.usedWidth}
              height={layout.paperHeight - layout.usedHeight}
            />
          ) : null}

          {layout.placements.map(piece => (
            <g key={piece.index}>
              <rect
                className="production-corte-pliego-diagram__piece"
                x={piece.x}
                y={piece.y}
                width={piece.width}
                height={piece.height}
              />
              {piece.width >= 8 && piece.height >= 5 ? (
                <text
                  className="production-corte-pliego-diagram__piece-label"
                  x={piece.x + piece.width / 2}
                  y={piece.y + piece.height / 2}
                  fontSize={pieceLabelSize}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {copy.pieceDimLabel(pieceAncho, pieceLargo)}
                </text>
              ) : null}
            </g>
          ))}

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
              x1={0}
              y1={y}
              x2={layout.usedWidth}
              y2={y}
            />
          ))}

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

      <figcaption className="production-corte-pliego-diagram__caption">{caption}</figcaption>
      <p className="production-corte-pliego-diagram__grid">
        {copy.gridLabel(layout.cols, layout.rows, layout.totalPieces, layout.shelfCounts)}
      </p>
      <p className="production-corte-pliego-diagram__waste-label">
        {copy.wasteLabel(
          layout.wasteArea,
          layout.wastePercent,
          layout.unidadMedida
        )}
      </p>
    </figure>
  )
}

export default ProductionCortePliegoDiagram
