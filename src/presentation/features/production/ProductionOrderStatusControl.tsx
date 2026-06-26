import React, { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import type { ProductionOrderStatus } from '@/core/domain/value-objects/ProductionOrderStatus'
import {
  PHASE_PRODUCTION_STATUSES,
  SUPERVISOR_ONLY_PRODUCTION_STATUSES,
} from '@/core/domain/value-objects/ProductionOrderStatus'
import {
  getAllowedProductionStatuses,
  userCanSuperviseProductionStatus,
} from '@/core/domain/policies/productionOrderStatusPolicy'
import type { OrderSpecs } from '@/core/domain/entities/Order'
import ProductionOrderStatusBadge from '@/presentation/components/ui/ProductionOrderStatusBadge'
import {
  PRODUCTION_ORDER_STATUS_CLASS,
  PRODUCTION_ORDER_STATUS_LABEL,
} from '@/presentation/constants/productionOrderStatusStyles'
import { confirmAction, notifyError, notifySuccess } from '@/presentation/utils/actionFeedback'

interface ProductionOrderStatusControlProps {
  status: ProductionOrderStatus
  specs: OrderSpecs
  permissions: readonly string[]
  userId: string
  disabled?: boolean
  editable?: boolean
  pendingCreation?: boolean
  onChange: (status: ProductionOrderStatus) => Promise<void>
  onSaved?: () => void
}

const ProductionOrderStatusControl: React.FC<ProductionOrderStatusControlProps> = ({
  status,
  specs,
  permissions,
  userId,
  disabled = false,
  editable = true,
  pendingCreation = false,
  onChange,
  onSaved,
}) => {
  const [draftStatus, setDraftStatus] = useState(status)
  const [saving, setSaving] = useState(false)
  const canSupervise = userCanSuperviseProductionStatus(permissions)
  const canEdit = editable && canSupervise && !pendingCreation
  const hasPendingChanges = draftStatus !== status
  const previewStatus = canEdit && hasPendingChanges ? draftStatus : status
  const previewStatusClass = PRODUCTION_ORDER_STATUS_CLASS[previewStatus]

  useEffect(() => {
    setDraftStatus(status)
  }, [status])

  const allowedStatuses = useMemo(
    () =>
      getAllowedProductionStatuses(permissions, {
        userId,
        specs,
      }),
    [permissions, userId, specs]
  )

  const allowedGeneral = useMemo(
    () => SUPERVISOR_ONLY_PRODUCTION_STATUSES.filter(option => allowedStatuses.includes(option)),
    [allowedStatuses]
  )

  const allowedPhases = useMemo(
    () => PHASE_PRODUCTION_STATUSES.filter(option => allowedStatuses.includes(option)),
    [allowedStatuses]
  )

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDraftStatus(event.target.value as ProductionOrderStatus)
  }

  const handleSave = async () => {
    if (!hasPendingChanges || saving || disabled) return

    const confirmed = await confirmAction(
      `¿Cambiar el estado de producción de «${PRODUCTION_ORDER_STATUS_LABEL[status]}» a «${PRODUCTION_ORDER_STATUS_LABEL[draftStatus]}»?`,
      {
        title: 'Cambiar estado de producción',
        confirmLabel: 'Guardar',
        variant: draftStatus === 'Cancelada' ? 'danger' : undefined,
      }
    )
    if (!confirmed) return

    setSaving(true)
    try {
      await onChange(draftStatus)
      notifySuccess(`Estado actualizado a ${PRODUCTION_ORDER_STATUS_LABEL[draftStatus]}.`)
      onSaved?.()
    } catch {
      setDraftStatus(status)
      notifyError('No se pudo actualizar el estado de producción.')
    } finally {
      setSaving(false)
    }
  }

  const renderOption = (option: ProductionOrderStatus) => (
    <option key={option} value={option}>
      {PRODUCTION_ORDER_STATUS_LABEL[option]}
    </option>
  )

  return (
    <div
      className={clsx('production-flow-status', {
        'production-flow-status--pending': pendingCreation,
        'production-flow-status--readonly': !canEdit,
        'production-flow-status--dirty': hasPendingChanges,
        'production-flow-status--saving': saving,
      })}
      aria-label="Estado de producción"
    >
      <div className="production-flow-status__toolbar">
        <div className="production-flow-status__head-copy">
          <span className="production-flow-status__eyebrow">Estado en planta</span>
          {pendingCreation ? (
            <p className="production-flow-status__hint">
              Al guardar la orden quedará en <strong>Pendiente</strong>. Podrá cambiar el estado
              después.
            </p>
          ) : canEdit && hasPendingChanges ? (
            <p className="production-flow-status__hint production-flow-status__hint--dirty" role="status">
              Cambio pendiente: de {PRODUCTION_ORDER_STATUS_LABEL[status]} a{' '}
              {PRODUCTION_ORDER_STATUS_LABEL[draftStatus]}. Confirme con Guardar.
            </p>
          ) : canEdit ? (
            <p className="production-flow-status__hint">
              Seleccione el nuevo estado y guarde los cambios.
            </p>
          ) : (
            <p className="production-flow-status__hint">Estado actual de la orden en producción.</p>
          )}
        </div>

        <div className="production-flow-status__control">
          {canEdit && allowedStatuses.length > 0 ? (
            <div className="production-flow-status__editor">
              <label
                className={clsx('production-flow-status__select-shell', previewStatusClass)}
                title={PRODUCTION_ORDER_STATUS_LABEL[previewStatus]}
              >
                <span className="sr-only">Estado de producción</span>
                <select
                  className="production-flow-status__select"
                  value={draftStatus}
                  onChange={handleSelectChange}
                  disabled={disabled || saving}
                  aria-label="Estado de producción"
                >
                  {allowedGeneral.length > 0 && (
                    <optgroup label="Control general">
                      {allowedGeneral.map(renderOption)}
                    </optgroup>
                  )}
                  {allowedPhases.length > 0 && (
                    <optgroup label="Por etapa">{allowedPhases.map(renderOption)}</optgroup>
                  )}
                </select>
              </label>

              <button
                type="button"
                className="production-btn-secondary production-flow-status__save"
                onClick={() => void handleSave()}
                disabled={disabled || saving || !hasPendingChanges}
                aria-disabled={disabled || saving || !hasPendingChanges}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          ) : (
            <div className="production-flow-status__current">
              {!pendingCreation &&
                status !== 'Finalizada' &&
                status !== 'Pendiente' &&
                status !== 'Cancelada' && (
                  <span className="production-flow-status__pulse" aria-hidden />
                )}
              <ProductionOrderStatusBadge status={status} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductionOrderStatusControl
