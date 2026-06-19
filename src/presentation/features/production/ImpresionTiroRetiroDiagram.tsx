import React, { useId, useMemo } from 'react'
import clsx from 'clsx'
import type { ImpresionLadoTintas, ImpresionTipoBifronte } from '../../../core/domain/entities/Order'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { isImpresionConVolteo } from './constants/impresionTipoBifronte'
import {
  DISENO_INK_PALETTE,
  DISENO_INK_PANTONE_MIX_BACKGROUND,
  DISENO_INK_PANTONE_MIX_COLORS,
  isDisenoInkPantoneMix,
} from './constants/preprensaDisenoColors'
import {
  isValidImpresionTintaIndex,
  normalizeImpresionInkIndex,
} from './utils/impresionTintasUtils'

const diagramCopy = copy.tintas.diagram
const volteoCopy = copy.tintas.tintasVolteo

const TIRO_RING_COLOR = '#00a9e0'
const RETIRO_RING_COLOR = '#d6007a'

type FlipMode = 'sin-volteo' | 'volteo-pinza' | 'volteo-escuadra'
type SheetSide = 'tiro' | 'retiro'

type SheetMechanics = {
  pinza: 'left' | 'right'
  escuadra: 'top' | 'bottom'
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
  showVolteoChips?: boolean
}

const SHEET_LAYOUTS: Record<FlipMode, Record<SheetSide, SheetMechanics>> = {
  'sin-volteo': {
    tiro: { pinza: 'left', escuadra: 'bottom' },
    retiro: { pinza: 'left', escuadra: 'bottom' },
  },
  'volteo-pinza': {
    tiro: { pinza: 'left', escuadra: 'bottom' },
    retiro: { pinza: 'left', escuadra: 'top' },
  },
  'volteo-escuadra': {
    tiro: { pinza: 'left', escuadra: 'bottom' },
    retiro: { pinza: 'right', escuadra: 'bottom' },
  },
}

const SHEET_X = 28
const SHEET_Y = 20
const SHEET_W = 86
const SHEET_H = 128
const PINZA_W = 13
const ESCUADRA_H = 13
const SHEET_VIEWBOX = '-4 -14 152 198'
const RESULTADO_PASADA_RING_RADIUS = 38
const RESULTADO_INK_ORBIT_RADIUS = 18

const resolveResultadoFaceRingRadius = (faceW: number, faceH: number): number => {
  const isFullFace = faceW >= SHEET_W - 1 && faceH >= SHEET_H - 1
  if (isFullFace) return RESULTADO_PASADA_RING_RADIUS

  const isWideShortFace = faceW > faceH * 1.2
  const labelReserve = isWideShortFace ? 8 : 10
  const edgePadding = 5
  const maxByHeight = faceH / 2 - labelReserve - edgePadding
  const maxByWidth = faceW / 2 - edgePadding
  const geometricMax = Math.min(maxByHeight, maxByWidth)

  return Math.max(22, Math.round(Math.min(geometricMax, RESULTADO_PASADA_RING_RADIUS + 4)))
}

type GuideRect = { x: number; y: number; w: number; h: number }

type SheetGuideLayout = {
  pinza: GuideRect
  escuadra: GuideRect
}

const resolveSheetGuideLayout = (
  sheetX: number,
  sheetY: number,
  sheetW: number,
  sheetH: number,
  pinzaW: number,
  escuadraH: number,
  mechanics: SheetMechanics
): SheetGuideLayout => {
  const pinzaOnLeft = mechanics.pinza === 'left'
  const escuadraOnTop = mechanics.escuadra === 'top'

  return {
    pinza: {
      x: pinzaOnLeft ? sheetX - pinzaW : sheetX + sheetW,
      y: sheetY,
      w: pinzaW,
      h: sheetH,
    },
    escuadra: {
      x: pinzaOnLeft ? sheetX - pinzaW : sheetX,
      y: escuadraOnTop ? sheetY - escuadraH : sheetY + sheetH,
      w: sheetW + pinzaW,
      h: escuadraH,
    },
  }
}

const resolveRegistroPosition = (
  mechanics: SheetMechanics,
  sheetX: number,
  sheetY: number,
  sheetW: number,
  sheetH: number
) => {
  if (mechanics.pinza === 'right' && mechanics.escuadra === 'bottom') {
    return { x: sheetX + 6, y: sheetY + 6 }
  }
  if (mechanics.pinza === 'left' && mechanics.escuadra === 'top') {
    return { x: sheetX + sheetW - 22, y: sheetY + sheetH - 20 }
  }
  return { x: sheetX + sheetW - 22, y: sheetY + 6 }
}

const resolveVolteoBadge = (tipo: ImpresionTipoBifronte | ''): string => {
  if (!isImpresionConVolteo(tipo)) return volteoCopy.volteoStatusSin
  if (tipo === 'volteo-escuadra') {
    return `${volteoCopy.volteoStatusCon} · ${volteoCopy.volteoEscuadraShort}`
  }
  return `${volteoCopy.volteoStatusCon} · ${volteoCopy.volteoPinzaShort}`
}

const resolveDiagramVolteo = (
  showColorBasico: boolean,
  showPantone: boolean,
  tipoBifronteColorBasico: ImpresionTipoBifronte | '',
  tipoBifrontePantone: ImpresionTipoBifronte | ''
): { conVolteo: boolean; flipMode: FlipMode } => {
  const volteoColorBasico = showColorBasico && isImpresionConVolteo(tipoBifronteColorBasico)
  const volteoPantone = showPantone && isImpresionConVolteo(tipoBifrontePantone)
  const conVolteo = volteoColorBasico || volteoPantone

  if (!conVolteo) {
    return { conVolteo: false, flipMode: 'sin-volteo' }
  }

  const tipoActivo = volteoColorBasico ? tipoBifronteColorBasico : tipoBifrontePantone
  const flipMode: FlipMode = tipoActivo === 'volteo-escuadra' ? 'volteo-escuadra' : 'volteo-pinza'
  return { conVolteo: true, flipMode }
}

const resolveLadoInkBars = (lado: ImpresionLadoTintas): InkBar[] =>
  lado.tintas.slice(0, lado.cantidad).flatMap(inkIndex => {
    const normalized = normalizeImpresionInkIndex(inkIndex)
    if (!isValidImpresionTintaIndex(normalized)) return []
    const ink = DISENO_INK_PALETTE[normalized]
    return ink ? [{ name: ink.name, swatch: ink.swatch }] : []
  })

