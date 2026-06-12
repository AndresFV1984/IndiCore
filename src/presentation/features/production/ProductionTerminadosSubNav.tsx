import React from 'react'
import { TERMINADOS_SUB_TABS, TerminadosSubTabId } from './productionTerminadosSubTabs'
import ProductionSubNav from './ProductionSubNav'

interface ProductionTerminadosSubNavProps {
  active: TerminadosSubTabId
  onChange: (id: TerminadosSubTabId) => void
}

const ProductionTerminadosSubNav: React.FC<ProductionTerminadosSubNavProps> = ({
  active,
  onChange,
}) => (
  <ProductionSubNav
    tabs={TERMINADOS_SUB_TABS}
    active={active}
    onChange={onChange}
    ariaLabel="Terminados"
    idPrefix="production-terminados"
  />
)

export default ProductionTerminadosSubNav
