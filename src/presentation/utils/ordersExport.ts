import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Order } from '../../core/domain/entities/Order'
import { formatPurchaseOrderNumber } from '../../core/domain/value-objects/PurchaseOrderId'
import { formatProductionOrderId } from '../../core/domain/value-objects/ProductionOrderId'
import { toPedidoDisplayStatus } from '../constants/orderStatusStyles'
import type { ExportField } from './exportFields'

export function formatPedidoCurrency(value: number): string {
  return `$${value.toLocaleString('es-CO')}`
}

export function formatPedidoQuantity(order: Order): string {
  const qty = order.specs?.quantity ?? order.specs?.thousands ?? 0
  return qty > 0 ? qty.toLocaleString('es-CO') : ''
}

/** Referencia de producción; vacío si el pedido aún no tiene orden asociada. */
export function pedidoProductionRef(order: Order): string {
  if (order.status === 'En curso' || order.status === 'Revisión' || order.status === 'Cancelado') {
    return ''
  }
  return formatProductionOrderId(order.id)
}

export function buildPedidoListExportFields(
  resolveClient: (clientId: string) => string
): ExportField<Order>[] {
  return [
    { label: 'N° pedido', value: o => formatPurchaseOrderNumber(o.id) },
    { label: 'Fecha', value: o => format(o.date, 'dd/MM/yyyy', { locale: es }) },
    { label: 'Cliente', value: o => resolveClient(o.clientId), width: 28 },
    { label: 'Descripción', value: o => o.workName, width: 40 },
    { label: 'Cantidad', value: formatPedidoQuantity },
    { label: 'Valor total', value: o => formatPedidoCurrency(o.total.getValue()) },
    { label: 'Estado', value: o => toPedidoDisplayStatus(o.status) },
    { label: 'Orden producción', value: pedidoProductionRef },
  ]
}

export function buildPedidoDetailExportFields(
  resolveClient?: (clientId: string) => string
): ExportField<Order>[] {
  return [
    { label: 'N° pedido', value: o => formatPurchaseOrderNumber(o.id) },
    { label: 'Fecha', value: o => format(o.date, 'dd/MM/yyyy', { locale: es }) },
    { label: 'Cliente', value: o => resolveClient?.(o.clientId) ?? o.clientId, width: 28 },
    { label: 'Descripción', value: o => o.workName, width: 40 },
    { label: 'Cantidad', value: formatPedidoQuantity },
    { label: 'Valor total', value: o => formatPedidoCurrency(o.total.getValue()) },
    { label: 'Estado', value: o => toPedidoDisplayStatus(o.status) },
    { label: 'Orden producción', value: pedidoProductionRef },
    { label: 'Vendedor', value: o => o.vendedorId.trim() },
  ]
}
