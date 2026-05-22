import React from 'react'
import { useNotificationStore } from '../../stores/notificationStore'

const ActionToastHost: React.FC = () => {
  const toasts = useNotificationStore(s => s.toasts)
  const dismiss = useNotificationStore(s => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="action-toast-host" aria-live="polite" aria-atomic="false">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
          <span className="toast-message">{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            aria-label="Cerrar notificación"
            onClick={() => dismiss(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export default ActionToastHost
