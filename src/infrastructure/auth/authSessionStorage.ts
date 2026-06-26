const AUTH_USER_ID_KEY = 'indicolors.auth.userId'

export function readPersistedAuthUserId(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  const value = sessionStorage.getItem(AUTH_USER_ID_KEY)?.trim()
  return value || null
}

export function persistAuthUserId(userId: string): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(AUTH_USER_ID_KEY, userId)
}

export function clearPersistedAuthUserId(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(AUTH_USER_ID_KEY)
}
