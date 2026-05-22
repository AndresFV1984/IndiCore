import { useEffect, useRef } from 'react'
import { useUIStore } from '../stores/uiStore'

const DESKTOP_BREAKPOINT = 900

/**
 * Solo cierra el menú al pasar a móvil; en escritorio respeta el estado del usuario.
 */
export function useLayoutMedia() {
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const wasDesktop = useRef(
    typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

    const apply = () => {
      const isDesktop = mq.matches
      if (!isDesktop) {
        setSidebarOpen(false)
      } else if (!wasDesktop.current && isDesktop) {
        setSidebarOpen(true)
      }
      wasDesktop.current = isDesktop
    }

    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [setSidebarOpen])
}
