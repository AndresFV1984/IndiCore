import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../../di/container'
import { ROUTES } from '../../../config/appRoutes'
import SearchBox from '../../components/ui/SearchBox'
import Pagination from '../../components/ui/Pagination'
import ProductionOrderStatusBadge from '../../components/ui/ProductionOrderStatusBadge'
import { usePagination } from '../../hooks/usePagination'
import { useAuth } from '../../hooks/useAuth'
import { useOrdersHook } from '../../hooks/useOrders'
import { useClientsHook } from '../../hooks/useClients'
import { useUsersHook } from '../../hooks/useUsers'
import { formatProductionOrderId } from '../../../core/domain/value-objects/ProductionOrderId'
import { filterOrdersAssignedToOperator } from '../../../core/domain/services/productionOperatorWorkflow'
import { formatDurationMs } from '../trazabilidad/utils/buildOperarioTraceReport'
import { OPERATOR_WORK_COPY as copy } from './constants/operatorWorkCopy'
import {
  buildOperatorOrderCardModel,
  matchesOperatorOrderFilter,
  type OperatorOrderListFilter,
} from './utils/operatorOrderListUtils'
import '../orders/Orders.css'
import '../remissions/Remissions.css'
import './OperatorWork.css'

const container = Container.getInstance()

const buildOperatorOrderPath = (orderId: string): string =>
  `${ROUTES.operatorWork.path}/${encodeURIComponent(orderId)}`

const FILTER_OPTIONS: OperatorOrderListFilter[] = ['all', 'active', 'pending', 'done']

const OperatorOrderCard: React.FC<{
  card: ReturnType<typeof buildOperatorOrderCardModel>
  clientName: string
  orderPath: string
}> = ({ card, clientName, orderPath }) => {
  const { order, summary, activeRow, assignedRows, doneCount, listStatus } = card
  const processPct = assignedRows.length
    ? Math.round((doneCount / assignedRows.length) * 100)
    : 0

  const statusLabel =
    listStatus === 'done'
      ? copy.card.completed
      : listStatus === 'active'
        ? copy.card.inProgress
        : activeRow?.canOperate
          ? copy.card.nextUp
          : copy.card.waiting

  return (
    <Link
      to={orderPath}
      className={clsx(
        'operator-inbox-card',
        'operator-inbox-card--link',
        `operator-inbox-card--${listStatus}`
      )}
    >
      <div className="operator-inbox-card__top">
        <div className="operator-inbox-card__identity">
          <span className="operator-inbox-card__code">{formatProductionOrderId(order.id)}</span>
          <span className={clsx('operator-inbox-card__state', `operator-inbox-card__state--${listStatus}`)}>
            {statusLabel}
          </span>
        </div>
        <ProductionOrderStatusBadge status={order.productionStatus} />
      </div>

      <h2 className="operator-inbox-card__title">{order.workName}</h2>

      <div className="operator-inbox-card__metrics">
        <div className="operator-inbox-card__metric">
          <span>{copy.card.client}</span>
          <strong>{clientName}</strong>
        </div>
        <div className="operator-inbox-card__metric">
          <span>{copy.card.delivery}</span>
          <strong>{summary.deliveryProgressPct}%</strong>
          <div className="operator-inbox-card__bar">
            <span style={{ width: `${summary.deliveryProgressPct}%` }} />
          </div>
        </div>
        <div className="operator-inbox-card__metric">
          <span>{copy.card.processes}</span>
          <strong>{copy.card.step(doneCount, assignedRows.length)}</strong>
          <div className="operator-inbox-card__bar operator-inbox-card__bar--teal">
            <span style={{ width: `${processPct}%` }} />
          </div>
        </div>
      </div>

      <div className="operator-inbox-card__phases">
        <span className="operator-inbox-card__phases-label">{copy.card.yourProcesses}</span>
        <div className="operator-inbox-card__chips">
          {assignedRows.map(row => (
            <span
              key={row.processKey}
              className={clsx(
                'operator-inbox-card__chip',
                `operator-inbox-card__chip--${row.status}`
              )}
            >
              {row.label}
            </span>
          ))}
        </div>
      </div>

      <footer className="operator-inbox-card__footer">
        <div className="operator-inbox-card__focus">
          {activeRow ? (
            <>
              <span className="operator-inbox-card__focus-label">{copy.currentProcess(activeRow.label)}</span>
              <span className="operator-inbox-card__focus-meta">
                {activeRow.completedUnits.toLocaleString('es-CO')} /{' '}
                {activeRow.totalUnits.toLocaleString('es-CO')} {copy.card.units}
                {summary.laborTimeMs > 0 ? ` · ${formatDurationMs(summary.laborTimeMs)}` : ''}
              </span>
            </>
          ) : (
            <span className="operator-inbox-card__focus-label">{copy.card.completed}</span>
          )}
        </div>
        <span className="operator-inbox-card__cta">
          {copy.card.open}
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </footer>
    </Link>
  )
}

