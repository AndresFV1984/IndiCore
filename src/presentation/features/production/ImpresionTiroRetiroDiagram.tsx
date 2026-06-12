import React, { useMemo } from 'react'
import clsx from 'clsx'
import type { ImpresionLadoTintas, ImpresionTipoBifronte } from '../../../core/domain/entities/Order'
import { ColoresSwatchIcon } from './DisenoColoresPicker'
import {
  DISENO_INK_PALETTE,
  isDisenoInkPantoneMix,
} from './constants/preprensaDisenoColors'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { isImpresionConVolteo } from './constants/impresionTipoBifronte'
import {
  isValidImpresionTintaIndex,
  normalizeImpresionInkIndex,
} from './utils/impresionTintasUtils'

const diagramCopy = copy.tintas.diagram
const ladoCopy = copy.tintas.lado
const volteoCopy = copy.tintas.tintasVolteo

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

const LIGHT_BAR_SWATCHES = new Set(['#ffd400'])

const resolveLadoInkBars = (lado: ImpresionLadoTintas): InkBar[] =>
  lado.tintas.slice(0, lado.cantidad).flatMap(inkIndex => {
    const normalized = normalizeImpresionInkIndex(inkIndex)
    if (!isValidImpresionTintaIndex(normalized)) return []
    const ink = DISENO_INK_PALETTE[normalized]
    return ink ? [{ name: ink.name, swatch: ink.swatch }] : []
  })

const resolveVolteoBadge = (tipo: ImpresionTipoBifronte | ''): string => {
  if (!isImpresionConVolteo(tipo)) return volteoCopy.volteoStatusSin
  if (tipo === 'volteo-escuadra') {
    return `${volteoCopy.volteoStatusCon} · ${volteoCopy.volteoEscuadraShort}`
  }
  return `${volteoCopy.volteoStatusCon} · ${volteoCopy.volteoPinzaShort}`
}

const resolveFlipSubtype = (
  conVolteoColorBasico: boolean,
  conVolteoPantone: boolean,
  tipoBifronteColorBasico: ImpresionTipoBifronte | '',
  tipoBifrontePantone: ImpresionTipoBifronte | ''
): 'pinza' | 'escuadra' => {
  const tipos: ImpresionTipoBifronte[] = []
  if (conVolteoColorBasico && isImpresionConVolteo(tipoBifronteColorBasico)) {
    tipos.push(tipoBifronteColorBasico)
  }
  if (conVolteoPantone && isImpresionConVolteo(tipoBifrontePantone)) {
    tipos.push(tipoBifrontePantone)
  }
  if (tipos.length > 0 && tipos.every(tipo => tipo === 'volteo-escuadra')) {
    return 'escuadra'
  }
  return 'pinza'
}

