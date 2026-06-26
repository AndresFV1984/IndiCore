import { create } from 'zustand'
import type { AuthSession } from '../../core/ports/in/IAuthUseCases'

interface AuthState {
  session: AuthSession | null
  loading: boolean
  error: string | null
  setLoading: (loading: boolean) => void
  setSession: (session: AuthSession | null) => void
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthState>(set => ({
  session: null,
  loading: false,
  error: null,
  setLoading: loading => set({ loading }),
  setSession: session => set({ session, loading: false, error: null }),
  setError: error => set({ error, loading: false }),
}))
