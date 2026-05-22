import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import SearchBox from '@/presentation/components/ui/SearchBox'
import ListRecordActions from '@/presentation/components/ui/ListRecordActions'
import Pagination from '@/presentation/components/ui/Pagination'
import RecordCell from '@/presentation/components/directory/RecordCell'
import { usePagination } from '@/presentation/hooks/usePagination'
import { useClientsHook } from '@/presentation/hooks/useClients'
import { Container } from '@/di/container'
import { Remission, RemissionStatus } from '@/core/domain/entities/Remission'
import { formatRemissionNumber } from '@/core/domain/value-objects/RemissionId'
import { formatProductionOrderId } from '@/core/domain/value-objects/ProductionOrderId'
import { ROUTES } from '@/config/appRoutes'
import { toRemissionDisplayStatus } from './RemissionStatusBadge'
import RemissionStatusBadge from './RemissionStatusBadge'
import RemissionsKpiGrid from './RemissionsKpiGrid'
import { confirmExport } from '@/presentation/utils/actionFeedback'
import '../orders/Orders.css'
import './Remissions.css'

const container = Container.getInstance()

const FILTER_OPTIONS: { value: RemissionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'Pendiente', label: 'Sin completar' },
  { value: 'Entregado', label: 'Entregadas' },
  { value: 'Cancelado', label: 'Canceladas' },
]

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-CO')}`
}

function itemsDescription(r: Remission): string {
  if (r.items.length === 0) return '—'
  const first = r.items[0].product
  if (r.items.length === 1) return first
  return `${first} +${r.items.length - 1}`
}

function totalQuantity(r: Remission): number {
  return r.items.reduce((sum, item) => sum + item.quantity, 0)
}

