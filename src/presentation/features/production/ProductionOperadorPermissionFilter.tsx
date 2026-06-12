import React from 'react'
import type { UserPermission } from '../../../core/domain/entities/User'
import {
  getProductionPhasePermissionOptions,
  type ProductionAssignmentPhaseId,
} from './utils/productionOperatorAssignment'

interface ProductionOperadorPermissionFilterProps {
  phaseId: ProductionAssignmentPhaseId
  selected: UserPermission[]
  onChange: (permissions: UserPermission[]) => void
  onRestorePhaseDefaults: () => void
}

const ProductionOperadorPermissionFilter: React.FC<ProductionOperadorPermissionFilterProps> = ({
  phaseId,
  selected,
  onChange,
  onRestorePhaseDefaults,
}) => {
  const options = getProductionPhasePermissionOptions(phaseId)
  const selectedSet = new Set(selected)

  const toggle = (permission: UserPermission) => {
    onChange(
      selectedSet.has(permission)
        ? selected.filter(item => item !== permission)
        : [...selected, permission]
    )
  }

  return (
    <div className="production-operador-permission-filter">
      <div className="production-operador-permission-filter__chips">
        {options.map(option => (
          <label key={option.id} className="production-operador-permission-filter__chip">
            <input
              type="checkbox"
              checked={selectedSet.has(option.id)}
              onChange={() => toggle(option.id)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        className="production-operador-permission-filter__restore"
        onClick={onRestorePhaseDefaults}
      >
        Restaurar permisos sugeridos
      </button>
    </div>
  )
}

export default ProductionOperadorPermissionFilter
