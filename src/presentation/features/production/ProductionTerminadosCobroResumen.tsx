import React, { useMemo } from 'react'
import clsx from 'clsx'
import type { TerminadosProduccionRegistro } from '../../../core/domain/entities/Order'
import ProductionOrdenResumenSection from './ProductionOrdenResumenSection'
import { TERMINADOS_COPY as copy } from './constants/terminadosCopy'
import {
  buildTerminadosCobroResumen,
  type TerminadosCorteContext,
} from './utils/terminadosUtils'
import { formatTerminadoPrecioCop } from './utils/terminadoPricingUtils'

const resumenCopy = copy.asignacion.resumen

interface ProductionTerminadosCobroResumenProps {
  contexts: TerminadosCorteContext[]
  registros: TerminadosProduccionRegistro[]
  activeCorteRowKey: string
}

const ProductionTerminadosCobroResumen: React.FC<ProductionTerminadosCobroResumenProps> = ({
  contexts,
  registros,
  activeCorteRowKey,
}) => {
  const resumen = useMemo(
    () => buildTerminadosCobroResumen(contexts, registros),
    [contexts, registros]
  )

  if (resumen.lineas.length === 0) return null

  const filas = resumen.lineas.map(linea => ({
    key: linea.corteRowKey,
    label: resumenCopy.valorPlancha(linea.planchaLabel),
    value: formatTerminadoPrecioCop(linea.totalCobro),
    inactive: linea.totalCobro <= 0,
    className: clsx(
      linea.corteRowKey === activeCorteRowKey &&
        'production-terminados-cobro-resumen__row--active'
    ),
    valueTitle: linea.planchaLabel,
  }))

  return (
    <ProductionOrdenResumenSection
      className="production-terminados-cobro-resumen"
      rows={filas}
      totalLabel={resumenCopy.total}
      totalValue={formatTerminadoPrecioCop(resumen.totalCobro)}
      totalHint={resumenCopy.totalHint}
    />
  )
}

export default ProductionTerminadosCobroResumen
