import React from 'react'
import { displayCatalogUnitCost, CATALOG_COSTO_MINIMO_LABEL } from './catalogRecord'

interface CatalogRecordCostProps {
  cost?: string
  variant: 'orange' | 'purple'
}

const CatalogRecordCost: React.FC<CatalogRecordCostProps> = ({ cost, variant }) => {
  const display = displayCatalogUnitCost(cost)

  return (
    <div className={`catalog-card-cost catalog-card-cost--${variant}`}>
      <span className="catalog-card-cost__label">{CATALOG_COSTO_MINIMO_LABEL}</span>
      <span className="catalog-card-cost__value">{display}</span>
    </div>
  )
}

export default CatalogRecordCost
