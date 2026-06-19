import React, { useMemo } from 'react'
import type { ImpresionTintasRegistro } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import ProductionOrdenResumenSection from './ProductionOrdenResumenSection'
import ImpresionVolteoEstadoBadge from './ImpresionVolteoEstadoBadge'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { buildImpresionTintasResumenConsolidado } from './utils/impresionPrecioTintaUtils'
import { formatPrecioMillar } from './utils/impresionVolteoTarifaUtils'

const resumenCopy = copy.tintas.resumen

const formatValor = (value: number) =>
  value > 0 ? formatPrecioMillar(value) : resumenCopy.empty

interface ProductionImpresionTintasResumenProps {
  coloresPlanchas: DisenoColorPlanchaItem[]
  registros: ImpresionTintasRegistro[]
}

const ProductionImpresionTintasResumen: React.FC<ProductionImpresionTintasResumenProps> = ({
  coloresPlanchas,
  registros,
}) => {
  const resumen = useMemo(
    () => buildImpresionTintasResumenConsolidado(coloresPlanchas, registros),
    [coloresPlanchas, registros]
  )

  if (resumen.registros.length === 0) return null

  const filas = [
    {
      key: 'colorBasico',
      label: resumenCopy.valorColorBasico,
      labelExtra: resumen.totales.volteoColorBasico ? (
        <ImpresionVolteoEstadoBadge estado={resumen.totales.volteoColorBasico} />
      ) : null,
      value: formatValor(resumen.totales.precioTintaColorBasico),
      inactive: resumen.totales.precioTintaColorBasico <= 0,
    },
    {
      key: 'pantone',
      label: resumenCopy.valorPantone,
      labelExtra: resumen.totales.volteoPantone ? (
        <ImpresionVolteoEstadoBadge estado={resumen.totales.volteoPantone} />
      ) : null,
      value: formatValor(resumen.totales.precioTintaPantone),
      inactive: resumen.totales.precioTintaPantone <= 0,
    },
  ]

  const totalTintas =
    resumen.totales.precioTintaColorBasico + resumen.totales.precioTintaPantone

  return (
    <ProductionOrdenResumenSection
      rows={filas}
      totalLabel={resumenCopy.total}
      totalValue={formatValor(totalTintas)}
    />
  )
}

export default ProductionImpresionTintasResumen
