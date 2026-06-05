import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTipoPapelHook } from '../../hooks/useTipoPapel'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import RecordCell from '../../components/directory/RecordCell'
import DirectoryEmptyState from '../../components/directory/DirectoryEmptyState'
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
import { formatUnidadEmpaqueDisplay } from '../../../core/domain/value-objects/UnidadEmpaque'
import { DespieceAsociadoDirectoryList } from './DespieceAsociadoUI'
import DirectoryKpiGrid from '../../components/directory/DirectoryKpiGrid'
import { countDirectoryStats } from '../../components/directory/directoryStats'
import '../remissions/Remissions.css'
import '../clients/Clients.css'
import './Catalog.css'

const formatValor = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const CatalogTipoPapel: React.FC = () => {
  const { items, loading, error, createTipoPapel, updateTipoPapel } = useTipoPapelHook()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TipoPapel | null>(null)
  const openedEditFromUrl = useRef(false)
  const activeItems = useMemo(() => items.filter(p => p.active), [items])

  useEffect(() => {
    if (loading || openedEditFromUrl.current) return
    const editId = searchParams.get('edit')?.trim()
    if (!editId) return
    const item = items.find(p => p.id === editId)
    if (!item) return
    openedEditFromUrl.current = true
    setIsNewOpen(false)
    setEditingItem(item)
    setSearchParams({}, { replace: true })
  }, [items, loading, searchParams, setSearchParams])

  const filtered = useMemo(() => {
    let result = activeItems
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.medida.toLowerCase().includes(q) ||
          String(p.unidadEmpaque).includes(q) ||
          String(p.valorHoja).includes(q) ||
          p.despiecesPliego.some(
            d =>
              d.name.toLowerCase().includes(q) ||
              d.ancho.includes(q) ||
              d.alto.includes(q) ||
              String(d.piezasPorPliego).includes(q)
          )
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
      success: 'Tipo de papel inactivado.',
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
          active: false,
          despiecesPliego: item.despiecesPliego,
        }),
    })
  }

  const isModalOpen = isNewOpen || editingItem !== null

  if (loading) return <div className="remissions-kpi-card">Cargando tipos de papel…</div>
  if (error) return <div className="remissions-kpi-card">Error: {error}</div>

  return (
    <div className="remissions-container clients-dashboard directory-dashboard directory-dashboard--catalog">
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

      <DirectoryKpiGrid
        sectionLabel="CATÁLOGOS"
        sectionSubtitle="Tipos de papel"
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
      />

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
                <th>DESPIECE PLIEGO</th>
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
                    <td data-label="Unidad empaque">
                      {formatUnidadEmpaqueDisplay(item.unidadEmpaque)}
                    </td>
                    <td data-label="Despiece pliego">
                      <DespieceAsociadoDirectoryList despieces={item.despiecesPliego} />
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
