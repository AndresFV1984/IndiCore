import React, { useId, useMemo } from 'react'
import clsx from 'clsx'
import type { ImpresionLadoTintas, ImpresionTipoBifronte } from '../../../core/domain/entities/Order'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { isImpresionConVolteo } from './constants/impresionTipoBifronte'
import {
  DISENO_INK_PALETTE,
  DISENO_INK_PANTONE_MIX_COLORS,
  isDisenoInkPantoneMix,
} from './constants/preprensaDisenoColors'
import {
  isValidImpresionTintaIndex,
  normalizeImpresionInkIndex,
} from './utils/impresionTintasUtils'

const diagramCopy = copy.tintas.diagram
const ladoCopy = copy.tintas.lado
const volteoCopy = copy.tintas.tintasVolteo

type FlipMode = 'sin-volteo' | 'volteo-pinza' | 'volteo-escuadra'
type SheetSide = 'tiro' | 'retiro'

type SheetMechanics = {
  pinza: 'left' | 'right'
  escuadra: 'bottom' | 'top'
  registro: 'top' | 'bottom'
}

interface InkBar {
  name: string
  swatch: string
}

interface ImpresionTiroRetiroDiagramProps {
  tiro: ImpresionLadoTintas
  retiro: ImpresionLadoTintas
  tipoBifronteColorBasico?: ImpresionTipoBifronte | ''
  tipoBifrontePantone?: ImpresionTipoBifronte | ''
  showColorBasico?: boolean
  showPantone?: boolean
}

const SHEET_LAYOUTS: Record<FlipMode, Record<SheetSide, SheetMechanics>> = {
  'sin-volteo': {
    tiro: { pinza: 'left', escuadra: 'bottom', registro: 'top' },
    retiro: { pinza: 'left', escuadra: 'bottom', registro: 'top' },
  },
  'volteo-pinza': {
    tiro: { pinza: 'left', escuadra: 'bottom', registro: 'top' },
    retiro: { pinza: 'right', escuadra: 'bottom', registro: 'top' },
  },
  'volteo-escuadra': {
    tiro: { pinza: 'left', escuadra: 'bottom', registro: 'top' },
    retiro: { pinza: 'left', escuadra: 'top', registro: 'bottom' },
  },
}

const resolveVolteoBadge = (tipo: ImpresionTipoBifronte | ''): string => {
  if (!isImpresionConVolteo(tipo)) return volteoCopy.volteoStatusSin
  if (tipo === 'volteo-escuadra') {
    return `${volteoCopy.volteoStatusCon} · ${volteoCopy.volteoEscuadraShort}`
  }
  return `${volteoCopy.volteoStatusCon} · ${volteoCopy.volteoPinzaShort}`
}

const resolveDiagramFlipMode = (
  showColorBasico: boolean,
  showPantone: boolean,
  tipoBifronteColorBasico: ImpresionTipoBifronte | '',
  tipoBifrontePantone: ImpresionTipoBifronte | ''
): FlipMode => {
  if (showColorBasico && isImpresionConVolteo(tipoBifronteColorBasico)) {
    return tipoBifronteColorBasico === 'volteo-escuadra' ? 'volteo-escuadra' : 'volteo-pinza'
  }
  if (showPantone && isImpresionConVolteo(tipoBifrontePantone)) {
    return tipoBifrontePantone === 'volteo-escuadra' ? 'volteo-escuadra' : 'volteo-pinza'
  }
  return 'sin-volteo'
}

const resolveLadoInkBars = (lado: ImpresionLadoTintas): InkBar[] =>
  lado.tintas.slice(0, lado.cantidad).flatMap(inkIndex => {
    const normalized = normalizeImpresionInkIndex(inkIndex)
    if (!isValidImpresionTintaIndex(normalized)) return []
    const ink = DISENO_INK_PALETTE[normalized]
    return ink ? [{ name: ink.name, swatch: ink.swatch }] : []
  })

