/**
 * Genera un id único. Usa crypto.randomUUID cuando el navegador lo permite
 * (HTTPS o localhost). En HTTP plano (p. ej. IP de EC2 sin TLS) usa fallback.
 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      /* contexto no seguro: HTTP en IP pública */
    }
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}
