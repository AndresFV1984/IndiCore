import { describe, expect, it } from 'vitest'
import { ROUTES } from '../../../config/appRoutes'
import { getPermissionsForRole } from './userPermissions'
import {
  isOperatorAllowedPath,
  isOperatorOnlySession,
  resolveDefaultRouteForSession,
  shouldRedirectOperatorHome,
} from './authRouting'

describe('authRouting', () => {
  it('envía operadores a Mi trabajo tras login', () => {
    const permissions = getPermissionsForRole('Operador')
    expect(
      resolveDefaultRouteForSession({
        userId: 'user-andres',
        role: 'Operador',
        permissions,
      })
    ).toBe(ROUTES.operatorWork.path)
  })

  it('envía administradores al dashboard', () => {
    const permissions = getPermissionsForRole('Administrador')
    expect(
      resolveDefaultRouteForSession({
        userId: 'user-bayron',
        role: 'Administrador',
        permissions: getPermissionsForRole('Administrador'),
      })
    ).toBe(ROUTES.dashboard.path)
  })

  it('redirige operador desde rutas fuera de Mi trabajo', () => {
    const session = {
      userId: 'user-andres',
      role: 'Operador' as const,
      permissions: getPermissionsForRole('Operador'),
    }
    expect(shouldRedirectOperatorHome(session, ROUTES.production.path)).toBe(true)
    expect(shouldRedirectOperatorHome(session, ROUTES.operatorWork.path)).toBe(false)
    expect(isOperatorAllowedPath(ROUTES.operatorWork.path)).toBe(true)
    expect(isOperatorAllowedPath(`${ROUTES.operatorWork.path}/PO-001`)).toBe(true)
    expect(isOperatorOnlySession(session)).toBe(true)
  })
})