const resolveInkCirclePositions = (count: number, cx: number, cy: number, radius: number) => {
  if (count <= 0) return []
  if (count === 1) return [{ x: cx, y: cy, r: radius }]
  if (count === 2) {
    return [
      { x: cx - radius * 0.55, y: cy, r: radius },
      { x: cx + radius * 0.55, y: cy, r: radius },
    ]
  }
  if (count === 3) {
    return [
      { x: cx, y: cy - radius * 0.45, r: radius },
      { x: cx - radius * 0.5, y: cy + radius * 0.35, r: radius },
      { x: cx + radius * 0.5, y: cy + radius * 0.35, r: radius },
    ]
  }
  if (count === 4) {
    const compactRadius = Math.max(12, radius - 1.5)
    const offsets = [
      { x: -compactRadius * 0.55, y: -compactRadius * 0.45 },
      { x: compactRadius * 0.55, y: -compactRadius * 0.45 },
      { x: -compactRadius * 0.55, y: compactRadius * 0.45 },
      { x: compactRadius * 0.55, y: compactRadius * 0.45 },
    ]
    return offsets.map(offset => ({
      x: cx + offset.x,
      y: cy + offset.y,
      r: compactRadius,
    }))
  }

  const circleRadius =
    count <= 6 ? Math.max(9, radius - 3) : count <= 9 ? Math.max(7.5, radius - 4.5) : Math.max(6, radius - 6)
  const orbitRadius =
    count <= 6 ? circleRadius * 1.05 : count <= 9 ? circleRadius * 1.22 : circleRadius * 1.38

  return Array.from({ length: count }, (_, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2
    return {
      x: cx + Math.cos(angle) * orbitRadius,
      y: cy + Math.sin(angle) * orbitRadius,
      r: circleRadius,
    }
  })
}

const resolveResultadoInkBars = (tiroBars: InkBar[], retiroBars: InkBar[]): InkBar[] => [
  ...tiroBars,
  ...retiroBars,
]

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

const DiagramSheetDefs: React.FC<{ idPrefix: string; patternId: string }> = ({ idPrefix, patternId }) => (
  <defs>
    <pattern id={patternId} width="12" height="12" patternUnits="userSpaceOnUse">
      <rect width="12" height="12" fill="#fafbfc" />
      <circle cx="1.4" cy="1.4" r="0.65" fill="#e2e8f0" opacity="0.9" />
    </pattern>
    <linearGradient id={`${idPrefix}-paper`} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="100%" stopColor="#f1f5f9" />
    </linearGradient>
    <linearGradient id={`${idPrefix}-pinza`} x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#3d9a56" />
      <stop offset="100%" stopColor="#1f6b35" />
    </linearGradient>
    <linearGradient id={`${idPrefix}-escuadra`} x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#3b6fd8" />
      <stop offset="100%" stopColor="#1e4fa8" />
    </linearGradient>
    <filter id={`${idPrefix}-sheet-shadow`} x="-25%" y="-20%" width="150%" height="145%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.14" />
    </filter>
    <filter id={`${idPrefix}-bar-label-shadow`} x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0.6" stdDeviation="0.55" floodColor="#0f172a" floodOpacity="0.45" />
    </filter>
  </defs>
)

const PINZA_GRIP_TOOTH_COUNT = 6
const PINZA_CORNER_RADIUS = 4
const PINZA_LABEL_OUTSET = 6
const ESCUADRA_LABEL_OUTSET = 6

const buildPinzaBodyPath = (
  layout: GuideRect,
  pinzaOnLeft: boolean,
  escuadraOnTop: boolean,
  cornerRadius = PINZA_CORNER_RADIUS
): string => {
  const { x, y, w, h } = layout
  const innerX = pinzaOnLeft ? x + w : x
  const outerX = pinzaOnLeft ? x : x + w
  const r = cornerRadius

  if (pinzaOnLeft && !escuadraOnTop) {
    return [
      `M ${innerX} ${y}`,
      `L ${outerX} ${y}`,
      `L ${outerX} ${y + h - r}`,
      `Q ${outerX} ${y + h} ${outerX + r} ${y + h}`,
      `L ${innerX} ${y + h}`,
      'Z',
    ].join(' ')
  }

  if (pinzaOnLeft && escuadraOnTop) {
    return [
      `M ${innerX} ${y + h}`,
      `L ${outerX} ${y + h}`,
      `L ${outerX} ${y + r}`,
      `Q ${outerX} ${y} ${outerX + r} ${y}`,
      `L ${innerX} ${y}`,
      'Z',
    ].join(' ')
  }

  if (!pinzaOnLeft && !escuadraOnTop) {
    return [
      `M ${innerX} ${y}`,
      `L ${outerX} ${y}`,
      `L ${outerX} ${y + h - r}`,
      `Q ${outerX} ${y + h} ${outerX - r} ${y + h}`,
      `L ${innerX} ${y + h}`,
      'Z',
    ].join(' ')
  }

  return [
    `M ${innerX} ${y + h}`,
    `L ${outerX} ${y + h}`,
    `L ${outerX} ${y + r}`,
    `Q ${outerX} ${y} ${outerX - r} ${y}`,
    `L ${innerX} ${y}`,
    'Z',
  ].join(' ')
}

const buildPinzaGripTeeth = (layout: GuideRect, pinzaOnLeft: boolean) => {
  const toothW = 3.1
  const toothH = 5.2
  const marginY = 12
  const span = layout.h - marginY * 2
  const cell = span / PINZA_GRIP_TOOTH_COUNT
  const toothX = pinzaOnLeft ? layout.x + 0.55 : layout.x + layout.w - toothW - 0.55

  return Array.from({ length: PINZA_GRIP_TOOTH_COUNT }, (_, index) => {
    const toothY = layout.y + marginY + cell * index + (cell - toothH) / 2
    return { x: toothX, y: toothY, w: toothW, h: toothH }
  })
}

const resolvePinzaLabelPosition = (
  layout: GuideRect,
  pinzaOnLeft: boolean,
  sheetX: number,
  sheetW: number
) => {
  const centerY = layout.y + layout.h / 2
  const paperOuterX = pinzaOnLeft ? sheetX : sheetX + sheetW
  const labelX = pinzaOnLeft
    ? Math.min(layout.x - PINZA_LABEL_OUTSET, paperOuterX - layout.w - PINZA_LABEL_OUTSET)
    : Math.max(layout.x + layout.w + PINZA_LABEL_OUTSET, paperOuterX + PINZA_LABEL_OUTSET)

  return { x: labelX, y: centerY }
}

