import React, { useEffect } from 'react'

export type ModalDirectoryTone = 'clients' | 'users' | 'vendedores'

interface ModalProps {
  isOpen: boolean
  title: string
  subtitle?: string
  onClose: () => void
  maxWidth?: string
  directoryTone?: ModalDirectoryTone
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  subtitle,
  onClose,
  maxWidth = '500px',
  directoryTone,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={[
          'modal-content',
          directoryTone ? 'modal-content--record' : '',
          directoryTone ? `modal-content--${directoryTone}` : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div className="modal-header-text">
            <h2 id="modal-title" className="modal-title">{title}</h2>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div
          className={directoryTone ? 'modal-body modal-body--record' : 'modal-body'}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
