import type { UserPermission, UserRole } from '../../domain/auth/userPermissions.js'

export interface AuthSession {
  userId: string
  role: UserRole
  permissions: UserPermission[]
}

export interface AuthSignInInput {
  email: string
  password: string
}

export type AuthSignInError = 'invalid_credentials' | 'inactive_user'

export type AuthSignInResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: AuthSignInError }

export interface IAuthUseCases {
  getSession(): Promise<AuthSession | null>
  signIn(input: AuthSignInInput): Promise<AuthSignInResult>
  signOut(): Promise<void>
}