const PinzaBarSvg: React.FC<{
  layout: GuideRect
  idPrefix: string
  pinzaOnLeft: boolean
  escuadraOnTop: boolean
  sheetX: number
  sheetW: number
}> = ({ layout, idPrefix, pinzaOnLeft, escuadraOnTop, sheetX, sheetW }) => {
  const innerX = pinzaOnLeft ? layout.x + layout.w : layout.x
  const centerX = layout.x + layout.w / 2
  const gripTeeth = buildPinzaGripTeeth(layout, pinzaOnLeft)
  const bodyPath = buildPinzaBodyPath(layout, pinzaOnLeft, escuadraOnTop)
  const towardSheet = pinzaOnLeft ? 1 : -1
  const arrowRatios = [0.34, 0.66]
  const label = resolvePinzaLabelPosition(layout, pinzaOnLeft, sheetX, sheetW)
  const clipId = `${idPrefix}-pinza-clip`

  return (
    <g className="production-impresion-tiro-retiro-diagram__svg-pinza-group">
      <defs>
        <clipPath id={clipId}>
          <path d={bodyPath} />
        </clipPath>
      </defs>

      <path
        d={bodyPath}
        fill={`url(#${idPrefix}-pinza)`}
        className="production-impresion-tiro-retiro-diagram__svg-pinza"
      />

      <path
        d={bodyPath}
        fill="none"
        className="production-impresion-tiro-retiro-diagram__svg-pinza-outer-edge"
      />

      <g clipPath={`url(#${clipId})`}>
        {gripTeeth.map((tooth, index) => (
          <rect
            key={index}
            x={tooth.x}
            y={tooth.y}
            width={tooth.w}
            height={tooth.h}
            rx="1.3"
            className="production-impresion-tiro-retiro-diagram__svg-pinza-grip-tooth"
          />
        ))}
      </g>

      {arrowRatios.map(ratio => {
        const arrowY = layout.y + layout.h * ratio
        const arrowStartX = centerX - towardSheet * 4.2
        const arrowEndX = centerX + towardSheet * 2.4
        return (
          <line
            key={ratio}
            x1={arrowStartX}
            y1={arrowY}
            x2={arrowEndX}
            y2={arrowY}
            className="production-impresion-tiro-retiro-diagram__svg-pinza-arrow"
            markerEnd="url(#pinza-arrowhead)"
          />
        )
      })}

      <text
        x={label.x}
        y={label.y}
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(${pinzaOnLeft ? -90 : 90} ${label.x} ${label.y})`}
        className="production-impresion-tiro-retiro-diagram__svg-bar-label production-impresion-tiro-retiro-diagram__svg-bar-label--pinza production-impresion-tiro-retiro-diagram__svg-bar-label--outside"
      >
        {diagramCopy.pinzaBarLabel}
      </text>
    </g>
  )
}

const ESCUADRA_TICK_RATIOS = [0.3, 0.46, 0.62, 0.78]

const buildEscuadraBodyPath = (
  layout: GuideRect,
  pinzaOnLeft: boolean,
  escuadraOnTop: boolean,
  cornerRadius = PINZA_CORNER_RADIUS
): string => {
  const { x, y, w, h } = layout
  const r = cornerRadius

  if (!escuadraOnTop && pinzaOnLeft) {
    return [
      `M ${x + r} ${y}`,
      `L ${x + w} ${y}`,
      `L ${x + w} ${y + h}`,
      `L ${x} ${y + h}`,
      `L ${x} ${y + r}`,
      `Q ${x} ${y} ${x + r} ${y}`,
      'Z',
    ].join(' ')
  }

  if (!escuadraOnTop && !pinzaOnLeft) {
    return [
      `M ${x} ${y}`,
      `L ${x + w - r} ${y}`,
      `Q ${x + w} ${y} ${x + w} ${y + r}`,
      `L ${x + w} ${y + h}`,
      `L ${x} ${y + h}`,
      'Z',
    ].join(' ')
  }

  if (escuadraOnTop && pinzaOnLeft) {
    return [
      `M ${x + r} ${y + h}`,
      `L ${x + w} ${y + h}`,
      `L ${x + w} ${y}`,
      `L ${x} ${y}`,
      `L ${x} ${y + h - r}`,
      `Q ${x} ${y + h} ${x + r} ${y + h}`,
      'Z',
    ].join(' ')
  }

  return [
    `M ${x} ${y + h}`,
    `L ${x + w - r} ${y + h}`,
    `Q ${x + w} ${y + h} ${x + w} ${y + h - r}`,
    `L ${x + w} ${y}`,
    `L ${x} ${y}`,
    'Z',
  ].join(' ')
}

const buildEscuadraCornerMark = (
  layout: GuideRect,
  pinzaOnLeft: boolean,
  escuadraOnTop: boolean
): string => {
  const arm = 8
  const inset = 1.5

  if (!escuadraOnTop && pinzaOnLeft) {
    const x = layout.x + inset
    const y = layout.y
    return `M ${x} ${y + arm} L ${x} ${y} L ${x + arm} ${y}`
  }

  if (!escuadraOnTop && !pinzaOnLeft) {
    const x = layout.x + layout.w - inset
    const y = layout.y
    return `M ${x} ${y + arm} L ${x} ${y} L ${x - arm} ${y}`
  }

  if (escuadraOnTop && pinzaOnLeft) {
    const x = layout.x + inset
    const y = layout.y + layout.h
    return `M ${x} ${y - arm} L ${x} ${y} L ${x + arm} ${y}`
  }

  const x = layout.x + layout.w - inset
  const y = layout.y + layout.h
  return `M ${x} ${y - arm} L ${x} ${y} L ${x - arm} ${y}`
}

const buildEscuadraEdgeTicks = (layout: GuideRect, escuadraOnTop: boolean) => {
  const edgeY = escuadraOnTop ? layout.y + layout.h : layout.y
  const tickLength = 4.6
  const capHalf = 2.2

  return ESCUADRA_TICK_RATIOS.map(ratio => {
    const x = layout.x + layout.w * ratio
    const tickEndY = escuadraOnTop ? edgeY - tickLength : edgeY + tickLength
    return { x, edgeY, tickEndY, capHalf }
  })
}

const resolveEscuadraLabelPosition = (
  layout: GuideRect,
  escuadraOnTop: boolean
) => {
  const labelX = layout.x + layout.w / 2
  const labelY = escuadraOnTop
    ? layout.y - ESCUADRA_LABEL_OUTSET
    : layout.y + layout.h + ESCUADRA_LABEL_OUTSET

  return { x: labelX, y: labelY }
}

const EscuadraBarSvg: React.FC<{
  layout: GuideRect
  idPrefix: string
  escuadraOnTop: boolean
  pinzaOnLeft: boolean
}> = ({ layout, idPrefix, escuadraOnTop, pinzaOnLeft }) => {
  const bodyPath = buildEscuadraBodyPath(layout, pinzaOnLeft, escuadraOnTop)
  const edgeTicks = buildEscuadraEdgeTicks(layout, escuadraOnTop)
  const label = resolveEscuadraLabelPosition(layout, escuadraOnTop)
  const escHintX = layout.x + layout.w - 7
  const escHintY = layout.y + layout.h / 2 + 0.5

  return (
    <g className="production-impresion-tiro-retiro-diagram__svg-escuadra-group">
      <path
        d={bodyPath}
        fill={`url(#${idPrefix}-escuadra)`}
        className="production-impresion-tiro-retiro-diagram__svg-escuadra"
      />

      <path
        d={bodyPath}
        fill="none"
        className="production-impresion-tiro-retiro-diagram__svg-escuadra-outer-edge"
      />

      <path
        d={buildEscuadraCornerMark(layout, pinzaOnLeft, escuadraOnTop)}
        className="production-impresion-tiro-retiro-diagram__svg-escuadra-l"
      />

      {edgeTicks.map((tick, index) => (
        <g key={index}>
          <line
            x1={tick.x}
            y1={tick.edgeY}
            x2={tick.x}
            y2={tick.tickEndY}
            className="production-impresion-tiro-retiro-diagram__svg-escuadra-tick"
          />
          <line
            x1={tick.x - tick.capHalf}
            y1={tick.edgeY}
            x2={tick.x + tick.capHalf}
            y2={tick.edgeY}
            className="production-impresion-tiro-retiro-diagram__svg-escuadra-tick"
          />
        </g>
      ))}

      <text
        x={escHintX}
        y={escHintY}
        textAnchor="end"
        dominantBaseline="middle"
        className="production-impresion-tiro-retiro-diagram__svg-escuadra-esc"
      >
        {diagramCopy.escuadraEscHint}
      </text>

      <text
        x={label.x}
        y={label.y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="production-impresion-tiro-retiro-diagram__svg-bar-label production-impresion-tiro-retiro-diagram__svg-bar-label--escuadra production-impresion-tiro-retiro-diagram__svg-bar-label--outside"
      >
        {diagramCopy.escuadraBarLabel}
      </text>
    </g>
  )
}

const RegistroMarkSvg: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx="8" cy="8" r="7.5" fill="#fff" stroke="#dc2626" strokeWidth="1.4" />
    <line x1="8" y1="3" x2="8" y2="13" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="3" y1="8" x2="13" y2="8" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="8" cy="8" r="1.6" fill="#dc2626" />
  </g>
)

const resolveResultadoInkCirclePositions = (
  count: number,
  cx: number,
  cy: number,
  outerRingRadius: number,
  inkOrbitRadius = RESULTADO_INK_ORBIT_RADIUS
) => {
  const innerLimit = outerRingRadius - 8
  const positions = resolveInkCirclePositions(count, cx, cy, inkOrbitRadius)
  if (count <= 0) return positions

  const maxReach = Math.max(
    ...positions.map(position => Math.hypot(position.x - cx, position.y - cy) + position.r)
  )
  if (maxReach <= innerLimit) return positions

  const scale = innerLimit / maxReach
  return positions.map(position => ({
    x: cx + (position.x - cx) * scale,
    y: cy + (position.y - cy) * scale,
    r: position.r * scale,
  }))
}

const InkCirclesSvg: React.FC<{
  bars: InkBar[]
  cx: number
  cy: number
  idPrefix: string
  outerRingRadius?: number
  inkOrbitRadius?: number
}> = ({ bars, cx, cy, idPrefix, outerRingRadius, inkOrbitRadius }) => {
  if (bars.length === 0) return null

  const positions =
    outerRingRadius != null
      ? resolveResultadoInkCirclePositions(
          bars.length,
          cx,
          cy,
          outerRingRadius,
          inkOrbitRadius ?? RESULTADO_INK_ORBIT_RADIUS
        )
      : resolveInkCirclePositions(bars.length, cx, cy, 16)

  return (
    <g className="production-impresion-tiro-retiro-diagram__svg-inks">
      {bars.map((bar, index) => {
        const position = positions[index]
        if (!position) return null
        const pantoneGradientId = `${idPrefix}-pantone-${index}`
        const fill = isDisenoInkPantoneMix(bar.swatch) ? `url(#${pantoneGradientId})` : bar.swatch

        return (
          <g key={`${bar.name}-${index}`}>
            {isDisenoInkPantoneMix(bar.swatch) ? <PantoneGradientDef id={pantoneGradientId} /> : null}
            <circle
              cx={position.x}
              cy={position.y}
              r={position.r}
              fill={fill}
              fillOpacity={0.88}
              className="production-impresion-tiro-retiro-diagram__svg-ink-circle"
            />
          </g>
        )
      })}
    </g>
  )
}

const SheetSvg: React.FC<{
  side: SheetSide
  mechanics: SheetMechanics
  bars: InkBar[]
  patternId: string
  idPrefix: string
}> = ({ side, mechanics, bars, patternId, idPrefix }) => {
  const guides = resolveSheetGuideLayout(
    SHEET_X,
    SHEET_Y,
    SHEET_W,
    SHEET_H,
    PINZA_W,
    ESCUADRA_H,
    mechanics
  )
  const pinzaOnLeft = mechanics.pinza === 'left'
  const escuadraOnTop = mechanics.escuadra === 'top'
  const registro = resolveRegistroPosition(mechanics, SHEET_X, SHEET_Y, SHEET_W, SHEET_H)
  const sheetCenterX = SHEET_X + SHEET_W / 2
  const sheetCenterY = SHEET_Y + SHEET_H / 2
  const ringRadius = 30
  const ringColor = side === 'tiro' ? TIRO_RING_COLOR : RETIRO_RING_COLOR

  return (
    <svg
      viewBox={SHEET_VIEWBOX}
      className="production-impresion-tiro-retiro-diagram__sheet-svg"
      role="img"
      aria-hidden
    >
      <defs>
        <marker id="pinza-arrowhead" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" className="production-impresion-tiro-retiro-diagram__svg-pinza-arrow-head" />
        </marker>
      </defs>
      <DiagramSheetDefs idPrefix={idPrefix} patternId={patternId} />
      <g filter={`url(#${idPrefix}-sheet-shadow)`}>
        <rect
          x={SHEET_X}
          y={SHEET_Y}
          width={SHEET_W}
          height={SHEET_H}
          rx="5"
          fill={`url(#${idPrefix}-paper)`}
          className="production-impresion-tiro-retiro-diagram__svg-sheet"
        />
        <rect
          x={SHEET_X + 1}
          y={SHEET_Y + 1}
          width={SHEET_W - 2}
          height={SHEET_H - 2}
          rx="4"
          fill={`url(#${patternId})`}
          opacity="0.9"
        />
      </g>

      <g className="production-impresion-tiro-retiro-diagram__svg-guides">
        <PinzaBarSvg
          layout={guides.pinza}
          idPrefix={idPrefix}
          pinzaOnLeft={pinzaOnLeft}
          escuadraOnTop={escuadraOnTop}
          sheetX={SHEET_X}
          sheetW={SHEET_W}
        />
        <EscuadraBarSvg
          layout={guides.escuadra}
          idPrefix={idPrefix}
          escuadraOnTop={escuadraOnTop}
          pinzaOnLeft={pinzaOnLeft}
        />
      </g>

      {bars.length > 0 ? (
        <circle
          cx={sheetCenterX}
          cy={sheetCenterY}
          r={ringRadius}
          fill="none"
          stroke={ringColor}
          strokeWidth={3}
          className={clsx(
            'production-impresion-tiro-retiro-diagram__svg-pasada-ring',
            side === 'retiro' && 'production-impresion-tiro-retiro-diagram__svg-pasada-ring--retiro'
          )}
        />
      ) : null}

      <InkCirclesSvg bars={bars} cx={sheetCenterX} cy={sheetCenterY} idPrefix={`ink-${side}`} />
      <RegistroMarkSvg x={registro.x} y={registro.y} />
    </svg>
  )
}

const ResultadoPasadaRingsSvg: React.FC<{
  cx: number
  cy: number
  ringRadius: number
  hasTiro: boolean
  hasRetiro: boolean
}> = ({ cx, cy, ringRadius, hasTiro, hasRetiro }) => {
  const retiroRadius = hasTiro && hasRetiro ? ringRadius - 6 : ringRadius
  const isCompactFace = ringRadius >= 34
  const tiroStrokeWidth = isCompactFace ? 4 : 3.5
  const retiroStrokeWidth = isCompactFace ? 3.5 : 3

  return (
    <>
      {hasTiro ? (
        <circle
          cx={cx}
          cy={cy}
          r={ringRadius}
          fill="none"
          stroke={TIRO_RING_COLOR}
          strokeWidth={tiroStrokeWidth}
          className="production-impresion-tiro-retiro-diagram__svg-pasada-ring production-impresion-tiro-retiro-diagram__svg-pasada-ring--resultado"
        />
      ) : null}
      {hasRetiro ? (
        <circle
          cx={cx}
          cy={cy}
          r={retiroRadius}
          fill="none"
          stroke={RETIRO_RING_COLOR}
          strokeWidth={retiroStrokeWidth}
          strokeDasharray="5 4"
          className="production-impresion-tiro-retiro-diagram__svg-pasada-ring production-impresion-tiro-retiro-diagram__svg-pasada-ring--retiro production-impresion-tiro-retiro-diagram__svg-pasada-ring--resultado"
        />
      ) : null}
    </>
  )
}

const SHEET_VIEWBOX_X = -4
const SHEET_VIEWBOX_Y = -14
const SHEET_VIEWBOX_W = 152
const SHEET_VIEWBOX_H = 198

type ResultadoFaceLabelPlacement = 'top-center' | 'bottom-start' | 'bottom-end'

type ResultadoBifrontalFaceLayout = {
  x: number
  y: number
  w: number
  h: number
}

type ResultadoBifrontalLayout = {
  orientation: 'horizontal' | 'vertical'
  tiroFace: ResultadoBifrontalFaceLayout
  retiroFace: ResultadoBifrontalFaceLayout
  seam: { x1: number; y1: number; x2: number; y2: number }
}

const resolveResultadoBifrontalLayout = (flipMode: FlipMode): ResultadoBifrontalLayout => {
  if (flipMode === 'volteo-pinza') {
    const leftX = SHEET_VIEWBOX_X
    const topY = SHEET_VIEWBOX_Y
    const faceW = SHEET_VIEWBOX_W
    const faceH = SHEET_VIEWBOX_H / 2
    const seamY = topY + faceH

    return {
      orientation: 'vertical',
      tiroFace: { x: leftX, y: topY, w: faceW, h: faceH },
      retiroFace: { x: leftX, y: seamY, w: faceW, h: faceH },
      seam: { x1: leftX + 2, y1: seamY, x2: leftX + faceW - 2, y2: seamY },
    }
  }

  const leftX = SHEET_VIEWBOX_X
  const topY = SHEET_VIEWBOX_Y
  const faceW = SHEET_VIEWBOX_W / 2
  const faceH = SHEET_VIEWBOX_H
  const seamX = leftX + faceW

  return {
    orientation: 'horizontal',
    tiroFace: { x: leftX, y: topY, w: faceW, h: faceH },
    retiroFace: { x: seamX, y: topY, w: faceW, h: faceH },
    seam: { x1: seamX, y1: topY + 2, x2: seamX, y2: topY + faceH - 2 },
  }
}

const resolveResultadoFaceLabel = (
  x: number,
  y: number,
  sheetW: number,
  sheetH: number,
  placement: ResultadoFaceLabelPlacement
) => {
  if (placement === 'bottom-start') {
    return { labelX: x + 4, labelY: y + sheetH - 1.5, textAnchor: 'start' as const }
  }
  if (placement === 'bottom-end') {
    return {
      labelX: x + sheetW - 4,
      labelY: y + sheetH - 1.5,
      textAnchor: 'end' as const,
    }
  }
  return { labelX: x + sheetW / 2, labelY: y + 11, textAnchor: 'middle' as const }
}

const ResultadoSheetFaceSvg: React.FC<{
  x: number
  y: number
  sheetW?: number
  sheetH?: number
  bars: InkBar[]
  patternId: string
  idPrefix: string
  paperFillId: string
  faceLabel: string
  faceLabelPlacement?: ResultadoFaceLabelPlacement
  faceClassName: string
  hasTiro: boolean
  hasRetiro: boolean
  inkIdPrefix: string
}> = ({
  x,
  y,
  sheetW = SHEET_W,
  sheetH = SHEET_H,
  bars,
  patternId,
  paperFillId,
  faceLabel,
  faceLabelPlacement = 'top-center',
  faceClassName,
  hasTiro,
  hasRetiro,
  inkIdPrefix,
}) => {
  const centerX = x + sheetW / 2
  const labelAtBottom = faceLabelPlacement !== 'top-center'
  const centerYOffset = labelAtBottom ? Math.min(10, Math.max(6, sheetH * 0.075)) : 0
  const centerY = y + sheetH / 2 - centerYOffset
  const ringRadius = resolveResultadoFaceRingRadius(sheetW, sheetH)
  const inkOrbitRadius = Math.max(14, Math.round(ringRadius * 0.48))
  const isCompactFace = sheetW < SHEET_W
  const cornerRadius = isCompactFace ? 3 : 5
  const innerCornerRadius = isCompactFace ? 2.5 : 4
  const { labelX, labelY, textAnchor } = resolveResultadoFaceLabel(
    x,
    y,
    sheetW,
    sheetH,
    faceLabelPlacement
  )

  return (
    <g className={faceClassName}>
      <rect
        x={x}
        y={y}
        width={sheetW}
        height={sheetH}
        rx={cornerRadius}
        fill={`url(#${paperFillId})`}
        className="production-impresion-tiro-retiro-diagram__svg-sheet"
      />
      <rect
        x={x + 1}
        y={y + 1}
        width={sheetW - 2}
        height={sheetH - 2}
        rx={innerCornerRadius}
        fill={`url(#${patternId})`}
        opacity="0.9"
      />
      <text
        x={labelX}
        y={labelY}
        textAnchor={textAnchor}
        dominantBaseline={labelAtBottom ? 'alphabetic' : 'middle'}
        className={clsx(
          'production-impresion-tiro-retiro-diagram__svg-resultado-face-label',
          faceLabelPlacement === 'bottom-start' &&
            'production-impresion-tiro-retiro-diagram__svg-resultado-face-label--start',
          faceLabelPlacement === 'bottom-end' &&
            'production-impresion-tiro-retiro-diagram__svg-resultado-face-label--end'
        )}
      >
        {faceLabel}
      </text>
      <InkCirclesSvg
        bars={bars}
        cx={centerX}
        cy={centerY}
        idPrefix={inkIdPrefix}
        outerRingRadius={ringRadius}
        inkOrbitRadius={inkOrbitRadius}
      />
      <ResultadoPasadaRingsSvg
        cx={centerX}
        cy={centerY}
        ringRadius={ringRadius}
        hasTiro={hasTiro}
        hasRetiro={hasRetiro}
      />
    </g>
  )
}

const ResultadoBifrontalSeamSvg: React.FC<{
  x1: number
  y1: number
  x2: number
  y2: number
}> = ({ x1, y1, x2, y2 }) => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    className="production-impresion-tiro-retiro-diagram__svg-resultado-seam"
  />
)

