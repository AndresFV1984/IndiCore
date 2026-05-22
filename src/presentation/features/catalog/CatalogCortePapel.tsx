import React, { useMemo, useState } from 'react'
import { useCortePapelHook } from '../../hooks/useCortePapel'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import RecordCell from '../../components/directory/RecordCell'
import DirectoryEmptyState from '../../components/directory/DirectoryEmptyState'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import CortePapelModal from './CortePapelModal'
import { CreateCortePapelDTO, CortePapel } from '../../../core/domain/entities/CortePapel'
import {
  confirmDelete,
  confirmExport,
  confirmSave,
  performAction,
} from '../../utils/actionFeedback'
import { formatMedidaDisplayFrom } from './cortePapelUtils'
import { DespieceAsociadoChips } from './DespieceAsociadoUI'
import '../remissions/Remissions.css'
import '../clients/Clients.css'
import './Catalog.css'

const CatalogCortePapel: React.FC = () => {
  const { items, loading, error, createCortePapel, updateCortePapel, deleteCortePapel } =
    useCortePapelHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CortePapel | null>(null)

  const filtered = useMemo(() => {
    let result = items
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.medida.toLowerCase().includes(q) ||
          c.despieces.some(
            d =>
              d.name.toLowerCase().includes(q) ||
              d.ancho.includes(q) ||
              d.alto.includes(q) ||
              d.unidadMedida.toLowerCase().includes(q) ||
              String(d.piezasPorPliego).includes(q)
          )
      )
    }
    return result
  }, [items, searchQuery])

  const stats = useMemo(() => {
    const despieceLinks = items.reduce((sum, c) => sum + c.despieces.length, 0)
    const medidas = new Set(items.map(c => c.medida.toLowerCase()))
    return {
      total: items.length,
      despieceLinks,
      medidas: medidas.size,
    }
  }, [items])

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

  const handleEdit = (item: CortePapel) => {
    setIsNewOpen(false)
    setEditingItem(item)
  }

  const handleCloseModal = () => {
    setIsNewOpen(false)
    setEditingItem(null)
  }

  const handleModalSubmit = async (dto: CreateCortePapelDTO) => {
    const isEditing = Boolean(editingItem)
    if (!(await confirmSave(dto.name, isEditing))) return
    await performAction({
      success: isEditing ? 'Corte de papel actualizado.' : 'Corte de papel registrado.',
      error: 'No se pudo guardar el corte de papel.',
      action: async () => {
        if (isEditing) await updateCortePapel(dto)
        else await createCortePapel(dto)
      },
    })
  }

  const handleDelete = async (item: CortePapel) => {
    if (!(await confirmDelete(item.name))) return
    await performAction({
      success: `Corte «${item.name}» eliminado.`,
      error: 'No se pudo eliminar el corte.',
      action: async () => deleteCortePapel(item.id),
    })
  }

  const handleExportList = async () => {
    if (!(await confirmExport('el listado de cortes de papel'))) return
    void import('../../utils/catalogExports').then(m => m.exportCortePapel(filtered, 'listado'))
  }

  const handleExportOne = async (item: CortePapel) => {
    if (!(await confirmExport(`el corte «${item.name}»`))) return
    void import('../../utils/catalogExports').then(m => m.exportCortePapel([item], item.name))
  }

  const isModalOpen = isNewOpen || editingItem !== null

  if (loading) return <div className="remissions-kpi-card">Cargando cortes de papel…</div>
  if (error) return <div className="remissions-kpi-card">Error: {error}</div>

  return (
    <div className="remissions-container clients-dashboard directory-dashboard">
      <div className="remissions-header">
        <div className="remissions-header-left">
          <h1 className="remissions-title">Corte de papel</h1>
          <p className="remissions-breadcrumb">IndiColors › Catálogos › Corte de papel</p>
          <p className="catalog-corte-subtitle">
            Cortes de papel con su despiece por pliego asociado
          </p>
        </div>
        <div className="remissions-header-right">
          <SearchBox placeholder="Buscar..." onSearch={handleSearch} debounceMs={300} />
          <button type="button" className="remissions-btn-new" onClick={handleNew}>
            + Nuevo corte
          </button>
        </div>
      </div>

      <div className="remissions-kpi-grid directory-kpi-grid">
        <div className="remissions-kpi-card remissions-kpi-card--intro">
          <div className="remissions-kpi-label">CATÁLOGO DE CORTES DE PAPEL</div>
          <div className="remissions-kpi-sublabel">Listado</div>
        </div>
        <div className="remissions-kpi-card remissions-kpi-card--stat-total">
          <div className="remissions-kpi-label">TOTAL</div>
          <div className="remissions-kpi-value">{stats.total}</div>
        </div>
        <div className="remissions-kpi-card remissions-kpi-card--stat-active">
          <div className="remissions-kpi-label">DESPIECES VINCULADOS</div>
          <div className="remissions-kpi-value">{stats.despieceLinks}</div>
        </div>
        <div className="remissions-kpi-card remissions-kpi-card--stat-inactive">
          <div className="remissions-kpi-label">MEDIDAS</div>
          <div className="remissions-kpi-value">{stats.medidas}</div>
        </div>
      </div>

      <div className="remissions-section">
        <div className="remissions-section-header">
          <h2 className="remissions-section-title">Catálogo de cortes de papel</h2>
          <div className="remissions-section-actions">
            <input
              type="text"
              placeholder="Buscar corte de papel..."
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
          <table className="remissions-table catalog-corte-table">
            <thead>
              <tr>
                <th className="catalog-corte-th-index">#</th>
                <th className="remissions-th-nombre">NOMBRE</th>
                <th>MEDIDA</th>
                <th className="catalog-corte-th-despiece">DESPIECE ASOCIADO</th>
                <th className="remissions-th-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td data-label="#" className="catalog-corte-td-index">
                      {startIndex + idx + 1}
                    </td>
                    <td data-label="Nombre">
                      <RecordCell name={item.name} />
                    </td>
                    <td data-label="Medida">{formatMedidaDisplayFrom(item)}</td>
                    <td data-label="Despiece asociado" className="catalog-corte-td-despiece">
                      <DespieceAsociadoChips
                        despieces={item.despieces.slice(0, 1)}
                        showName={false}
                        piezasFirst
                      />
                    </td>
                    <td className="orders-td-acciones" data-label="Acciones">
                      <ListRecordActions
                        recordName={item.name}
                        onView={() => handleEdit(item)}
                        onEdit={() => handleEdit(item)}
                        onExport={() => handleExportOne(item)}
                        onDelete={() => handleDelete(item)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="remissions-td-empty">
                    <DirectoryEmptyState
                      icon="✂️"
                      title="Sin cortes de papel"
                      hint="Agregue el primer corte con «+ Nuevo corte»."
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
          itemLabel="cortes"
          footerClassName="remissions-footer list-footer"
          countClassName="remissions-count list-footer-count"
        />
      </div>

      <CortePapelModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        item={editingItem}
      />
    </div>
  )
}

export default CatalogCortePapel
