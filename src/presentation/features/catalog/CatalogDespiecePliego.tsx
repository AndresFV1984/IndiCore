import React, { useMemo, useState } from 'react'
import { useDespiecePliegoHook } from '../../hooks/useDespiecePliego'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import RecordCell from '../../components/directory/RecordCell'
import DirectoryEmptyState from '../../components/directory/DirectoryEmptyState'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import DespiecePliegoModal from './DespiecePliegoModal'
import { CreateDespiecePliegoDTO, DespiecePliego } from '../../../core/domain/entities/DespiecePliego'
import { formatMedidaDisplayFrom, formatPiezasLabel } from './cortePapelUtils'
import DirectoryKpiGrid from '../../components/directory/DirectoryKpiGrid'
import { countDirectoryStats } from '../../components/directory/directoryStats'
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
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DespiecePliego | null>(null)
  const activeItems = useMemo(() => items.filter(p => p.active), [items])

  const filtered = useMemo(() => {
    let result = activeItems
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.ancho.includes(q) ||
          p.alto.includes(q) ||
          p.unidadMedida.toLowerCase().includes(q) ||
          p.medida.toLowerCase().includes(q) ||
          String(p.piezasPorPliego).includes(q)
      )
    }
    return [...result].sort((a, b) => a.name.localeCompare(b.name, 'es'))
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
      success: 'Despiece inactivado.',
      error: 'No se pudo cambiar el estado.',
      action: async () =>
        updateDespiecePliego({
          id: item.id,
          name: item.name,
          ancho: item.ancho,
          alto: item.alto,
          unidadMedida: item.unidadMedida,
          piezasPorPliego: item.piezasPorPliego,
          active: false,
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
    <div className="remissions-container clients-dashboard directory-dashboard directory-dashboard--catalog catalog-despiece-dashboard">
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

      <DirectoryKpiGrid
        sectionLabel="CATÁLOGOS"
        sectionSubtitle="Despiece por pliego"
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
      />

      <div className="remissions-section catalog-despiece-section">
        <div className="remissions-section-header catalog-despiece-section-header">
          <h2 className="remissions-section-title">Listado de despieces</h2>
          <div className="remissions-section-actions">
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
                <th className="remissions-th-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item, index) => (
                  <tr key={item.id}>
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
                    <td className="orders-td-acciones" data-label="Acciones">
                      <ListRecordActions
                        recordName={item.name}
                        isActive
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
                  <td colSpan={5} className="remissions-td-empty">
                    <DirectoryEmptyState
                      icon="📐"
                      title={searchQuery.trim() ? 'Sin resultados' : 'Sin despieces registrados'}
                      hint={
                        searchQuery.trim()
                          ? 'Pruebe otro criterio de búsqueda.'
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
