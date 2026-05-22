import React, { useEffect } from 'react'
import { useConfirmStore } from '../../stores/confirmStore'
import './ConfirmDialog.css'

const ConfirmDialogHost: React.FC = () => {
  const request = useConfirmStore(s => s.request)
  const close = useConfirmStore(s => s.close)

  useEffect(() => {
    if (!request) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [request, close])

  if (!request) return null

  const isDanger = request.variant === 'danger'

  return (
    <div
      className="confirm-dialog-backdrop"
      role="presentation"
      onClick={() => close(false)}
    >
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="confirm-dialog__title">
          {request.title}
        </h2>
        <p id="confirm-dialog-message" className="confirm-dialog__message">
          {request.message}
        </p>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="confirm-dialog__btn confirm-dialog__btn--cancel"
            onClick={() => close(false)}
          >
            {request.cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-dialog__btn confirm-dialog__btn--confirm${isDanger ? ' confirm-dialog__btn--danger' : ''}`}
            onClick={() => close(true)}
            autoFocus
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialogHost
