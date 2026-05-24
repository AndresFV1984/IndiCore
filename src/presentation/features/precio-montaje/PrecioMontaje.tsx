import React, { useMemo, useState } from 'react'
import { usePrecioMontajeHook } from '../../hooks/usePrecioMontaje'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import RecordCell from '../../components/directory/RecordCell'
import DirectoryEmptyState from '../../components/directory/DirectoryEmptyState'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import NewPrecioMontajeModal from './NewPrecioMontajeModal'
import { PrecioMontaje, CreatePrecioMontajeDTO } from '../../../core/domain/entities/PrecioMontaje'
import {
  confirmExport,
  confirmSave,
  confirmToggleState,
  performAction,
} from '../../utils/actionFeedback'
import DirectoryKpiGrid from '../../components/directory/DirectoryKpiGrid'
import { countDirectoryStats } from '../../components/directory/directoryStats'
import '../remissions/Remissions.css'
import '../clients/Clients.css'

const formatCost = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const PrecioMontajePage: React.FC = () => {
  const { items, loading, error, createPrecioMontaje, updatePrecioMontaje } = usePrecioMontajeHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PrecioMontaje | null>(null)
  const activeItems = useMemo(() => items.filter(p => p.state), [items])

  const filtered = useMemo(() => {
    let result = activeItems
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          String(p.cost).includes(q)
      )
    }
    return result
  }, [activeItems, searchQuery])

  const stats = useMemo(() => countDirectoryStats(items), [items])

  const {
    page,
    setPage,
    totalPages,
    paginatedItems,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filtered)

  const handleNew = () => {
    setEditingItem(null)
    setIsNewOpen(true)
  }

  const handleEdit = (item: PrecioMontaje) => {
    setIsNewOpen(false)
    setEditingItem(item)
  }

  const handleCloseModal = () => {
    setIsNewOpen(false)
    setEditingItem(null)
  }

  const handleModalSubmit = async (dto: CreatePrecioMontajeDTO) => {
    const isEditing = Boolean(editingItem)
    if (!(await confirmSave(dto.name, isEditing))) return
    await performAction({
      success: isEditing ? 'Precio de montaje actualizado.' : 'Precio de montaje creado.',
      error: 'No se pudo guardar el precio de montaje.',
      action: async () => {
        if (isEditing) await updatePrecioMontaje(dto)
        else await createPrecioMontaje(dto)
      },
    })
  }

  const handleExportList = async () => {
    if (!(await confirmExport('el listado de precios de montaje'))) return
    void import('../../utils/catalogExports').then(m => m.exportPrecioMontaje(filtered, 'listado'))
  }

  const handleExportOne = async (item: PrecioMontaje) => {
    if (!(await confirmExport(`el precio de montaje «${item.name}»`))) return
    void import('../../utils/catalogExports').then(m => m.exportPrecioMontaje([item], item.name))
  }

  const handleToggleState = async (item: PrecioMontaje) => {
    if (!(await confirmToggleState(item.name, item.state))) return
    await performAction({
      success: 'Precio de montaje inactivado.',
      error: 'No se pudo cambiar el estado.',
      action: async () =>
        updatePrecioMontaje({
          id: item.id,
          name: item.name,
          cost: item.cost,
          state: false,
        }),
    })
  }

  const isModalOpen = isNewOpen || editingItem !== null

  if (loading) return <div className="remissions-kpi-card">Cargando precios de montaje…</div>
  if (error) return <div className="remissions-kpi-card">Error: {error}</div>

  return (
    <div className="remissions-container clients-dashboard directory-dashboard directory-dashboard--catalog">
      <div className="remissions-header">
        <div className="remissions-header-left">
          <h1 className="remissions-title">Precio montaje</h1>
          <p className="remissions-breadcrumb">IndiColors › Catálogos › Precio montaje</p>
        </div>
        <div className="remissions-header-right">
          <SearchBox placeholder="Buscar..." onSearch={setSearchQuery} debounceMs={300} />
          <button type="button" className="remissions-btn-new" onClick={handleNew}>
            + Nuevo precio de montaje
          </button>
        </div>
      </div>

      <DirectoryKpiGrid
        sectionLabel="CATÁLOGOS"
        sectionSubtitle="Precios de montaje"
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
      />

      <div className="remissions-section">
        <div className="remissions-section-header">
          <h2 className="remissions-section-title">Directorio de precios de montaje</h2>
          <div className="remissions-section-actions">
            <input
              type="text"
              placeholder="Buscar precio de montaje..."
              className="remissions-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
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
                <th>COSTO</th>
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
                    <td data-label="Costo">
                      {formatCost(item.cost)}
                    </td>
                    <td className="orders-td-acciones" data-label="Acciones">
                      <ListRecordActions
                        recordName={item.name}
                        isActive
                        onView={() => handleEdit(item)}
                        onEdit={() => handleEdit(item)}
                        onExport={() => handleExportOne(item)}
                        onInactivate={() => handleToggleState(item)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="remissions-td-empty">
                    <DirectoryEmptyState
                      icon="⚙️"
                      title="Sin precios de montaje"
                      hint="Agregue el primero con «+ Nuevo precio de montaje»."
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
          itemLabel="precios"
          footerClassName="remissions-footer list-footer"
          countClassName="remissions-count list-footer-count"
        />
      </div>

      <NewPrecioMontajeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        item={editingItem}
      />
    </div>
  )
}

export default PrecioMontajePage