const ResultadoSheetSvg: React.FC<{
  tiroBars: InkBar[]
  retiroBars: InkBar[]
  patternId: string
  idPrefix: string
  hasTiro: boolean
  hasRetiro: boolean
  conVolteo: boolean
  flipMode: FlipMode
}> = ({ tiroBars, retiroBars, patternId, idPrefix, hasTiro, hasRetiro, conVolteo, flipMode }) => {
  const sheetCenterX = SHEET_X + SHEET_W / 2
  const sheetCenterY = SHEET_Y + SHEET_H / 2
  const ringRadius = RESULTADO_PASADA_RING_RADIUS
  const showBothSides = conVolteo
  const showTiroRing = hasTiro || conVolteo
  const showRetiroRing = hasRetiro || conVolteo
  const resultadoBars = resolveResultadoInkBars(tiroBars, retiroBars)
  const bifrontalLayout = resolveResultadoBifrontalLayout(flipMode)
  const tiroFaceLabelPlacement: ResultadoFaceLabelPlacement = 'bottom-start'
  const retiroFaceLabelPlacement: ResultadoFaceLabelPlacement =
    bifrontalLayout.orientation === 'vertical' ? 'bottom-start' : 'bottom-end'

  return (
    <svg
      viewBox={SHEET_VIEWBOX}
      className={clsx(
        'production-impresion-tiro-retiro-diagram__sheet-svg',
        showBothSides && 'production-impresion-tiro-retiro-diagram__sheet-svg--bifrontal',
        showBothSides &&
          bifrontalLayout.orientation === 'vertical' &&
          'production-impresion-tiro-retiro-diagram__sheet-svg--bifrontal-vertical',
        showBothSides &&
          bifrontalLayout.orientation === 'horizontal' &&
          'production-impresion-tiro-retiro-diagram__sheet-svg--bifrontal-horizontal'
      )}
      role="img"
      aria-hidden
    >
      <DiagramSheetDefs idPrefix={idPrefix} patternId={patternId} />
      {showBothSides ? (
        <>
          <g filter={`url(#${idPrefix}-sheet-shadow)`}>
            <ResultadoSheetFaceSvg
              x={bifrontalLayout.tiroFace.x}
              y={bifrontalLayout.tiroFace.y}
              sheetW={bifrontalLayout.tiroFace.w}
              sheetH={bifrontalLayout.tiroFace.h}
              bars={tiroBars}
              patternId={patternId}
              idPrefix={idPrefix}
              paperFillId={`${idPrefix}-paper`}
              faceLabel={diagramCopy.faceATiro}
              faceLabelPlacement={tiroFaceLabelPlacement}
              faceClassName="production-impresion-tiro-retiro-diagram__svg-resultado-face production-impresion-tiro-retiro-diagram__svg-resultado-face--tiro"
              hasTiro={showTiroRing}
              hasRetiro={false}
              inkIdPrefix="ink-resultado-tiro"
            />
            <ResultadoSheetFaceSvg
              x={bifrontalLayout.retiroFace.x}
              y={bifrontalLayout.retiroFace.y}
              sheetW={bifrontalLayout.retiroFace.w}
              sheetH={bifrontalLayout.retiroFace.h}
              bars={retiroBars}
              patternId={patternId}
              idPrefix={idPrefix}
              paperFillId={`${idPrefix}-paper`}
              faceLabel={diagramCopy.faceBRetiro}
              faceLabelPlacement={retiroFaceLabelPlacement}
              faceClassName="production-impresion-tiro-retiro-diagram__svg-resultado-face production-impresion-tiro-retiro-diagram__svg-resultado-face--retiro"
              hasTiro={false}
              hasRetiro={showRetiroRing}
              inkIdPrefix="ink-resultado-retiro"
            />
          </g>
          <ResultadoBifrontalSeamSvg {...bifrontalLayout.seam} />
        </>
      ) : (
        <g filter={`url(#${idPrefix}-sheet-shadow)`}>
          <rect
            x={SHEET_X}
            y={SHEET_Y}
            width={SHEET_W}
            height={SHEET_H}
            rx="5"
            fill={`url(#${idPrefix}-paper)`}
            className="production-impresion-tiro-retiro-diagram__svg-sheet"
          />
          <rect
            x={SHEET_X + 1}
            y={SHEET_Y + 1}
            width={SHEET_W - 2}
            height={SHEET_H - 2}
            rx="4"
            fill={`url(#${patternId})`}
            opacity="0.9"
          />
          <InkCirclesSvg
            bars={resultadoBars}
            cx={sheetCenterX}
            cy={sheetCenterY}
            idPrefix="ink-resultado"
            outerRingRadius={ringRadius}
          />
          <ResultadoPasadaRingsSvg
            cx={sheetCenterX}
            cy={sheetCenterY}
            ringRadius={ringRadius}
            hasTiro={showTiroRing}
            hasRetiro={showRetiroRing}
          />
        </g>
      )}
    </svg>
  )
}

