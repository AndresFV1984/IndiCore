import React, { useId } from 'react'
import clsx from 'clsx'
import type { TarifaMillar } from '../../../core/domain/entities/TarifaMillar'
import { TARIFA_MILLAR_UNIDAD } from '../../../core/domain/entities/TarifaMillar'
import {
  formatMillaresFactor,
  resolveImpresionTarifaMillarPricing,
} from './utils/impresionPrecioTintaUtils'
import { formatPrecioMillar, formatUnidadMillar } from './utils/impresionVolteoTarifaUtils'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'

const volteoCopy = copy.tintas.tintasVolteo

export type ImpresionTarifaMetricsTone = 'pantone' | 'volteo' | 'colorBasico'

export interface ImpresionTarifaMetricsLabels {
  precio: string
  precioInicial?: string
  topeMinimoMillar: string
  millarMinimoVenta: string
  umbralDecimalMillar: string
  unidadMedida?: string
  precioEmpty: string
  precioInicialEmpty?: string
  topeMinimoMillarEmpty: string
  millarMinimoVentaEmpty: string
  umbralDecimalMillarEmpty: string
  unidadMedidaEmpty?: string
  precioMillarHint: string
  precioMillarNoTarifa: string
}

interface ImpresionTarifaMetricsStripProps {
  tone: ImpresionTarifaMetricsTone
  labels: ImpresionTarifaMetricsLabels
  tarifa?: TarifaMillar | null
  precioMillar?: number
  precioInicialMillar?: number
  showPrecioInicial?: boolean
  millarMinimoVenta?: number
  topeMinimoMillar?: number
  umbralDecimalMillar?: number
  unidadMedida?: number
  showUnidad?: boolean
  tarifasMillarLoading?: boolean
  precioEditable?: boolean
  onPrecioMillarChange?: (value: number) => void
  precioInicialEditable?: boolean
  onPrecioInicialChange?: (value: number) => void
}

const ImpresionTarifaMetricsStrip: React.FC<ImpresionTarifaMetricsStripProps> = ({
  tone,
  labels,
  tarifa = null,
  precioMillar = 0,
  precioInicialMillar = 0,
  showPrecioInicial = false,
  millarMinimoVenta,
  topeMinimoMillar,
  umbralDecimalMillar,
  unidadMedida,
  showUnidad = false,
  tarifasMillarLoading = false,
  precioEditable = false,
  onPrecioMillarChange,
  precioInicialEditable = false,
  onPrecioInicialChange,
}) => {
  const precioInputId = useId()
  const precioInicialInputId = useId()
  const pricing = resolveImpresionTarifaMillarPricing(
    precioMillar > 0 ? precioMillar : (tarifa?.precio ?? 0),
    millarMinimoVenta ?? tarifa?.millarMinimoVenta,
    topeMinimoMillar ?? tarifa?.topeMinimoMillar,
    umbralDecimalMillar ?? tarifa?.umbralDecimalMillar
  )

  const precioInicialValue =
    precioInicialMillar > 0 ? precioInicialMillar : (tarifa?.precio ?? 0)
  const precioInicialDisplay =
    precioInicialValue > 0 ? formatPrecioMillar(precioInicialValue) : null
  const precioDisplay = pricing.precio > 0 ? formatPrecioMillar(pricing.precio) : null
  const topeDisplay = pricing ? formatMillaresFactor(pricing.topeMinimoMillar) : null
  const millarMinDisplay = pricing ? formatMillaresFactor(pricing.millarMinimoVenta) : null
  const umbralDisplay = pricing ? formatMillaresFactor(pricing.umbralDecimalMillar) : null
  const unidadDisplay = showUnidad
    ? tarifa
      ? formatUnidadMillar(tarifa.unidadMedida)
      : unidadMedida != null && unidadMedida > 0
        ? formatUnidadMillar(unidadMedida)
        : precioMillar > 0
          ? formatUnidadMillar(TARIFA_MILLAR_UNIDAD)
          : null
    : null

  const sinTarifa = !tarifasMillarLoading && !precioDisplay && !precioEditable

  const ruleMetrics = [
    ...(showUnidad
      ? [
          {
            key: 'unidad',
            label: labels.unidadMedida ?? 'Unidad millar',
            value: tarifasMillarLoading
              ? '…'
              : unidadDisplay ?? labels.unidadMedidaEmpty ?? '—',
          },
        ]
      : []),
    {
      key: 'tope',
      label: labels.topeMinimoMillar,
      value: tarifasMillarLoading ? '…' : topeDisplay ?? labels.topeMinimoMillarEmpty,
    },
    {
      key: 'millarMin',
      label: labels.millarMinimoVenta,
      value: tarifasMillarLoading ? '…' : millarMinDisplay ?? labels.millarMinimoVentaEmpty,
    },
    {
      key: 'umbral',
      label: labels.umbralDecimalMillar,
      value: tarifasMillarLoading ? '…' : umbralDisplay ?? labels.umbralDecimalMillarEmpty,
    },
  ]

  const renderPrecioField = (
    key: 'precio' | 'precioInicial',
    label: string,
    value: number,
    display: string | null,
    emptyLabel: string,
    editable: boolean,
    onChange?: (value: number) => void,
    inputId?: string
  ) => (
    <div key={key} className="production-impresion-tarifa-strip__precio-field">
      <label className="production-impresion-tarifa-strip__label" htmlFor={editable ? inputId : undefined}>
        {label}
      </label>
      {editable && onChange && inputId ? (
        <input
          id={inputId}
          type="number"
          min={0}
          step={1}
          className={clsx(
            'production-form-input',
            'production-impresion-tarifa-strip__input'
          )}
          value={value > 0 ? value : ''}
          onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))}
          disabled={tarifasMillarLoading}
        />
      ) : (
        <span
          className={clsx(
            'production-impresion-tarifa-strip__value',
            sinTarifa && 'production-impresion-tarifa-strip__value--empty'
          )}
        >
          {tarifasMillarLoading ? '…' : display ?? emptyLabel}
        </span>
      )}
    </div>
  )

  return (
    <div
      className={clsx(
        'production-impresion-tarifa-strip',
        `production-impresion-tarifa-strip--${tone}`,
        sinTarifa && 'production-impresion-tarifa-strip--empty'
      )}
    >
      <div className="production-impresion-tarifa-strip__precios">
        {showPrecioInicial && labels.precioInicial
          ? renderPrecioField(
              'precioInicial',
              labels.precioInicial,
              precioInicialMillar,
              precioInicialDisplay,
              labels.precioInicialEmpty ?? labels.precioEmpty,
              precioInicialEditable && Boolean(onPrecioInicialChange),
              onPrecioInicialChange,
              precioInicialInputId
            )
          : null}
        {renderPrecioField(
          'precio',
          labels.precio,
          precioMillar,
          precioDisplay,
          labels.precioEmpty,
          precioEditable && Boolean(onPrecioMillarChange),
          onPrecioMillarChange,
          precioInputId
        )}
      </div>

      <details className="production-impresion-tarifa-strip__rules">
        <summary>{volteoCopy.reglasTarifaSummary}</summary>
        <dl className="production-impresion-tarifa-strip__rules-grid">
          {ruleMetrics.map(metric => (
            <div key={metric.key} className="production-impresion-tarifa-strip__rule">
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      </details>

      {sinTarifa ? (
        <p className="production-impresion-tarifa-strip__aviso">{labels.precioMillarNoTarifa}</p>
      ) : null}
    </div>
  )
}

export default ImpresionTarifaMetricsStrip
