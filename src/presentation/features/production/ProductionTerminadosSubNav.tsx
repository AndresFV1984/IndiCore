import React from 'react'
import { getTerminadosSubTabs, TerminadosSubTabId } from './productionTerminadosSubTabs'
import ProductionSubNav from './ProductionSubNav'

interface ProductionTerminadosSubNavProps {
  active: TerminadosSubTabId
  onChange: (id: TerminadosSubTabId) => void
  isNewOrder?: boolean
}

const ProductionTerminadosSubNav: React.FC<ProductionTerminadosSubNavProps> = ({
  active,
  onChange,
  isNewOrder = false,
}) => (
  <ProductionSubNav
    tabs={getTerminadosSubTabs(isNewOrder)}
    active={active}
    onChange={onChange}
    ariaLabel="Terminados"
    idPrefix="production-terminados"
  />
)

export default ProductionTerminadosSubNav