const InkSheet: React.FC<{ bars: InkBar[]; emptyLabel: string }> = ({ bars, emptyLabel }) => {
  if (bars.length === 0) {
    return (
      <div className="production-impresion-tiro-retiro-diagram__print production-impresion-tiro-retiro-diagram__print--empty">
        <span>{emptyLabel}</span>
      </div>
    )
  }

  return (
    <div className="production-impresion-tiro-retiro-diagram__print">
      {bars.map((bar, index) => (
        <div
          key={`${bar.name}-${index}`}
          className={clsx(
            'production-impresion-tiro-retiro-diagram__stripe',
            isDisenoInkPantoneMix(bar.swatch) &&
              'production-impresion-tiro-retiro-diagram__stripe--pantone',
            LIGHT_BAR_SWATCHES.has(bar.swatch.toLowerCase()) &&
              'production-impresion-tiro-retiro-diagram__stripe--light'
          )}
          style={
            isDisenoInkPantoneMix(bar.swatch) ? undefined : { backgroundColor: bar.swatch }
          }
          title={bar.name}
        >
          <span className="production-impresion-tiro-retiro-diagram__stripe-meta">
            <ColoresSwatchIcon swatch={bar.swatch} name={bar.name} size="xs" />
            <span className="production-impresion-tiro-retiro-diagram__stripe-name">{bar.name}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

const PaperCard: React.FC<{
  side: 'tiro' | 'retiro'
  bars: InkBar[]
  face?: 'front' | 'back'
}> = ({ side, bars, face = 'front' }) => {
  const label = side === 'tiro' ? ladoCopy.tiro : ladoCopy.retiro

  return (
    <div
      className={clsx(
        'production-impresion-tiro-retiro-diagram__paper',
        `production-impresion-tiro-retiro-diagram__paper--${side}`,
        face === 'back' && 'production-impresion-tiro-retiro-diagram__paper--back'
      )}
    >
      <div className="production-impresion-tiro-retiro-diagram__paper-tab">
        <span>{label}</span>
        {face === 'back' ? (
          <span className="production-impresion-tiro-retiro-diagram__paper-face">{diagramCopy.backFace}</span>
        ) : null}
      </div>
      <InkSheet bars={bars} emptyLabel={copy.tintas.entradas.ladoSinTintas} />
    </div>
  )
}

const FlipBridge: React.FC<{ subtype: 'pinza' | 'escuadra' }> = ({ subtype }) => (
  <div
    className={clsx(
      'production-impresion-tiro-retiro-diagram__bridge',
      `production-impresion-tiro-retiro-diagram__bridge--${subtype}`
    )}
    aria-hidden
  >
    {subtype === 'pinza' ? (
      <>
        <span className="production-impresion-tiro-retiro-diagram__grip production-impresion-tiro-retiro-diagram__grip--top" />
        <div className="production-impresion-tiro-retiro-diagram__bridge-core">
          <svg viewBox="0 0 48 24" fill="none" className="production-impresion-tiro-retiro-diagram__arc">
            <path
              d="M6 18 C18 6, 30 6, 42 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M38 15l4 3-4 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{volteoCopy.volteoPinzaShort}</span>
        </div>
        <span className="production-impresion-tiro-retiro-diagram__grip production-impresion-tiro-retiro-diagram__grip--bottom" />
      </>
    ) : (
      <div className="production-impresion-tiro-retiro-diagram__bridge-core">
        <span className="production-impresion-tiro-retiro-diagram__grip production-impresion-tiro-retiro-diagram__grip--side" />
        <svg viewBox="0 0 48 24" fill="none" className="production-impresion-tiro-retiro-diagram__arc">
          <path
            d="M6 18 C18 6, 30 6, 42 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M38 15l4 3-4 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{volteoCopy.volteoEscuadraShort}</span>
      </div>
    )}
  </div>
)

const SeparateBridge: React.FC = () => (
  <div className="production-impresion-tiro-retiro-diagram__separate" aria-hidden>
    <svg viewBox="0 0 24 24" fill="none" className="production-impresion-tiro-retiro-diagram__separate-icon">
      <path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span>{diagramCopy.separateSheets}</span>
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
}) => {
  const tiroBars = useMemo(() => resolveLadoInkBars(tiro), [tiro])
  const retiroBars = useMemo(() => resolveLadoInkBars(retiro), [retiro])
  const totalTintas = tiro.cantidad + retiro.cantidad

  const conVolteoColorBasico = showColorBasico && isImpresionConVolteo(tipoBifronteColorBasico)
  const conVolteoPantone = showPantone && isImpresionConVolteo(tipoBifrontePantone)
  const conVolteoActivo = conVolteoColorBasico || conVolteoPantone
  const flipSubtype = resolveFlipSubtype(
    conVolteoColorBasico,
    conVolteoPantone,
    tipoBifronteColorBasico,
    tipoBifrontePantone
  )

  if (totalTintas <= 0) {
    return (
      <div className="production-impresion-tiro-retiro-diagram production-impresion-tiro-retiro-diagram--empty">
        <p className="production-impresion-tiro-retiro-diagram__empty">{diagramCopy.empty}</p>
      </div>
    )
  }

  return (
    <figure className="production-impresion-tiro-retiro-diagram" aria-label={diagramCopy.title}>
      <figcaption className="production-impresion-tiro-retiro-diagram__caption">
        <span className="production-impresion-tiro-retiro-diagram__title">{diagramCopy.title}</span>
        <span
          className={clsx(
            'production-impresion-tiro-retiro-diagram__modo',
            conVolteoActivo
              ? 'production-impresion-tiro-retiro-diagram__modo--con'
              : 'production-impresion-tiro-retiro-diagram__modo--sin'
          )}
        >
          {conVolteoActivo ? volteoCopy.volteoStatusCon : volteoCopy.volteoStatusSin}
        </span>
      </figcaption>

      <div
        className={clsx(
          'production-impresion-tiro-retiro-diagram__stage',
          conVolteoActivo
            ? 'production-impresion-tiro-retiro-diagram__stage--volteo'
            : 'production-impresion-tiro-retiro-diagram__stage--sin-volteo'
        )}
      >
        {conVolteoActivo ? (
          <>
            <PaperCard side="tiro" bars={tiroBars} face="front" />
            <FlipBridge subtype={flipSubtype} />
            <PaperCard side="retiro" bars={retiroBars} face="back" />
          </>
        ) : (
          <>
            <PaperCard side="tiro" bars={tiroBars} />
            <SeparateBridge />
            <PaperCard side="retiro" bars={retiroBars} />
          </>
        )}
      </div>

      {(showColorBasico || showPantone) && (
        <div className="production-impresion-tiro-retiro-diagram__legend">
          {showColorBasico ? (
            <VolteoChip label={volteoCopy.badgeColorBasico} tipo={tipoBifronteColorBasico} />
          ) : null}
          {showPantone ? (
            <VolteoChip label={volteoCopy.badgePantone} tipo={tipoBifrontePantone} />
          ) : null}
        </div>
      )}
    </figure>
  )
}

export default ImpresionTiroRetiroDiagram
