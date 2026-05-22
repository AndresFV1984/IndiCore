import React from 'react'
import { PREPRENSA_SUB_TABS, PreprensaSubTabId } from './productionPreprensaSubTabs'
import ProductionSubNav from './ProductionSubNav'
const ProductionPreprensaSubNav: React.FC<{ active: PreprensaSubTabId; onChange: (id: PreprensaSubTabId) => void }> = ({ active, onChange }) => (
  <ProductionSubNav tabs={PREPRENSA_SUB_TABS} active={active} onChange={onChange} ariaLabel="Preprensa" idPrefix="production-preprensa" />
)
export default ProductionPreprensaSubNav
