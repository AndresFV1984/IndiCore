import React, { useMemo, useState } from 'react'
import { useVendedoresHook } from '../../hooks/useVendedores'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import NewVendedorModal from './NewVendedorModal'
import { Vendedor, CreateVendedorDTO } from '../../../core/domain/entities/Vendedor'
import RecordCell from '../../components/directory/RecordCell'
import IdentityDocumentDisplay from '../../components/directory/IdentityDocumentDisplay'
import { formatLocationLabel } from '../../../core/utils/colombiaLocations'
import DirectoryEmptyState from '../../components/directory/DirectoryEmptyState'
import {
  confirmExport,
  confirmSave,
  confirmToggleState,
  performAction,
} from '../../utils/actionFeedback'
import '../remissions/Remissions.css'
import '../clients/Clients.css'
import './Vendedores.css'

const Vendedores: React.FC = () => {
  const { vendedores, loading, error, createVendedor, updateVendedor } = useVendedoresHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null)

  const filtered = useMemo(() => {
    let result = vendedores
    if (statusFilter === 'activo') result = result.filter(v => v.state)
    if (statusFilter === 'inactivo') result = result.filter(v => !v.state)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        v =>
          v.name.toLowerCase().includes(q) ||
          v.identification_number.toLowerCase().includes(q) ||
          v.mail.toLowerCase().includes(q) ||
          v.contact.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.department.toLowerCase().includes(q)
      )
    }
    return result
  }, [vendedores, searchQuery, statusFilter])

  const stats = useMemo(
    () => ({
      total: vendedores.length,
      active: vendedores.filter(v => v.state).length,
      inactive: vendedores.filter(v => !v.state).length,
    }),
    [vendedores]
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

  const handleNew = () => {
    setEditingVendedor(null)
    setIsNewOpen(true)
  }

  const handleEdit = (vendedor: Vendedor) => {
    setIsNewOpen(false)
    setEditingVendedor(vendedor)
  }

  const handleCloseModal = () => {
    setIsNewOpen(false)
    setEditingVendedor(null)
  }

  const handleModalSubmit = async (dto: CreateVendedorDTO) => {
    const isEditing = Boolean(editingVendedor)
    if (!(await confirmSave(dto.name, isEditing))) return
    await performAction({
      success: isEditing ? 'Vendedor actualizado correctamente.' : 'Vendedor creado correctamente.',
      error: 'No se pudo guardar el vendedor.',
      action: async () => {
        if (isEditing) await updateVendedor(dto)
        else await createVendedor(dto)
      },
    })
  }

  const handleExportList = async () => {
    if (!(await confirmExport('el listado de vendedores'))) return
    void import('../../utils/directoryExports').then(m => m.exportVendedores(filtered, 'listado'))
  }
  const handleExportOne = async (vendedor: Vendedor) => {
    if (!(await confirmExport(`el vendedor «${vendedor.name}»`))) return
    void import('../../utils/directoryExports').then(m => m.exportVendedores([vendedor], vendedor.name))
  }

  const handleToggleState = async (vendedor: Vendedor) => {
    if (!(await confirmToggleState(vendedor.name, vendedor.state))) return
    await performAction({
      success: vendedor.state ? 'Vendedor inactivado.' : 'Vendedor activado.',
      error: 'No se pudo cambiar el estado del vendedor.',
      action: async () =>
        updateVendedor({
          id: vendedor.id,
          name: vendedor.name,
          document_type: vendedor.document_type,
          identification_number: vendedor.identification_number,
          department: vendedor.department,
          city: vendedor.city,
          cityCode: vendedor.cityCode,
          address: vendedor.address,
          mail: vendedor.mail,
          contact: vendedor.contact,
          state: !vendedor.state,
        }),
    })
  }

  const isModalOpen = isNewOpen || editingVendedor !== null

  if (loading) return <div className="remissions-kpi-card">Cargando vendedores…</div>
  if (error) return <div className="remissions-kpi-card">Error: {error}</div>

  return (
    <div className="remissions-container clients-dashboard vendedores-dashboard directory-dashboard directory-dashboard--vendedores">
      <div className="remissions-header">
        <div className="remissions-header-left">
          <h1 className="remissions-title">Vendedores</h1>
          <p className="remissions-breadcrumb">IndiColors › Gestión › Vendedores</p>
        </div>
        <div className="remissions-header-right">
          <SearchBox placeholder="Buscar…" onSearch={setSearchQuery} debounceMs={300} />
          <button type="button" className="remissions-btn-new" onClick={handleNew}>
            + Nuevo vendedor
          </button>
        </div>
      </div>

      <div className="remissions-kpi-grid directory-kpi-grid">
        <div className="remissions-kpi-card remissions-kpi-card--intro">
          <div className="remissions-kpi-label">GESTIÓN</div>
          <div className="remissions-kpi-sublabel">Vendedores comerciales</div>
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
          <h2 className="remissions-section-title">Directorio de vendedores</h2>
          <div className="remissions-section-actions">
            <input
              type="text"
              placeholder="Filtrar…"
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
                <th className="remissions-th-documento">IDENTIFICACIÓN</th>
                <th className="remissions-th-email">CORREO</th>
                <th className="remissions-th-ciudad">UBICACIÓN</th>
                <th>CONTACTO</th>
                <th className="remissions-th-estado">ESTADO</th>
                <th className="remissions-th-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map(v => (
                  <tr key={v.id}>
                    <td data-label="Nombre">
                      <RecordCell name={v.name} />
                    </td>
                    <td data-label="Identificación">
                      <IdentityDocumentDisplay
                        documentType={v.document_type}
                        number={v.identification_number}
                      />
                    </td>
                    <td data-label="Correo">{v.mail || '—'}</td>
                    <td data-label="Ubicación">
                      {formatLocationLabel(v.department, v.city)}
                    </td>
                    <td data-label="Contacto">{v.contact || '—'}</td>
                    <td data-label="Estado" className="orders-td-estado">
                      <Badge
                        variant={v.state ? 'success' : 'neutral'}
                        label={v.state ? 'Activo' : 'Inactivo'}
                      />
                    </td>
                    <td className="orders-td-acciones" data-label="Acciones">
                      <ListRecordActions
                        recordName={v.name}
                        isActive={v.state}
                        onView={() => handleEdit(v)}
                        onEdit={() => handleEdit(v)}
                        onExport={() => handleExportOne(v)}
                        onInactivate={() => handleToggleState(v)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="remissions-td-empty">
                    <DirectoryEmptyState
                      icon="🤝"
                      title="Sin vendedores"
                      hint="Registre vendedores con el botón «+ Nuevo vendedor»."
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
          itemLabel="vendedores"
          footerClassName="remissions-footer list-footer"
          countClassName="remissions-count list-footer-count"
        />
      </div>

      <NewVendedorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        vendedor={editingVendedor}
      />
    </div>
  )
}

export default Vendedores
