import React, { useMemo } from 'react'
import clsx from 'clsx'
import type { AcabadosProduccionRegistro } from '../../../core/domain/entities/Order'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
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

  return (
    <ProductionWorkspaceSection
      className="production-acabados-cobro-resumen"
      tag={resumenCopy.tag}
      title={resumenCopy.title}
      tone={6}
    >
      <ul className="production-acabados-cobro-resumen__rows">
        {resumen.lineas.map(linea => (
          <li
            key={linea.corteRowKey}
            className={clsx(
              'production-acabados-cobro-resumen__row',
              linea.corteRowKey === activeCorteRowKey &&
                'production-acabados-cobro-resumen__row--active'
            )}
          >
            <span className="production-acabados-cobro-resumen__row-label" title={linea.planchaLabel}>
              {linea.planchaLabel}
            </span>
            <strong className="production-acabados-cobro-resumen__row-value">
              {formatTerminadoPrecioCop(linea.totalCobro)}
            </strong>
          </li>
        ))}
      </ul>

      <footer className="production-acabados-cobro-resumen__total" aria-live="polite">
        <div className="production-acabados-cobro-resumen__total-info">
          <span className="production-acabados-cobro-resumen__total-label">
            {resumenCopy.totalLabel}
          </span>
          <span className="production-acabados-cobro-resumen__total-hint">
            {resumenCopy.totalHint}
          </span>
        </div>
        <strong className="production-acabados-cobro-resumen__total-value">
          {formatTerminadoPrecioCop(resumen.totalCobro)}
        </strong>
      </footer>
    </ProductionWorkspaceSection>
  )
}

export default ProductionAcabadosCobroResumen
