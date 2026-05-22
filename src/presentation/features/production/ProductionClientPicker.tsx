import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Client } from '../../../core/domain/entities/Client'
import { formatLocationLabel } from '../../../core/utils/colombiaLocations'

interface ProductionClientPickerProps {
  clients: Client[]
  selectedId: string
  onSelect: (client: Client | null) => void
}

const CLIENT_DETAIL_ROWS: { label: string; getValue: (c: Client) => string }[] = [
  { label: 'NIT / C.C.', getValue: c => c.nit },
  { label: 'Teléfono', getValue: c => c.phone },
  { label: 'Correo electrónico', getValue: c => c.email },
  { label: 'Ubicación', getValue: c => formatLocationLabel(c.department, c.city) },
  { label: 'Dirección', getValue: c => c.address },
  {
    label: 'Estado',
    getValue: c => (c.active ? 'Activo' : 'Inactivo'),
  },
]

const displayValue = (value: string) => value.trim() || '—'

const matchesQuery = (client: Client, query: string) => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    client.name.toLowerCase().includes(q) ||
    client.nit.toLowerCase().includes(q) ||
    client.city.toLowerCase().includes(q) ||
    client.department.toLowerCase().includes(q) ||
    client.email.toLowerCase().includes(q) ||
    client.phone.toLowerCase().includes(q) ||
    client.contact.toLowerCase().includes(q)
  )
}

const ProductionClientPicker: React.FC<ProductionClientPickerProps> = ({
  clients,
  selectedId,
  onSelect,
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [listRect, setListRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const searchWrapRef = useRef<HTMLDivElement>(null)

  const selectedClient = useMemo(
    () => clients.find(c => c.id === selectedId) ?? null,
    [clients, selectedId]
  )

  const activeClients = useMemo(() => clients.filter(c => c.active), [clients])

  const filteredClients = useMemo(() => {
    const list = activeClients.filter(c => matchesQuery(c, query))
    return list.slice(0, 12)
  }, [activeClients, query])

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
  }, [isOpen, updateListPosition, filteredClients.length])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      const listEl = document.getElementById('prod-client-search-list')
      if (listEl?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const handleSelect = (client: Client) => {
    onSelect(client)
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
            id="prod-client-search-list"
            className="production-client-picker__list production-client-picker__list--portal"
            role="listbox"
            aria-label="Clientes"
            style={{
              top: listRect.top,
              left: listRect.left,
              width: listRect.width,
            }}
          >
            {activeClients.length === 0 ? (
              <li className="production-client-picker__empty">No hay clientes registrados</li>
            ) : filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <li key={client.id} role="option">
                  <button
                    type="button"
                    className={`production-client-picker__option${
                      client.id === selectedId ? ' production-client-picker__option--selected' : ''
                    }`}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelect(client)}
                  >
                    <span className="production-client-picker__option-name">{client.name}</span>
                    <span className="production-client-picker__option-meta">
                      {client.nit ? `NIT ${client.nit}` : 'Sin NIT'}
                      {client.department || client.city
                        ? ` · ${formatLocationLabel(client.department, client.city)}`
                        : ''}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="production-client-picker__empty">Sin resultados</li>
            )}
          </ul>,
          document.body
        )
      : null

  return (
    <div className="production-client-picker" ref={rootRef}>
      <label className="production-form-label" htmlFor="prod-client-search">
        Buscar cliente
      </label>
      <div
        ref={searchWrapRef}
        className={[
          'production-client-picker__search-wrap',
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
          id="prod-client-search"
          type="search"
          className="production-client-picker__input"
          placeholder="Nombre, NIT, ciudad o contacto…"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            openList()
          }}
          onFocus={openList}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="prod-client-search-list"
        />
      </div>

      {listDropdown}

      {selectedClient ? (
        <div className="production-client-card">
          <div className="production-client-card__head">
            <div>
              <p className="production-client-card__title">{selectedClient.name}</p>
            </div>
            <button type="button" className="production-client-card__change" onClick={handleClear}>
              Cambiar
            </button>
          </div>
          <dl className="production-client-card__grid">
            {CLIENT_DETAIL_ROWS.map(row => (
              <React.Fragment key={row.label}>
                <dt>{row.label}</dt>
                <dd>{displayValue(row.getValue(selectedClient))}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      ) : (
        <p className="production-client-picker__hint">Seleccione un cliente de la lista para cargar sus datos.</p>
      )}
    </div>
  )
}

export default ProductionClientPicker
