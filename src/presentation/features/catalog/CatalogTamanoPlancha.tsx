import React, { useMemo, useState } from 'react'
import { useTamanoPlanchaHook } from '../../hooks/useTamanoPlancha'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import RecordCell from '../../components/directory/RecordCell'
import DirectoryEmptyState from '../../components/directory/DirectoryEmptyState'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import TamanoPlanchaModal from './TamanoPlanchaModal'
import { CreateTamanoPlanchaDTO, TamanoPlancha } from '../../../core/domain/entities/TamanoPlancha'
import {
  confirmExport,
  confirmSave,
  confirmToggleState,
  performAction,
} from '../../utils/actionFeedback'
import { formatMedidaDisplayFrom } from './cortePapelUtils'
import DirectoryKpiGrid from '../../components/directory/DirectoryKpiGrid'
import { countDirectoryStats } from '../../components/directory/directoryStats'
import '../remissions/Remissions.css'
import '../clients/Clients.css'

const formatValor = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const CatalogTamanoPlancha: React.FC = () => {
  const { items, loading, error, createTamanoPlancha, updateTamanoPlancha } = useTamanoPlanchaHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TamanoPlancha | null>(null)
  const activeItems = useMemo(() => items.filter(p => p.active), [items])

  const filtered = useMemo(() => {
    let result = activeItems
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.medida.toLowerCase().includes(q) ||
          String(p.valor).includes(q)
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

  const handleSearch = (q: string) => setSearchQuery(q)

  const handleNew = () => {
    setEditingItem(null)
    setIsNewOpen(true)
  }

  const handleEdit = (item: TamanoPlancha) => {
    setIsNewOpen(false)
    setEditingItem(item)
  }

  const handleCloseModal = () => {
    setIsNewOpen(false)
    setEditingItem(null)
  }

  const handleModalSubmit = async (dto: CreateTamanoPlanchaDTO) => {
    const isEditing = Boolean(editingItem)
    if (!(await confirmSave(dto.name, isEditing))) return
    await performAction({
      success: isEditing ? 'Tipo de plancha actualizado.' : 'Tipo de plancha creado.',
      error: 'No se pudo guardar el tipo de plancha.',
      action: async () => {
        if (isEditing) await updateTamanoPlancha(dto)
        else await createTamanoPlancha(dto)
      },
    })
  }

  const handleExportList = async () => {
    if (!(await confirmExport('el listado de tipos de plancha'))) return
    void import('../../utils/catalogExports').then(m => m.exportTamanoPlancha(filtered, 'listado'))
  }

  const handleExportOne = async (item: TamanoPlancha) => {
    if (!(await confirmExport(`el tipo de plancha «${item.name}»`))) return
    void import('../../utils/catalogExports').then(m => m.exportTamanoPlancha([item], item.name))
  }

  const handleToggleActive = async (item: TamanoPlancha) => {
    if (!(await confirmToggleState(item.name, item.active))) return
    await performAction({
      success: 'Tipo de plancha inactivado.',
      error: 'No se pudo cambiar el estado.',
      action: async () =>
        updateTamanoPlancha({
          id: item.id,
          name: item.name,
          ancho: item.ancho,
          alto: item.alto,
          unidadMedida: item.unidadMedida,
          valor: item.valor,
          active: false,
        }),
    })
  }

  const isModalOpen = isNewOpen || editingItem !== null

  if (loading) return <div className="remissions-kpi-card">Cargando tipos de plancha…</div>
  if (error) return <div className="remissions-kpi-card">Error: {error}</div>

  return (
    <div className="remissions-container clients-dashboard directory-dashboard directory-dashboard--catalog">
      <div className="remissions-header">
        <div className="remissions-header-left">
          <h1 className="remissions-title">Tipo Plancha</h1>
          <p className="remissions-breadcrumb">IndiColors › Catálogos › Tipo Plancha</p>
        </div>
        <div className="remissions-header-right">
          <SearchBox placeholder="Buscar..." onSearch={handleSearch} debounceMs={300} />
          <button className="remissions-btn-new" onClick={handleNew}>
            + Nuevo tipo de plancha
          </button>
        </div>
      </div>

      <DirectoryKpiGrid
        sectionLabel="CATÁLOGOS"
        sectionSubtitle="Tipos de plancha"
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
      />

      <div className="remissions-section">
        <div className="remissions-section-header">
          <h2 className="remissions-section-title">Directorio de tipos de plancha</h2>
          <div className="remissions-section-actions">
            <input
              type="text"
              placeholder="Buscar tipo de plancha..."
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
                <th>MEDIDA</th>
                <th>VALOR</th>
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
                    <td data-label="Valor">{formatValor(item.valor)}</td>
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
                  <td colSpan={4} className="remissions-td-empty">
                    <DirectoryEmptyState
                      icon="📐"
                      title="Sin tipos de plancha"
                      hint="Agregue el primer tipo con «+ Nuevo tipo de plancha»."
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

      <TamanoPlanchaModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        item={editingItem}
      />
    </div>
  )
}

export default CatalogTamanoPlancha
