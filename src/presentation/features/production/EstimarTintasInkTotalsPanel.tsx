import React from 'react'
import clsx from 'clsx'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import {
  formatEstimarTintasWeightG,
  quantizeEstimarTintasInkTotalsBreakdown,
  resolvePedidoInkTotalsBreakdown,
  type EstimarTintasInkTotalsBreakdown,
  type EstimarTintasInkTotalsSnapshot,
} from './utils/estimarTintasUtils'

const totalsCopy = copy.muestra.results

interface EstimarTintasInkTotalsBreakdownViewProps {
  title: string
  breakdown: EstimarTintasInkTotalsBreakdown
  variant?: 'sample' | 'pedido'
  emptyHint?: string
}

const EstimarTintasInkTotalsBreakdownView: React.FC<EstimarTintasInkTotalsBreakdownViewProps> = ({
  title,
  breakdown,
  variant = 'sample',
  emptyHint,
}) => (
  <section
    className={clsx(
      'production-impresion-estimar-tintas-hud__total',
      variant === 'pedido' && 'production-impresion-estimar-tintas-hud__total--pedido'
    )}
    aria-label={title}
  >
    <h4 className="production-impresion-estimar-tintas-hud__total-label">{title}</h4>

    <dl className="production-impresion-estimar-tintas-hud__total-breakdown">
      <div className="production-impresion-estimar-tintas-hud__total-breakdown-row">
        <dt>{totalsCopy.processTotalLabel}</dt>
        <dd>{formatEstimarTintasWeightG(breakdown.processInkG)}</dd>
      </div>
      <div className="production-impresion-estimar-tintas-hud__total-breakdown-row">
        <dt>{totalsCopy.pantoneTotalLabel}</dt>
        <dd>{formatEstimarTintasWeightG(breakdown.pantoneInkG)}</dd>
      </div>
      <div className="production-impresion-estimar-tintas-hud__total-breakdown-row production-impresion-estimar-tintas-hud__total-breakdown-row--unified">
        <dt>{totalsCopy.unifiedTotalLabel}</dt>
        <dd>{formatEstimarTintasWeightG(breakdown.totalInkG)}</dd>
      </div>
    </dl>

    {emptyHint ? (
      <p className="production-impresion-estimar-tintas-hud__total-hint production-impresion-estimar-tintas-hud__total-hint--inline">
        {emptyHint}
      </p>
    ) : null}
  </section>
)

interface EstimarTintasInkTotalsPanelProps {
  totals: EstimarTintasInkTotalsSnapshot
  pedidoEmptyHint?: string
  totalPliegos?: number
}

const EstimarTintasInkTotalsPanel: React.FC<EstimarTintasInkTotalsPanelProps> = ({
  totals,
  pedidoEmptyHint,
  totalPliegos,
}) => {
  const rawPedido = resolvePedidoInkTotalsBreakdown(totals.perPliego, totalPliegos) ?? totals.pedido
  const pedidoBreakdown = rawPedido ? quantizeEstimarTintasInkTotalsBreakdown(rawPedido) : null

  return (
    <div className="production-impresion-estimar-tintas-hud__totals-row">
      <EstimarTintasInkTotalsBreakdownView
        title={totalsCopy.totalLabel}
        breakdown={totals.perPliego}
        variant="sample"
      />
      <EstimarTintasInkTotalsBreakdownView
        title={totalsCopy.totalPedidoLabel}
        breakdown={
          pedidoBreakdown ?? {
            processInkG: 0,
            pantoneInkG: 0,
            totalInkG: 0,
          }
        }
        variant="pedido"
        emptyHint={pedidoBreakdown ? undefined : pedidoEmptyHint}
      />
    </div>
  )
}

interface EstimarTintasInkTotalsCompactCellProps {
  breakdown: EstimarTintasInkTotalsBreakdown
}

export const EstimarTintasInkTotalsCompactCell: React.FC<EstimarTintasInkTotalsCompactCellProps> = ({
  breakdown,
}) => (
  <div className="production-impresion-tintas-total-cell">
    <div className="production-impresion-tintas-total-cell__row">
      <span className="production-impresion-tintas-total-cell__label">{totalsCopy.processShortLabel}</span>
      <span>{formatEstimarTintasWeightG(breakdown.processInkG)}</span>
    </div>
    <div className="production-impresion-tintas-total-cell__row">
      <span className="production-impresion-tintas-total-cell__label">{totalsCopy.pantoneShortLabel}</span>
      <span>{formatEstimarTintasWeightG(breakdown.pantoneInkG)}</span>
    </div>
    <div className="production-impresion-tintas-total-cell__row production-impresion-tintas-total-cell__row--unified">
      <span className="production-impresion-tintas-total-cell__label">{totalsCopy.unifiedShortLabel}</span>
      <strong>{formatEstimarTintasWeightG(breakdown.totalInkG)}</strong>
    </div>
  </div>
)

interface EstimarTintasInkTotalsValueCellProps {
  valueG: number
  variant?: 'default' | 'unified'
}

export const EstimarTintasInkTotalsValueCell: React.FC<EstimarTintasInkTotalsValueCellProps> = ({
  valueG,
  variant = 'default',
}) => (
  <span
    className={clsx(
      'production-impresion-estimar-tintas-total-value',
      variant === 'unified' && 'production-impresion-estimar-tintas-total-value--unified'
    )}
  >
    {formatEstimarTintasWeightG(valueG)}
  </span>
)

export default EstimarTintasInkTotalsPanel
