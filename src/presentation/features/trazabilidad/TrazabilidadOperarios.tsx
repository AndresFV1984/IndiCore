import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Container } from '../../../di/container'
import { ROUTES } from '../../../config/appRoutes'
import type { OrderStatus } from '../../../core/domain/value-objects/OrderStatus'
import {
  PRODUCTION_TRACE_PAUSE_REASONS,
  type ProductionTracePauseReasonId,
  type ProductionTracePhaseId,
} from '../../../core/domain/entities/ProductionTrace'
import SearchBox from '../../components/ui/SearchBox'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/ui/StatusBadge'
import { usePagination } from '../../hooks/usePagination'
import { useUsersHook } from '../../hooks/useUsers'
import { useClientsHook } from '../../hooks/useClients'
import { useOrdersHook } from '../../hooks/useOrders'
import { ProductionSubNavIcon } from '../production/ProductionSubNav'
import { PRODUCTION_PHASE_LABELS } from '../production/utils/productionOperatorAssignment'
import { productionTraceRecorder } from '../../services/productionTraceRecorder'
import { TRAZABILIDAD_COPY as copy } from './constants/trazabilidadCopy'
import {
  buildOperarioTraceReport,
  formatDurationMs,
  formatTraceDateTime,
  type OperarioTraceRow,
} from './utils/buildOperarioTraceReport'
import { performAction } from '../../utils/actionFeedback'
import '../production/Production.css'
import './TrazabilidadOperarios.css'

const container = Container.getInstance()

type ModalMode = 'partial' | 'progress' | 'pause' | 'resume'

const PHASE_OPTIONS = Object.entries(PRODUCTION_PHASE_LABELS) as Array<
  [ProductionTracePhaseId, string]
>

const PAUSE_REASON_OPTIONS = Object.entries(PRODUCTION_TRACE_PAUSE_REASONS) as Array<
  [ProductionTracePauseReasonId, string]
>

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'En curso',
  'Revisión',
  'Listo',
  'Entregado',
  'Cancelado',
]

const PHASE_ICON: Record<ProductionTracePhaseId, string> = {
  preprensa: 'diseno',
  'corte-papel': 'corte',
  impresion: 'tintas',
  terminados: 'asignacion',
  acabados: 'acabado',
  cobro: 'factura',
}

const SESSION_CARD_CLASS: Record<OperarioTraceRow['operationStatus'], string> = {
  'En curso': 'trazabilidad-operarios__session-card--active',
  Completado: 'trazabilidad-operarios__session-card--done',
  Pausado: 'trazabilidad-operarios__session-card--paused',
}

const getInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')

const TraceKpiIcon: React.FC<{ id: string }> = ({ id }) => {
  if (id === 'clock') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 7.5v4.5l3 2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }
  if (id === 'pause') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M9 7v10M15 7v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  }
  if (id === 'units') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M5 7h14v10H5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 11h6M9 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }
  if (id === 'partial') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 18h12M8 14h8M10 10h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 4h10v16H7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 8h4M10 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

const TracePauseTimeline: React.FC<{ row: OperarioTraceRow }> = ({ row }) => (
  <details className="trazabilidad-operarios__pause-panel">
    <summary className="trazabilidad-operarios__pause-panel-summary">
      {copy.card.pauseHistory}
      <span className="trazabilidad-operarios__pause-panel-count">{row.pausaCount}</span>
    </summary>
    {row.pausas.length === 0 ? (
      <p className="trazabilidad-operarios__pause-empty">{copy.card.noPauses}</p>
    ) : (
      <ol className="trazabilidad-operarios__pause-list">
        {row.pausas.map((pausa, index) => (
          <li
            key={`${pausa.id}-${index}`}
            className={clsx(
              'trazabilidad-operarios__pause-item',
              pausa.isOpen && 'trazabilidad-operarios__pause-item--open'
            )}
          >
            <div className="trazabilidad-operarios__pause-item-head">
              <strong>{pausa.reasonLabel}</strong>
              <span>
                {pausa.isOpen ? copy.card.pauseOpen : copy.card.pauseClosed} ·{' '}
                {formatDurationMs(pausa.durationMs)}
              </span>
            </div>
            <div className="trazabilidad-operarios__pause-item-times">
              <span>
                {copy.card.startedAt}: {formatTraceDateTime(pausa.startedAt)}
              </span>
              <span>
                {copy.card.endedAt}:{' '}
                {pausa.endedAt ? formatTraceDateTime(pausa.endedAt) : copy.card.inProgress}
              </span>
            </div>
            {pausa.note ? (
              <p className="trazabilidad-operarios__pause-item-note">{pausa.note}</p>
            ) : null}
          </li>
        ))}
      </ol>
    )}
  </details>
)