const InkSwatchList: React.FC<{ bars: InkBar[] }> = ({ bars }) => {
  if (bars.length === 0) {
    return <p className="production-impresion-tiro-retiro-diagram__ink-empty">{diagramCopy.inkEmpty}</p>
  }

  return (
    <ul className="production-impresion-tiro-retiro-diagram__ink-list">
      {bars.map((bar, index) => {
        const isPantone = isDisenoInkPantoneMix(bar.swatch)

        return (
          <li key={`${bar.name}-${index}`} className="production-impresion-tiro-retiro-diagram__ink-chip">
            <span
              className={clsx(
                'production-impresion-tiro-retiro-diagram__ink-chip-swatch',
                isPantone && 'production-impresion-tiro-retiro-diagram__ink-chip-swatch--pantone'
              )}
              style={isPantone ? { background: DISENO_INK_PANTONE_MIX_BACKGROUND } : { background: bar.swatch }}
              aria-hidden
            />
            <span className="production-impresion-tiro-retiro-diagram__ink-chip-name">{bar.name}</span>
          </li>
        )
      })}
    </ul>
  )
}

const PasadaColumn: React.FC<{
  side: SheetSide
  mechanics: SheetMechanics
  bars: InkBar[]
  patternId: string
  defsIdPrefix: string
}> = ({ side, mechanics, bars, patternId, defsIdPrefix }) => {
  const label = side === 'tiro' ? diagramCopy.pasadaTiroLabel : diagramCopy.pasadaRetiroLabel

  return (
    <div
      className={clsx(
        'production-impresion-tiro-retiro-diagram__pasada',
        `production-impresion-tiro-retiro-diagram__pasada--${side}`
      )}
    >
      <p className="production-impresion-tiro-retiro-diagram__pasada-label">{label}</p>
      <div className="production-impresion-tiro-retiro-diagram__pasada-sheet">
        <SheetSvg
          side={side}
          mechanics={mechanics}
          bars={bars}
          patternId={patternId}
          idPrefix={defsIdPrefix}
        />
      </div>
      <InkSwatchList bars={bars} />
    </div>
  )
}

