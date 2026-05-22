import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface NotificationState {
  toasts: ToastItem[]
  push: (message: string, type?: ToastType) => void
  dismiss: (id: string) => void
}

const TOAST_DURATION_MS = 4200

export const useNotificationStore = create<NotificationState>((set, get) => ({
  toasts: [],
  push: (message, type = 'success') => {
    const id = crypto.randomUUID()
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }))
    window.setTimeout(() => {
      if (get().toasts.some(t => t.id === id)) {
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
      }
    }, TOAST_DURATION_MS)
  },
  dismiss: id => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}))
