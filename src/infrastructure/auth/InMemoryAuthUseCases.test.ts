import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryAuthUseCases } from './InMemoryAuthUseCases'
import { InMemoryUserRepository } from '../repositories/InMemoryUserRepository'
import { clearPersistedAuthUserId } from './authSessionStorage'

const storage = new Map<string, string>()

describe('InMemoryAuthUseCases', () => {
  let auth: InMemoryAuthUseCases

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
    })
    clearPersistedAuthUserId()
    auth = new InMemoryAuthUseCases(new InMemoryUserRepository())
  })

  it('devuelve null sin sesión persistida', async () => {
    await expect(auth.getSession()).resolves.toBeNull()
  })

  it('autentica operador con correo y contraseña', async () => {
    const result = await auth.signIn({
      email: 'andres@indicolors.com',
      password: 'Indiclors123*',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.session.userId).toBe('user-andres')
      expect(result.session.role).toBe('Operador')
    }

    const session = await auth.getSession()
    expect(session?.userId).toBe('user-andres')
  })

  it('autentica administrador', async () => {
    const result = await auth.signIn({
      email: 'bayron@indicolors.com',
      password: 'Indiclors123*',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.session.userId).toBe('user-bayron')
      expect(result.session.role).toBe('Administrador')
    }
  })

  it('rechaza credenciales inválidas', async () => {
    const result = await auth.signIn({
      email: 'andres@indicolors.com',
      password: 'incorrecta',
    })

    expect(result).toEqual({ ok: false, error: 'invalid_credentials' })
  })

  it('limpia sesión al cerrar', async () => {
    await auth.signIn({
      email: 'andres@indicolors.com',
      password: 'Indiclors123*',
    })
    await auth.signOut()
    await expect(auth.getSession()).resolves.toBeNull()
  })
})
