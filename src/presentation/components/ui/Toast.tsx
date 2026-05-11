import React, { useEffect } from 'react'
import clsx from 'clsx'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onDismiss: () => void
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className={clsx('toast', `toast-${type}`)}>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onDismiss}>
        ×
      </button>
    </div>
  )
}

export default Toast
