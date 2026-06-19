import React, { useMemo } from 'react'
import clsx from 'clsx'
import type { AcabadosProduccionRegistro } from '../../../core/domain/entities/Order'
import ProductionOrdenResumenSection from './ProductionOrdenResumenSection'
import { ACABADOS_COPY as copy } from './constants/acabadosCopy'
import {
  buildAcabadosCobroResumen,
  type AcabadosCorteContext,
} from './utils/acabadosUtils'
import { formatTerminadoPrecioCop } from './utils/terminadoPricingUtils'

const resumenCopy = copy.asignacion.resumen

interface ProductionAcabadosCobroResumenProps {
  contexts: AcabadosCorteContext[]
  registros: AcabadosProduccionRegistro[]
  activeCorteRowKey: string
}

const ProductionAcabadosCobroResumen: React.FC<ProductionAcabadosCobroResumenProps> = ({
  contexts,
  registros,
  activeCorteRowKey,
}) => {
  const resumen = useMemo(
    () => buildAcabadosCobroResumen(contexts, registros),
    [contexts, registros]
  )

  if (resumen.lineas.length === 0) return null

  const filas = resumen.lineas.map(linea => ({
    key: linea.corteRowKey,
    label: resumenCopy.valorPlancha(linea.planchaLabel),
    value: formatTerminadoPrecioCop(linea.totalCobro),
    inactive: linea.totalCobro <= 0,
    className: clsx(
      linea.corteRowKey === activeCorteRowKey && 'production-acabados-cobro-resumen__row--active'
    ),
    valueTitle: linea.planchaLabel,
  }))

  return (
    <ProductionOrdenResumenSection
      className="production-acabados-cobro-resumen"
      rows={filas}
      totalLabel={resumenCopy.total}
      totalValue={formatTerminadoPrecioCop(resumen.totalCobro)}
      totalHint={resumenCopy.totalHint}
    />
  )
}

export default ProductionAcabadosCobroResumen
