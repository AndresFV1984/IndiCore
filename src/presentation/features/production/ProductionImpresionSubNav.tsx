import React from 'react'
import { IMPRESION_SUB_TABS, ImpresionSubTabId } from './productionImpresionSubTabs'
import ProductionSubNav from './ProductionSubNav'

interface ProductionImpresionSubNavProps {
  active: ImpresionSubTabId
  onChange: (id: ImpresionSubTabId) => void
}

const ProductionImpresionSubNav: React.FC<ProductionImpresionSubNavProps> = ({
  active,
  onChange,
}) => (
  <ProductionSubNav
    tabs={IMPRESION_SUB_TABS}
    active={active}
    onChange={onChange}
    ariaLabel="Impresión"
    idPrefix="production-impresion"
  />
)

export default ProductionImpresionSubNav
