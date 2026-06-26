import {
  normalizeUserPermissions,
  normalizeUserRole,
  type UserPermission,
  type UserRole,
} from '../../core/domain/auth/userPermissions.js'
import type { AuthSession, IAuthUseCases } from '../../core/ports/in/IAuthUseCases.js'
import type { IUserRepository } from '../../core/ports/out/IUserRepository.js'

/** Usuario demo hasta conectar login real con el backend. */
export const DEMO_AUTH_USER_ID = 'user-3'

export class InMemoryAuthUseCases implements IAuthUseCases {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionUserId: string = DEMO_AUTH_USER_ID
  ) {}

  async getSession(): Promise<AuthSession> {
    const user = await this.userRepository.findById(this.sessionUserId)
    if (!user) {
      return this.fallbackSession()
    }

    const role = normalizeUserRole(user.role)
    const permissions = normalizeUserPermissions(user.permissions, role)

    return {
      userId: user.id,
      role,
      permissions,
    }
  }

  private fallbackSession(): AuthSession {
    const role: UserRole = 'Supervisor'
    return {
      userId: DEMO_AUTH_USER_ID,
      role,
      permissions: normalizeUserPermissions(undefined, role),
    }
  }
}

export type { AuthSession, UserPermission }
