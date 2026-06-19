import type { Order } from '../../../../core/domain/entities/Order'
import type {
  ProductionTraceEvent,
  ProductionTracePauseReasonId,
  ProductionTracePhaseId,
} from '../../../../core/domain/entities/ProductionTrace'
import { PRODUCTION_TRACE_PAUSE_REASONS } from '../../../../core/domain/entities/ProductionTrace'
import type { User } from '../../../../core/domain/entities/User'
import { formatProductionOrderId } from '../../../../core/domain/value-objects/ProductionOrderId'
import type { OrderStatus } from '../../../../core/domain/value-objects/OrderStatus'
import {
  OPERADOR_ASSIGNMENT_FIELDS,
  PRODUCTION_PHASE_LABELS,
  type ProductionAssignmentPhaseId,
} from '../../production/utils/productionOperatorAssignment'

const PHASES = Object.keys(OPERADOR_ASSIGNMENT_FIELDS) as ProductionAssignmentPhaseId[]

export interface OperarioTracePause {
  id: string
  reason: ProductionTracePauseReasonId
  reasonLabel: string
  startedAt: string
  endedAt: string | null
  durationMs: number
  note?: string
  isOpen: boolean
}

export interface OperarioTraceRow {
  id: string
  orderId: string
  orderLabel: string
  workName: string
  clientName: string
  phase: ProductionTracePhaseId
  phaseLabel: string
  userId: string
  userName: string
  orderStatus: OrderStatus
  startedAt: string | null
  endedAt: string | null
  lastStatusChangeAt: string | null
  operationStatus: 'En curso' | 'Completado' | 'Pausado'
  unidadesEntregaParcial: number
  unidadesProcesadas: number
  tiempoBrutoMs: number
  tiempoPausadoMs: number
  tiempoLaboradoMs: number
  pausas: OperarioTracePause[]
  pausaCount: number
  isPausedNow: boolean
}

export interface OperarioTraceSummary {
  sesiones: number
  sesionesActivas: number
  tiempoLaboradoMs: number
  tiempoPausadoMs: number
  pausaCount: number
  unidadesProcesadas: number
  unidadesEntregaParcial: number
}

export interface BuildOperarioTraceReportInput {
  orders: Order[]
  events: ProductionTraceEvent[]
  users: User[]
  clientsById: Record<string, string>
  userId?: string
  phase?: ProductionTracePhaseId
  from?: string
  to?: string
  now?: string
}