const TraceSessionCard: React.FC<{
  row: OperarioTraceRow
  onPartial: () => void
  onProgress: () => void
  onPause: () => void
  onResume: () => void
}> = ({ row, onPartial, onProgress, onPause, onResume }) => (
  <article
    className={clsx(
      'trazabilidad-operarios__session-card',
      SESSION_CARD_CLASS[row.operationStatus]
    )}
  >
    <header className="trazabilidad-operarios__session-head">
      <div className="trazabilidad-operarios__session-phase">
        <span className="trazabilidad-operarios__session-phase-icon" aria-hidden>
          <ProductionSubNavIcon id={PHASE_ICON[row.phase]} />
        </span>
        <div className="trazabilidad-operarios__session-phase-text">
          <span className="trazabilidad-operarios__session-phase-label">{row.phaseLabel}</span>
          <strong className="trazabilidad-operarios__session-order">{row.orderLabel}</strong>
        </div>
      </div>
      <div className="trazabilidad-operarios__session-badges">
        <StatusBadge status={row.orderStatus} />
        <span
          className={clsx(
            'trazabilidad-operarios__operation-status',
            `trazabilidad-operarios__operation-status--${row.operationStatus
              .toLowerCase()
              .replace(' ', '-')}`
          )}
        >
          {row.isPausedNow ? copy.card.pausedNow : row.operationStatus}
        </span>
      </div>
    </header>

    <div>
      <p className="trazabilidad-operarios__session-work">{row.workName}</p>
      <p className="trazabilidad-operarios__session-client">{row.clientName}</p>
    </div>

    <div className="trazabilidad-operarios__session-operator">
      <span className="trazabilidad-operarios__session-avatar" aria-hidden>
        {getInitials(row.userName)}
      </span>
      <span className="trazabilidad-operarios__session-operator-name">{row.userName}</span>
    </div>

    <div className="trazabilidad-operarios__session-metrics">
      <div className="trazabilidad-operarios__session-metric trazabilidad-operarios__session-metric--span">
        <span>{copy.card.startedAt}</span>
        <strong>{formatTraceDateTime(row.startedAt)}</strong>
      </div>
      <div className="trazabilidad-operarios__session-metric trazabilidad-operarios__session-metric--span">
        <span>{copy.card.endedAt}</span>
        <strong>{row.endedAt ? formatTraceDateTime(row.endedAt) : copy.card.inProgress}</strong>
      </div>
      <div className="trazabilidad-operarios__session-metric">
        <span>{copy.card.laborTime}</span>
        <strong>{formatDurationMs(row.tiempoLaboradoMs)}</strong>
      </div>
      <div className="trazabilidad-operarios__session-metric">
        <span>{copy.card.pausedTime}</span>
        <strong>{formatDurationMs(row.tiempoPausadoMs)}</strong>
      </div>
      <div className="trazabilidad-operarios__session-metric">
        <span>{copy.card.pauseCount}</span>
        <strong>{row.pausaCount}</strong>
      </div>
      <div className="trazabilidad-operarios__session-metric">
        <span>{copy.card.processedUnits}</span>
        <strong>{row.unidadesProcesadas.toLocaleString('es-CO')}</strong>
      </div>
    </div>

    <TracePauseTimeline row={row} />

    <footer className="trazabilidad-operarios__session-actions">
      {row.isPausedNow ? (
        <button type="button" className="trazabilidad-operarios__action-btn trazabilidad-operarios__action-btn--primary" onClick={onResume}>
          {copy.actions.registerResume}
        </button>
      ) : row.endedAt ? null : (
        <button type="button" className="trazabilidad-operarios__action-btn" onClick={onPause}>
          {copy.actions.registerPause}
        </button>
      )}
      <button type="button" className="trazabilidad-operarios__action-btn" onClick={onPartial}>
        {copy.actions.registerPartial}
      </button>
      <button type="button" className="trazabilidad-operarios__action-btn" onClick={onProgress}>
        {copy.actions.registerProgress}
      </button>
      <Link
        to={`${ROUTES.production.path}/${row.orderId}`}
        className="trazabilidad-operarios__action-link"
      >
        {copy.actions.openOrder}
      </Link>
    </footer>
  </article>
)

