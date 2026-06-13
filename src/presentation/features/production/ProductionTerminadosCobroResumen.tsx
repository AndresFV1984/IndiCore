import React, { useMemo } from 'react'
import clsx from 'clsx'
import type { TerminadosProduccionRegistro } from '../../../core/domain/entities/Order'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import TerminadosCobroFormulaDetails from './TerminadosCobroFormulaDetails'
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

  return (
    <ProductionWorkspaceSection
      className="production-terminados-cobro-resumen"
      tag={resumenCopy.tag}
      title={resumenCopy.title}
      tone={6}
    >
      <ul className="production-terminados-cobro-resumen__rows">
        {resumen.lineas.map(linea => (
          <li
            key={linea.corteRowKey}
            className={clsx(
              'production-terminados-cobro-resumen__row',
              linea.corteRowKey === activeCorteRowKey &&
                'production-terminados-cobro-resumen__row--active'
            )}
          >
            <span className="production-terminados-cobro-resumen__row-label" title={linea.planchaLabel}>
              {linea.planchaLabel}
            </span>
            <strong className="production-terminados-cobro-resumen__row-value">
              {formatTerminadoPrecioCop(linea.totalCobro)}
            </strong>
          </li>
        ))}
      </ul>

      <footer className="production-terminados-cobro-resumen__total" aria-live="polite">
        <div className="production-terminados-cobro-resumen__total-info">
          <span className="production-terminados-cobro-resumen__total-label">
            {resumenCopy.totalLabel}
          </span>
          <span className="production-terminados-cobro-resumen__total-hint">
            {resumenCopy.totalHint}
          </span>
          <TerminadosCobroFormulaDetails
            formulaCopy={copy.asignacion.asignados.formula}
            className="production-terminados-cobro-resumen__formula"
            showTotalStep
          />
        </div>
        <strong className="production-terminados-cobro-resumen__total-value">
          {formatTerminadoPrecioCop(resumen.totalCobro)}
        </strong>
      </footer>
    </ProductionWorkspaceSection>
  )
}

export default ProductionTerminadosCobroResumen
