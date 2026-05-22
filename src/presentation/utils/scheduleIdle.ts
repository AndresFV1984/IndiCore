/** Ejecuta trabajo no urgente sin bloquear el primer paint. */
export function scheduleIdle(fn: () => void, options?: { timeout?: number; delayMs?: number }): void {
  const run = () => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => fn(), { timeout: options?.timeout ?? 2500 })
      return
    }
    fn()
  }
  const delay = options?.delayMs ?? 0
  if (delay > 0) {
    window.setTimeout(run, delay)
    return
  }
  run()
}
