import type { Order } from '../../../../core/domain/entities/Order'
import type { ProductionTraceEvent } from '../../../../core/domain/entities/ProductionTrace'
import {
  buildOperatorOrderSummary,
  buildOperatorProcessRows,
  type ProductionOperatorProcessRow,
  type ProductionOperatorOrderSummary,
} from '../../../../core/domain/services/productionOperatorWorkflow'

export type OperatorOrderListFilter = 'all' | 'active' | 'pending' | 'done'

export interface OperatorOrderCardModel {
  order: Order
  rows: ProductionOperatorProcessRow[]
  summary: ProductionOperatorOrderSummary
  listStatus: Exclude<OperatorOrderListFilter, 'all'>
  activeRow: ProductionOperatorProcessRow | null
  assignedRows: ProductionOperatorProcessRow[]
  doneCount: number
}

export function buildOperatorOrderCardModel(
  order: Order,
  events: ProductionTraceEvent[],
  userId: string
): OperatorOrderCardModel {
  const rows = buildOperatorProcessRows({
    order,
    events,
    userId,
    activeProductionStatus: order.productionStatus,
  })
  const summary = buildOperatorOrderSummary(rows, events, order, userId)
  const assignedRows = rows.filter(row => row.assignedToUser)
  const doneCount = assignedRows.filter(row => row.status === 'terminado').length
  const activeRow =
    assignedRows.find(row => row.canRegisterProgress && row.status !== 'terminado') ??
    assignedRows.find(row => row.status === 'en-proceso') ??
    null

  let listStatus: OperatorOrderCardModel['listStatus'] = 'pending'
  if (assignedRows.length > 0 && assignedRows.every(row => row.status === 'terminado')) {
    listStatus = 'done'
  } else if (assignedRows.some(row => row.status === 'en-proceso')) {
    listStatus = 'active'
  }

  return {
    order,
    rows,
    summary,
    listStatus,
    activeRow,
    assignedRows,
    doneCount,
  }
}

export function matchesOperatorOrderFilter(
  card: OperatorOrderCardModel,
  filter: OperatorOrderListFilter
): boolean {
  if (filter === 'all') return true
  return card.listStatus === filter
}
