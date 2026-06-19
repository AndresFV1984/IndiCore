import React from 'react'
import { COBRO_SUB_TABS, CobroSubTabId } from './productionCobroSubTabs'
import ProductionSubNav from './ProductionSubNav'

interface ProductionCobroSubNavProps {
  active: CobroSubTabId
  onChange: (id: CobroSubTabId) => void
}

const ProductionCobroSubNav: React.FC<ProductionCobroSubNavProps> = ({ active, onChange }) => (
  <ProductionSubNav
    tabs={COBRO_SUB_TABS}
    active={active}
    onChange={onChange}
    ariaLabel="Cobro"
    idPrefix="production-cobro"
  />
)

export default ProductionCobroSubNav
