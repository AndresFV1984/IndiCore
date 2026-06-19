import {
  DEFAULT_USER_ROLE,
  USER_PERMISSION_CATALOG,
  getPermissionLabel,
  isValidUserPermission,
  userHasPermission,
  type UserPermission,
  type UserRole,
} from '../../../../core/domain/auth/userPermissions'
import type { User } from '../../../../core/domain/entities/User'

import type { OrderSpecs } from '../../../../core/domain/entities/Order'

export type ProductionAssignmentPhaseId =
  | 'preprensa'
  | 'corte-papel'
  | 'impresion'
  | 'terminados'
  | 'acabados'
  | 'cobro'

export const PRODUCTION_PHASE_LABELS: Record<ProductionAssignmentPhaseId, string> = {
  preprensa: 'Preprensa',
  'corte-papel': 'Corte de papel',
  impresion: 'Impresión',
  terminados: 'Terminados',
  acabados: 'Acabados',
  cobro: 'Cobro',
}

/** Permisos sugeridos para filtrar usuarios en cada etapa de producción. */
export const PRODUCTION_PHASE_REQUIRED_PERMISSIONS: Record<
  ProductionAssignmentPhaseId,
  readonly UserPermission[]
> = {
  preprensa: ['production.edit'],
  'corte-papel': ['production.edit'],
  impresion: ['production.edit'],
  terminados: ['production.edit'],
  acabados: ['production.edit'],
  cobro: ['production.edit'],
}

export const getDefaultPhasePermissionFilters = (
  phase: ProductionAssignmentPhaseId
): UserPermission[] => [...PRODUCTION_PHASE_REQUIRED_PERMISSIONS[phase]]

const LEGACY_TERMINADOS_ACABADOS_PERMISSION_FILTERS: UserPermission[] = [
  'production.view',
  'catalog.view',
]

const isLegacyTerminadosAcabadosPermissionFilters = (
  phase: ProductionAssignmentPhaseId,
  filters: readonly UserPermission[]
): boolean =>
  (phase === 'terminados' || phase === 'acabados') &&
  filters.length === LEGACY_TERMINADOS_ACABADOS_PERMISSION_FILTERS.length &&
  LEGACY_TERMINADOS_ACABADOS_PERMISSION_FILTERS.every(permission => filters.includes(permission))

export const normalizeOperadorPermissionFilters = (
  phase: ProductionAssignmentPhaseId,
  filters?: UserPermission[]
): UserPermission[] => {
  if (filters?.length) {
    const normalized = [...new Set(filters.filter(isValidUserPermission))]
    if (isLegacyTerminadosAcabadosPermissionFilters(phase, normalized)) {
      return getDefaultPhasePermissionFilters(phase)
    }
    return normalized
  }
  return getDefaultPhasePermissionFilters(phase)
}

export const userMeetsPermissionFilters = (
  user: User,
  permissionFilters: readonly UserPermission[]
): boolean =>
  permissionFilters.length === 0 ||
  permissionFilters.every(permission => userHasPermission(user.permissions, permission))

export const userMeetsPhasePermissions = (
  user: User,
  phase: ProductionAssignmentPhaseId
): boolean => userMeetsPermissionFilters(user, PRODUCTION_PHASE_REQUIRED_PERMISSIONS[phase])

export const canAssignUserToProductionPhase = (
  user: User,
  phase: ProductionAssignmentPhaseId,
  roleFilter: UserRole,
  permissionFilters: readonly UserPermission[]
): boolean => {
  const filters = permissionFilters.length
    ? permissionFilters
    : getDefaultPhasePermissionFilters(phase)
  return user.state && user.role === roleFilter && userMeetsPermissionFilters(user, filters)
}

export const filterUsersForProductionPhase = (
  users: User[],
  phase: ProductionAssignmentPhaseId,
  roleFilter: UserRole,
  permissionFilters: readonly UserPermission[]
): User[] =>
  users.filter(user => canAssignUserToProductionPhase(user, phase, roleFilter, permissionFilters))

export const getProductionPhasePermissionSummary = (
  phase: ProductionAssignmentPhaseId
): string =>
  PRODUCTION_PHASE_REQUIRED_PERMISSIONS[phase].map(getPermissionLabel).join(' · ')

export const getProductionPhasePermissionOptions = (phase: ProductionAssignmentPhaseId) => {
  const suggested = new Set<UserPermission>(PRODUCTION_PHASE_REQUIRED_PERMISSIONS[phase])
  const suggestedOptions = USER_PERMISSION_CATALOG.filter(item => suggested.has(item.id))
  const otherOptions = USER_PERMISSION_CATALOG.filter(item => !suggested.has(item.id))
  return [...suggestedOptions, ...otherOptions]
}

export const resolveOperadorRoleFilter = (role?: UserRole): UserRole => role ?? DEFAULT_USER_ROLE

export const OPERADOR_ASSIGNMENT_FIELDS = {
  preprensa: {
    id: 'operadorPreprensaId',
    rol: 'operadorPreprensaRol',
    permisos: 'operadorPreprensaPermisos',
  },
  'corte-papel': {
    id: 'operadorCortePapelId',
    rol: 'operadorCortePapelRol',
    permisos: 'operadorCortePapelPermisos',
  },
  impresion: {
    id: 'operadorImpresionId',
    rol: 'operadorImpresionRol',
    permisos: 'operadorImpresionPermisos',
  },
  terminados: {
    id: 'operadorTerminadosId',
    rol: 'operadorTerminadosRol',
    permisos: 'operadorTerminadosPermisos',
  },
  acabados: {
    id: 'operadorAcabadosId',
    rol: 'operadorAcabadosRol',
    permisos: 'operadorAcabadosPermisos',
  },
  cobro: {
    id: 'operadorCobroId',
    rol: 'operadorCobroRol',
    permisos: 'operadorCobroPermisos',
  },
} as const satisfies Record<
  ProductionAssignmentPhaseId,
  { id: keyof OrderSpecs; rol: keyof OrderSpecs; permisos: keyof OrderSpecs }
>

export { getPermissionLabel }
