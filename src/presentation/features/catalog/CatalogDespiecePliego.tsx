import React, { useMemo, useState } from 'react'
import { useDespiecePliegoHook } from '../../hooks/useDespiecePliego'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import RecordCell from '../../components/directory/RecordCell'
import DirectoryEmptyState from '../../components/directory/DirectoryEmptyState'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import DespiecePliegoModal from './DespiecePliegoModal'
import { CreateDespiecePliegoDTO, DespiecePliego } from '../../../core/domain/entities/DespiecePliego'
import { formatMedidaDisplayFrom, formatPiezasLabel } from './cortePapelUtils'
import {
  confirmExport,
  confirmSave,
  confirmToggleState,
  performAction,
} from '../../utils/actionFeedback'
import '../remissions/Remissions.css'
import '../clients/Clients.css'
import './Catalog.css'

const CatalogDespiecePliego: React.FC = () => {
  const { items, loading, error, createDespiecePliego, updateDespiecePliego } =
    useDespiecePliegoHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DespiecePliego | null>(null)

  const filtered = useMemo(() => {
    let result = items
    if (statusFilter === 'activo') result = result.filter(p => p.active)
    if (statusFilter === 'inactivo') result = result.filter(p => !p.active)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.ancho.includes(q) ||
          p.alto.includes(q) ||
          p.unidadMedida.toLowerCase().includes(q) ||
          p.medida.toLowerCase().includes(q) ||
          String(p.piezasPorPliego).includes(q) ||
          (p.active ? 'activo' : 'inactivo').includes(q)
      )
    }
    return [...result].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1
      return a.name.localeCompare(b.name, 'es')
    })
  }, [items, searchQuery, statusFilter])

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter(p => p.active).length,
      inactive: items.filter(p => !p.active).length,
    }),
    [items]
  )

  const {
    page,
    setPage,
    totalPages,
    paginatedItems,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filtered)

  const handleSearch = (q: string) => setSearchQuery(q)

  const handleNew = () => {
    setEditingItem(null)
    setIsNewOpen(true)
  }

  const handleEdit = (item: DespiecePliego) => {
    setIsNewOpen(false)
    setEditingItem(item)
  }

  const handleCloseModal = () => {
    setIsNewOpen(false)
    setEditingItem(null)
  }

  const handleModalSubmit = async (dto: CreateDespiecePliegoDTO) => {
    const isEditing = Boolean(editingItem)
    if (!(await confirmSave(dto.name, isEditing))) return
    await performAction({
      success: isEditing ? 'Despiece actualizado.' : 'Despiece creado.',
      error: 'No se pudo guardar el despiece.',
      action: async () => {
        if (isEditing) await updateDespiecePliego(dto)
        else await createDespiecePliego(dto)
      },
    })
  }

  const handleToggleActive = async (item: DespiecePliego) => {
    if (!(await confirmToggleState(item.name, item.active))) return
    await performAction({
      success: item.active ? 'Despiece inactivado.' : 'Despiece activado.',
      error: 'No se pudo cambiar el estado.',
      action: async () =>
        updateDespiecePliego({
          id: item.id,
          name: item.name,
          ancho: item.ancho,
          alto: item.alto,
          unidadMedida: item.unidadMedida,
          piezasPorPliego: item.piezasPorPliego,
          active: !item.active,
        }),
    })
  }

  const handleExportList = async () => {
    if (!(await confirmExport('el listado de despieces'))) return
    void import('../../utils/catalogExports').then(m => m.exportDespiecePliego(filtered, 'listado'))
  }

  const handleExportOne = async (item: DespiecePliego) => {
    if (!(await confirmExport(`el despiece «${item.name}»`))) return
    void import('../../utils/catalogExports').then(m => m.exportDespiecePliego([item], item.name))
  }

  const isModalOpen = isNewOpen || editingItem !== null

  if (loading) return <div className="remissions-kpi-card">Cargando despieces por pliego…</div>
  if (error) return <div className="remissions-kpi-card">Error: {error}</div>

  return (
    <div className="remissions-container clients-dashboard directory-dashboard catalog-despiece-dashboard">
      <div className="remissions-header">
        <div className="remissions-header-left">
          <h1 className="remissions-title">Despiece por pliego</h1>
          <p className="remissions-breadcrumb">IndiColors › Catálogos › Despiece por pliego</p>
          <p className="catalog-page-subtitle">
            Medida del pliego, piezas por pliego y estado para producción
          </p>
        </div>
        <div className="remissions-header-right">
          <SearchBox placeholder="Buscar nombre, medida o piezas…" onSearch={handleSearch} debounceMs={300} />
          <button type="button" className="remissions-btn-new catalog-btn-new--navy" onClick={handleNew}>
            + Nuevo despiece
          </button>
        </div>
      </div>

      <div className="remissions-kpi-grid directory-kpi-grid catalog-despiece-kpis">
        <div className="remissions-kpi-card remissions-kpi-card--stat-total">
          <div className="remissions-kpi-label">TOTAL</div>
          <div className="remissions-kpi-value">{stats.total}</div>
        </div>
        <div className="remissions-kpi-card remissions-kpi-card--stat-active">
          <div className="remissions-kpi-label">ACTIVOS</div>
          <div className="remissions-kpi-value">{stats.active}</div>
        </div>
        <div className="remissions-kpi-card remissions-kpi-card--stat-inactive">
          <div className="remissions-kpi-label">INACTIVOS</div>
          <div className="remissions-kpi-value">{stats.inactive}</div>
        </div>
      </div>

      <div className="remissions-section catalog-despiece-section">
        <div className="remissions-section-header catalog-despiece-section-header">
          <h2 className="remissions-section-title">Listado de despieces</h2>
          <div className="remissions-section-actions">
            <select
              className="remissions-status-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              aria-label="Filtrar por estado"
            >
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
            <button type="button" className="remissions-btn-export" onClick={handleExportList}>
              Exportar
            </button>
          </div>
        </div>

        <div className="remissions-table-wrapper directory-table">
          <table className="remissions-table catalog-despiece-table">
            <thead>
              <tr>
                <th className="remissions-th-numero">#</th>
                <th className="remissions-th-nombre">NOMBRE</th>
                <th>MEDIDA</th>
                <th>PIEZAS</th>
                <th className="remissions-th-estado">ESTADO</th>
                <th className="remissions-th-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={item.active ? undefined : 'catalog-despiece-row--inactive'}
                  >
                    <td data-label="#" className="catalog-despiece-td-index">
                      {startIndex + index}
                    </td>
                    <td data-label="Nombre">
                      <RecordCell name={item.name} />
                    </td>
                    <td data-label="Medida" className="catalog-despiece-td-medida">
                      {formatMedidaDisplayFrom(item)}
                    </td>
                    <td data-label="Piezas" className="catalog-despiece-td-piezas">
                      {formatPiezasLabel(item.piezasPorPliego)}
                    </td>
                    <td data-label="Estado" className="orders-td-estado">
                      <Badge
                        variant={item.active ? 'success' : 'neutral'}
                        label={item.active ? 'Activo' : 'Inactivo'}
                      />
                    </td>
                    <td className="orders-td-acciones" data-label="Acciones">
                      <ListRecordActions
                        recordName={item.name}
                        isActive={item.active}
                        onView={() => handleEdit(item)}
                        onEdit={() => handleEdit(item)}
                        onExport={() => handleExportOne(item)}
                        onInactivate={() => handleToggleActive(item)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="remissions-td-empty">
                    <DirectoryEmptyState
                      icon="📐"
                      title={searchQuery.trim() || statusFilter !== 'todos' ? 'Sin resultados' : 'Sin despieces registrados'}
                      hint={
                        searchQuery.trim() || statusFilter !== 'todos'
                          ? 'Pruebe otro criterio o filtro de estado.'
                          : 'Agregue el primero con «+ Nuevo despiece».'
                      }
                    />
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
          itemLabel="despieces"
          footerClassName="remissions-footer list-footer"
          countClassName="remissions-count list-footer-count"
        />
      </div>

      <DespiecePliegoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        item={editingItem}
      />
    </div>
  )
}

export default CatalogDespiecePliego
