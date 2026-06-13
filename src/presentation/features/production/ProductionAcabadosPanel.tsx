import React from 'react'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import { ACABADOS_COPY as copy } from './constants/acabadosCopy'

const asignacionCopy = copy.asignacion

const ProductionAcabadosPanel: React.FC = () => (
  <div className="production-acabados-panel">
    <p className="production-workspace-panel-desc">{asignacionCopy.desc}</p>

    <ProductionWorkspaceSection
      tag={asignacionCopy.section.tag}
      title={asignacionCopy.section.title}
      tone={0}
    >
      <p className="production-empty-hint">{asignacionCopy.section.empty}</p>
    </ProductionWorkspaceSection>
  </div>
)

export default ProductionAcabadosPanel