const ResultadoRingLegendIcon: React.FC<{ variant: 'tiro' | 'retiro' }> = ({ variant }) => (
  <svg
    viewBox="0 0 20 20"
    className="production-impresion-tiro-retiro-diagram__resultado-ring-icon"
    aria-hidden
  >
    {variant === 'tiro' ? (
      <circle
        cx="10"
        cy="10"
        r="7.6"
        fill="none"
        stroke={TIRO_RING_COLOR}
        strokeWidth="2.6"
        className="production-impresion-tiro-retiro-diagram__resultado-ring-icon-stroke--tiro"
      />
    ) : (
      <circle
        cx="10"
        cy="10"
        r="6.2"
        fill="none"
        stroke={RETIRO_RING_COLOR}
        strokeWidth="2.2"
        strokeDasharray="4.5 3.5"
        className="production-impresion-tiro-retiro-diagram__resultado-ring-icon-stroke--retiro"
      />
    )}
  </svg>
)

const ResultadoColumn: React.FC<{
  tiroBars: InkBar[]
  retiroBars: InkBar[]
  patternId: string
  defsIdPrefix: string
  conVolteo: boolean
  flipMode: FlipMode
}> = ({ tiroBars, retiroBars, patternId, defsIdPrefix, conVolteo, flipMode }) => (
  <div
    className={clsx(
      'production-impresion-tiro-retiro-diagram__pasada',
      'production-impresion-tiro-retiro-diagram__pasada--resultado',
      conVolteo && 'production-impresion-tiro-retiro-diagram__pasada--resultado-bifrontal',
      conVolteo &&
        flipMode === 'volteo-pinza' &&
        'production-impresion-tiro-retiro-diagram__pasada--resultado-bifrontal-vertical',
      conVolteo &&
        flipMode === 'volteo-escuadra' &&
        'production-impresion-tiro-retiro-diagram__pasada--resultado-bifrontal-horizontal'
    )}
  >
    <p className="production-impresion-tiro-retiro-diagram__pasada-label">
      {diagramCopy.resultadoLabel}
    </p>
    {conVolteo ? (
      <p className="production-impresion-tiro-retiro-diagram__resultado-bifrontal-hint">
        {diagramCopy.resultadoBifrontalHint}
      </p>
    ) : null}
    <div className="production-impresion-tiro-retiro-diagram__pasada-sheet">
      <ResultadoSheetSvg
        tiroBars={tiroBars}
        retiroBars={retiroBars}
        patternId={patternId}
        idPrefix={defsIdPrefix}
        hasTiro={tiroBars.length > 0}
        hasRetiro={retiroBars.length > 0}
        conVolteo={conVolteo}
        flipMode={flipMode}
      />
    </div>
    <div className="production-impresion-tiro-retiro-diagram__resultado-legend">
      {tiroBars.length > 0 || conVolteo ? (
        <span className="production-impresion-tiro-retiro-diagram__resultado-legend-item">
          <ResultadoRingLegendIcon variant="tiro" />
          {diagramCopy.resultadoTiro}
        </span>
      ) : null}
      {retiroBars.length > 0 || conVolteo ? (
        <span className="production-impresion-tiro-retiro-diagram__resultado-legend-item">
          <ResultadoRingLegendIcon variant="retiro" />
          {diagramCopy.resultadoRetiro}
        </span>
      ) : null}
    </div>
  </div>
)