export const formatDurationMs = (ms: number): string => {
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours} h ${minutes} min`
  return `${minutes} min`
}

export const formatTraceDateTime = (iso: string | null): string => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const sessionKey = (orderId: string, phase: ProductionTracePhaseId, userId: string): string =>
  `${orderId}:${phase}:${userId}`

const isWithinRange = (iso: string, from?: string, to?: string): boolean => {
  const at = Date.parse(iso)
  if (Number.isNaN(at)) return false
  if (from && at < Date.parse(from)) return false
  if (to && at > Date.parse(to)) return false
  return true
}

export const buildSessionPauses = (
  sessionEvents: ProductionTraceEvent[],
  sessionEndedAt: string | null,
  nowIso: string
): OperarioTracePause[] => {
  const pauseEvents = sessionEvents.filter(
    event => event.type === 'paro' || event.type === 'reanudacion'
  )
  const pausas: OperarioTracePause[] = []
  let openParo: ProductionTraceEvent | null = null

  for (const event of pauseEvents) {
    if (event.type === 'paro') {
      openParo = event
      continue
    }

    if (event.type === 'reanudacion' && openParo) {
      const durationMs = Math.max(0, Date.parse(event.at) - Date.parse(openParo.at))
      pausas.push({
        id: openParo.id,
        reason: openParo.pauseReason ?? 'otro',
        reasonLabel:
          PRODUCTION_TRACE_PAUSE_REASONS[openParo.pauseReason ?? 'otro'] ??
          PRODUCTION_TRACE_PAUSE_REASONS.otro,
        startedAt: openParo.at,
        endedAt: event.at,
        durationMs,
        note: openParo.nota,
        isOpen: false,
      })
      openParo = null
    }
  }

  if (openParo) {
    const endReference = sessionEndedAt ?? nowIso
    pausas.push({
      id: openParo.id,
      reason: openParo.pauseReason ?? 'otro',
      reasonLabel:
        PRODUCTION_TRACE_PAUSE_REASONS[openParo.pauseReason ?? 'otro'] ??
        PRODUCTION_TRACE_PAUSE_REASONS.otro,
      startedAt: openParo.at,
      endedAt: sessionEndedAt ? endReference : null,
      durationMs: Math.max(0, Date.parse(endReference) - Date.parse(openParo.at)),
      note: openParo.nota,
      isOpen: !sessionEndedAt,
    })
  }

  return pausas
}

const resolveOperationStatus = (
  orderStatus: OrderStatus,
  hasFinFase: boolean,
  hasOpenPause: boolean
): OperarioTraceRow['operationStatus'] => {
  if (hasFinFase || orderStatus === 'Entregado' || orderStatus === 'Listo') return 'Completado'
  if (hasOpenPause || orderStatus === 'Cancelado' || orderStatus === 'Revisión') return 'Pausado'
  return 'En curso'
}

export const buildOperarioTraceReport = ({
  orders,
  events,
  users,
  clientsById,
  userId,
  phase,
  from,
  to,
  now = new Date().toISOString(),
}: BuildOperarioTraceReportInput): { rows: OperarioTraceRow[]; summary: OperarioTraceSummary } => {
  const usersById = new Map(users.map(user => [user.id, user.name]))
  const eventsBySession = new Map<string, ProductionTraceEvent[]>()

  for (const event of events) {
    const key = sessionKey(event.orderId, event.phase, event.userId)
    const bucket = eventsBySession.get(key) ?? []
    bucket.push(event)
    eventsBySession.set(key, bucket)
  }

  const rows: OperarioTraceRow[] = []

  for (const order of orders) {
    for (const currentPhase of PHASES) {
      if (phase && phase !== currentPhase) continue

      const fields = OPERADOR_ASSIGNMENT_FIELDS[currentPhase]
      const assignedUserId = order.specs[fields.id] as string | undefined
      if (!assignedUserId) continue
      if (userId && assignedUserId !== userId) continue

      const key = sessionKey(order.id, currentPhase, assignedUserId)
      const sessionEvents = [...(eventsBySession.get(key) ?? [])].sort(
        (a, b) => Date.parse(a.at) - Date.parse(b.at)
      )

      const assignmentEvents = sessionEvents.filter(event => event.type === 'asignacion')
      const statusEvents = sessionEvents.filter(event => event.type === 'cambio_estado_orden')
      const partialEvents = sessionEvents.filter(event => event.type === 'entrega_parcial')
      const progressEvents = sessionEvents.filter(event => event.type === 'avance_unidades')
      const finEvents = sessionEvents.filter(event => event.type === 'fin_fase')

      const startedAt =
        assignmentEvents[0]?.at ?? sessionEvents[0]?.at ?? order.date.toISOString()

      const endedAt = finEvents.at(-1)?.at ?? null

      const lastStatusChangeAt =
        statusEvents.at(-1)?.at ?? sessionEvents.at(-1)?.at ?? startedAt

      const unidadesEntregaParcial = partialEvents.reduce(
        (sum, event) => sum + (event.unidades ?? 0),
        0
      )
      const unidadesProcesadas = progressEvents.reduce(
        (sum, event) => sum + (event.unidades ?? 0),
        unidadesEntregaParcial
      )

      const pausas = buildSessionPauses(sessionEvents, endedAt, now)
      const tiempoPausadoMs = pausas.reduce((sum, pausa) => sum + pausa.durationMs, 0)
      const endReference = endedAt ?? now
      const tiempoBrutoMs = Math.max(0, Date.parse(endReference) - Date.parse(startedAt))
      const tiempoLaboradoMs = Math.max(0, tiempoBrutoMs - tiempoPausadoMs)
      const isPausedNow = pausas.some(pausa => pausa.isOpen)

      const operationStatus = resolveOperationStatus(
        order.status,
        finEvents.length > 0,
        isPausedNow
      )

      if (from || to) {
        const anchor = lastStatusChangeAt ?? startedAt
        if (!isWithinRange(anchor, from, to)) continue
      }

      rows.push({
        id: key,
        orderId: order.id,
        orderLabel: formatProductionOrderId(order.id),
        workName: order.workName,
        clientName: clientsById[order.clientId] ?? '—',
        phase: currentPhase,
        phaseLabel: PRODUCTION_PHASE_LABELS[currentPhase],
        userId: assignedUserId,
        userName: usersById.get(assignedUserId) ?? assignedUserId,
        orderStatus: order.status,
        startedAt,
        endedAt,
        lastStatusChangeAt,
        operationStatus,
        unidadesEntregaParcial,
        unidadesProcesadas,
        tiempoBrutoMs,
        tiempoPausadoMs,
        tiempoLaboradoMs,
        pausas,
        pausaCount: pausas.length,
        isPausedNow,
      })
    }
  }

  rows.sort((a, b) => Date.parse(b.lastStatusChangeAt ?? '') - Date.parse(a.lastStatusChangeAt ?? ''))

  const summary: OperarioTraceSummary = rows.reduce(
    (acc, row) => ({
      sesiones: acc.sesiones + 1,
      sesionesActivas: acc.sesionesActivas + (row.operationStatus === 'En curso' ? 1 : 0),
      tiempoLaboradoMs: acc.tiempoLaboradoMs + row.tiempoLaboradoMs,
      tiempoPausadoMs: acc.tiempoPausadoMs + row.tiempoPausadoMs,
      pausaCount: acc.pausaCount + row.pausaCount,
      unidadesProcesadas: acc.unidadesProcesadas + row.unidadesProcesadas,
      unidadesEntregaParcial: acc.unidadesEntregaParcial + row.unidadesEntregaParcial,
    }),
    {
      sesiones: 0,
      sesionesActivas: 0,
      tiempoLaboradoMs: 0,
      tiempoPausadoMs: 0,
      pausaCount: 0,
      unidadesProcesadas: 0,
      unidadesEntregaParcial: 0,
    }
  )

  return { rows, summary }
}