const PantoneGradientDef: React.FC<{ id: string }> = ({ id }) => (
  <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
    {DISENO_INK_PANTONE_MIX_COLORS.map((color, index) => (
      <stop
        key={color}
        offset={`${(index / DISENO_INK_PANTONE_MIX_COLORS.length) * 100}%`}
        stopColor={color}
      />
    ))}
    <stop offset="100%" stopColor={DISENO_INK_PANTONE_MIX_COLORS[0]} />
  </linearGradient>
)

const InkBarsSvg: React.FC<{
  bars: InkBar[]
  x: number
  y: number
  width: number
  height: number
  idPrefix: string
}> = ({ bars, x, y, width, height, idPrefix }) => {
  if (bars.length === 0) return null

  const barGap = 1.5
  const barHeight = (height - barGap * (bars.length - 1)) / bars.length

  return (
    <g className="production-impresion-tiro-retiro-diagram__svg-inks">
      {bars.map((bar, index) => {
        const barY = y + index * (barHeight + barGap)
        const pantoneGradientId = `${idPrefix}-pantone-${index}`
        const fill = isDisenoInkPantoneMix(bar.swatch) ? `url(#${pantoneGradientId})` : bar.swatch

        return (
          <g key={`${bar.name}-${index}`}>
            {isDisenoInkPantoneMix(bar.swatch) ? <PantoneGradientDef id={pantoneGradientId} /> : null}
            <rect
              x={x}
              y={barY}
              width={width}
              height={barHeight}
              rx="1.5"
              fill={fill}
              className="production-impresion-tiro-retiro-diagram__svg-ink-bar"
            />
          </g>
        )
      })}
    </g>
  )
}

const RegistroMarkSvg: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx="10" cy="10" r="9" fill="#22c55e" />
    <line x1="10" y1="4" x2="10" y2="16" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="4" y1="10" x2="16" y2="10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="10" cy="10" r="2.2" fill="#fff" />
  </g>
)

