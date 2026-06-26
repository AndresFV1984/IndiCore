import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Container } from '../../../di/container'
import { ROUTES } from '../../../config/appRoutes'
import { useAuth } from '../../hooks/useAuth'
import { useOrdersHook } from '../../hooks/useOrders'
import { useClientsHook } from '../../hooks/useClients'
import ProductionOrderStatusBadge from '../../components/ui/ProductionOrderStatusBadge'
import { formatProductionOrderId } from '../../../core/domain/value-objects/ProductionOrderId'
import {
  getProductionStatusForPhase,
  type ProductionStatusPhaseId,
} from '../../../core/domain/policies/productionOrderStatusPolicy'
import {
  buildOperatorDeliveryHistory,
  buildOperatorOrderSummary,
  buildOperatorProcessRows,
  validateOperatorUnitsSubmission,
  type ProductionOperatorProcessRow,
} from '../../../core/domain/services/productionOperatorWorkflow'
import type { ProductionTracePauseReasonId } from '../../../core/domain/entities/ProductionTrace'
import { productionTraceRecorder } from '../../services/productionTraceRecorder'
import { formatDurationMs, formatTraceDateTime } from '../trazabilidad/utils/buildOperarioTraceReport'
import { OPERATOR_WORK_COPY as copy } from './constants/operatorWorkCopy'
import { performAction } from '../../utils/actionFeedback'
import OperatorProcessCard from './OperatorProcessCard'
import {
  buildOperatorProcessTraceMetrics,
  findOperatorBottleneckLabel,
} from './utils/operatorProcessTraceUtils'
import './OperatorWork.css'

const container = Container.getInstance()

const formatOrderDate = (date: Date): string =>
  date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

const sectionTitle: Record<ProductionOperatorProcessRow['section'], string> = {
  base: copy.table.sectionBase,
  terminados: copy.table.sectionTerminados,
  acabados: copy.table.sectionAcabados,
}

