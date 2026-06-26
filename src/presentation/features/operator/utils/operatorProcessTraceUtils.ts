import type { ProductionTraceEvent, ProductionTracePhaseId } from '../../../../core/domain/entities/ProductionTrace'
import {
  buildSessionPauses,
  type OperarioTracePause,
} from '../../trazabilidad/utils/buildOperarioTraceReport'

export interface OperatorProcessTraceMetrics {
  laborTimeMs: number
  pausedTimeMs: number
  pauseCount: number
  isPausedNow: boolean
  pauses: OperarioTracePause[]
  startedAt: string | null
}

export function filterProcessTraceEvents(
  events: ProductionTraceEvent[],
  orderId: string,
  userId: string,
  processKey: string,
  phase: ProductionTracePhaseId
): ProductionTraceEvent[] {
  return events
    .filter(event => {
      if (event.orderId !== orderId || event.userId !== userId) return false
      if (event.processKey) return event.processKey === processKey
      return event.phase === phase && (processKey === phase || processKey.startsWith(`${phase}:`))
    })
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
}

export function buildOperatorProcessTraceMetrics(
  events: ProductionTraceEvent[],
  orderId: string,
  userId: string,
  processKey: string,
  phase: ProductionTracePhaseId,
  now = new Date().toISOString()
): OperatorProcessTraceMetrics {
  const sessionEvents = filterProcessTraceEvents(events, orderId, userId, processKey, phase)
  const startedAt = sessionEvents[0]?.at ?? null
  const endedAt = sessionEvents.some(event => event.type === 'fin_fase')
    ? sessionEvents.filter(event => event.type === 'fin_fase').at(-1)?.at ?? null
    : null

  const pauses = buildSessionPauses(sessionEvents, endedAt, now)
  const pausedTimeMs = pauses.reduce((sum, pause) => sum + pause.durationMs, 0)
  const endReference = endedAt ?? now
  const grossTimeMs =
    startedAt != null ? Math.max(0, Date.parse(endReference) - Date.parse(startedAt)) : 0
  const laborTimeMs = Math.max(0, grossTimeMs - pausedTimeMs)

  return {
    laborTimeMs,
    pausedTimeMs,
    pauseCount: pauses.length,
    isPausedNow: pauses.some(pause => pause.isOpen),
    pauses,
    startedAt,
  }
}

export function findOperatorBottleneckLabel(
  rows: Array<{ label: string; assignedToUser: boolean; pendingUnits: number; status: string }>
): string | null {
  const candidate = rows
    .filter(row => row.assignedToUser && row.pendingUnits > 0 && row.status !== 'terminado')
    .sort((a, b) => b.pendingUnits - a.pendingUnits)[0]

  return candidate?.label ?? null
}