const Remissions: React.FC = () => {
  const navigate = useNavigate()
  const { clients } = useClientsHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<RemissionStatus | 'all'>('all')

  const { data: remissions = [], isLoading, error } = useQuery({
    queryKey: ['remissions'],
    queryFn: () => container.getRemissionUseCases().getRemissions(),
    staleTime: 5 * 60 * 1000,
  })

  const clientsMap = useMemo(() => {
    const map: Record<string, string> = {}
    clients.forEach((c) => {
      map[c.id] = c.name
    })
    return map
  }, [clients])

  const filtered = useMemo(() => {
    const headerQ = searchQuery.trim().toLowerCase()
    const tableQ = tableFilter.trim().toLowerCase()

    return remissions.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false

      const clientName = (clientsMap[r.clientId] || '').toLowerCase()
      const remNum = formatRemissionNumber(r.id).toLowerCase()
      const prodNum = formatProductionOrderId(r.orderId).toLowerCase()
      const desc = itemsDescription(r).toLowerCase()
      const haystack = `${remNum} ${prodNum} ${r.orderId.toLowerCase()} ${clientName} ${desc} ${toRemissionDisplayStatus(r.status).toLowerCase()}`

      if (headerQ && !haystack.includes(headerQ)) return false
      if (tableQ && !haystack.includes(tableQ)) return false
      return true
    })
  }, [remissions, searchQuery, tableFilter, statusFilter, clientsMap])

  const {
    page,
    setPage,
    totalPages,
    paginatedItems,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filtered)

  useEffect(() => {
    setPage(1)
  }, [searchQuery, tableFilter, statusFilter, setPage])

  const handleNewRemission = () => {
    console.log('Nueva remisión')
  }

  const handlePrint = (remissionId: string) => {
    console.log('Imprimir remisión', remissionId)
  }

  const handleExportList = async () => {
    if (!(await confirmExport('el listado de remisiones'))) return
    void import('@/presentation/utils/exportCsv').then(({ downloadCsv, todayExportSuffix }) => {
      downloadCsv(`remisiones-${todayExportSuffix()}`, [
        { label: 'N°', value: (r: Remission) => formatRemissionNumber(r.id) },
        { label: 'Destinatario', value: (r: Remission) => clientsMap[r.clientId] ?? r.clientId },
        { label: 'Descripción', value: (r: Remission) => itemsDescription(r), width: 44 },
        { label: 'Orden prod.', value: (r: Remission) => formatProductionOrderId(r.orderId) },
        { label: 'Fecha', value: (r: Remission) => format(r.date, 'dd MMM yyyy', { locale: es }) },
        { label: 'Cantidad', value: (r: Remission) => String(totalQuantity(r)) },
        { label: 'Valor total', value: (r: Remission) => formatCurrency(r.total.getValue()) },
        { label: 'Estado', value: (r: Remission) => toRemissionDisplayStatus(r.status) },
      ], filtered)
    })
  }

  const handleExportOne = async (r: Remission) => {
    if (!(await confirmExport(`la remisión ${formatRemissionNumber(r.id)}`))) return
    void import('@/presentation/utils/documentExports').then((m) =>
      m.exportRemision(r, (id) => clientsMap[id] ?? id)
    )
  }

  if (isLoading && remissions.length === 0) {
    return <div className="orders-loading">Cargando remisiones…</div>
  }

  return (
    <div className="orders-container remissions-dashboard">
      <div className="orders-header">
        <div className="orders-header-left">
          <h1 className="orders-title">Remisiones</h1>
          <p className="orders-breadcrumb">IndiColors › Remisiones</p>
        </div>
        <div className="orders-header-right">
          <SearchBox placeholder="Buscar…" onSearch={setSearchQuery} debounceMs={300} />
          <button type="button" className="remissions-btn-new" onClick={handleNewRemission}>
            + Nueva remisión
          </button>
        </div>
      </div>

      {error && (
        <div className="orders-error">
          {error instanceof Error ? error.message : 'Error al cargar remisiones'}
        </div>
      )}

      <RemissionsKpiGrid remissions={remissions} />

      <div className="orders-section">
        <div className="orders-section-header">
          <h2 className="orders-section-title">Remisiones</h2>
          <div className="orders-section-actions">
            <input
              type="text"
              placeholder="Filtrar…"
              className="orders-search-input"
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              aria-label="Filtrar remisiones en la tabla"
            />
            <select
              className="orders-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RemissionStatus | 'all')}
              aria-label="Filtrar por estado"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button type="button" className="orders-btn-export remissions-btn-export" onClick={handleExportList}>
              Exportar
            </button>
          </div>
        </div>

        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th className="orders-th-numero">N°</th>
                <th className="orders-th-cliente">DESTINATARIO</th>
                <th className="orders-th-descripcion">DESCRIPCIÓN</th>
                <th className="orders-th-orden-prod">ORDEN PROD.</th>
                <th className="orders-th-fecha">FECHA</th>
                <th className="orders-th-cantidad">CANTIDAD</th>
                <th className="orders-th-valor">VALOR TOTAL</th>
                <th className="orders-th-estado">ESTADO</th>
                <th className="orders-th-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((row) => {
                  const remLabel = formatRemissionNumber(row.id)
                  const prodLabel = formatProductionOrderId(row.orderId)

                  return (
                    <tr key={row.id}>
                      <td data-label="N°">{remLabel}</td>
                      <td data-label="Destinatario">
                        <RecordCell name={clientsMap[row.clientId] || row.clientId} />
                      </td>
                      <td data-label="Descripción">{itemsDescription(row)}</td>
                      <td data-label="Orden prod.">
                        <Link
                          to={`${ROUTES.production.path}/${row.orderId}`}
                          className="remissions-link"
                          title={`Ver orden ${formatProductionOrderId(row.orderId)}`}
                        >
                          {prodLabel}
                        </Link>
                      </td>
                      <td data-label="Fecha">{format(row.date, 'dd MMM yyyy', { locale: es })}</td>
                      <td data-label="Cantidad">{totalQuantity(row).toLocaleString('es-CO')}</td>
                      <td data-label="Valor total">{formatCurrency(row.total.getValue())}</td>
                      <td className="orders-td-estado" data-label="Estado">
                        <RemissionStatusBadge status={row.status} />
                      </td>
                      <td className="orders-td-acciones" data-label="Acciones">
                        <ListRecordActions
                          recordName={remLabel}
                          onView={() => navigate(`${ROUTES.production.path}/${row.orderId}`)}
                          onEdit={() => navigate(`${ROUTES.production.path}/${row.orderId}`)}
                          onExport={() => handleExportOne(row)}
                          onPrint={() => handlePrint(row.id)}
                        />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={9} className="orders-td-empty">
                    No se encontraron remisiones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={totalItems}
          itemLabel="remisiones"
          footerClassName="orders-footer list-footer"
          countClassName="orders-count list-footer-count"
        />
      </div>
    </div>
  )
}

export default Remissions
