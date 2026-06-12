import {
  USER_ROLES,
  DEFAULT_USER_ROLE,
  USER_PERMISSION_CATALOG,
  type UserRole,
  type UserPermission,
  getPermissionLabel,
  getPermissionsForRole,
} from '../../core/domain/auth/userPermissions'

export type { UserRole, UserPermission }

export { DEFAULT_USER_ROLE, USER_PERMISSION_CATALOG, getPermissionLabel, getPermissionsForRole }

export const USER_ROLE_OPTIONS = USER_ROLES.map(role => ({
  value: role,
  label: role,
}))

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  Administrador: 'Administrador',
  Supervisor: 'Supervisor',
  Operador: 'Operador',
}
