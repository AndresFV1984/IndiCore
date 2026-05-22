import { Order } from '../../../../core/domain/entities/Order'
import { PreprensaDisenoSpecs } from '../../../../core/domain/entities/PreprensaDiseno'
import {
  normalizePreprensaSnapshot,
  resolveDisplayNombreDiseno,
} from './applyPreprensaFromHistorial'

export interface ClienteDisenoOption {
  /** Orden de producción de referencia */
  sourceOrderId: string
  nombreDiseno: string
  workName: string
  date: Date
  preprensaSnapshot: PreprensaDisenoSpecs
}

/** Todos los trabajos (órdenes) del cliente, del más reciente al más antiguo. */
export function buildClienteDisenosFromOrders(
  orders: Order[],
  clientId: string,
  excludeOrderId?: string
): ClienteDisenoOption[] {
  if (!clientId.trim()) return []

  const items: ClienteDisenoOption[] = []

  for (const order of orders) {
    if (order.clientId !== clientId) continue
    if (excludeOrderId && order.id === excludeOrderId) continue

    const preprensaSnapshot = normalizePreprensaSnapshot(order.specs.preprensaDiseno)

    items.push({
      sourceOrderId: order.id,
      nombreDiseno: resolveDisplayNombreDiseno(preprensaSnapshot),
      workName: order.workName?.trim() || 'Sin nombre de trabajo',
      date: new Date(order.date),
      preprensaSnapshot,
    })
  }

  return items.sort((a, b) => b.date.getTime() - a.date.getTime())
}