const BridgeVolteoFigureSvg: React.FC<{ kind: 'pinza' | 'escuadra' }> = ({ kind }) => {
  const bridgeId = useId().replace(/:/g, '')
  const markerStartId = `${bridgeId}-arrow-start`
  const markerEndId = `${bridgeId}-arrow-end`
  const isPinza = kind === 'pinza'
  const arrowMarkers = {
    markerStart: `url(#${markerStartId})`,
    markerEnd: `url(#${markerEndId})`,
  }

  return (
    <svg
      viewBox={isPinza ? '0 0 54 72' : '0 0 72 54'}
      className={clsx(
        'production-impresion-tiro-retiro-diagram__bridge-arrow-svg',
        isPinza
          ? 'production-impresion-tiro-retiro-diagram__bridge-arrow-svg--vertical'
          : 'production-impresion-tiro-retiro-diagram__bridge-arrow-svg--horizontal'
      )}
      aria-hidden
    >
      <defs>
        <marker
          id={markerEndId}
          markerWidth="7"
          markerHeight="7"
          refX="5.5"
          refY="3.5"
          orient="auto"
        >
          <path
            d="M0.5,0.5 L6.5,3.5 L0.5,6.5 Z"
            className="production-impresion-tiro-retiro-diagram__bridge-arrow-head"
          />
        </marker>
        <marker
          id={markerStartId}
          markerWidth="7"
          markerHeight="7"
          refX="1.5"
          refY="3.5"
          orient="auto-start-reverse"
        >
          <path
            d="M0.5,0.5 L6.5,3.5 L0.5,6.5 Z"
            className="production-impresion-tiro-retiro-diagram__bridge-arrow-head"
          />
        </marker>
      </defs>
      {isPinza ? (
        <>
          <text
            x="11"
            y="9"
            textAnchor="middle"
            className="production-impresion-tiro-retiro-diagram__bridge-axis-label"
          >
            {diagramCopy.pinzaBarLabel}
          </text>
          <line
            x1="11"
            y1="14"
            x2="11"
            y2="62"
            className="production-impresion-tiro-retiro-diagram__bridge-axis"
          />
          <circle
            cx="11"
            cy="38"
            r="2.75"
            className="production-impresion-tiro-retiro-diagram__bridge-axis-node"
          />
          <line
            x1="39"
            y1="12"
            x2="39"
            y2="60"
            className="production-impresion-tiro-retiro-diagram__bridge-arrow-line"
            {...arrowMarkers}
          />
        </>
      ) : (
        <>
          <line
            x1="12"
            y1="14"
            x2="60"
            y2="14"
            className="production-impresion-tiro-retiro-diagram__bridge-arrow-line"
            {...arrowMarkers}
          />
          <text
            x="36"
            y="50"
            textAnchor="middle"
            className="production-impresion-tiro-retiro-diagram__bridge-axis-label"
          >
            {diagramCopy.escuadraBarLabel}
          </text>
          <line
            x1="12"
            y1="38"
            x2="60"
            y2="38"
            className="production-impresion-tiro-retiro-diagram__bridge-axis"
          />
          <circle
            cx="36"
            cy="38"
            r="2.75"
            className="production-impresion-tiro-retiro-diagram__bridge-axis-node"
          />
        </>
      )}
    </svg>
  )
}

