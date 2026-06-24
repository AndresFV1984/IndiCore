import React, { useMemo } from 'react'
import ProductionOrdenResumenSection from './ProductionOrdenResumenSection'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import {
  buildEstimarTintasCobroResumen,
  type EstimarTintasTableRow,
} from './utils/estimarTintasRegistrosUtils'
import { formatEstimarTintasWeightG } from './utils/estimarTintasUtils'

const resumenCopy = copy.muestra.resumen

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
    {
      key: 'pedido-process',
      label: resumenCopy.totalPedidoProcess,
      value: formatValor(resumen.totalPedidoProcess),
      inactive: resumen.totalPedidoProcess <= 0,
    },
    {
      key: 'pedido-pantone',
      label: resumenCopy.totalPedidoPantone,
      value: formatValor(resumen.totalPedidoPantone),
      inactive: resumen.totalPedidoPantone <= 0,
    },
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
