import { Order } from '@/core/domain/entities/Order'
import { Remission } from '@/core/domain/entities/Remission'
import { formatCompactCurrency } from '@/presentation/utils/formatCurrency'

export interface DashboardDetail {
  label: string
  value: string | number
}

export interface DashboardMetric {
  label: string
  value: string | number
  money?: number
  hint?: string
}

export interface DashboardSegment {
  label: string
  count: number
  money?: number
  color: string
}

export interface DashboardModuleStats {
  description: string
  primary: DashboardMetric
  details: DashboardDetail[]
  segments: DashboardSegment[]
  totalMoney?: number
}

function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function isThisMonth(d: Date, ref = new Date()): boolean {
  const start = startOfMonth(ref)
  return new Date(d) >= start
}

function sumOrdersValue(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + o.total.getValue(), 0)
}

function sumRemissionsValue(remissions: Remission[]): number {
  return remissions.reduce((sum, r) => sum + r.total.getValue(), 0)
}

export function computeProductionStats(orders: Order[]): DashboardModuleStats {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const inProgress = orders.filter(o => o.status === 'En curso')
  const ready = orders.filter(o => o.status === 'Listo')
  const delivered = orders.filter(o => o.status === 'Entregado')
  const inReview = orders.filter(o => o.status === 'Revisión')

  const inProgressThisWeek = inProgress.filter(o => new Date(o.date) >= weekAgo).length
  const activeTotal = inProgress.length + ready.length + delivered.length

  return {
    description: 'Órdenes en planta y entregas',
    totalMoney: sumOrdersValue([...inProgress, ...ready, ...delivered]),
    primary: {
      label: 'órdenes activas',
      value: activeTotal,
      money: sumOrdersValue(inProgress),
      hint:
        inProgressThisWeek > 0
          ? `${inProgress.length} en curso · +${inProgressThisWeek} esta semana`
          : `${inProgress.length} en curso`,
    },
    details: [
      { label: 'Listos', value: ready.length },
      { label: 'En revisión', value: inReview.length },
    ],
    segments: [
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
    ],
  }
}

export function computePedidosStats(orders: Order[]): DashboardModuleStats {
  const pending = orders.filter(o => o.status === 'En curso')
  const inReview = orders.filter(o => o.status === 'Revisión')
  const confirmed = orders.filter(o => o.status === 'Listo' || o.status === 'Entregado')

  const pendingValue = sumOrdersValue(pending)
  const inReviewValue = sumOrdersValue(inReview)
  const pipelineValue = pendingValue + inReviewValue
  const pipelineTotal = pending.length + inReview.length + confirmed.length

  const thisMonthCount = orders.filter(o => isThisMonth(o.date)).length

  return {
    description: 'Cartera y confirmaciones',
    totalMoney: sumOrdersValue(orders),
    primary: {
      label: 'en cartera',
      value: pipelineTotal || orders.length,
      money: pipelineValue,
      hint:
        pipelineValue > 0
          ? `${formatCompactCurrency(pipelineValue)} por confirmar`
          : 'Sin valor pendiente',
    },
    details: [
      { label: 'Pendientes', value: pending.length },
      { label: 'Nuevos (mes)', value: thisMonthCount },
    ],
    segments: [
      {
        label: 'Pendientes',
        count: pending.length,
        money: pendingValue,
        color: 'var(--amber)',
      },
      {
        label: 'En revisión',
        count: inReview.length,
        money: inReviewValue,
        color: 'var(--orange)',
      },
      {
        label: 'Confirmados',
        count: confirmed.length,
        money: sumOrdersValue(confirmed),
        color: 'var(--green)',
      },
    ],
  }
}

export function computeRemissionsStats(remissions: Remission[]): DashboardModuleStats {
  const incomplete = remissions.filter(r => r.status === 'Pendiente')
  const delivered = remissions.filter(r => r.status === 'Entregado')
  const canceled = remissions.filter(r => r.status === 'Cancelado')

  const thisMonth = remissions.filter(r => isThisMonth(r.date))
  const valueThisMonth = sumRemissionsValue(thisMonth)

  const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
  const prevMonthEnd = startOfMonth()
  const prevMonthCount = remissions.filter(r => {
    const d = new Date(r.date)
    return d >= prevMonthStart && d < prevMonthEnd
  }).length
  const monthDelta = thisMonth.length - prevMonthCount

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
  if (canceled.length > 0) {
    segments.push({
      label: 'Canceladas',
      count: canceled.length,
      money: sumRemissionsValue(canceled),
      color: 'var(--txt-3)',
    })
  }

  return {
    description: 'Despachos y valor del mes',
    totalMoney: sumRemissionsValue(remissions),
    primary: {
      label: 'remisiones este mes',
      value: thisMonth.length,
      money: valueThisMonth,
      hint: `${formatCompactCurrency(valueThisMonth)} remitido · ${
        monthDelta >= 0 ? '+' : ''
      }${monthDelta} vs mes anterior`,
    },
    details: [
      { label: 'Sin completar', value: incomplete.length },
      { label: 'Entregadas', value: delivered.length },
    ],
    segments,
  }
}
