import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBox from '@/presentation/components/ui/SearchBox'
import ListRecordActions from '@/presentation/components/ui/ListRecordActions'
import Pagination from '@/presentation/components/ui/Pagination'
import RecordCell from '@/presentation/components/directory/RecordCell'
import CellValue from '@/presentation/components/directory/CellValue'
import { usePagination } from '@/presentation/hooks/usePagination'
import { useOrdersHook } from '@/presentation/hooks/useOrders'
import { useClientsHook } from '@/presentation/hooks/useClients'
import { Order } from '@/core/domain/entities/Order'
import { formatPurchaseOrderNumber } from '@/core/domain/value-objects/PurchaseOrderId'
import type { OrderStatus } from '@/core/domain/value-objects/OrderStatus'
import { ROUTES } from '@/config/appRoutes'
import { toPedidoDisplayStatus } from '@/presentation/constants/orderStatusStyles'
import PurchaseOrderStatusBadge from './PurchaseOrderStatusBadge'
import OrdersKpiGrid from './OrdersKpiGrid'
import { confirmExport } from '@/presentation/utils/actionFeedback'
import {
  buildPedidoListExportFields,
  formatPedidoCurrency,
  formatPedidoQuantity,
  pedidoProductionRef,
} from '@/presentation/utils/ordersExport'
import '../remissions/Remissions.css'
import './Orders.css'

const FILTER_OPTIONS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'En curso', label: 'Pendientes' },
  { value: 'Revisión', label: 'En revisión' },
  { value: 'Listo', label: 'Confirmados' },
  { value: 'Entregado', label: 'Entregados' },
  { value: 'Cancelado', label: 'Cancelados' },
]

const Orders: React.FC = () => {
  const navigate = useNavigate()
  const { orders, loading } = useOrdersHook()
  const { clients } = useClientsHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')

  const clientsMap = useMemo(() => {
    const map: Record<string, string> = {}
    clients.forEach((c) => {
      map[c.id] = c.name
    })
    return map
  }, [clients])

  const filteredOrders = useMemo(() => {
    const headerQ = searchQuery.trim().toLowerCase()
    const tableQ = tableFilter.trim().toLowerCase()

    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false

      const clientName = (clientsMap[o.clientId] || '').toLowerCase()
      const pedidoNum = formatPurchaseOrderNumber(o.id).toLowerCase()
      const prodNum = pedidoProductionRef(o).toLowerCase()
      const haystack = `${pedidoNum} ${prodNum} ${o.id.toLowerCase()} ${o.workName.toLowerCase()} ${clientName} ${toPedidoDisplayStatus(o.status).toLowerCase()}`

      if (headerQ && !haystack.includes(headerQ)) return false
      if (tableQ && !haystack.includes(tableQ)) return false
      return true
    })
  }, [orders, searchQuery, tableFilter, statusFilter, clientsMap])

  const {
    page,
    setPage,
    totalPages,
    paginatedItems,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredOrders)

  useEffect(() => {
    setPage(1)
  }, [searchQuery, tableFilter, statusFilter, setPage])

  const handleNewOrder = () => {
    navigate(`${ROUTES.production.path}/new`)
  }

  const handleOpenOrder = (id: string) => {
    navigate(`${ROUTES.production.path}/${id}`)
  }

  const handlePrint = (orderId: string) => {
    console.log('Imprimir pedido', orderId)
  }

  const handleExportList = async () => {
    if (!(await confirmExport('el listado de pedidos'))) return
    void import('@/presentation/utils/exportCsv').then(({ downloadCsv, todayExportSuffix }) => {
      downloadCsv(
        `pedidos-${todayExportSuffix()}`,
        buildPedidoListExportFields(id => clientsMap[id] ?? id),
        filteredOrders
      )
    })
  }

  if (loading && orders.length === 0) {
    return <div className="orders-loading">Cargando pedidos…</div>
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <div className="orders-header-left">
          <h1 className="orders-title">Órdenes de pedido</h1>
          <p className="orders-breadcrumb">IndiColors › Pedidos</p>
        </div>
        <div className="orders-header-right">
          <SearchBox placeholder="Buscar…" onSearch={setSearchQuery} debounceMs={300} />
          <button type="button" className="orders-btn-new" onClick={handleNewOrder}>
            + Nuevo pedido
          </button>
        </div>
      </div>

      <OrdersKpiGrid orders={orders} />

      <div className="orders-section">
        <div className="orders-section-header">
          <h2 className="orders-section-title">Listado de pedidos</h2>
          <div className="orders-section-actions">
            <input
              type="text"
              placeholder="Filtrar…"
              className="orders-search-input"
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              aria-label="Filtrar pedidos en la tabla"
            />
            <select
              className="orders-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              aria-label="Filtrar por estado"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button type="button" className="orders-btn-export" onClick={handleExportList}>
              Exportar
            </button>
          </div>
        </div>

        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th className="orders-th-numero">N°</th>
                <th className="orders-th-cliente">CLIENTE</th>
                <th className="orders-th-descripcion">DESCRIPCIÓN</th>
                <th className="orders-th-cantidad">CANTIDAD</th>
                <th className="orders-th-valor">VALOR TOTAL</th>
                <th className="orders-th-estado">ESTADO</th>
                <th className="orders-th-orden-prod">ORDEN PROD.</th>
                <th className="orders-th-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((row) => {
                  const pedidoLabel = formatPurchaseOrderNumber(row.id)
                  const prodRef = pedidoProductionRef(row)

                  return (
                    <tr key={row.id}>
                      <td data-label="N°">{pedidoLabel}</td>
                      <td data-label="Cliente">
                        <RecordCell name={clientsMap[row.clientId] || row.clientId} />
                      </td>
                      <td data-label="Descripción">
                        <CellValue>{row.workName}</CellValue>
                      </td>
                      <td data-label="Cantidad">{formatPedidoQuantity(row) || '—'}</td>
                      <td data-label="Valor total">{formatPedidoCurrency(row.total.getValue())}</td>
                      <td className="orders-td-estado" data-label="Estado">
                        <PurchaseOrderStatusBadge status={row.status} />
                      </td>
                      <td data-label="Orden prod." className="orders-td-orden-prod">
                        {prodRef || <span className="orders-cell-empty">—</span>}
                      </td>
                      <td className="orders-td-acciones" data-label="Acciones">
                        <ListRecordActions
                          recordName={pedidoLabel}
                          onView={() => handleOpenOrder(row.id)}
                          onEdit={() => handleOpenOrder(row.id)}
                          onExport={async () => {
                            if (!(await confirmExport(`el pedido ${pedidoLabel}`))) return
                            void import('@/presentation/utils/documentExports').then((m) =>
                              m.exportPedido(row, (id) => clientsMap[id] ?? id)
                            )
                          }}
                          onPrint={() => handlePrint(row.id)}
                        />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="orders-td-empty">
                    No se encontraron pedidos
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
          itemLabel="pedidos"
          footerClassName="orders-footer list-footer"
          countClassName="orders-count list-footer-count"
        />
      </div>
    </div>
  )
}

export default Orders
