import React, { useMemo, useState } from 'react'
import { useCortePapelHook } from '../../hooks/useCortePapel'
import { useTipoPapelHook } from '../../hooks/useTipoPapel'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import RecordCell from '../../components/directory/RecordCell'
import DirectoryEmptyState from '../../components/directory/DirectoryEmptyState'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import CortePapelModal from './CortePapelModal'
import { CreateCortePapelDTO, CortePapel } from '../../../core/domain/entities/CortePapel'
import { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import {
  confirmDelete,
  confirmExport,
  confirmSave,
  performAction,
} from '../../utils/actionFeedback'
import { formatMedidaDisplayFrom } from './cortePapelUtils'
import { DespieceAsociadoChips } from './DespieceAsociadoUI'
import DirectoryKpiGrid from '../../components/directory/DirectoryKpiGrid'
import '../remissions/Remissions.css'
import '../clients/Clients.css'

const CatalogCortePapel: React.FC = () => {
  const { items, loading, error, createCortePapel, updateCortePapel, deleteCortePapel } =
    useCortePapelHook()
  const { items: tiposPapel } = useTipoPapelHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CortePapel | null>(null)

  const tiposPapelById = useMemo(() => {
    const map = new Map<string, TipoPapel>()
    for (const tipo of tiposPapel) map.set(tipo.id, tipo)
    return map
  }, [tiposPapel])

  const resolveTipoPapel = (item: CortePapel): TipoPapel | null =>
    item.tipoPapelId ? tiposPapelById.get(item.tipoPapelId) ?? null : null

  const filtered = useMemo(() => {
    let result = items
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => {
        const tipo = resolveTipoPapel(c)
        return (
          c.name.toLowerCase().includes(q) ||
          (tipo?.name.toLowerCase().includes(q) ?? false) ||
          (tipo?.medida.toLowerCase().includes(q) ?? false) ||
          c.despieces.some(
            d =>
              d.name.toLowerCase().includes(q) ||
              d.ancho.includes(q) ||
              d.alto.includes(q) ||
              d.unidadMedida.toLowerCase().includes(q) ||
              String(d.piezasPorPliego).includes(q)
          )
        )
      })
    }
    return result
  }, [items, searchQuery, tiposPapelById])

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.length,
      inactive: 0,
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
    void import('../../utils/catalogExports').then(m =>
      m.exportCortePapel(filtered, 'listado', tiposPapel)
    )
  }

  const handleExportOne = async (item: CortePapel) => {
    if (!(await confirmExport(`el corte «${item.name}»`))) return
    void import('../../utils/catalogExports').then(m =>
      m.exportCortePapel([item], item.name, tiposPapel)
    )
  }

  const isModalOpen = isNewOpen || editingItem !== null

  if (loading) return <div className="remissions-kpi-card">Cargando cortes de papel…</div>
  if (error) return <div className="remissions-kpi-card">Error: {error}</div>

  return (
    <div className="remissions-container clients-dashboard directory-dashboard directory-dashboard--catalog">
      <div className="remissions-header">
        <div className="remissions-header-left">
          <h1 className="remissions-title">Corte de papel</h1>
          <p className="remissions-breadcrumb">IndiColors › Catálogos › Corte de papel</p>
        </div>
        <div className="remissions-header-right">
          <SearchBox placeholder="Buscar..." onSearch={handleSearch} debounceMs={300} />
          <button type="button" className="remissions-btn-new" onClick={handleNew}>
            + Nuevo corte
          </button>
        </div>
      </div>

      <DirectoryKpiGrid
        sectionLabel="CATÁLOGOS"
        sectionSubtitle="Cortes de papel"
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
      />

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
          <table className="remissions-table">
            <thead>
              <tr>
                <th className="remissions-th-nombre">NOMBRE</th>
                <th>DESPIECE PLIEGO</th>
                <th>MEDIDA PAPEL</th>
                <th>NOMBRE PAPEL</th>
                <th className="remissions-th-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map(item => {
                  const tipoPapel = resolveTipoPapel(item)
                  return (
                    <tr key={item.id}>
                      <td data-label="Nombre">
                        <RecordCell name={item.name} />
                      </td>
                      <td data-label="Despiece pliego">
                        <DespieceAsociadoChips
                          despieces={item.despieces.slice(0, 1)}
                          showName={false}
                        />
                      </td>
                      <td data-label="Medida papel">
                        {tipoPapel ? formatMedidaDisplayFrom(tipoPapel) : '—'}
                      </td>
                      <td data-label="Nombre papel">{tipoPapel?.name ?? '—'}</td>
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
                  )
                })
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
