import React, { useMemo, useState } from 'react'
import { useTarifaMillarHook } from '../../hooks/useTarifaMillar'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import RecordCell from '../../components/directory/RecordCell'
import DirectoryEmptyState from '../../components/directory/DirectoryEmptyState'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import NewTarifaMillarModal from './NewTarifaMillarModal'
import {
  CreateTarifaMillarDTO,
  TARIFA_MILLAR_CATEGORIAS,
  TarifaMillar,
} from '../../../core/domain/entities/TarifaMillar'

const categoriaOrder = Object.fromEntries(
  TARIFA_MILLAR_CATEGORIAS.map((categoria, index) => [categoria, index])
)

const sortByCategoria = (items: TarifaMillar[]) =>
  [...items].sort((a, b) => {
    const order =
      (categoriaOrder[a.categoria] ?? Number.MAX_SAFE_INTEGER) -
      (categoriaOrder[b.categoria] ?? Number.MAX_SAFE_INTEGER)
    if (order !== 0) return order
    return a.name.localeCompare(b.name, 'es')
  })
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

const formatPrecio = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const TarifasMillarPage: React.FC = () => {
  const { items, loading, error, createTarifaMillar, updateTarifaMillar } = useTarifaMillarHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TarifaMillar | null>(null)
  const activeItems = useMemo(() => items.filter(item => item.state), [items])

  const filtered = useMemo(() => {
    let result = activeItems
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          String(item.unidadMedida).includes(q) ||
          item.categoria.toLowerCase().includes(q) ||
          item.descripcion.toLowerCase().includes(q) ||
          String(item.precio).includes(q)
      )
    }
    return sortByCategoria(result)
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

  const handleEdit = (item: TarifaMillar) => {
    setIsNewOpen(false)
    setEditingItem(item)
  }

  const handleCloseModal = () => {
    setIsNewOpen(false)
    setEditingItem(null)
  }

  const handleModalSubmit = async (dto: CreateTarifaMillarDTO) => {
    const isEditing = Boolean(editingItem)
    if (!(await confirmSave(dto.name, isEditing))) return
    await performAction({
      success: isEditing ? 'Tarifa por millar actualizada.' : 'Tarifa por millar creada.',
      error: 'No se pudo guardar la tarifa por millar.',
      action: async () => {
        if (isEditing) await updateTarifaMillar(dto)
        else await createTarifaMillar(dto)
      },
    })
  }

  const handleExportList = async () => {
    if (!(await confirmExport('el listado de tarifas por millar'))) return
    void import('../../utils/catalogExports').then(m => m.exportTarifasMillar(filtered, 'listado'))
  }

  const handleExportOne = async (item: TarifaMillar) => {
    if (!(await confirmExport(`la tarifa por millar «${item.name}»`))) return
    void import('../../utils/catalogExports').then(m => m.exportTarifasMillar([item], item.name))
  }

  const handleToggleState = async (item: TarifaMillar) => {
    if (!(await confirmToggleState(item.name, item.state))) return
    await performAction({
      success: 'Tarifa por millar inactivada.',
      error: 'No se pudo cambiar el estado.',
      action: async () =>
        updateTarifaMillar({
          id: item.id,
          name: item.name,
          precio: item.precio,
          categoria: item.categoria,
          descripcion: item.descripcion,
          state: false,
        }),
    })
  }

  const isModalOpen = isNewOpen || editingItem !== null

  if (loading) return <div className="remissions-kpi-card">Cargando tarifas por millar…</div>
  if (error) return <div className="remissions-kpi-card">Error: {error}</div>

  return (
    <div className="remissions-container clients-dashboard directory-dashboard directory-dashboard--catalog">
      <div className="remissions-header">
        <div className="remissions-header-left">
          <h1 className="remissions-title">Tarifas por millar</h1>
          <p className="remissions-breadcrumb">IndiColors › Catálogos › Tarifas por millar</p>
        </div>
        <div className="remissions-header-right">
          <SearchBox placeholder="Buscar..." onSearch={setSearchQuery} debounceMs={300} />
          <button type="button" className="remissions-btn-new" onClick={handleNew}>
            + Nueva tarifa por millar
          </button>
        </div>
      </div>

      <DirectoryKpiGrid
        sectionLabel="CATÁLOGOS"
        sectionSubtitle="Tarifas por millar"
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
      />

      <div className="remissions-section">
        <div className="remissions-section-header">
          <h2 className="remissions-section-title">Directorio de tarifas por millar</h2>
          <div className="remissions-section-actions">
            <input
              type="text"
              placeholder="Buscar tarifa por millar..."
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
                <th>UNIDAD MILLAR</th>
                <th>PRECIO</th>
                <th>CATEGORÍA</th>
                <th>DESCRIPCIÓN</th>
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
                    <td data-label="Unidad millar">{item.unidadMedida}</td>
                    <td data-label="Precio">{formatPrecio(item.precio)}</td>
                    <td data-label="Categoría">{item.categoria}</td>
                    <td data-label="Descripción">{item.descripcion || '—'}</td>
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
                  <td colSpan={6} className="remissions-td-empty">
                    <DirectoryEmptyState
                      icon="💰"
                      title="Sin tarifas por millar"
                      hint="Agregue la primera con «+ Nueva tarifa por millar»."
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
          itemLabel="tarifas"
          footerClassName="remissions-footer list-footer"
          countClassName="remissions-count list-footer-count"
        />
      </div>

      <NewTarifaMillarModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        item={editingItem}
      />
    </div>
  )
}

export default TarifasMillarPage
