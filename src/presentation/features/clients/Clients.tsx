import React, { useEffect, useState, useMemo } from 'react'
import { useClientsHook } from '../../hooks/useClients'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import RecordCell from '../../components/directory/RecordCell'
import IdentityDocumentDisplay from '../../components/directory/IdentityDocumentDisplay'
import DirectoryEmptyState from '../../components/directory/DirectoryEmptyState'
import Badge from '../../components/ui/Badge'
import '../remissions/Remissions.css'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import './Clients.css'
import NewClientModal from './NewClientModal'
import { Client } from '../../../core/domain/entities/Client'
import { formatLocationLabel } from '../../../core/utils/colombiaLocations'
import {
  confirmExport,
  confirmSave,
  confirmToggleState,
  performAction,
} from '../../utils/actionFeedback'

const Clients: React.FC = () => {
  const { clients, loading, error, createClient, updateClient } = useClientsHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  useEffect(() => {
    // placeholder: if there were async loads specific to clients, they'd run here
  }, [])

  const filtered = useMemo(() => {
    if (!searchQuery) return clients
    const q = searchQuery.toLowerCase()
    return clients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.nit || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.department || '').toLowerCase().includes(q)
    )
  }, [clients, searchQuery])

  const {
    page,
    setPage,
    totalPages,
    paginatedItems,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filtered)

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.active).length,
    inactive: clients.filter(c => !c.active).length
  }), [clients])

  const handleSearch = (q: string) => setSearchQuery(q)
  const handleNew = () => {
    setEditingClient(null)
    setIsNewClientOpen(true)
  }
  const handleEdit = (client: Client) => {
    setIsNewClientOpen(false)
    setEditingClient(client)
  }
  const handleCloseModal = () => {
    setIsNewClientOpen(false)
    setEditingClient(null)
  }
  const handleModalSubmit = async (dto: Parameters<typeof createClient>[0]) => {
    const isEditing = Boolean(editingClient)
    if (!(await confirmSave(dto.name, isEditing))) return
    await performAction({
      success: isEditing ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.',
      error: 'No se pudo guardar el cliente.',
      action: async () => {
        if (isEditing) await updateClient(dto)
        else await createClient(dto)
      },
    })
  }

  const handleExportList = async () => {
    if (!(await confirmExport('el listado de clientes'))) return
    void import('../../utils/directoryExports').then(m => m.exportClients(filtered, 'listado'))
  }

  const handleExportOne = async (client: Client) => {
    if (!(await confirmExport(`el cliente «${client.name}»`))) return
    void import('../../utils/directoryExports').then(m => m.exportClients([client], client.name))
  }

  const handleToggleActive = async (client: Client) => {
    if (!(await confirmToggleState(client.name, client.active))) return
    await performAction({
      success: client.active ? 'Cliente inactivado.' : 'Cliente activado.',
      error: 'No se pudo cambiar el estado del cliente.',
      action: async () => {
        await updateClient({
          id: client.id,
          name: client.name,
          nit: client.nit,
          phone: client.phone,
          department: client.department,
          city: client.city,
          cityCode: client.cityCode,
          address: client.address,
          email: client.email,
          contact: client.contact,
          active: !client.active,
        })
      },
    })
  }

  const isClientModalOpen = isNewClientOpen || editingClient !== null

  if (loading) return <div className="remissions-kpi-card">Cargando clientes...</div>
  if (error) return <div className="remissions-kpi-card">Error: {error}</div>

  return (
    <div className="remissions-container clients-dashboard directory-dashboard">
      <div className="remissions-header">
        <div className="remissions-header-left">
          <h1 className="remissions-title">Clientes</h1>
          <p className="remissions-breadcrumb">IndiColors › Clientes</p>
        </div>
        <div className="remissions-header-right">
          <SearchBox placeholder="Buscar..." onSearch={handleSearch} debounceMs={300} />
          <button className="remissions-btn-new" onClick={handleNew}>+ Nuevo cliente</button>
        </div>
      </div>

      <div className="remissions-kpi-grid directory-kpi-grid">
        <div className="remissions-kpi-card remissions-kpi-card--intro">
          <div className="remissions-kpi-label">DIRECTORIO DE CLIENTES</div>
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
          <h2 className="remissions-section-title">Directorio de clientes</h2>
          <div className="remissions-section-actions">
            <input type="text" placeholder="Buscar cliente..." className="remissions-search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <select className="remissions-status-select" value="Todos" onChange={() => {}}>
              <option>Todos</option>
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
                <th className="remissions-th-telefono">TELÉFONO</th>
                <th className="remissions-th-email">CORREO</th>
                <th className="remissions-th-ciudad">UBICACIÓN</th>
                <th className="remissions-th-estado">ESTADO</th>
                <th className="remissions-th-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? paginatedItems.map(c => (
                <tr key={c.id}>
                  <td data-label="Nombre">
                    <RecordCell name={c.name} />
                  </td>
                  <td data-label="Identificación">
                    <IdentityDocumentDisplay documentType="NIT" number={c.nit} />
                  </td>
                  <td data-label="Teléfono">{c.phone || '—'}</td>
                  <td data-label="Correo">{c.email || '—'}</td>
                  <td data-label="Ubicación">
                    {formatLocationLabel(c.department, c.city)}
                  </td>
                  <td data-label="Estado" className="orders-td-estado">
                    <Badge
                      variant={c.active ? 'success' : 'neutral'}
                      label={c.active ? 'Activo' : 'Inactivo'}
                    />
                  </td>
                  <td className="orders-td-acciones" data-label="Acciones">
                    <ListRecordActions
                      recordName={c.name}
                      isActive={c.active}
                      onView={() => handleEdit(c)}
                      onEdit={() => handleEdit(c)}
                      onExport={() => handleExportOne(c)}
                      onInactivate={() => handleToggleActive(c)}
                    />
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="remissions-td-empty">
                    <DirectoryEmptyState
                      icon="🏢"
                      title="Sin clientes"
                      hint="Agregue el primer cliente con «+ Nuevo cliente»."
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
          itemLabel="clientes"
          footerClassName="remissions-footer list-footer"
          countClassName="remissions-count list-footer-count"
        />
      </div>

      <NewClientModal
        isOpen={isClientModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        client={editingClient}
      />
    </div>
  )
}

export default Clients
