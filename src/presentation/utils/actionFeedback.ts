import { useConfirmStore, type ConfirmOptions } from '../stores/confirmStore'
import { useNotificationStore } from '../stores/notificationStore'

export function notifySuccess(message: string): void {
  useNotificationStore.getState().push(message, 'success')
}

export function notifyError(message: string): void {
  useNotificationStore.getState().push(message, 'error')
}

export function notifyInfo(message: string): void {
  useNotificationStore.getState().push(message, 'info')
}

export async function confirmAction(message: string, options?: Partial<ConfirmOptions>): Promise<boolean> {
  return useConfirmStore.getState().ask({
    message,
    ...options,
  })
}

export async function confirmDelete(recordName: string): Promise<boolean> {
  return confirmAction(`¿Eliminar «${recordName}»? Esta acción no se puede deshacer.`, {
    title: 'Eliminar registro',
    confirmLabel: 'Eliminar',
    variant: 'danger',
  })
}

export async function confirmToggleState(recordName: string, isActive: boolean): Promise<boolean> {
  return confirmAction(
    isActive
      ? `¿Inactivar «${recordName}»?`
      : `¿Activar «${recordName}»?`,
    {
      title: isActive ? 'Inactivar registro' : 'Activar registro',
      confirmLabel: isActive ? 'Inactivar' : 'Activar',
    }
  )
}

export async function confirmExport(label: string): Promise<boolean> {
  return confirmAction(`¿Exportar ${label}?`, {
    title: 'Exportar datos',
    confirmLabel: 'Exportar',
  })
}

export async function confirmSave(recordName: string, isEditing: boolean): Promise<boolean> {
  return confirmAction(
    isEditing
      ? `¿Guardar los cambios de «${recordName}»?`
      : `¿Guardar el nuevo registro «${recordName}»?`,
    {
      title: isEditing ? 'Guardar cambios' : 'Guardar registro',
      confirmLabel: 'Guardar',
    }
  )
}

export async function performAction<T>(options: {
  confirm?: string
  confirmOptions?: Partial<ConfirmOptions>
  success: string
  error?: string
  action: () => Promise<T> | T
}): Promise<T | undefined> {
  if (options.confirm && !(await confirmAction(options.confirm, options.confirmOptions))) {
    return undefined
  }
  try {
    const result = await options.action()
    notifySuccess(options.success)
    return result
  } catch {
    notifyError(options.error ?? 'No se pudo completar la acción.')
    return undefined
  }
}

export async function runConfirmedSync(options: {
  confirm?: string
  confirmOptions?: Partial<ConfirmOptions>
  success: string
  action: () => void
}): Promise<void> {
  if (options.confirm && !(await confirmAction(options.confirm, options.confirmOptions))) return
  try {
    options.action()
    notifySuccess(options.success)
  } catch {
    notifyError('No se pudo completar la acción.')
  }
}
