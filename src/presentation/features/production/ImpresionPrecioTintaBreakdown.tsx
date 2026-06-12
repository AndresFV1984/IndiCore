import React from 'react'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { formatMillaresFactor } from './utils/impresionPrecioTintaUtils'
import type { ImpresionPrecioTintaBreakdown } from './utils/impresionPrecioTintaUtils'
import { formatPrecioMillar } from './utils/impresionVolteoTarifaUtils'

const entradasCopy = copy.tintas.entradas

interface ImpresionPrecioTintaBreakdownProps {
  breakdown: ImpresionPrecioTintaBreakdown
  compact?: boolean
}

const formatPrecioTinta = (value: number) =>
  value > 0 ? formatPrecioMillar(value) : entradasCopy.millaresEmpty

const MillaresGrupoRow: React.FC<{
  grupoLabel: string
  millares: number
  precio: number
}> = ({ grupoLabel, millares, precio }) => (
  <div className="production-impresion-millares-grupo">
    <span className="production-impresion-millares-grupo__title">{grupoLabel}</span>
    <div className="production-impresion-precio-tinta-breakdown__row">
      <span className="production-impresion-precio-tinta-breakdown__label">
        {entradasCopy.millaresValueLabel}
      </span>
      <span className="production-impresion-precio-tinta-breakdown__value">
        {formatMillaresFactor(millares)}
      </span>
    </div>
    <div className="production-impresion-precio-tinta-breakdown__row">
      <span className="production-impresion-precio-tinta-breakdown__label">
        {entradasCopy.millaresPrecioTintaLabel}
      </span>
      <span className="production-impresion-precio-tinta-breakdown__value">
        {formatPrecioTinta(precio)}
      </span>
    </div>
  </div>
)

const ImpresionPrecioTintaBreakdownDisplay: React.FC<ImpresionPrecioTintaBreakdownProps> = ({
  breakdown,
  compact = false,
}) => {
  const hasAny = breakdown.total > 0 || breakdown.volteo > 0

  if (!hasAny) {
    return (
      <span className="production-impresion-precio-tinta-breakdown__empty">
        {entradasCopy.millaresEmpty}
      </span>
    )
  }

  return (
    <div
      className={[
        'production-impresion-precio-tinta-breakdown',
        compact ? 'production-impresion-precio-tinta-breakdown--compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <MillaresGrupoRow
        grupoLabel={`${entradasCopy.millaresColorBasicoLabel} (${entradasCopy.tintasCountLabel(breakdown.cantidadTintasColorBasico)})`}
        millares={breakdown.millaresColorBasico}
        precio={breakdown.colorBasico}
      />
      <MillaresGrupoRow
        grupoLabel={`${entradasCopy.millaresPantoneLabel} (${entradasCopy.tintasCountLabel(breakdown.cantidadTintasPantone)})`}
        millares={breakdown.millaresPantone}
        precio={breakdown.pantone}
      />
      {breakdown.volteoColorBasico > 0 ? (
        <MillaresGrupoRow
          grupoLabel={copy.tintas.tintasVolteo.volteoColorBasicoLabel}
          millares={breakdown.millaresVolteoColorBasico}
          precio={breakdown.volteoColorBasico}
        />
      ) : null}
      {breakdown.volteoPantone > 0 ? (
        <MillaresGrupoRow
          grupoLabel={copy.tintas.tintasVolteo.volteoPantoneLabel}
          millares={breakdown.millaresVolteoPantone}
          precio={breakdown.volteoPantone}
        />
      ) : null}
    </div>
  )
}

export default ImpresionPrecioTintaBreakdownDisplay
