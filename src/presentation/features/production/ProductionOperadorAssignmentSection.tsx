import React from 'react'
import { User, type UserPermission, type UserRole } from '../../../core/domain/entities/User'
import ProductionOperadorPicker from './ProductionOperadorPicker'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import type { ProductionWorkspaceTone } from './constants/productionWorkspaceColors'
import type { ProductionAssignmentPhaseId } from './utils/productionOperatorAssignment'

interface ProductionOperadorAssignmentSectionProps {
  users: User[]
  phaseId: ProductionAssignmentPhaseId
  selectedId: string
  roleFilter: UserRole
  permissionFilters: UserPermission[]
  onSelect: (userId: string) => void
  onRoleFilterChange: (role: UserRole) => void
  onPermissionFiltersChange: (permissions: UserPermission[]) => void
  etapa: string
  tone?: ProductionWorkspaceTone
  inputId?: string
}

const ProductionOperadorAssignmentSection: React.FC<ProductionOperadorAssignmentSectionProps> = ({
  users,
  phaseId,
  selectedId,
  roleFilter,
  permissionFilters,
  onSelect,
  onRoleFilterChange,
  etapa,
  tone = 0,
  inputId,
}) => (
  <ProductionWorkspaceSection
    tag="Responsable"
    title={`Responsable de ${etapa}`}
    subtitle="Filtre por rol y seleccione el usuario asignado a esta etapa."
    tone={tone}
    className={[
      'production-operador-assignment',
      'production-detalle-op__section',
      'production-detalle-op__section--vendedor',
      selectedId ? 'production-detalle-op__section--vendedor-filled' : '',
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <ProductionOperadorPicker
      users={users}
      phaseId={phaseId}
      roleFilter={roleFilter}
      permissionFilters={permissionFilters}
      onRoleFilterChange={onRoleFilterChange}
      selectedId={selectedId}
      onSelect={user => onSelect(user?.id ?? '')}
      inputId={inputId}
    />
  </ProductionWorkspaceSection>
)

export default ProductionOperadorAssignmentSection
