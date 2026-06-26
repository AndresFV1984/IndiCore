import { ROUTES } from '../../../config/appRoutes.js'
import type { AuthSession } from '../../ports/in/IAuthUseCases.js'
import { userHasPermission } from './userPermissions.js'

/** Sesión de operador de planta: solo navega por Mi trabajo. */
export function isOperatorOnlySession(session: AuthSession): boolean {
  return session.role === 'Operador'
}

export function isOperatorAllowedPath(pathname: string): boolean {
  return (
    pathname === ROUTES.operatorWork.path ||
    pathname.startsWith(`${ROUTES.operatorWork.path}/`)
  )
}

/** Ruta de inicio según rol y permisos tras autenticarse. */
export function resolveDefaultRouteForSession(session: AuthSession): string {
  if (
    isOperatorOnlySession(session) &&
    userHasPermission(session.permissions, 'production.operator.workspace')
  ) {
    return ROUTES.operatorWork.path
  }

  if (userHasPermission(session.permissions, 'dashboard.view')) {
    return ROUTES.dashboard.path
  }

  if (userHasPermission(session.permissions, 'production.operator.workspace')) {
    return ROUTES.operatorWork.path
  }

  if (userHasPermission(session.permissions, 'production.view')) {
    return ROUTES.production.path
  }

  return ROUTES.home.path
}

/** Operadores aterrizan en Mi trabajo al abrir inicio o dashboard. */
export function shouldRedirectOperatorHome(session: AuthSession, pathname: string): boolean {
  if (!isOperatorOnlySession(session)) return false
  if (!userHasPermission(session.permissions, 'production.operator.workspace')) return false
  return (
    pathname === ROUTES.home.path ||
    pathname === ROUTES.dashboard.path ||
    !isOperatorAllowedPath(pathname)
  )
}
