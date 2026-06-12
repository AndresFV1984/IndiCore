import React from 'react'
import { ACABADOS_SUB_TABS, AcabadosSubTabId } from './productionAcabadosSubTabs'
import ProductionSubNav from './ProductionSubNav'

interface ProductionAcabadosSubNavProps {
  active: AcabadosSubTabId
  onChange: (id: AcabadosSubTabId) => void
}

const ProductionAcabadosSubNav: React.FC<ProductionAcabadosSubNavProps> = ({
  active,
  onChange,
}) => (
  <ProductionSubNav
    tabs={ACABADOS_SUB_TABS}
    active={active}
    onChange={onChange}
    ariaLabel="Acabados"
    idPrefix="production-acabados"
  />
)

export default ProductionAcabadosSubNav
