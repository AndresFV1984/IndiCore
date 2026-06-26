import {
  userHasPermission,
  type UserPermission,
} from '../auth/userPermissions.js'
import type { OrderSpecs } from '../entities/Order.js'
import {
  PHASE_PRODUCTION_STATUSES,
  PRODUCTION_ORDER_STATUSES,
  SUPERVISOR_ONLY_PRODUCTION_STATUSES,
  type ProductionOrderStatus,
} from '../value-objects/ProductionOrderStatus.js'

export type ProductionStatusPhaseId =
  | 'preprensa'
  | 'corte-papel'
  | 'impresion'
  | 'terminados'
  | 'acabados'

const PHASE_OPERATOR_ID_FIELD: Record<ProductionStatusPhaseId, keyof OrderSpecs> = {
  preprensa: 'operadorPreprensaId',
  'corte-papel': 'operadorCortePapelId',
  impresion: 'operadorImpresionId',
  terminados: 'operadorTerminadosId',
  acabados: 'operadorAcabadosId',
}

export type ProductionOrderStatusActor = {
  userId: string
  permissions: readonly string[]
}

export const PRODUCTION_STATUS_PHASE_MAP = {
  preprensa: 'En Proceso Preprensa',
  'corte-papel': 'En Proceso Corte de papel',
  impresion: 'En Proceso Impresion',
  terminados: 'En Proceso Terminados',
  acabados: 'En Proceso Acabados',
} as const satisfies Record<ProductionStatusPhaseId, ProductionOrderStatus>

export const PRODUCTION_PHASE_STATUS_PERMISSION: Record<
  ProductionStatusPhaseId,
  UserPermission
> = {
  preprensa: 'production.status.phase.preprensa',
  'corte-papel': 'production.status.phase.corte-papel',
  impresion: 'production.status.phase.impresion',
  terminados: 'production.status.phase.terminados',
  acabados: 'production.status.phase.acabados',
}

const productionStatusToPhase = (): Partial<
  Record<ProductionOrderStatus, ProductionStatusPhaseId>
> => {
  const map: Partial<Record<ProductionOrderStatus, ProductionStatusPhaseId>> = {}
  for (const [phase, status] of Object.entries(PRODUCTION_STATUS_PHASE_MAP)) {
    map[status as ProductionOrderStatus] = phase as ProductionStatusPhaseId
  }
  return map
}

export const PRODUCTION_STATUS_TO_PHASE = productionStatusToPhase()

export const userCanSuperviseProductionStatus = (
  permissions: readonly string[]
): boolean => userHasPermission(permissions, 'production.status.supervise')

export const userCanOperateProductionPhases = (
  permissions: readonly string[]
): boolean =>
  userHasPermission(permissions, 'production.status.phase') ||
  (Object.keys(PRODUCTION_PHASE_STATUS_PERMISSION) as ProductionStatusPhaseId[]).some(phase =>
    userHasPermission(permissions, PRODUCTION_PHASE_STATUS_PERMISSION[phase])
  )

export const getAssignedProductionPhases = (
  specs: OrderSpecs,
  userId: string
): ProductionStatusPhaseId[] =>
  (Object.keys(PRODUCTION_STATUS_PHASE_MAP) as ProductionStatusPhaseId[]).filter(phase => {
    const field = PHASE_OPERATOR_ID_FIELD[phase]
    return specs[field] === userId
  })

export const userHasPhaseStatusPermission = (
  permissions: readonly string[],
  phase: ProductionStatusPhaseId
): boolean =>
  userHasPermission(permissions, 'production.status.supervise') ||
  userHasPermission(permissions, 'production.status.phase') ||
  userHasPermission(permissions, PRODUCTION_PHASE_STATUS_PERMISSION[phase])

export const canSetProductionStatus = (
  permissions: readonly string[],
  targetStatus: ProductionOrderStatus,
  context: { userId: string; specs: OrderSpecs }
): boolean => {
  if (userCanSuperviseProductionStatus(permissions)) {
    return true
  }

  if ((SUPERVISOR_ONLY_PRODUCTION_STATUSES as readonly string[]).includes(targetStatus)) {
    return false
  }

  const phase = PRODUCTION_STATUS_TO_PHASE[targetStatus]
  if (!phase) {
    return false
  }

  if (!userHasPhaseStatusPermission(permissions, phase)) {
    return false
  }

  return getAssignedProductionPhases(context.specs, context.userId).includes(phase)
}

export const getAllowedProductionStatuses = (
  permissions: readonly string[],
  context: { userId: string; specs: OrderSpecs }
): ProductionOrderStatus[] =>
  PRODUCTION_ORDER_STATUSES.filter(status =>
    canSetProductionStatus(permissions, status, context)
  )

export const getProductionStatusForPhase = (
  phase: ProductionStatusPhaseId
): ProductionOrderStatus => PRODUCTION_STATUS_PHASE_MAP[phase]

export const isPhaseProductionStatus = (
  status: ProductionOrderStatus
): status is (typeof PHASE_PRODUCTION_STATUSES)[number] =>
  (PHASE_PRODUCTION_STATUSES as readonly string[]).includes(status)
