import {
  normalizeUserPermissions,
  normalizeUserRole,
} from '../../core/domain/auth/userPermissions.js'
import type {
  AuthSession,
  AuthSignInInput,
  AuthSignInResult,
  IAuthUseCases,
} from '../../core/ports/in/IAuthUseCases.js'
import type { IUserRepository } from '../../core/ports/out/IUserRepository.js'
import { verifyPassword } from '../../presentation/utils/passwordHash.js'
import {
  clearPersistedAuthUserId,
  persistAuthUserId,
  readPersistedAuthUserId,
} from './authSessionStorage.js'

export class InMemoryAuthUseCases implements IAuthUseCases {
  constructor(private readonly userRepository: IUserRepository) {}

  async getSession(): Promise<AuthSession | null> {
    const userId = readPersistedAuthUserId()
    if (!userId) return null
    return this.buildSessionForUserId(userId)
  }

  async signIn(input: AuthSignInInput): Promise<AuthSignInResult> {
    const email = input.email.trim()
    const password = input.password
    if (!email || !password) {
      return { ok: false, error: 'invalid_credentials' }
    }

    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      return { ok: false, error: 'invalid_credentials' }
    }

    if (!user.state) {
      return { ok: false, error: 'inactive_user' }
    }

    const passwordMatches = await verifyPassword(password, user.password_hash)
    if (!passwordMatches) {
      return { ok: false, error: 'invalid_credentials' }
    }

    persistAuthUserId(user.id)
    const session = await this.buildSessionForUserId(user.id)
    if (!session) {
      return { ok: false, error: 'invalid_credentials' }
    }

    return { ok: true, session }
  }

  async signOut(): Promise<void> {
    clearPersistedAuthUserId()
  }

  private async buildSessionForUserId(userId: string): Promise<AuthSession | null> {
    const user = await this.userRepository.findById(userId)
    if (!user || !user.state) {
      clearPersistedAuthUserId()
      return null
    }

    const role = normalizeUserRole(user.role)
    const permissions = normalizeUserPermissions(user.permissions, role)

    return {
      userId: user.id,
      role,
      permissions,
    }
  }
}

export type { AuthSession }