const ProductionOperatorOrderList: React.FC = () => {
  const { session, hasPermission } = useAuth()
  const { orders, loading: ordersLoading } = useOrdersHook()
  const { clients } = useClientsHook()
  const { users } = useUsersHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<OperatorOrderListFilter>('all')

  const userId = session?.userId ?? ''
  const currentUser = users.find(user => user.id === userId)

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['production-trace-events'],
    queryFn: () => container.getProductionTraceUseCases().getEvents(),
    staleTime: 30_000,
  })

  const clientsMap = useMemo(() => {
    const map: Record<string, string> = {}
    clients.forEach(client => {
      map[client.id] = client.name
    })
    return map
  }, [clients])

  const orderCards = useMemo(() => {
    if (!userId) return []
    return filterOrdersAssignedToOperator(orders, userId).map(order =>
      buildOperatorOrderCardModel(order, events, userId)
    )
  }, [orders, events, userId])

  const stats = useMemo(
    () => ({
      total: orderCards.length,
      active: orderCards.filter(card => card.listStatus === 'active').length,
      pending: orderCards.filter(card => card.listStatus === 'pending').length,
      done: orderCards.filter(card => card.listStatus === 'done').length,
    }),
    [orderCards]
  )

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return orderCards.filter(card => {
      if (!matchesOperatorOrderFilter(card, filter)) return false
      if (!q) return true
      const order = card.order
      return [
        formatProductionOrderId(order.id),
        order.workName,
        clientsMap[order.clientId] ?? '',
        order.productionStatus,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [orderCards, filter, searchQuery, clientsMap])

  const {
    page,
    setPage,
    totalPages,
    paginatedItems,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredCards, 6)

  useEffect(() => {
    setPage(1)
  }, [searchQuery, filter, setPage])

  if (!hasPermission('production.operator.workspace')) {
    return (
      <div className="operator-work">
        <p>No tiene permiso para acceder a Mi trabajo.</p>
      </div>
    )
  }

  const loading = ordersLoading || eventsLoading
  const displayName = currentUser?.name?.split(' ')[0] ?? 'Operador'

  return (
    <div className="orders-container operator-work operator-work--inbox">
      <div className="orders-header">
        <div className="orders-header-left">
          <h1 className="orders-title">{copy.title}</h1>
          <p className="orders-breadcrumb">{copy.breadcrumb(displayName)}</p>
          <p className="operator-work__header-note">{copy.subtitle}</p>
        </div>
        <div className="orders-header-right">
          <SearchBox
            placeholder={copy.searchPlaceholder}
            onSearch={value => setSearchQuery(value)}
            debounceMs={300}
          />
        </div>
      </div>

      <div className="remissions-kpi-grid" aria-label="Resumen de órdenes asignadas">
        <div className="remissions-kpi-card">
          <div className="remissions-kpi-label">{copy.stats.assigned}</div>
          <div className="remissions-kpi-value">{stats.total}</div>
          <div className="remissions-kpi-sublabel">En tu bandeja</div>
        </div>
        <div className="remissions-kpi-card remissions-kpi-card-warning">
          <div className="remissions-kpi-label">{copy.stats.active}</div>
          <div className="remissions-kpi-value">{stats.active}</div>
          <div className="remissions-kpi-sublabel">Con avance en curso</div>
        </div>
        <div className="remissions-kpi-card">
          <div className="remissions-kpi-label">{copy.stats.pending}</div>
          <div className="remissions-kpi-value">{stats.pending}</div>
          <div className="remissions-kpi-sublabel">Esperando turno</div>
        </div>
        <div className="remissions-kpi-card">
          <div className="remissions-kpi-label">{copy.stats.done}</div>
          <div className="remissions-kpi-value">{stats.done}</div>
          <div className="remissions-kpi-sublabel remissions-kpi-sublabel-success">Procesos cerrados</div>
        </div>
      </div>

      <div className="orders-section">
        <div className="orders-section-header">
          <h2 className="orders-section-title">{copy.sectionTitle}</h2>
          <div className="orders-section-actions">
            <select
              className="orders-status-select"
              value={filter}
              onChange={event => setFilter(event.target.value as OperatorOrderListFilter)}
              aria-label="Filtrar órdenes asignadas"
            >
              {FILTER_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {copy.filters[option]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="operator-inbox-section-body">
          {loading ? (
            <div className="operator-inbox-grid" aria-busy="true" aria-label={copy.loading}>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="operator-inbox-card operator-inbox-card--skeleton" />
              ))}
            </div>
          ) : orderCards.length === 0 ? (
            <div className="operator-inbox-empty">
              <div className="operator-inbox-empty__icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <h2>{copy.empty.title}</h2>
              <p>{copy.empty.body}</p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="operator-inbox-empty">
              <h2>{copy.emptyFilter.title}</h2>
              <p>{copy.emptyFilter.body}</p>
            </div>
          ) : (
            <>
              <div className="operator-inbox-grid">
                {paginatedItems.map(card => (
                  <OperatorOrderCard
                    key={card.order.id}
                    card={card}
                    clientName={clientsMap[card.order.clientId] ?? '—'}
                    orderPath={buildOperatorOrderPath(card.order.id)}
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
        </div>
      </div>
    </div>
  )
}

export default ProductionOperatorOrderList
