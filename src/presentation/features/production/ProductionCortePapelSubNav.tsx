import React from 'react'
import { CORTE_PAPEL_SUB_TABS, CortePapelSubTabId } from './productionCortePapelSubTabs'
import ProductionSubNav from './ProductionSubNav'

interface ProductionCortePapelSubNavProps {
  active: CortePapelSubTabId
  onChange: (id: CortePapelSubTabId) => void
}

const ProductionCortePapelSubNav: React.FC<ProductionCortePapelSubNavProps> = ({
  active,
  onChange,
}) => (
  <ProductionSubNav
    tabs={CORTE_PAPEL_SUB_TABS}
    active={active}
    onChange={onChange}
    ariaLabel="Corte de papel"
    idPrefix="production-corte-papel"
  />
)

export default ProductionCortePapelSubNav