const FlipBridge: React.FC<{ flipMode: FlipMode }> = ({ flipMode }) => {
  const isPinza = flipMode === 'volteo-pinza'
  const isEscuadra = flipMode === 'volteo-escuadra'
  const label =
    flipMode === 'volteo-pinza'
      ? diagramCopy.volteoPinzaLabel
      : flipMode === 'volteo-escuadra'
        ? diagramCopy.volteoEscuadraLabel
        : diagramCopy.sinVolteoLabel
  const rotationHint = isPinza
    ? diagramCopy.volteoPinzaRotationHint
    : isEscuadra
      ? diagramCopy.volteoEscuadraRotationHint
      : undefined

  return (
    <div
      className={clsx(
        'production-impresion-tiro-retiro-diagram__bridge',
        `production-impresion-tiro-retiro-diagram__bridge--${flipMode}`
      )}
      role={rotationHint ? 'img' : undefined}
      aria-label={rotationHint}
    >
      {isPinza ? (
        <div className="production-impresion-tiro-retiro-diagram__bridge-arrow-stack">
          <span
            className={clsx(
              'production-impresion-tiro-retiro-diagram__bridge-side-label',
              'production-impresion-tiro-retiro-diagram__bridge-side-label--tiro'
            )}
          >
            {diagramCopy.resultadoTiro}
          </span>
          <BridgeVolteoFigureSvg kind="pinza" />
          <span
            className={clsx(
              'production-impresion-tiro-retiro-diagram__bridge-side-label',
              'production-impresion-tiro-retiro-diagram__bridge-side-label--retiro'
            )}
          >
            {diagramCopy.resultadoRetiro}
          </span>
        </div>
      ) : null}
      {isEscuadra ? (
        <div className="production-impresion-tiro-retiro-diagram__bridge-arrow-row">
          <span
            className={clsx(
              'production-impresion-tiro-retiro-diagram__bridge-side-label',
              'production-impresion-tiro-retiro-diagram__bridge-side-label--tiro'
            )}
          >
            {diagramCopy.resultadoTiro}
          </span>
          <BridgeVolteoFigureSvg kind="escuadra" />
          <span
            className={clsx(
              'production-impresion-tiro-retiro-diagram__bridge-side-label',
              'production-impresion-tiro-retiro-diagram__bridge-side-label--retiro'
            )}
          >
            {diagramCopy.resultadoRetiro}
          </span>
        </div>
      ) : null}
      <span className="production-impresion-tiro-retiro-diagram__bridge-label">{label}</span>
    </div>
  )
}

const DiagramLegend: React.FC = () => (
  <div className="production-impresion-tiro-retiro-diagram__guide-legend">
    <span className="production-impresion-tiro-retiro-diagram__guide-legend-item">
      <span className="production-impresion-tiro-retiro-diagram__guide-legend-swatch production-impresion-tiro-retiro-diagram__guide-legend-swatch--escuadra" />
      {diagramCopy.legendEscuadra}
    </span>
    <span className="production-impresion-tiro-retiro-diagram__guide-legend-item">
      <span className="production-impresion-tiro-retiro-diagram__guide-legend-swatch production-impresion-tiro-retiro-diagram__guide-legend-swatch--pinza" />
      {diagramCopy.legendPinza}
    </span>
    <span className="production-impresion-tiro-retiro-diagram__guide-legend-item">
      <span className="production-impresion-tiro-retiro-diagram__guide-legend-swatch production-impresion-tiro-retiro-diagram__guide-legend-swatch--registro" />
      {diagramCopy.legendRegistro}
    </span>
  </div>
)

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
  showVolteoChips = true,
}) => {
  const titleId = useId()
  const tiroPatternId = useId().replace(/:/g, '')
  const retiroPatternId = useId().replace(/:/g, '')
  const resultadoPatternId = useId().replace(/:/g, '')
  const tiroDefsId = useId().replace(/:/g, '')
  const retiroDefsId = useId().replace(/:/g, '')
  const resultadoDefsId = useId().replace(/:/g, '')
  const totalTintas = useMemo(() => tiro.cantidad + retiro.cantidad, [tiro.cantidad, retiro.cantidad])

  const { conVolteo, flipMode } = resolveDiagramVolteo(
    showColorBasico,
    showPantone,
    tipoBifronteColorBasico,
    tipoBifrontePantone
  )
  const layouts = SHEET_LAYOUTS[flipMode]
  const tiroBars = useMemo(() => resolveLadoInkBars(tiro), [tiro])
  const retiroBars = useMemo(() => resolveLadoInkBars(retiro), [retiro])

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
              <PasadaColumn
                side="tiro"
                mechanics={layouts.tiro}
                bars={tiroBars}
                patternId={tiroPatternId}
                defsIdPrefix={tiroDefsId}
              />
              <FlipBridge flipMode={flipMode} />
              <PasadaColumn
                side="retiro"
                mechanics={layouts.retiro}
                bars={retiroBars}
                patternId={retiroPatternId}
                defsIdPrefix={retiroDefsId}
              />
              <ResultadoColumn
                tiroBars={tiroBars}
                retiroBars={retiroBars}
                patternId={resultadoPatternId}
                defsIdPrefix={resultadoDefsId}
                conVolteo={conVolteo}
                flipMode={flipMode}
              />
            </div>

            <DiagramLegend />

            {showVolteoChips && (showColorBasico || showPantone) ? (
              <figcaption className="production-impresion-tiro-retiro-diagram__legend">
                {showColorBasico ? (
                  <VolteoChip label={volteoCopy.badgeColorBasico} tipo={tipoBifronteColorBasico} />
                ) : null}
                {showPantone ? (
                  <VolteoChip label={volteoCopy.badgePantone} tipo={tipoBifrontePantone} />
                ) : null}
              </figcaption>
            ) : null}
          </figure>
        )}
      </div>
    </section>
  )
}

export default ImpresionTiroRetiroDiagram
