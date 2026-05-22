import React, { useMemo, useState } from 'react'
import { useTipoPapelHook } from '../../hooks/useTipoPapel'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import RecordCell from '../../components/directory/RecordCell'
import DirectoryEmptyState from '../../components/directory/DirectoryEmptyState'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import TipoPapelModal from './TipoPapelModal'
import { CreateTipoPapelDTO, TipoPapel } from '../../../core/domain/entities/TipoPapel'
import {
  confirmExport,
  confirmSave,
  confirmToggleState,
  performAction,
} from '../../utils/actionFeedback'
import { formatMedidaDisplayFrom } from './cortePapelUtils'
import '../remissions/Remissions.css'
import '../clients/Clients.css'

const formatValor = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const CatalogTipoPapel: React.FC = () => {
  const { items, loading, error, createTipoPapel, updateTipoPapel } = useTipoPapelHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TipoPapel | null>(null)

  const filtered = useMemo(() => {
    let result = items
    if (statusFilter === 'activo') result = result.filter(p => p.active)
    if (statusFilter === 'inactivo') result = result.filter(p => !p.active)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.medida.toLowerCase().includes(q) ||
          p.unidadEmpaque.toLowerCase().includes(q) ||
          String(p.valorHoja).includes(q)
      )
    }
    return result
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

  const handleEdit = (item: TipoPapel) => {
    setIsNewOpen(false)
    setEditingItem(item)
  }

  const handleCloseModal = () => {
    setIsNewOpen(false)
    setEditingItem(null)
  }

  const handleModalSubmit = async (dto: CreateTipoPapelDTO) => {
    const isEditing = Boolean(editingItem)
    if (!(await confirmSave(dto.name, isEditing))) return
    await performAction({
      success: isEditing ? 'Tipo de papel actualizado.' : 'Tipo de papel creado.',
      error: 'No se pudo guardar el tipo de papel.',
      action: async () => {
        if (isEditing) await updateTipoPapel(dto)
        else await createTipoPapel(dto)
      },
    })
  }

  const handleExportList = async () => {
    if (!(await confirmExport('el listado de tipos de papel'))) return
    void import('../../utils/catalogExports').then(m => m.exportTipoPapel(filtered, 'listado'))
  }

  const handleExportOne = async (item: TipoPapel) => {
    if (!(await confirmExport(`el tipo de papel «${item.name}»`))) return
    void import('../../utils/catalogExports').then(m => m.exportTipoPapel([item], item.name))
  }

  const handleToggleActive = async (item: TipoPapel) => {
    if (!(await confirmToggleState(item.name, item.active))) return
    await performAction({
      success: item.active ? 'Tipo de papel inactivado.' : 'Tipo de papel activado.',
      error: 'No se pudo cambiar el estado.',
      action: async () =>
        updateTipoPapel({
          id: item.id,
          name: item.name,
          ancho: item.ancho,
          alto: item.alto,
          unidadMedida: item.unidadMedida,
          valorHoja: item.valorHoja,
          unidadEmpaque: item.unidadEmpaque,
          active: !item.active,
        }),
    })
  }

  const isModalOpen = isNewOpen || editingItem !== null

  if (loading) return <div className="remissions-kpi-card">Cargando tipos de papel…</div>
  if (error) return <div className="remissions-kpi-card">Error: {error}</div>

  return (
    <div className="remissions-container clients-dashboard directory-dashboard">
      <div className="remissions-header">
        <div className="remissions-header-left">
          <h1 className="remissions-title">Tipo de papel</h1>
          <p className="remissions-breadcrumb">IndiColors › Catálogos › Tipo de papel</p>
        </div>
        <div className="remissions-header-right">
          <SearchBox placeholder="Buscar..." onSearch={handleSearch} debounceMs={300} />
          <button type="button" className="remissions-btn-new" onClick={handleNew}>
            + Nuevo tipo de papel
          </button>
        </div>
      </div>

      <div className="remissions-kpi-grid directory-kpi-grid">
        <div className="remissions-kpi-card remissions-kpi-card--intro">
          <div className="remissions-kpi-label">DIRECTORIO DE TIPOS DE PAPEL</div>
          <div className="remissions-kpi-sublabel">Listado</div>
        </div>
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

      <div className="remissions-section">
        <div className="remissions-section-header">
          <h2 className="remissions-section-title">Directorio de tipos de papel</h2>
          <div className="remissions-section-actions">
            <input
              type="text"
              placeholder="Buscar tipo de papel..."
              className="remissions-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select
              className="remissions-status-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
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
          <table className="remissions-table">
            <thead>
              <tr>
                <th className="remissions-th-nombre">NOMBRE</th>
                <th>MEDIDA</th>
                <th>VALOR HOJA</th>
                <th>UNIDAD EMPAQUE</th>
                <th className="remissions-th-estado">ESTADO</th>
                <th className="remissions-th-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map(item => (
                  <tr key={item.id}>
                    <td data-label="Nombre">
                      <RecordCell name={item.name} />
                    </td>
                    <td data-label="Medida">{formatMedidaDisplayFrom(item)}</td>
                    <td data-label="Valor hoja">{formatValor(item.valorHoja)}</td>
                    <td data-label="Unidad empaque">{item.unidadEmpaque}</td>
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
                      icon="📄"
                      title="Sin tipos de papel"
                      hint="Agregue el primer tipo con «+ Nuevo tipo de papel»."
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
          itemLabel="tipos"
          footerClassName="remissions-footer list-footer"
          countClassName="remissions-count list-footer-count"
        />
      </div>

      <TipoPapelModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        item={editingItem}
      />
    </div>
  )
}

export default CatalogTipoPapel
