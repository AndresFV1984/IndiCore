import { create } from 'zustand'

export type ConfirmVariant = 'default' | 'danger'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

interface ConfirmState {
  request: ConfirmRequest | null
  ask: (options: ConfirmOptions) => Promise<boolean>
  close: (confirmed: boolean) => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,
  ask: options =>
    new Promise<boolean>(resolve => {
      set({
        request: {
          title: options.title ?? 'Confirmar acción',
          message: options.message,
          confirmLabel: options.confirmLabel ?? 'Confirmar',
          cancelLabel: options.cancelLabel ?? 'Cancelar',
          variant: options.variant ?? 'default',
          resolve,
        },
      })
    }),
  close: confirmed => {
    const { request } = get()
    if (!request) return
    request.resolve(confirmed)
    set({ request: null })
  },
}))