const TrazabilidadOperarios: React.FC = () => {
  const queryClient = useQueryClient()
  const { users } = useUsersHook()
  const { clients } = useClientsHook()
  const { orders, loading: ordersLoading } = useOrdersHook()

  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [phaseFilter, setPhaseFilter] = useState<ProductionTracePhaseId | ''>('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [modalRow, setModalRow] = useState<OperarioTraceRow | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>('partial')
  const [modalUnits, setModalUnits] = useState('')
  const [modalNote, setModalNote] = useState('')
  const [modalPauseReason, setModalPauseReason] = useState<ProductionTracePauseReasonId>('fin_horario')

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['production-trace-events'],
    queryFn: () => container.getProductionTraceUseCases().getEvents(),
    staleTime: 30_000,
  })

  const clientsById = useMemo(() => {
    const map: Record<string, string> = {}
    clients.forEach(client => {
      map[client.id] = client.name
    })
    return map
  }, [clients])

  const fromIso = fromDate ? new Date(`${fromDate}T00:00:00`).toISOString() : undefined
  const toIso = toDate ? new Date(`${toDate}T23:59:59`).toISOString() : undefined

  const report = useMemo(
    () =>
      buildOperarioTraceReport({
        orders,
        events,
        users,
        clientsById,
        userId: userFilter || undefined,
        phase: phaseFilter || undefined,
        from: fromIso,
        to: toIso,
      }),
    [orders, events, users, clientsById, userFilter, phaseFilter, fromIso, toIso]
  )

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return report.rows.filter(row => {
      if (statusFilter && row.orderStatus !== statusFilter) return false
      if (!q) return true
      const haystack = [
        row.orderLabel,
        row.workName,
        row.clientName,
        row.userName,
        row.phaseLabel,
        row.orderStatus,
        row.operationStatus,
        ...row.pausas.map(pausa => `${pausa.reasonLabel} ${pausa.note ?? ''}`),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [report.rows, searchQuery, statusFilter])

  const {
    page,
    setPage,
    totalPages,
    paginatedItems,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredRows, 6)

  const loading = ordersLoading || eventsLoading
  const hasActiveFilters = Boolean(
    userFilter || phaseFilter || statusFilter || fromDate || toDate || searchQuery.trim()
  )

  const clearFilters = () => {
    setSearchQuery('')
    setUserFilter('')
    setPhaseFilter('')
    setStatusFilter('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const openModal = (row: OperarioTraceRow, mode: ModalMode) => {
    setModalRow(row)
    setModalMode(mode)
    setModalUnits('')
    setModalNote('')
    setModalPauseReason('fin_horario')
  }

  const closeModal = () => {
    setModalRow(null)
    setModalUnits('')
    setModalNote('')
  }

  const modalTitle = useMemo(() => {
    switch (modalMode) {
      case 'partial':
        return copy.modal.partialTitle
      case 'progress':
        return copy.modal.progressTitle
      case 'pause':
        return copy.modal.pauseTitle
      case 'resume':
        return copy.modal.resumeTitle
    }
  }, [modalMode])

  const modalHint = useMemo(() => {
    switch (modalMode) {
      case 'partial':
        return copy.modal.partialHint
      case 'progress':
        return copy.modal.progressHint
      case 'pause':
        return copy.modal.pauseHint
      case 'resume':
        return copy.modal.resumeHint
    }
  }, [modalMode])

  const handleSaveModal = async () => {
    if (!modalRow) return

    if (modalMode === 'partial' || modalMode === 'progress') {
      const unidades = Number(modalUnits.replace(/\D/g, ''))
      if (!Number.isFinite(unidades) || unidades <= 0) return
    }

    if (modalMode === 'pause' && modalPauseReason === 'otro' && !modalNote.trim()) return

    await performAction({
      success: 'Registro de trazabilidad guardado.',
      error: 'No se pudo guardar el registro.',
      action: async () => {
        if (modalMode === 'partial') {
          await productionTraceRecorder.recordPartialDelivery({
            orderId: modalRow.orderId,
            workName: modalRow.workName,
            phase: modalRow.phase,
            userId: modalRow.userId,
            unidades: Number(modalUnits.replace(/\D/g, '')),
            orderStatus: modalRow.orderStatus,
            nota: modalNote.trim() || undefined,
          })
        } else if (modalMode === 'progress') {
          await productionTraceRecorder.recordUnitsProgress({
            orderId: modalRow.orderId,
            workName: modalRow.workName,
            phase: modalRow.phase,
            userId: modalRow.userId,
            unidades: Number(modalUnits.replace(/\D/g, '')),
            orderStatus: modalRow.orderStatus,
            nota: modalNote.trim() || undefined,
          })
        } else if (modalMode === 'pause') {
          await productionTraceRecorder.recordPause({
            orderId: modalRow.orderId,
            workName: modalRow.workName,
            phase: modalRow.phase,
            userId: modalRow.userId,
            pauseReason: modalPauseReason,
            orderStatus: modalRow.orderStatus,
            nota: modalNote.trim() || undefined,
          })
        } else {
          await productionTraceRecorder.recordResume({
            orderId: modalRow.orderId,
            workName: modalRow.workName,
            phase: modalRow.phase,
            userId: modalRow.userId,
            orderStatus: modalRow.orderStatus,
            nota: modalNote.trim() || undefined,
          })
        }
        await queryClient.invalidateQueries({ queryKey: ['production-trace-events'] })
      },
    })
    closeModal()
  }

  return (
    <div className="remissions-container trazabilidad-operarios">
      <header className="trazabilidad-operarios__hero">
        <div className="trazabilidad-operarios__hero-text">
          <h1 className="trazabilidad-operarios__title">{copy.title}</h1>
          <p className="trazabilidad-operarios__subtitle">{copy.subtitle}</p>
        </div>
        <div className="trazabilidad-operarios__search">
          <SearchBox
            value={searchQuery}
            onChange={value => {
              setSearchQuery(value)
              setPage(1)
            }}
            placeholder={copy.searchPlaceholder}
          />
        </div>
      </header>

      <section className="trazabilidad-operarios__toolbar" aria-label={copy.filters.title}>
        <div className="trazabilidad-operarios__toolbar-head">
          <h2 className="trazabilidad-operarios__toolbar-title">{copy.filters.title}</h2>
          {hasActiveFilters ? (
            <button
              type="button"
              className="trazabilidad-operarios__toolbar-clear"
              onClick={clearFilters}
            >
              {copy.filters.clear}
            </button>
          ) : null}
        </div>
        <div className="trazabilidad-operarios__filters">
          <label className="trazabilidad-operarios__filter">
            <span>{copy.filters.user}</span>
            <select
              value={userFilter}
              onChange={e => {
                setUserFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">{copy.filters.userAll}</option>
              {users
                .filter(user => user.state)
                .map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="trazabilidad-operarios__filter">
            <span>{copy.filters.phase}</span>
            <select
              value={phaseFilter}
              onChange={e => {
                setPhaseFilter(e.target.value as ProductionTracePhaseId | '')
                setPage(1)
              }}
            >
              <option value="">{copy.filters.phaseAll}</option>
              {PHASE_OPTIONS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="trazabilidad-operarios__filter">
            <span>{copy.filters.orderStatus}</span>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as OrderStatus | '')
                setPage(1)
              }}
            >
              <option value="">{copy.filters.orderStatusAll}</option>
              {ORDER_STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="trazabilidad-operarios__filter">
            <span>{copy.filters.from}</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => {
                setFromDate(e.target.value)
                setPage(1)
              }}
            />
          </label>
          <label className="trazabilidad-operarios__filter">
            <span>{copy.filters.to}</span>
            <input
              type="date"
              value={toDate}
              onChange={e => {
                setToDate(e.target.value)
                setPage(1)
              }}
            />
          </label>
        </div>
      </section>

      {!loading ? (
        <p className="trazabilidad-operarios__results-meta">
          {totalItems === 1 ? copy.results.one : copy.results.many(totalItems)}
        </p>
      ) : null}

      <div className="trazabilidad-operarios__kpi-grid">
        <article className="trazabilidad-operarios__kpi">
          <span className="trazabilidad-operarios__kpi-icon">
            <TraceKpiIcon id="sessions" />
          </span>
          <div className="trazabilidad-operarios__kpi-body">
            <span>{copy.kpi.sesiones}</span>
            <strong>{report.summary.sesiones}</strong>
          </div>
        </article>
        <article className="trazabilidad-operarios__kpi">
          <span className="trazabilidad-operarios__kpi-icon">
            <TraceKpiIcon id="clock" />
          </span>
          <div className="trazabilidad-operarios__kpi-body">
            <span>{copy.kpi.tiempo}</span>
            <strong>{formatDurationMs(report.summary.tiempoLaboradoMs)}</strong>
          </div>
        </article>
        <article className="trazabilidad-operarios__kpi">
          <span className="trazabilidad-operarios__kpi-icon">
            <TraceKpiIcon id="pause" />
          </span>
          <div className="trazabilidad-operarios__kpi-body">
            <span>{copy.kpi.pausado}</span>
            <strong>{formatDurationMs(report.summary.tiempoPausadoMs)}</strong>
          </div>
        </article>
        <article className="trazabilidad-operarios__kpi">
          <span className="trazabilidad-operarios__kpi-icon">
            <TraceKpiIcon id="pause" />
          </span>
          <div className="trazabilidad-operarios__kpi-body">
            <span>{copy.kpi.paros}</span>
            <strong>{report.summary.pausaCount}</strong>
          </div>
        </article>
        <article className="trazabilidad-operarios__kpi">
          <span className="trazabilidad-operarios__kpi-icon">
            <TraceKpiIcon id="units" />
          </span>
          <div className="trazabilidad-operarios__kpi-body">
            <span>{copy.kpi.unidades}</span>
            <strong>{report.summary.unidadesProcesadas.toLocaleString('es-CO')}</strong>
          </div>
        </article>
      </div>

      {loading ? (
        <div className="trazabilidad-operarios__state">
          <span className="trazabilidad-operarios__state-icon">
            <TraceKpiIcon id="clock" />
          </span>
          <p className="trazabilidad-operarios__state-body">{copy.loading}</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="trazabilidad-operarios__state">
          <span className="trazabilidad-operarios__state-icon">
            <TraceKpiIcon id="sessions" />
          </span>
          <h2 className="trazabilidad-operarios__state-title">{copy.empty.title}</h2>
          <p className="trazabilidad-operarios__state-body">{copy.empty.body}</p>
        </div>
      ) : (
        <>
          <div className="trazabilidad-operarios__list">
            {paginatedItems.map(row => (
              <TraceSessionCard
                key={row.id}
                row={row}
                onPartial={() => openModal(row, 'partial')}
                onProgress={() => openModal(row, 'progress')}
                onPause={() => openModal(row, 'pause')}
                onResume={() => openModal(row, 'resume')}
              />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </>
      )}

      {modalRow ? (
        <div className="trazabilidad-operarios__modal-backdrop" onClick={closeModal}>
          <div
            className="trazabilidad-operarios__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trazabilidad-modal-title"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="trazabilidad-modal-title">{modalTitle}</h2>
            <p className="trazabilidad-operarios__modal-meta">
              {modalRow.orderLabel} · {modalRow.phaseLabel} · {modalRow.userName}
            </p>
            <p className="trazabilidad-operarios__modal-hint">{modalHint}</p>

            {modalMode === 'pause' ? (
              <label className="trazabilidad-operarios__modal-field">
                <span>{copy.modal.reasonLabel}</span>
                <select
                  value={modalPauseReason}
                  onChange={e =>
                    setModalPauseReason(e.target.value as ProductionTracePauseReasonId)
                  }
                >
                  {PAUSE_REASON_OPTIONS.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {modalMode === 'partial' || modalMode === 'progress' ? (
              <label className="trazabilidad-operarios__modal-field">
                <span>{copy.modal.unitsLabel}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={modalUnits}
                  onChange={e => setModalUnits(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </label>
            ) : null}

            <label className="trazabilidad-operarios__modal-field">
              <span>
                {modalMode === 'pause' && modalPauseReason === 'otro'
                  ? copy.modal.noteRequiredLabel
                  : copy.modal.noteLabel}
              </span>
              <textarea value={modalNote} onChange={e => setModalNote(e.target.value)} rows={3} />
            </label>

            <div className="trazabilidad-operarios__modal-actions">
              <button type="button" className="production-btn-secondary" onClick={closeModal}>
                {copy.modal.cancel}
              </button>
              <button
                type="button"
                className="production-btn-primary"
                onClick={() => void handleSaveModal()}
              >
                {copy.modal.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default TrazabilidadOperarios
