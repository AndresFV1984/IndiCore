import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../../components/ui/StatusBadge'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import { useOrdersHook } from '../../hooks/useOrders'
import { useClientsHook } from '../../hooks/useClients'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import { ROUTES } from '../../../config/appRoutes'
import { formatProductionOrderId } from '../../../core/domain/value-objects/ProductionOrderId'
import { formatPurchaseOrderNumber } from '../../../core/domain/value-objects/PurchaseOrderId'
import '../remissions/Remissions.css'
import '../orders/Orders.css'
import './Production.css'
import ProductionKpiGrid from './ProductionKpiGrid'
import RecordCell from '../../components/directory/RecordCell'
import { confirmAction, confirmExport } from '../../utils/actionFeedback'
import { productionDraftHasContent } from './utils/productionNewOrderDraft'
import { useProductionNewOrderDraftStore } from '../../stores/productionNewOrderDraftStore'

const ProductionList: React.FC = () => {
  const navigate = useNavigate()
  const { orders, loading } = useOrdersHook()
  const { clients } = useClientsHook()
  const draft = useProductionNewOrderDraftStore(s => s.draft)
  const clearDraft = useProductionNewOrderDraftStore(s => s.clearDraft)
  const [searchQuery, setSearchQuery] = useState('')
  const hasDraft = Boolean(draft && productionDraftHasContent(draft))

  const clientsMap = useMemo(() => {
    const map: Record<string, string> = {}
    clients.forEach(c => {
      map[c.id] = c.name
    })
    return map
  }, [clients])

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders
    const q = searchQuery.toLowerCase()
    return orders.filter(o =>
      formatProductionOrderId(o.id).toLowerCase().includes(q) ||
      formatPurchaseOrderNumber(o.id).toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.clientId.toLowerCase().includes(q) ||
      o.workName.toLowerCase().includes(q) ||
      (clientsMap[o.clientId] || '').toLowerCase().includes(q)
    )
  }, [orders, searchQuery, clientsMap])

  const {
    page,
    setPage,
    totalPages,
    paginatedItems,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredOrders)

  const handleSearch = (query: string) => setSearchQuery(query)

  const handleNewOrder = () => {
    navigate(`${ROUTES.production.path}/new`)
  }

  const handleContinueDraft = () => {
    navigate(`${ROUTES.production.path}/new`)
  }

  const handleDiscardDraft = async () => {
    if (
      !(await confirmAction(
        '¿Eliminar el borrador de la orden en curso? Se perderá toda la información no guardada.',
        { variant: 'danger', confirmLabel: 'Eliminar borrador', title: 'Eliminar borrador' }
      ))
    ) {
      return
    }
    clearDraft()
  }

  const handleOpenOrder = (id: string) => {
    navigate(`${ROUTES.production.path}/${id}`)
  }

  const handlePrint = (orderId: string) => {
    console.log('Imprimir orden de producción', orderId)
  }

  const handleExportList = async () => {
    if (!(await confirmExport('el listado de órdenes de producción'))) return
    void import('../../utils/exportCsv').then(({ downloadCsv, todayExportSuffix }) => {
      downloadCsv(`produccion-${todayExportSuffix()}`, [
        { label: 'Orden', value: o => formatProductionOrderId(o.id) },
        { label: 'Pedido', value: o => formatPurchaseOrderNumber(o.id) },
        { label: 'Cliente', value: o => clientsMap[o.clientId] ?? o.clientId },
        { label: 'Trabajo', value: o => o.workName, width: 40 },
        { label: 'Fecha', value: o => new Date(o.date).toLocaleDateString('es-CO') },
        { label: 'Cantidad', value: o => String(o.specs?.quantity ?? o.specs?.thousands ?? 0) },
        { label: 'Estado', value: o => o.status },
      ], filteredOrders)
    })
  }

  if (loading) {
    return <div className="orders-loading">Cargando órdenes de producción…</div>
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <div className="orders-header-left">
          <h1 className="orders-title">Órdenes de producción</h1>
          <p className="orders-breadcrumb">IndiColors › Producción</p>
        </div>
        <div className="orders-header-right">
          <SearchBox placeholder="Buscar…" onSearch={handleSearch} debounceMs={300} />
          <button type="button" className="orders-btn-new" onClick={handleNewOrder}>
            + Nueva orden
          </button>
        </div>
      </div>

      <ProductionKpiGrid orders={orders} />

      {hasDraft && (
        <div className="production-draft-banner" role="status">
          <div className="production-draft-banner__text">
            <strong>Orden en borrador</strong>
            <p className="production-draft-banner__desc">
              {draft?.workName?.trim()
                ? `«${draft.workName.trim()}» — puede continuar donde la dejó.`
                : 'Tiene una orden sin guardar. Puede continuar donde la dejó.'}
            </p>
          </div>
          <div className="production-draft-banner__actions">
            <button type="button" className="orders-btn-new" onClick={handleContinueDraft}>
              Continuar borrador
            </button>
            <button
              type="button"
              className="production-btn-secondary production-btn-secondary--danger"
              onClick={handleDiscardDraft}
            >
              Eliminar borrador
            </button>
          </div>
        </div>
      )}

      <div className="orders-section">
        <div className="orders-section-header">
          <h2 className="orders-section-title">Listado de órdenes</h2>
          <div className="orders-section-actions">
            <input
              type="text"
              placeholder="Filtrar…"
              className="orders-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="button" className="orders-btn-export" onClick={handleExportList}>
              Exportar
            </button>
          </div>
        </div>

        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th className="orders-th-cliente">CLIENTE</th>
                <th className="orders-th-orden-prod">FECHA</th>
                <th className="orders-th-numero">ORDEN</th>
                <th className="orders-th-cantidad">CANTIDAD</th>
                <th className="orders-th-descripcion">TRABAJO</th>
                <th className="orders-th-avance">AVANCE ENTREGA</th>
                <th className="orders-th-estado">ESTADO</th>
                <th className="orders-th-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map(row => {
                  const totalQty = row.specs?.quantity || row.specs?.thousands || 0
                  const delivered = row.status === 'Listo' ? totalQty : 0
                  const percent = totalQty > 0 ? Math.round((delivered / totalQty) * 100) : 0

                  return (
                    <tr key={row.id}>
                      <td data-label="Cliente">
                        <RecordCell name={clientsMap[row.clientId] || row.clientId} />
                      </td>
                      <td data-label="Fecha">{new Date(row.date).toLocaleDateString()}</td>
                      <td data-label="Orden">{formatProductionOrderId(row.id)}</td>
                      <td data-label="Cantidad">{row.specs?.quantity ?? row.specs?.thousands ?? '—'}</td>
                      <td data-label="Trabajo">{row.workName}</td>
                      <td className="orders-td-avance" data-label="Avance entrega">
                        <div className="orders-avance-progress">
                          <div className="orders-avance-progress-track">
                            <div className="orders-avance-bar">
                              <div
                                className="orders-avance-bar-fill"
                                style={{
                                  width: `${percent}%`,
                                  background: percent === 100 ? 'var(--green)' : 'var(--orange)',
                                }}
                              />
                            </div>
                            <div className="orders-avance-meta">
                              Entregado: {delivered} · Saldo: {totalQty - delivered}
                            </div>
                          </div>
                          <div className="orders-avance-percent">{percent}%</div>
                        </div>
                      </td>
                      <td className="orders-td-estado" data-label="Estado">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="orders-td-acciones" data-label="Acciones">
                        <ListRecordActions
                          recordName={formatProductionOrderId(row.id)}
                          onView={() => handleOpenOrder(row.id)}
                          onEdit={() => handleOpenOrder(row.id)}
                          onExport={async () => {
                            if (
                              !(await confirmExport(
                                `la orden de producción ${formatProductionOrderId(row.id)}`
                              ))
                            )
                              return
                            void import('../../utils/documentExports').then((m) =>
                              m.exportProduccion(row, (id) => clientsMap[id] ?? id)
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
                    No se encontraron órdenes
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
          itemLabel="órdenes"
          footerClassName="orders-footer list-footer"
          countClassName="orders-count list-footer-count"
        />
      </div>
    </div>
  )
}

export default ProductionList
