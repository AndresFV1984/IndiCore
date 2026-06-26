import type { UserPermission, UserRole } from '../../domain/auth/userPermissions.js'

export interface AuthSession {
  userId: string
  role: UserRole
  permissions: UserPermission[]
}

export interface IAuthUseCases {
  getSession(): Promise<AuthSession>
}
