import React, { useEffect, useMemo, useRef, useState } from 'react'
import { User, type UserPermission, type UserRole } from '../../../core/domain/entities/User'
import { DOCUMENT_LABELS } from '../../constants/documentTypes'
import { USER_ROLE_LABELS, USER_ROLE_OPTIONS } from '../../constants/userRoles'
import ProductionOperadorPermissionFilter from './ProductionOperadorPermissionFilter'
import {
  canAssignUserToProductionPhase,
  filterUsersForProductionPhase,
  getDefaultPhasePermissionFilters,
  getPermissionLabel,
  type ProductionAssignmentPhaseId,
  userMeetsPermissionFilters,
} from './utils/productionOperatorAssignment'

interface ProductionOperadorPickerProps {
  users: User[]
  phaseId: ProductionAssignmentPhaseId
  roleFilter: UserRole
  permissionFilters: UserPermission[]
  onRoleFilterChange: (role: UserRole) => void
  onPermissionFiltersChange: (permissions: UserPermission[]) => void
  selectedId: string
  onSelect: (user: User | null) => void
  inputId?: string
}

const displayValue = (value: string) => value.trim() || '—'

const documentLabel = (u: User) => DOCUMENT_LABELS[u.document_type] ?? u.document_type

const OPERADOR_DETAIL_ROWS: { label: string; getValue: (u: User) => string }[] = [
  { label: 'Rol en el sistema', getValue: u => USER_ROLE_LABELS[u.role] ?? u.role },
  {
    label: 'Permisos',
    getValue: u => u.permissions.map(getPermissionLabel).join(' · ') || '—',
  },
  { label: 'Tipo de documento', getValue: u => documentLabel(u) },
  { label: 'Número de identificación', getValue: u => u.identification_number },
  { label: 'Departamento', getValue: u => u.department },
  { label: 'Ciudad', getValue: u => u.city },
  { label: 'Correo electrónico', getValue: u => u.mail },
  { label: 'Teléfono / contacto', getValue: u => u.contact },
]

const matchesQuery = (user: User, query: string) => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const docLabel = documentLabel(user).toLowerCase()
  return (
    user.name.toLowerCase().includes(q) ||
    user.identification_number.toLowerCase().includes(q) ||
    docLabel.includes(q) ||
    user.mail.toLowerCase().includes(q) ||
    user.contact.toLowerCase().includes(q) ||
    user.department.toLowerCase().includes(q) ||
    user.city.toLowerCase().includes(q) ||
    USER_ROLE_LABELS[user.role].toLowerCase().includes(q) ||
    user.permissions.some(permission => getPermissionLabel(permission).toLowerCase().includes(q))
  )
}