const ProductionOperatorOrderPanel: React.FC = () => {
  const { orderId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session, hasPermission, loading: authLoading } = useAuth()
  const { orders, loading: ordersLoading, updateProductionOrderStatus } = useOrdersHook()
  const { clients } = useClientsHook()
  const [draftUnits, setDraftUnits] = useState<Record<string, string>>({})
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({})
  const [draftPauseReasons, setDraftPauseReasons] = useState<
    Record<string, ProductionTracePauseReasonId>
  >({})
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const resolvedOrderId = decodeURIComponent(orderId)

  const order = useMemo(
    () =>
      orders.find(
        item =>
          item.id === resolvedOrderId ||
          item.id === orderId ||
          formatProductionOrderId(item.id) === resolvedOrderId
      ),
    [orders, orderId, resolvedOrderId]
  )
  const traceOrderId = order?.id ?? resolvedOrderId
  const clientName = order ? clients.find(c => c.id === order.clientId)?.name ?? '—' : '—'

  const { data: events = [], isLoading: eventsLoading, isError: eventsError } = useQuery({
    queryKey: ['production-trace-events', traceOrderId],
    queryFn: () => container.getProductionTraceUseCases().getEvents({ orderId: traceOrderId }),
    enabled: Boolean(traceOrderId),
    staleTime: 15_000,
  })

  const userId = session?.userId ?? ''

  const rows = useMemo(() => {
    if (!order || !userId) return []
    return buildOperatorProcessRows({
      order,
      events,
      userId,
      activeProductionStatus: order.productionStatus,
    })
  }, [order, events, userId])

  const summary = useMemo(() => {
    if (!order || !userId) return null
    return buildOperatorOrderSummary(rows, events, order, userId)
  }, [rows, events, order, userId])

  const assignedRows = useMemo(() => rows.filter(row => row.assignedToUser), [rows])

  const deliveryHistory = useMemo(() => {
    if (!order) return []
    return buildOperatorDeliveryHistory(events, order.id, rows)
  }, [events, order, rows])

  const traceByProcess = useMemo(() => {
    if (!order || !userId) return new Map<string, ReturnType<typeof buildOperatorProcessTraceMetrics>>()
    const map = new Map<string, ReturnType<typeof buildOperatorProcessTraceMetrics>>()
    rows.forEach(row => {
      map.set(
        row.processKey,
        buildOperatorProcessTraceMetrics(events, order.id, userId, row.processKey, row.phase)
      )
    })
    return map
  }, [rows, events, order, userId])

  const currentProcessLabel = useMemo(() => {
    const active = assignedRows.find(row => row.status === 'en-proceso')
    return (
      active?.label ??
      assignedRows.find(row => row.pendingUnits > 0)?.label ??
      assignedRows[0]?.label ??
      '—'
    )
  }, [assignedRows])

  const bottleneckLabel = useMemo(() => findOperatorBottleneckLabel(assignedRows), [assignedRows])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['production-trace-events'] })
    await queryClient.invalidateQueries({ queryKey: ['production-trace-events', orderId] })
  }

  const handleStartProcess = async (row: ProductionOperatorProcessRow) => {
    if (!order || !session || !row.assignedToUser) return
    const note = draftNotes[row.processKey]?.trim()
    const phase = row.phase as ProductionStatusPhaseId
    const targetStatus = getProductionStatusForPhase(phase)
    setSavingKey(row.processKey)
    try {
      await performAction({
        success: 'Estado actualizado.',
        error: 'No se pudo actualizar el estado.',
        action: async () => {
          await updateProductionOrderStatus(order.id, targetStatus)
          await productionTraceRecorder.recordProductionStatusChange({
            orderId: order.id,
            workName: order.workName,
            phase: row.phase,
            userId: session.userId,
            productionStatus: targetStatus,
            orderStatus: order.status,
            processKey: row.processKey,
            nota: note || undefined,
          })
          await invalidate()
        },
      })
    } finally {
      setSavingKey(null)
    }
  }

  const handleRegisterUnits = async (row: ProductionOperatorProcessRow, mode: 'progress' | 'delivery') => {
    if (!order || !session) return
    const units = Number((draftUnits[row.processKey] ?? '').replace(/\D/g, ''))
    const validation = validateOperatorUnitsSubmission({
      rows,
      processKey: row.processKey,
      units,
      mode,
    })
    if (!validation.ok) {
      window.alert(validation.message)
      return
    }
    const note = draftNotes[row.processKey]?.trim() || undefined
    setSavingKey(row.processKey)
    try {
      await performAction({
        success: mode === 'delivery' ? 'Entrega parcial registrada.' : 'Avance registrado.',
        error: 'No se pudo registrar el avance.',
        action: async () => {
          if (mode === 'delivery') {
            await productionTraceRecorder.recordPartialDelivery({
              orderId: order.id,
              workName: order.workName,
              phase: row.phase,
              userId: session.userId,
              unidades: units,
              orderStatus: order.status,
              processKey: row.processKey,
              nota: note,
            })
          } else {
            await productionTraceRecorder.recordUnitsProgress({
              orderId: order.id,
              workName: order.workName,
              phase: row.phase,
              userId: session.userId,
              unidades: units,
              orderStatus: order.status,
              processKey: row.processKey,
              nota: note,
            })
          }
          const nextCompleted = row.completedUnits + units
          if (mode === 'progress' && nextCompleted >= row.totalUnits) {
            await productionTraceRecorder.recordPhaseEnd({
              orderId: order.id,
              workName: order.workName,
              phase: row.phase,
              userId: session.userId,
              orderStatus: order.status,
              processKey: row.processKey,
              nota: note,
            })
          }
          setDraftUnits(prev => ({ ...prev, [row.processKey]: '' }))
          await invalidate()
        },
      })
    } finally {
      setSavingKey(null)
    }
  }

  const handlePause = async (row: ProductionOperatorProcessRow) => {
    if (!order || !session || !row.assignedToUser) return
    const pauseReason = draftPauseReasons[row.processKey] ?? 'descanso_general'
    const note = draftNotes[row.processKey]?.trim() || undefined
    setSavingKey(row.processKey)
    try {
      await performAction({
        success: 'Parada registrada.',
        error: 'No se pudo registrar la parada.',
        action: async () => {
          await productionTraceRecorder.recordPause({
            orderId: order.id,
            workName: order.workName,
            phase: row.phase,
            userId: session.userId,
            pauseReason,
            orderStatus: order.status,
            processKey: row.processKey,
            nota: note,
          })
          await invalidate()
        },
      })
    } finally {
      setSavingKey(null)
    }
  }

  const handleResume = async (row: ProductionOperatorProcessRow) => {
    if (!order || !session || !row.assignedToUser) return
    const note = draftNotes[row.processKey]?.trim() || undefined
    setSavingKey(row.processKey)
    try {
      await performAction({
        success: 'Trabajo reanudado.',
        error: 'No se pudo reanudar el trabajo.',
        action: async () => {
          await productionTraceRecorder.recordResume({
            orderId: order.id,
            workName: order.workName,
            phase: row.phase,
            userId: session.userId,
            orderStatus: order.status,
            processKey: row.processKey,
            nota: note,
          })
          await invalidate()
        },
      })
    } finally {
      setSavingKey(null)
    }
  }

  if (!hasPermission('production.operator.workspace')) {
    return (
      <div className="operator-work">
        <p>No tiene permiso para acceder a Mi trabajo.</p>
      </div>
    )
  }

  if (ordersLoading || eventsLoading || authLoading) {
    return <div className="operator-work__state">{copy.loading}</div>
  }

  if (!order) {
    return (
      <div className="operator-work__state">
        <p>Orden no encontrada.</p>
        <button type="button" className="operator-work__back" onClick={() => navigate(ROUTES.operatorWork.path)}>
          {copy.backToList}
        </button>
      </div>
    )
  }

  if (!summary) {
    return <div className="operator-work__state">{copy.loading}</div>
  }

  if (eventsError) {
    return (
      <div className="operator-work__state">
        <p>No se pudo cargar la trazabilidad de la orden.</p>
        <button type="button" className="operator-work__back" onClick={() => navigate(ROUTES.operatorWork.path)}>
          {copy.backToList}
        </button>
      </div>
    )
  }

  if (assignedRows.length === 0) {
    return (
      <div className="operator-work operator-workspace">
        <header className="operator-workspace__header">
          <div className="operator-workspace__header-main">
            <button
              type="button"
              className="operator-workspace__back"
              onClick={() => navigate(ROUTES.operatorWork.path)}
            >
              ← {copy.backToList}
            </button>
            <h1 className="operator-workspace__title">
              Orden {formatProductionOrderId(order.id)} — {order.workName}
            </h1>
          </div>
        </header>
        <div className="operator-work__state">
          <p>No tiene procesos asignados en esta orden.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="operator-work operator-workspace">
      <header className="operator-workspace__header">
        <div className="operator-workspace__header-main">
          <button
            type="button"
            className="operator-workspace__back"
            onClick={() => navigate(ROUTES.operatorWork.path)}
          >
            ← {copy.backToList}
          </button>
          <h1 className="operator-workspace__title">
            Orden {formatProductionOrderId(order.id)} — {order.workName}
          </h1>
          <p className="operator-workspace__meta">
            {copy.workspace.orderMeta(
              clientName,
              formatOrderDate(order.date),
              summary.totalUnits.toLocaleString('es-CO')
            )}
          </p>
          <ProductionOrderStatusBadge status={order.productionStatus} />
        </div>
        <button
          type="button"
          className="operator-workspace__close"
          onClick={() => navigate(ROUTES.operatorWork.path)}
          aria-label={copy.backToList}
        >
          ×
        </button>
      </header>

      <section className="operator-workspace__kpis">
        <article className="operator-workspace__kpi operator-workspace__kpi--primary">
          <strong>{summary.totalUnits.toLocaleString('es-CO')}</strong>
          <span>{copy.kpi.total}</span>
        </article>
        <article className="operator-workspace__kpi">
          <strong>{summary.completedAllProcesses.toLocaleString('es-CO')}</strong>
          <span>{copy.kpi.completedProcesses}</span>
        </article>
        <article className="operator-workspace__kpi">
          <strong>{summary.deliveredUnits.toLocaleString('es-CO')}</strong>
          <span>{copy.kpi.delivered}</span>
        </article>
        <article className="operator-workspace__kpi">
          <strong>{summary.deliverableBalance.toLocaleString('es-CO')}</strong>
          <span>{copy.kpi.deliverable}</span>
        </article>
      </section>

      <section className="operator-workspace__delivery">
        <div className="operator-workspace__delivery-head">
          <span>{copy.kpi.deliveryProgress}</span>
          <strong>{summary.deliveryProgressPct}%</strong>
        </div>
        <div className="operator-workspace__delivery-bar" aria-hidden>
          <span style={{ width: `${summary.deliveryProgressPct}%` }} />
        </div>
        <p className="operator-workspace__delivery-legend">{copy.workspace.deliveryLegend}</p>
      </section>

      <section className="operator-workspace__alert">
        <p>
          <strong>{copy.alerts.noDeliverable}</strong>
          <span>
            {copy.alerts.processesPassed(summary.completedAllProcesses, summary.totalUnits)}
            {bottleneckLabel ? ` · ${copy.alerts.bottleneck(bottleneckLabel)}` : ''}
          </span>
        </p>
        {summary.laborTimeMs > 0 ? (
          <p className="operator-workspace__alert-time">
            {copy.workspace.laborOrder}: {formatDurationMs(summary.laborTimeMs)}
          </p>
        ) : null}
      </section>

      <div className="operator-workspace__current">
        {copy.workspace.currentProcessTitle(currentProcessLabel)}
      </div>

      {(['base', 'terminados', 'acabados'] as const).map(section => {
        const sectionRows = assignedRows.filter(row => row.section === section)
        if (sectionRows.length === 0) return null
        return (
          <section key={section} className="operator-workspace__section">
            <h2 className="operator-workspace__section-title">{sectionTitle[section]}</h2>
            <div className="operator-workspace__process-grid">
              {sectionRows.map(row => {
                const trace = traceByProcess.get(row.processKey) ?? {
                  laborTimeMs: 0,
                  pausedTimeMs: 0,
                  pauseCount: 0,
                  isPausedNow: false,
                  pauses: [],
                  startedAt: null,
                }

                return (
                  <OperatorProcessCard
                    key={row.processKey}
                    row={row}
                    prerequisiteLabel={
                      row.prerequisiteKey
                        ? rows.find(item => item.processKey === row.prerequisiteKey)?.label ?? null
                        : null
                    }
                    trace={trace}
                    draftUnits={draftUnits[row.processKey] ?? ''}
                    draftNote={draftNotes[row.processKey] ?? ''}
                    draftPauseReason={draftPauseReasons[row.processKey] ?? 'descanso_general'}
                    saving={savingKey === row.processKey}
                    onDraftUnitsChange={value =>
                      setDraftUnits(prev => ({ ...prev, [row.processKey]: value }))
                    }
                    onDraftNoteChange={value =>
                      setDraftNotes(prev => ({ ...prev, [row.processKey]: value }))
                    }
                    onDraftPauseReasonChange={value =>
                      setDraftPauseReasons(prev => ({ ...prev, [row.processKey]: value }))
                    }
                    onStartProcess={() => void handleStartProcess(row)}
                    onRegisterProgress={() => void handleRegisterUnits(row, 'progress')}
                    onRegisterDelivery={() => void handleRegisterUnits(row, 'delivery')}
                    onPause={() => void handlePause(row)}
                    onResume={() => void handleResume(row)}
                  />
                )
              })}
            </div>
          </section>
        )
      })}

      <section className="operator-workspace__timeline">
        <h2>{copy.workspace.timelineTitle}</h2>
        {deliveryHistory.length === 0 ? (
          <p>{copy.workspace.timelineEmpty}</p>
        ) : (
          <ol className="operator-workspace__timeline-list">
            {deliveryHistory.map(entry => (
              <li key={entry.id}>
                <span className="operator-workspace__timeline-dot" aria-hidden />
                <div>
                  <strong>{entry.processLabel}</strong>
                  <p>
                    {entry.units.toLocaleString('es-CO')} u ·{' '}
                    {formatTraceDateTime(entry.at)}
                  </p>
                  {entry.note ? <p className="operator-workspace__timeline-note">{entry.note}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {summary.isOrderComplete ? (
        <p className="operator-workspace__complete">
          {copy.alerts.orderComplete(formatDurationMs(summary.laborTimeMs))}
        </p>
      ) : null}
    </div>
  )
}

export default ProductionOperatorOrderPanel
