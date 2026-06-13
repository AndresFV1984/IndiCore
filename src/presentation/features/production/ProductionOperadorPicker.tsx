import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { User, type UserPermission, type UserRole } from '../../../core/domain/entities/User'
import { DOCUMENT_LABELS } from '../../constants/documentTypes'
import { USER_ROLE_LABELS, USER_ROLE_OPTIONS } from '../../constants/userRoles'
import { formatLocationLabel } from '../../../core/utils/colombiaLocations'
import {
  canAssignUserToProductionPhase,
  filterUsersForProductionPhase,
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
  selectedId: string
  onSelect: (user: User | null) => void
  inputId?: string
}

const displayValue = (value: string) => value.trim() || '—'

const documentLabel = (user: User) => DOCUMENT_LABELS[user.document_type] ?? user.document_type

const userInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

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
    USER_ROLE_LABELS[user.role].toLowerCase().includes(q)
  )
}

const ProductionOperadorPicker: React.FC<ProductionOperadorPickerProps> = ({
  users,
  phaseId,
  roleFilter,
  permissionFilters,
  onRoleFilterChange,
  selectedId,
  onSelect,
  inputId = 'prod-operador-search',
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [listRect, setListRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const listId = `${inputId}-list`

  const eligibleUsers = useMemo(
    () => filterUsersForProductionPhase(users, phaseId, roleFilter, permissionFilters),
    [users, phaseId, roleFilter, permissionFilters]
  )

  const selectedUser = useMemo(
    () => users.find(user => user.id === selectedId) ?? null,
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
    const list = eligibleUsers.filter(user => matchesQuery(user, query))
    return list.slice(0, 12)
  }, [eligibleUsers, query])

  const updateListPosition = useCallback(() => {
    const el = searchWrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setListRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setListRect(null)
      return
    }
    updateListPosition()
    const onReposition = () => updateListPosition()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [isOpen, updateListPosition, filteredUsers.length])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      const listEl = document.getElementById(listId)
      if (listEl?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [listId])

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

  const openList = useCallback(() => {
    const el = searchWrapRef.current
    if (el) {
      const rect = el.getBoundingClientRect()
      setListRect({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
    setIsOpen(true)
  }, [])

  const listDropdown =
    isOpen && listRect
      ? createPortal(
          <ul
            id={listId}
            className="production-client-picker__list production-client-picker__list--portal production-vendedor-picker__list production-operador-picker__list"
            role="listbox"
            aria-label="Usuarios"
            style={{
              top: listRect.top,
              left: listRect.left,
              width: listRect.width,
            }}
          >
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <li key={user.id} role="option" className="production-vendedor-picker__item">
                  <button
                    type="button"
                    className={[
                      'production-client-picker__option',
                      'production-vendedor-picker__option',
                      user.id === selectedId ? 'production-client-picker__option--selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelect(user)}
                  >
                    <span className="production-client-picker__option-name">{user.name}</span>
                    <span className="production-client-picker__option-meta">
                      {USER_ROLE_LABELS[user.role]} · {documentLabel(user)}{' '}
                      {user.identification_number}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="production-client-picker__empty">
                No hay usuarios con rol {USER_ROLE_LABELS[roleFilter]} para esta etapa
              </li>
            )}
          </ul>,
          document.body
        )
      : null

  return (
    <div
      className={[
        'production-client-picker',
        'production-vendedor-picker',
        'production-operador-picker',
        selectedUser && selectedUserValid ? 'production-vendedor-picker--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={rootRef}
    >
      <div className="production-operador-picker__role-field">
        <label className="production-form-label" htmlFor={`${inputId}-role`}>
          Filtrar por rol
        </label>
        <select
          id={`${inputId}-role`}
          className="production-form-input production-vendedor-picker__input production-operador-picker__role-select"
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

      <label className="production-form-label" htmlFor={inputId}>
        Buscar usuario
      </label>
      <div
        ref={searchWrapRef}
        className={[
          'production-client-picker__search-wrap',
          'production-operador-picker__search-wrap',
          isOpen ? 'production-client-picker__search-wrap--open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="production-client-picker__search-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
            <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </span>
        <input
          id={inputId}
          type="search"
          className="production-client-picker__input production-vendedor-picker__input"
          placeholder="Nombre o número de documento…"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            openList()
          }}
          onFocus={openList}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
        />
      </div>

      {listDropdown}

      {selectedUser && !selectedUserValid ? (
        <p className="production-operador-picker__warning" role="alert">
          {selectedUser.name} no cumple el rol «{USER_ROLE_LABELS[roleFilter]}» o no tiene los
          permisos requeridos para esta etapa.
          {!userMeetsPermissionFilters(selectedUser, permissionFilters) &&
            permissionFilters.length > 0 && (
              <> Faltan: {permissionFilters.map(getPermissionLabel).join(' · ')}.</>
            )}
        </p>
      ) : null}

      {selectedUser && selectedUserValid ? (
        <div className="production-vendedor-card production-vendedor-card--filled">
          <div className="production-vendedor-card__head">
            <div className="production-vendedor-card__identity">
              <span className="production-vendedor-card__avatar" aria-hidden>
                {userInitials(selectedUser.name)}
              </span>
              <div className="production-vendedor-card__identity-text">
                <p className="production-vendedor-card__title">{selectedUser.name}</p>
                <p className="production-vendedor-card__subtitle">
                  {USER_ROLE_LABELS[selectedUser.role]} · {documentLabel(selectedUser)}{' '}
                  {selectedUser.identification_number}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="production-vendedor-card__change"
              onClick={handleClear}
            >
              Cambiar
            </button>
          </div>
          <div className="production-vendedor-card__chips">
            <span className="production-vendedor-card__chip" title={selectedUser.mail}>
              <span className="production-vendedor-card__chip-label">Correo</span>
              <span className="production-vendedor-card__chip-value">
                {displayValue(selectedUser.mail)}
              </span>
            </span>
            <span className="production-vendedor-card__chip" title={selectedUser.contact}>
              <span className="production-vendedor-card__chip-label">Contacto</span>
              <span className="production-vendedor-card__chip-value">
                {displayValue(selectedUser.contact)}
              </span>
            </span>
            <span
              className="production-vendedor-card__chip"
              title={formatLocationLabel(selectedUser.department, selectedUser.city)}
            >
              <span className="production-vendedor-card__chip-label">Ubicación</span>
              <span className="production-vendedor-card__chip-value">
                {displayValue(formatLocationLabel(selectedUser.department, selectedUser.city))}
              </span>
            </span>
          </div>
        </div>
      ) : (
        <p className="production-client-picker__hint production-vendedor-picker__hint">
          Seleccione el rol y busque el usuario responsable de esta etapa.
        </p>
      )}
    </div>
  )
}

export default ProductionOperadorPicker