const ProductionOperadorPicker: React.FC<ProductionOperadorPickerProps> = ({
  users,
  phaseId,
  roleFilter,
  permissionFilters,
  onRoleFilterChange,
  onPermissionFiltersChange,
  selectedId,
  onSelect,
  inputId = 'prod-operador-search',
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const eligibleUsers = useMemo(
    () => filterUsersForProductionPhase(users, phaseId, roleFilter, permissionFilters),
    [users, phaseId, roleFilter, permissionFilters]
  )

  const selectedUser = useMemo(
    () => users.find(u => u.id === selectedId) ?? null,
    [users, selectedId]
  )

  const selectedUserValid = useMemo(
    () =>
      selectedUser
        ? canAssignUserToProductionPhase(selectedUser, phaseId, roleFilter, permissionFilters)
        : true,
    [selectedUser, phaseId, roleFilter, permissionFilters]
  )

  const filteredUsers = useMemo(() => {
    const list = eligibleUsers.filter(u => matchesQuery(u, query))
    return list.slice(0, 12)
  }, [eligibleUsers, query])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const handleSelect = (user: User) => {
    onSelect(user)
    setQuery('')
    setIsOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
    setIsOpen(false)
  }

  const handleRestorePhasePermissions = () => {
    onPermissionFiltersChange(getDefaultPhasePermissionFilters(phaseId))
  }

  return (
    <div className="production-client-picker production-operador-picker" ref={rootRef}>
      <div className="production-operador-picker__filters">
        <div className="production-form-field">
          <label className="production-form-label" htmlFor={`${inputId}-role`}>
            Filtrar por rol
          </label>
          <select
            id={`${inputId}-role`}
            className="production-form-input production-operador-picker__role-select"
            value={roleFilter}
            onChange={e => onRoleFilterChange(e.target.value as UserRole)}
          >
            {USER_ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="production-form-field production-form-field--full">
          <label className="production-form-label">Filtrar por permisos</label>
          <ProductionOperadorPermissionFilter
            phaseId={phaseId}
            selected={permissionFilters}
            onChange={onPermissionFiltersChange}
            onRestorePhaseDefaults={handleRestorePhasePermissions}
          />
        </div>
      </div>

      <label className="production-form-label" htmlFor={inputId}>
        Buscar usuario
      </label>
      <div className="production-client-picker__search-wrap production-operador-picker__search-wrap">
        <span className="production-client-picker__search-icon production-operador-picker__search-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
            <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </span>
        <input
          id={inputId}
          type="search"
          className="production-client-picker__input production-operador-picker__input"
          placeholder="Nombre, documento, rol o permiso…"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        {isOpen && (
          <ul className="production-client-picker__list production-operador-picker__list" role="listbox">
            {permissionFilters.length === 0 ? (
              <li className="production-client-picker__empty">
                Seleccione al menos un permiso para filtrar usuarios
              </li>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <li key={user.id} role="option">
                  <button
                    type="button"
                    className={`production-client-picker__option production-operador-picker__option${
                      user.id === selectedId ? ' production-client-picker__option--selected' : ''
                    }`}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelect(user)}
                  >
                    <span className="production-client-picker__option-name">{user.name}</span>
                    <span className="production-client-picker__option-meta">
                      {USER_ROLE_LABELS[user.role]} · {documentLabel(user)} {user.identification_number}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="production-client-picker__empty">
                No hay usuarios con rol {USER_ROLE_LABELS[roleFilter]} y los permisos seleccionados
              </li>
            )}
          </ul>
        )}
      </div>

      {selectedUser && !selectedUserValid ? (
        <p className="production-operador-picker__warning" role="alert">
          {selectedUser.name} no cumple el rol «{USER_ROLE_LABELS[roleFilter]}» o no tiene todos los
          permisos seleccionados.
          {!userMeetsPermissionFilters(selectedUser, permissionFilters) && permissionFilters.length > 0 && (
            <>
              {' '}
              Faltan: {permissionFilters.map(getPermissionLabel).join(' · ')}.
            </>
          )}
        </p>
      ) : null}

      {selectedUser && selectedUserValid ? (
        <div className="production-client-card production-operador-card">
          <div className="production-client-card__head">
            <div>
              <p className="production-client-card__title">{selectedUser.name}</p>
              <p className="production-operador-card__role">{USER_ROLE_LABELS[selectedUser.role]}</p>
            </div>
            <button type="button" className="production-client-card__change" onClick={handleClear}>
              Cambiar
            </button>
          </div>
          <dl className="production-client-card__grid">
            {OPERADOR_DETAIL_ROWS.map(row => (
              <React.Fragment key={row.label}>
                <dt>{row.label}</dt>
                <dd>
                  <span className="production-client-card__value">
                    {displayValue(row.getValue(selectedUser))}
                  </span>
                </dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      ) : (
        <p className="production-client-picker__hint production-operador-picker__hint">
          Seleccione rol y permisos para filtrar, luego elija el usuario responsable de esta etapa.
        </p>
      )}
    </div>
  )
}

export default ProductionOperadorPicker