const SheetSvg: React.FC<{
  side: SheetSide
  mechanics: SheetMechanics
  bars: InkBar[]
  showLeftPinzaLabel: boolean
  showRightPinzaLabel: boolean
}> = ({ side, mechanics, bars, showLeftPinzaLabel, showRightPinzaLabel }) => {
  const title = side === 'tiro' ? ladoCopy.tiro : ladoCopy.retiro
  const faceLetter = side === 'tiro' ? 'A' : 'B'
  const faceLabel = side === 'tiro' ? diagramCopy.faceA : diagramCopy.faceB

  const gridSize = 120
  const gridX = mechanics.pinza === 'left' ? 44 : 18
  const gridY = mechanics.escuadra === 'top' ? 40 : 24
  const gridCenterX = gridX + gridSize / 2
  const escuadraY = mechanics.escuadra === 'top' ? gridY : gridY + gridSize - 10
  const registroX = gridCenterX - 10
  const registroY = mechanics.registro === 'top' ? gridY + 4 : gridY + gridSize - 24
  const pinzaX = mechanics.pinza === 'left' ? gridX - 12 : gridX + gridSize
  const pinzaLabelX =
    mechanics.pinza === 'left'
      ? showLeftPinzaLabel
        ? 10
        : -999
      : showRightPinzaLabel
        ? pinzaX + 18
        : -999
  const escuadraLabelY =
    mechanics.escuadra === 'top' ? gridY - 8 : gridY + gridSize + 22

  const inkInsetX = 16
  const inkInsetTop = mechanics.escuadra === 'top' ? 24 : mechanics.registro === 'top' ? 26 : 18
  const inkInsetBottom = mechanics.escuadra === 'bottom' ? 24 : mechanics.registro === 'bottom' ? 28 : 18
  const inkBlocksX = gridX + inkInsetX
  const inkBlocksY = gridY + inkInsetTop
  const inkBlocksWidth = gridSize - inkInsetX * 2
  const inkBlocksHeight = gridSize - inkInsetTop - inkInsetBottom

  return (
    <svg
      viewBox="0 0 182 196"
      className="production-impresion-tiro-retiro-diagram__sheet-svg"
      role="img"
      aria-label={`${title} ${faceLabel}`}
    >
      <text x="91" y="16" textAnchor="middle" className="production-impresion-tiro-retiro-diagram__svg-title">
        {title}
      </text>

      {showLeftPinzaLabel && mechanics.pinza === 'left' ? (
        <text
          x={pinzaLabelX}
          y={gridY + gridSize / 2}
          textAnchor="middle"
          className="production-impresion-tiro-retiro-diagram__svg-edge-label production-impresion-tiro-retiro-diagram__svg-edge-label--pinza"
          transform={`rotate(-90 ${pinzaLabelX} ${gridY + gridSize / 2})`}
        >
          {diagramCopy.pinzaLabel}
        </text>
      ) : null}

      <rect
        x={gridX}
        y={gridY}
        width={gridSize}
        height={gridSize}
        className="production-impresion-tiro-retiro-diagram__svg-grid"
      />

      <defs>
        <pattern id={`grid-dots-${side}`} width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="0.9" fill="#cbd5e1" />
        </pattern>
      </defs>
      <rect
        x={gridX + 1}
        y={gridY + 1}
        width={gridSize - 2}
        height={gridSize - 2}
        fill={`url(#grid-dots-${side})`}
      />

      <InkBarsSvg
        bars={bars}
        x={inkBlocksX}
        y={inkBlocksY}
        width={inkBlocksWidth}
        height={inkBlocksHeight}
        idPrefix={`ink-${side}`}
      />

      <rect
        x={pinzaX}
        y={gridY}
        width="12"
        height={gridSize}
        className="production-impresion-tiro-retiro-diagram__svg-pinza"
      />

      <rect
        x={gridX}
        y={escuadraY}
        width={gridSize}
        height="10"
        className="production-impresion-tiro-retiro-diagram__svg-escuadra"
      />

      <text
        x={gridCenterX}
        y={gridY + gridSize / 2 - 2}
        textAnchor="middle"
        className="production-impresion-tiro-retiro-diagram__svg-face-letter"
      >
        {faceLetter}
      </text>
      <text
        x={gridCenterX}
        y={gridY + gridSize / 2 + 18}
        textAnchor="middle"
        className="production-impresion-tiro-retiro-diagram__svg-face-label"
      >
        {faceLabel}
      </text>

      <RegistroMarkSvg x={registroX} y={registroY} />

      {showRightPinzaLabel && mechanics.pinza === 'right' ? (
        <text
          x={pinzaLabelX}
          y={gridY + gridSize / 2}
          textAnchor="middle"
          className="production-impresion-tiro-retiro-diagram__svg-edge-label production-impresion-tiro-retiro-diagram__svg-edge-label--pinza"
          transform={`rotate(-90 ${pinzaLabelX} ${gridY + gridSize / 2})`}
        >
          {diagramCopy.pinzaLabel}
        </text>
      ) : null}

      <text
        x={gridCenterX}
        y={escuadraLabelY}
        textAnchor="middle"
        className="production-impresion-tiro-retiro-diagram__svg-edge-label production-impresion-tiro-retiro-diagram__svg-edge-label--escuadra"
      >
        {diagramCopy.escuadraLabel}
      </text>
    </svg>
  )
}

const FlipBridge: React.FC<{
  flipMode: FlipMode
  showBridgePinzaLabel: boolean
}> = ({ flipMode, showBridgePinzaLabel }) => {
  const primaryLabel =
    flipMode === 'volteo-pinza'
      ? diagramCopy.volteoPinzaLabel
      : flipMode === 'volteo-escuadra'
        ? diagramCopy.volteoEscuadraLabel
        : diagramCopy.voltearLabel

  return (
    <div className="production-impresion-tiro-retiro-diagram__bridge" aria-hidden>
      <span className="production-impresion-tiro-retiro-diagram__bridge-line" />
      <span className="production-impresion-tiro-retiro-diagram__bridge-label">{primaryLabel}</span>
      <span className="production-impresion-tiro-retiro-diagram__bridge-line" />
      {flipMode === 'volteo-escuadra' ? (
        <span className="production-impresion-tiro-retiro-diagram__bridge-sub-label">
          {diagramCopy.pinzaLabel}
        </span>
      ) : null}
      {showBridgePinzaLabel ? (
        <span className="production-impresion-tiro-retiro-diagram__bridge-pinza-label">
          {diagramCopy.pinzaLabel}
        </span>
      ) : null}
    </div>
  )
}

