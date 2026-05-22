import React from 'react'
import { SPECS_SUB_TABS, SpecsSubTabId } from './productionSpecsSubTabs'
import ProductionSubNav from './ProductionSubNav'

interface ProductionSpecsSubNavProps {
  active: SpecsSubTabId
  onChange: (id: SpecsSubTabId) => void
}

const ProductionSpecsSubNav: React.FC<ProductionSpecsSubNavProps> = ({ active, onChange }) => (
  <ProductionSubNav
    tabs={SPECS_SUB_TABS}
    active={active}
    onChange={onChange}
    ariaLabel="Cliente y detalle OP"
    idPrefix="production-specs"
  />
)

export default ProductionSpecsSubNav
