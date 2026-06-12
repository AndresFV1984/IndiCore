export const USER_ROLES = ['Administrador', 'Supervisor', 'Operador'] as const

export type UserRole = (typeof USER_ROLES)[number]

export const USER_PERMISSION_CATALOG = [
  { id: 'dashboard.view', label: 'Ver dashboard e inicio' },
  { id: 'production.view', label: 'Ver órdenes de producción' },
  { id: 'production.edit', label: 'Crear y editar órdenes de producción' },
  { id: 'orders.view', label: 'Ver pedidos' },
  { id: 'orders.edit', label: 'Gestionar pedidos' },
  { id: 'remissions.view', label: 'Ver remisiones' },
  { id: 'remissions.edit', label: 'Gestionar remisiones' },
  { id: 'clients.view', label: 'Ver clientes' },
  { id: 'clients.edit', label: 'Gestionar clientes' },
  { id: 'users.view', label: 'Ver usuarios del sistema' },
  { id: 'users.edit', label: 'Administrar usuarios y roles' },
  { id: 'vendedores.view', label: 'Ver vendedores' },
  { id: 'vendedores.edit', label: 'Gestionar vendedores' },
  { id: 'catalog.view', label: 'Ver catálogos' },
  { id: 'catalog.edit', label: 'Administrar catálogos' },
  { id: 'reports.view', label: 'Ver reportes' },
  { id: 'settings.edit', label: 'Configuración del sistema' },
] as const

export type UserPermission = (typeof USER_PERMISSION_CATALOG)[number]['id']

export const DEFAULT_USER_ROLE: UserRole = 'Operador'

const ALL_PERMISSIONS = USER_PERMISSION_CATALOG.map(p => p.id)

export const ROLE_PERMISSIONS: Record<UserRole, readonly UserPermission[]> = {
  Administrador: ALL_PERMISSIONS,
  Supervisor: [
    'dashboard.view',
    'production.view',
    'production.edit',
    'orders.view',
    'orders.edit',
    'remissions.view',
    'remissions.edit',
    'clients.view',
    'vendedores.view',
    'catalog.view',
    'reports.view',
  ],
  Operador: ['production.view', 'production.edit'],
}

export const isValidUserRole = (value: string): value is UserRole =>
  (USER_ROLES as readonly string[]).includes(value)

export const normalizeUserRole = (value?: string): UserRole =>
  value && isValidUserRole(value) ? value : DEFAULT_USER_ROLE

export const getPermissionsForRole = (role: UserRole): UserPermission[] => [
  ...ROLE_PERMISSIONS[role],
]

export const isValidUserPermission = (value: string): value is UserPermission =>
  (ALL_PERMISSIONS as readonly string[]).includes(value)

export const normalizeUserPermissions = (
  permissions: UserPermission[] | undefined,
  role?: UserRole
): UserPermission[] => {
  if (permissions?.length) {
    return [...new Set(permissions.filter(isValidUserPermission))]
  }
  return getPermissionsForRole(normalizeUserRole(role))
}

export const userHasPermission = (
  permissions: readonly UserPermission[],
  permission: UserPermission
): boolean => permissions.includes(permission)

export const getPermissionLabel = (permission: UserPermission): string =>
  USER_PERMISSION_CATALOG.find(item => item.id === permission)?.label ?? permission

const PERMISSION_MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  production: 'Producción',
  orders: 'Pedidos',
  remissions: 'Remisiones',
  clients: 'Clientes',
  users: 'Usuarios',
  vendedores: 'Vendedores',
  catalog: 'Catálogos',
  reports: 'Reportes',
  settings: 'Configuración',
}

const PERMISSION_ACTION_LABELS: Record<string, string> = {
  view: 'Ver',
  edit: 'Gestionar',
}

export interface UserPermissionGroup {
  module: string
  moduleLabel: string
  actions: string[]
  permissions: UserPermission[]
}

export const hasFullUserPermissions = (permissions: readonly UserPermission[]): boolean =>
  ALL_PERMISSIONS.every(permission => permissions.includes(permission))

export const groupUserPermissions = (
  permissions: readonly UserPermission[]
): UserPermissionGroup[] => {
  const groups = new Map<string, UserPermissionGroup>()

  for (const permission of permissions) {
    const [module = permission, action = ''] = permission.split('.')
    const existing = groups.get(module)
    const actionLabel = PERMISSION_ACTION_LABELS[action] ?? action

    if (existing) {
      if (!existing.actions.includes(actionLabel)) {
        existing.actions.push(actionLabel)
      }
      existing.permissions.push(permission)
      continue
    }

    groups.set(module, {
      module,
      moduleLabel: PERMISSION_MODULE_LABELS[module] ?? module,
      actions: actionLabel ? [actionLabel] : [],
      permissions: [permission],
    })
  }

  return [...groups.values()].sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel, 'es'))
}
