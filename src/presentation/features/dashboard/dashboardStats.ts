import { Order } from '@/core/domain/entities/Order'
import { Remission } from '@/core/domain/entities/Remission'

export interface DashboardMetric {
  label: string
  value: string | number
  /** Valor en dinero del indicador principal (estado clave del módulo) */
  money: number
  moneyCaption: string
}

export interface DashboardSegment {
  label: string
  count: number
  money: number
  color: string
}

export interface DashboardModuleStats {
  primary: DashboardMetric
  segments: DashboardSegment[]
  /** Suma de valores en los estados mostrados (base del % de distribución) */
  distributionTotal: number
}

function sumOrdersValue(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + o.total.getValue(), 0)
}

function sumRemissionsValue(remissions: Remission[]): number {
  return remissions.reduce((sum, r) => sum + r.total.getValue(), 0)
}

function segmentTotalMoney(segments: DashboardSegment[]): number {
  return segments.reduce((sum, s) => sum + s.money, 0)
}

export function computeProductionStats(orders: Order[]): DashboardModuleStats {
  const inProgress = orders.filter(o => o.status === 'En curso')
  const ready = orders.filter(o => o.status === 'Listo')
  const delivered = orders.filter(o => o.status === 'Entregado')

  const segments: DashboardSegment[] = [
    {
      label: 'En curso',
      count: inProgress.length,
      money: sumOrdersValue(inProgress),
      color: 'var(--orange)',
    },
    {
      label: 'Listos',
      count: ready.length,
      money: sumOrdersValue(ready),
      color: 'var(--green)',
    },
    {
      label: 'Entregados',
      count: delivered.length,
      money: sumOrdersValue(delivered),
      color: 'var(--teal)',
    },
  ]

  return {
    distributionTotal: segmentTotalMoney(segments),
    primary: {
      label: 'órdenes en curso',
      value: inProgress.length,
      money: sumOrdersValue(inProgress),
      moneyCaption: 'Valor en estado En curso',
    },
    segments,
  }
}

export function computePedidosStats(orders: Order[]): DashboardModuleStats {
  const pending = orders.filter(o => o.status === 'En curso')
  const inReview = orders.filter(o => o.status === 'Revisión')
  const confirmed = orders.filter(o => o.status === 'Listo' || o.status === 'Entregado')

  const segments: DashboardSegment[] = [
    {
      label: 'Pendientes',
      count: pending.length,
      money: sumOrdersValue(pending),
      color: 'var(--amber)',
    },
    {
      label: 'En revisión',
      count: inReview.length,
      money: sumOrdersValue(inReview),
      color: 'var(--orange)',
    },
    {
      label: 'Confirmados',
      count: confirmed.length,
      money: sumOrdersValue(confirmed),
      color: 'var(--green)',
    },
  ]

  return {
    distributionTotal: segmentTotalMoney(segments),
    primary: {
      label: 'pedidos pendientes',
      value: pending.length,
      money: sumOrdersValue(pending),
      moneyCaption: 'Valor en estado En curso',
    },
    segments,
  }
}

export function computeRemissionsStats(remissions: Remission[]): DashboardModuleStats {
  const incomplete = remissions.filter(r => r.status === 'Pendiente')
  const delivered = remissions.filter(r => r.status === 'Entregado')
  const canceled = remissions.filter(r => r.status === 'Cancelado')

  const segments: DashboardSegment[] = [
    {
      label: 'Sin completar',
      count: incomplete.length,
      money: sumRemissionsValue(incomplete),
      color: 'var(--amber)',
    },
    {
      label: 'Entregadas',
      count: delivered.length,
      money: sumRemissionsValue(delivered),
      color: 'var(--green)',
    },
  ]
  if (canceled.length > 0 || sumRemissionsValue(canceled) > 0) {
    segments.push({
      label: 'Canceladas',
      count: canceled.length,
      money: sumRemissionsValue(canceled),
      color: 'var(--txt-3)',
    })
  }

  return {
    distributionTotal: segmentTotalMoney(segments),
    primary: {
      label: 'sin completar',
      value: incomplete.length,
      money: sumRemissionsValue(incomplete),
      moneyCaption: 'Valor en estado Pendiente',
    },
    segments,
  }
}
