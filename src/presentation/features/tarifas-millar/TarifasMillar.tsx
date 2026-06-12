import React, { useMemo, useState } from 'react'
import { useTarifaMillarHook } from '../../hooks/useTarifaMillar'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import Badge from '../../components/ui/Badge'
import RecordCell from '../../components/directory/RecordCell'
import DirectoryEmptyState from '../../components/directory/DirectoryEmptyState'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import NewTarifaMillarModal from './NewTarifaMillarModal'
import {
  isLegacyVolteoTarifaMillarRecord,
  resolveTarifaMillarPrecioVolteoEscuadra,
  resolveTarifaMillarPrecioVolteoPinza,
} from '../production/constants/impresionTarifaMillar'
import {
  CreateTarifaMillarDTO,
  TarifaMillar,
} from '../../../core/domain/entities/TarifaMillar'
import { formatMillaresFactor } from '../production/utils/impresionPrecioTintaUtils'
import {
  confirmExport,
  confirmSave,
  confirmToggleState,
  performAction,
} from '../../utils/actionFeedback'
import DirectoryKpiGrid from '../../components/directory/DirectoryKpiGrid'
import { countDirectoryStats } from '../../components/directory/directoryStats'
import {
  isTarifaMillarDirectoryRecord,
  sortTarifasMillarDirectory,
} from './tarifasMillarDirectory'
import '../remissions/Remissions.css'
import '../clients/Clients.css'

const formatPrecio = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const formatVolteoPinzaPrecio = (item: TarifaMillar) => {
  const precio = resolveTarifaMillarPrecioVolteoPinza(item)
  return precio !== null ? formatPrecio(precio) : '—'
}

const formatVolteoEscuadraPrecio = (item: TarifaMillar) => {
  const precio = resolveTarifaMillarPrecioVolteoEscuadra(item)
  return precio !== null ? formatPrecio(precio) : '—'
}

const TarifasMillarPage: React.FC = () => {
  const { items, loading, error, createTarifaMillar, updateTarifaMillar } = useTarifaMillarHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TarifaMillar | null>(null)
  const directoryItems = useMemo(
    () =>
      items.filter(
        item => !isLegacyVolteoTarifaMillarRecord(item) && isTarifaMillarDirectoryRecord(item)
      ),
    [items]
  )

  const filtered = useMemo(() => {
    let result = directoryItems
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(item => {
        const volteoPinza = resolveTarifaMillarPrecioVolteoPinza(item)
        const volteoEscuadra = resolveTarifaMillarPrecioVolteoEscuadra(item)
        return (
          item.name.toLowerCase().includes(q) ||
          String(item.unidadMedida).includes(q) ||
          String(item.precio).includes(q) ||
          String(item.topeMinimoMillar).includes(q) ||
          String(item.millarMinimoVenta).includes(q) ||
          String(item.umbralDecimalMillar).includes(q) ||
          (volteoPinza !== null && String(volteoPinza).includes(q)) ||
          (volteoEscuadra !== null && String(volteoEscuadra).includes(q))
        )
      })
    }
    return sortTarifasMillarDirectory(result)
  }, [directoryItems, searchQuery])

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
    void import('../../utils/catalogExports').then(m => m.exportTarifasMillarListado(filtered, 'listado'))
  }

  const handleExportOne = async (item: TarifaMillar) => {
    if (!(await confirmExport(`la tarifa por millar «${item.name}»`))) return
    void import('../../utils/catalogExports').then(m => m.exportTarifasMillarListado([item], item.name))
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
          millarMinimoVenta: item.millarMinimoVenta,
          topeMinimoMillar: item.topeMinimoMillar,
          umbralDecimalMillar: item.umbralDecimalMillar,
          precioVolteoPinza: item.precioVolteoPinza,
          precioVolteoEscuadra: item.precioVolteoEscuadra,
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
                <th>VOLTEO POR PINZA</th>
                <th>VOLTEO POR ESCUADRA</th>
                <th>TOPE MÍNIMO MILLAR</th>
                <th>MILLAR MÍNIMO</th>
                <th>UMBRAL DECIMAL</th>
                <th>ESTADO</th>
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
                    <td data-label="Volteo por pinza">{formatVolteoPinzaPrecio(item)}</td>
                    <td data-label="Volteo por escuadra">{formatVolteoEscuadraPrecio(item)}</td>
                    <td data-label="Tope mínimo millar">{item.topeMinimoMillar}</td>
                    <td data-label="Millar mínimo">{item.millarMinimoVenta}</td>
                    <td data-label="Umbral decimal">
                      {formatMillaresFactor(item.umbralDecimalMillar)}
                    </td>
                    <td data-label="Estado" className="orders-td-estado">
                      <Badge
                        variant={item.state ? 'success' : 'neutral'}
                        label={item.state ? 'Activo' : 'Inactivo'}
                      />
                    </td>
                    <td className="orders-td-acciones" data-label="Acciones">
                      <ListRecordActions
                        recordName={item.name}
                        isActive={item.state}
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
                  <td colSpan={10} className="remissions-td-empty">
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
