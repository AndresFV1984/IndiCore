import { Order } from '../../core/domain/entities/Order'
import { Remission } from '../../core/domain/entities/Remission'
import { formatProductionOrderId } from '../../core/domain/value-objects/ProductionOrderId'
import { formatRemissionNumber } from '../../core/domain/value-objects/RemissionId'
import type { ExportField } from './exportFields'
import { slugifyFilename } from './exportFields'
import {
  buildPedidoDetailExportFields,
  formatPedidoCurrency,
  formatPedidoQuantity,
} from './ordersExport'

const formatDate = (date: Date) => {
  try {
    return date.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

const moneyLabel = (value: { toString: () => string } | undefined | null) =>
  value && typeof value.toString === 'function' ? value.toString() : ''

const produccionFields = (resolveClient?: (clientId: string) => string): ExportField<Order>[] => [
  { label: 'Orden producción', value: o => formatProductionOrderId(o.id) },
  { label: 'Cliente', value: o => resolveClient?.(o.clientId) ?? o.clientId, width: 28 },
  { label: 'Descripción', value: o => o.workName, width: 40 },
  { label: 'Fecha', value: o => formatDate(o.date) },
  { label: 'Cantidad', value: formatPedidoQuantity },
  { label: 'Valor total', value: o => formatPedidoCurrency(o.total.getValue()) },
  { label: 'Estado', value: o => o.status },
  { label: 'Vendedor', value: o => o.vendedorId.trim() },
]

const remissionFields = (
  resolveClient?: (clientId: string) => string
): ExportField<Remission>[] => [
  { label: 'N°', value: r => formatRemissionNumber(r.id) },
  { label: 'Orden producción', value: r => formatProductionOrderId(r.orderId) },
  { label: 'Cliente', value: r => resolveClient?.(r.clientId) ?? r.clientId },
  { label: 'Fecha', value: r => formatDate(r.date) },
  { label: 'Estado', value: r => r.status },
  { label: 'Valor total', value: r => moneyLabel(r.total) },
  {
    label: 'Cantidad ítems',
    value: r =>
      String(Array.isArray(r.items) ? r.items.reduce((s, it) => s + (it.quantity || 0), 0) : 0),
  },
  {
    label: 'Productos',
    value: r =>
      Array.isArray(r.items) && r.items.length
        ? r.items.map(it => it.product).filter(Boolean).join('; ')
        : '',
  },
  { label: 'Observaciones', value: r => r.observations || '' },
]

export async function exportPedido(
  order: Order,
  resolveClient?: (clientId: string) => string
): Promise<void> {
  const { downloadRecordPdf } = await import('./exportPdf')
  const scope = slugifyFilename(order.workName || order.id)
  await downloadRecordPdf({
    filename: `pedido-${scope}`,
    title: 'Pedido de trabajo',
    subtitle: order.workName,
    fields: buildPedidoDetailExportFields(resolveClient),
    row: order,
  })
}

export async function exportProduccion(
  order: Order,
  resolveClient?: (clientId: string) => string
): Promise<void> {
  const { downloadRecordPdf } = await import('./exportPdf')
  const scope = slugifyFilename(order.workName || order.id)
  await downloadRecordPdf({
    filename: `produccion-${scope}`,
    title: 'Orden de producción',
    subtitle: order.workName,
    fields: produccionFields(resolveClient),
    row: order,
  })
}

export async function exportRemision(
  remission: Remission,
  resolveClient?: (clientId: string) => string
): Promise<void> {
  const { downloadRecordPdf } = await import('./exportPdf')
  const scope = slugifyFilename(remission.id)
  await downloadRecordPdf({
    filename: `remision-${scope}`,
    title: 'Remisión',
    subtitle: remission.id,
    fields: remissionFields(resolveClient),
    row: remission,
  })
}
