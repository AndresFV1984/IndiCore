import React, { useMemo } from 'react'
import ProductionOrdenResumenSection from './ProductionOrdenResumenSection'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import {
  buildEstimarTintasCobroResumen,
  type EstimarTintasTableRow,
} from './utils/estimarTintasRegistrosUtils'
import { CMYK_CHANNELS, formatEstimarTintasWeightG } from './utils/estimarTintasUtils'

const resumenCopy = copy.muestra.resumen
const channelLabels: Record<(typeof CMYK_CHANNELS)[number], string> = {
  c: resumenCopy.valorCian,
  m: resumenCopy.valorMagenta,
  y: resumenCopy.valorAmarillo,
  k: resumenCopy.valorNegro,
}

const formatValor = (value: number) =>
  value > 0 ? formatEstimarTintasWeightG(value) : resumenCopy.empty

interface ProductionImpresionEstimarTintasResumenProps {
  rows: EstimarTintasTableRow[]
  coloresPlanchasCount: number
  className?: string
}

const ProductionImpresionEstimarTintasResumen: React.FC<
  ProductionImpresionEstimarTintasResumenProps
> = ({ rows, coloresPlanchasCount, className }) => {
  const resumen = useMemo(() => buildEstimarTintasCobroResumen(rows), [rows])

  if (resumen.registrosCount === 0) return null

  const filas = [
    ...CMYK_CHANNELS.map(channel => ({
      key: channel,
      label: channelLabels[channel],
      value: formatValor(resumen.pedidoPorCanal[channel]),
      inactive: resumen.pedidoPorCanal[channel] <= 0,
    })),
    ...(resumen.registrosCount === 1
      ? [
          {
            key: 'estimado-pliego',
            label: resumenCopy.totalEstimadoPliego,
            value: formatValor(resumen.totalEstimadoPliego),
            inactive: resumen.totalEstimadoPliego <= 0,
          },
        ]
      : []),
  ]

  return (
    <ProductionOrdenResumenSection
      className={className}
      subtitle={resumenCopy.subtitle(resumen.registrosCount, coloresPlanchasCount)}
      rows={filas}
      totalLabel={resumenCopy.total}
      totalValue={formatValor(resumen.totalPedido)}
      totalHint={resumenCopy.totalHint}
    />
  )
}

export default ProductionImpresionEstimarTintasResumen