const VolteoChip: React.FC<{
  label: string
  tipo: ImpresionTipoBifronte | ''
}> = ({ label, tipo }) => {
  const conVolteo = isImpresionConVolteo(tipo)

  return (
    <span
      className={clsx(
        'production-impresion-tiro-retiro-diagram__chip',
        conVolteo
          ? 'production-impresion-tiro-retiro-diagram__chip--con'
          : 'production-impresion-tiro-retiro-diagram__chip--sin'
      )}
    >
      <strong>{label}</strong>
      <span>{resolveVolteoBadge(tipo)}</span>
    </span>
  )
}

const ImpresionTiroRetiroDiagram: React.FC<ImpresionTiroRetiroDiagramProps> = ({
  tiro,
  retiro,
  tipoBifronteColorBasico = '',
  tipoBifrontePantone = '',
  showColorBasico = false,
  showPantone = false,
}) => {
  const titleId = useId()
  const totalTintas = useMemo(() => tiro.cantidad + retiro.cantidad, [tiro.cantidad, retiro.cantidad])

  const flipMode = resolveDiagramFlipMode(
    showColorBasico,
    showPantone,
    tipoBifronteColorBasico,
    tipoBifrontePantone
  )
  const layouts = SHEET_LAYOUTS[flipMode]
  const tiroBars = useMemo(() => resolveLadoInkBars(tiro), [tiro])
  const retiroBars = useMemo(() => resolveLadoInkBars(retiro), [retiro])

  const showBridgePinzaLabel =
    layouts.retiro.pinza === 'left' && flipMode !== 'volteo-escuadra'

  return (
    <section
      className="production-impresion-tiro-retiro-diagram-panel"
      aria-labelledby={titleId}
    >
      <div className="production-impresion-tiro-retiro-diagram-panel__head">
        <h4 id={titleId} className="production-impresion-tiro-retiro-diagram-panel__title">
          {diagramCopy.title}
        </h4>
      </div>

      <div className="production-impresion-tiro-retiro-diagram-panel__body">
        {totalTintas <= 0 ? (
          <p className="production-impresion-tiro-retiro-diagram__empty">{diagramCopy.empty}</p>
        ) : (
          <figure className="production-impresion-tiro-retiro-diagram">
            <div
              className={clsx(
                'production-impresion-tiro-retiro-diagram__stage',
                `production-impresion-tiro-retiro-diagram__stage--${flipMode}`
              )}
            >
              <SheetSvg
                side="tiro"
                mechanics={layouts.tiro}
                bars={tiroBars}
                showLeftPinzaLabel
                showRightPinzaLabel={false}
              />
              <FlipBridge flipMode={flipMode} showBridgePinzaLabel={showBridgePinzaLabel} />
              <SheetSvg
                side="retiro"
                mechanics={layouts.retiro}
                bars={retiroBars}
                showLeftPinzaLabel={false}
                showRightPinzaLabel={layouts.retiro.pinza === 'right'}
              />
            </div>

            {(showColorBasico || showPantone) && (
              <figcaption className="production-impresion-tiro-retiro-diagram__legend">
                {showColorBasico ? (
                  <VolteoChip label={volteoCopy.badgeColorBasico} tipo={tipoBifronteColorBasico} />
                ) : null}
                {showPantone ? (
                  <VolteoChip label={volteoCopy.badgePantone} tipo={tipoBifrontePantone} />
                ) : null}
              </figcaption>
            )}
          </figure>
        )}
      </div>
    </section>
  )
}

export default ImpresionTiroRetiroDiagram
