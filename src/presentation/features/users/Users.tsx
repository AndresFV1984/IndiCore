import React, { useMemo, useState } from 'react'
import { useUsersHook } from '../../hooks/useUsers'
import SearchBox from '../../components/ui/SearchBox'
import ListRecordActions from '../../components/ui/ListRecordActions'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import NewUserModal from './NewUserModal'
import { User, CreateUserDTO } from '../../../core/domain/entities/User'
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
import './Users.css'

const Users: React.FC = () => {
  const { users, loading, error, createUser, updateUser } = useUsersHook()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const filtered = useMemo(() => {
    let result = users
    if (statusFilter === 'activo') result = result.filter(u => u.state)
    if (statusFilter === 'inactivo') result = result.filter(u => !u.state)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        u =>
          u.name.toLowerCase().includes(q) ||
          u.identification_number.toLowerCase().includes(q) ||
          u.mail.toLowerCase().includes(q) ||
          u.contact.toLowerCase().includes(q) ||
          u.city.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)
      )
    }
    return result
  }, [users, searchQuery, statusFilter])

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter(u => u.state).length,
      inactive: users.filter(u => !u.state).length,
    }),
    [users]
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
    setEditingUser(null)
    setIsNewOpen(true)
  }

  const handleEdit = (user: User) => {
    setIsNewOpen(false)
    setEditingUser(user)
  }

  const handleCloseModal = () => {
    setIsNewOpen(false)
    setEditingUser(null)
  }

  const handleModalSubmit = async (dto: CreateUserDTO) => {
    const isEditing = Boolean(editingUser)
    if (!(await confirmSave(dto.name, isEditing))) return
    await performAction({
      success: isEditing ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.',
      error: 'No se pudo guardar el usuario.',
      action: async () => {
        if (isEditing) await updateUser(dto)
        else await createUser(dto)
      },
    })
  }

  const handleExportList = async () => {
    if (!(await confirmExport('el listado de usuarios'))) return
    void import('../../utils/directoryExports').then(m => m.exportUsers(filtered, 'listado'))
  }
  const handleExportOne = async (user: User) => {
    if (!(await confirmExport(`el usuario «${user.name}»`))) return
    void import('../../utils/directoryExports').then(m => m.exportUsers([user], user.name))
  }

  const handleToggleState = async (user: User) => {
    if (!(await confirmToggleState(user.name, user.state))) return
    await performAction({
      success: user.state ? 'Usuario inactivado.' : 'Usuario activado.',
      error: 'No se pudo cambiar el estado del usuario.',
      action: async () =>
        updateUser({
          id: user.id,
          name: user.name,
          document_type: user.document_type,
          identification_number: user.identification_number,
          department: user.department,
          city: user.city,
          cityCode: user.cityCode,
          address: user.address,
          mail: user.mail,
          contact: user.contact,
          password_hash: user.password_hash,
          state: !user.state,
        }),
    })
  }

  const isModalOpen = isNewOpen || editingUser !== null

  if (loading) return <div className="remissions-kpi-card">Cargando usuarios…</div>
  if (error) return <div className="remissions-kpi-card">Error: {error}</div>

  return (
    <div className="remissions-container clients-dashboard users-dashboard directory-dashboard directory-dashboard--users">
      <div className="remissions-header">
        <div className="remissions-header-left">
          <h1 className="remissions-title">Usuarios</h1>
          <p className="remissions-breadcrumb">IndiColors › Gestión › Usuarios</p>
        </div>
        <div className="remissions-header-right">
          <SearchBox placeholder="Buscar…" onSearch={setSearchQuery} debounceMs={300} />
          <button type="button" className="remissions-btn-new" onClick={handleNew}>
            + Nuevo usuario
          </button>
        </div>
      </div>

      <div className="remissions-kpi-grid directory-kpi-grid">
        <div className="remissions-kpi-card remissions-kpi-card--intro">
          <div className="remissions-kpi-label">GESTIÓN</div>
          <div className="remissions-kpi-sublabel">Usuarios del sistema</div>
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
          <h2 className="remissions-section-title">Directorio de usuarios</h2>
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
                paginatedItems.map(u => (
                  <tr key={u.id}>
                    <td data-label="Nombre">
                      <RecordCell name={u.name} />
                    </td>
                    <td data-label="Identificación">
                      <IdentityDocumentDisplay
                        documentType={u.document_type}
                        number={u.identification_number}
                      />
                    </td>
                    <td data-label="Correo">{u.mail || '—'}</td>
                    <td data-label="Ubicación">
                      {formatLocationLabel(u.department, u.city)}
                    </td>
                    <td data-label="Contacto">{u.contact || '—'}</td>
                    <td data-label="Estado" className="orders-td-estado">
                      <Badge
                        variant={u.state ? 'success' : 'neutral'}
                        label={u.state ? 'Activo' : 'Inactivo'}
                      />
                    </td>
                    <td className="orders-td-acciones" data-label="Acciones">
                      <ListRecordActions
                        recordName={u.name}
                        isActive={u.state}
                        onView={() => handleEdit(u)}
                        onEdit={() => handleEdit(u)}
                        onExport={() => handleExportOne(u)}
                        onInactivate={() => handleToggleState(u)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="remissions-td-empty">
                    <DirectoryEmptyState
                      icon="👤"
                      title="Sin usuarios"
                      hint="Cree el primer usuario con el botón «Nuevo usuario»."
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
          itemLabel="usuarios"
          footerClassName="remissions-footer list-footer"
          countClassName="remissions-count list-footer-count"
        />
      </div>

      <NewUserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        user={editingUser}
      />
    </div>
  )
}

export default Users
