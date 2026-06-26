import React, { useMemo, useState } from 'react'
import type { OrderSpecs } from '@/core/domain/entities/Order'
import {
  canSetProductionStatus,
  getProductionStatusForPhase,
  userCanSuperviseProductionStatus,
  type ProductionStatusPhaseId,
} from '@/core/domain/policies/productionOrderStatusPolicy'
import type { ProductionOrderStatus } from '@/core/domain/value-objects/ProductionOrderStatus'
import { PRODUCTION_PHASE_LABELS } from './utils/productionOperatorAssignment'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'

interface ProductionPhaseStatusActionProps {
  phase: ProductionStatusPhaseId
  currentStatus: ProductionOrderStatus
  specs: OrderSpecs
  permissions: readonly string[]
  userId: string
  disabled?: boolean
  onChange: (status: ProductionOrderStatus) => Promise<void>
}

const ProductionPhaseStatusAction: React.FC<ProductionPhaseStatusActionProps> = ({
  phase,
  currentStatus,
  specs,
  permissions,
  userId,
  disabled = false,
  onChange,
}) => {
  const [saving, setSaving] = useState(false)
  const targetStatus = getProductionStatusForPhase(phase)
  const phaseLabel = PRODUCTION_PHASE_LABELS[phase]

  const canChange = useMemo(
    () =>
      !userCanSuperviseProductionStatus(permissions) &&
      canSetProductionStatus(permissions, targetStatus, {
        userId,
        specs,
      }),
    [permissions, targetStatus, userId, specs]
  )

  if (!canChange) {
    return null
  }

  const isActive = currentStatus === targetStatus

  const handleClick = async () => {
    if (isActive || saving) return
    setSaving(true)
    try {
      await onChange(targetStatus)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProductionWorkspaceSection
      tag="Estado"
      title={`Estado de ${phaseLabel}`}
      subtitle={
        isActive
          ? `La orden está marcada como ${targetStatus}.`
          : `Marque la orden como ${targetStatus} cuando inicie esta etapa.`
      }
      tone={1}
      className="production-phase-status-action"
    >
      <button
        type="button"
        className={[
          'production-btn-secondary',
          isActive ? 'production-phase-status-action__btn--active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={handleClick}
        disabled={disabled || saving || isActive}
      >
        {isActive ? `${targetStatus} (activo)` : `Marcar ${targetStatus}`}
      </button>
    </ProductionWorkspaceSection>
  )
}

export default ProductionPhaseStatusAction
