import { useEffect } from 'react'
import { Container } from '../../di/container'
import { dedupedFetch } from '../utils/dedupedFetch'
import { useAuthStore } from '../stores/authStore'
import { userHasPermission } from '../../core/domain/auth/userPermissions'
import type { UserPermission } from '../../core/domain/auth/userPermissions'

const container = Container.getInstance()

export const useAuth = () => {
  const session = useAuthStore(state => state.session)
  const loading = useAuthStore(state => state.loading)
  const error = useAuthStore(state => state.error)
  const setLoading = useAuthStore(state => state.setLoading)
  const setSession = useAuthStore(state => state.setSession)
  const setError = useAuthStore(state => state.setError)

  useEffect(() => {
    if (useAuthStore.getState().session) return

    let cancelled = false
    setLoading(true)
    dedupedFetch('auth:session', () => container.getAuthUseCases().getSession())
      .then(fetched => {
        if (!cancelled) setSession(fetched)
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error cargando sesión')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setLoading, setSession, setError])

  const hasPermission = (permission: UserPermission): boolean =>
    session ? userHasPermission(session.permissions, permission) : false

  return {
    session,
    loading,
    error,
    hasPermission,
  }
}

export const getAuthSessionSnapshot = () => useAuthStore.getState().session
