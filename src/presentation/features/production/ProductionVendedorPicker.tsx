import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Vendedor } from '../../../core/domain/entities/Vendedor'
import { DOCUMENT_LABELS } from '../../constants/documentTypes'

interface ProductionVendedorPickerProps {
  vendedores: Vendedor[]
  selectedId: string
  onSelect: (vendedor: Vendedor | null) => void
}

const displayValue = (value: string) => value.trim() || '—'

const documentLabel = (v: Vendedor) => DOCUMENT_LABELS[v.document_type] ?? v.document_type

const vendedorInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

const matchesQuery = (vendedor: Vendedor, query: string) => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const docLabel = documentLabel(vendedor).toLowerCase()
  return (
    vendedor.name.toLowerCase().includes(q) ||
    vendedor.identification_number.toLowerCase().includes(q) ||
    docLabel.includes(q) ||
    vendedor.mail.toLowerCase().includes(q) ||
    vendedor.contact.toLowerCase().includes(q)
  )
}

const ProductionVendedorPicker: React.FC<ProductionVendedorPickerProps> = ({
  vendedores,
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

  const selectedVendedor = useMemo(
    () => vendedores.find(v => v.id === selectedId) ?? null,
    [vendedores, selectedId]
  )

  const activeVendedores = useMemo(() => vendedores.filter(v => v.state), [vendedores])

  const filteredVendedores = useMemo(() => {
    const list = activeVendedores.filter(v => matchesQuery(v, query))
    return list.slice(0, 12)
  }, [activeVendedores, query])

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
  }, [isOpen, updateListPosition, filteredVendedores.length])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      const listEl = document.getElementById('prod-vendedor-search-list')
      if (listEl?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const handleSelect = (vendedor: Vendedor) => {
    onSelect(vendedor)
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
            id="prod-vendedor-search-list"
            className="production-client-picker__list production-client-picker__list--portal production-vendedor-picker__list"
            role="listbox"
            aria-label="Vendedores"
            style={{
              top: listRect.top,
              left: listRect.left,
              width: listRect.width,
            }}
          >
            {activeVendedores.length === 0 ? (
              <li className="production-client-picker__empty">No hay vendedores registrados</li>
            ) : filteredVendedores.length > 0 ? (
              filteredVendedores.map(vendedor => (
                <li key={vendedor.id} role="option" className="production-vendedor-picker__item">
                  <button
                    type="button"
                    className={[
                      'production-client-picker__option',
                      'production-vendedor-picker__option',
                      vendedor.id === selectedId ? 'production-client-picker__option--selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelect(vendedor)}
                  >
                    <span className="production-client-picker__option-name">{vendedor.name}</span>
                    <span className="production-client-picker__option-meta">
                      {documentLabel(vendedor)} {vendedor.identification_number}
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
    <div
      className={[
        'production-client-picker',
        'production-vendedor-picker',
        selectedVendedor ? 'production-vendedor-picker--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={rootRef}
    >
      <label className="production-form-label" htmlFor="prod-vendedor-search">
        Buscar vendedor
      </label>
      <div
        ref={searchWrapRef}
        className={[
          'production-client-picker__search-wrap',
          'production-vendedor-picker__search-wrap',
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
          id="prod-vendedor-search"
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
          aria-controls="prod-vendedor-search-list"
        />
      </div>

      {listDropdown}

      {selectedVendedor ? (
        <div className="production-vendedor-card production-vendedor-card--filled">
          <div className="production-vendedor-card__head">
            <div className="production-vendedor-card__identity">
              <span className="production-vendedor-card__avatar" aria-hidden>
                {vendedorInitials(selectedVendedor.name)}
              </span>
              <div className="production-vendedor-card__identity-text">
                <p className="production-vendedor-card__title">{selectedVendedor.name}</p>
                <p className="production-vendedor-card__subtitle">
                  {documentLabel(selectedVendedor)} {selectedVendedor.identification_number}
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
            <span className="production-vendedor-card__chip" title={selectedVendedor.mail}>
              <span className="production-vendedor-card__chip-label">Correo</span>
              <span className="production-vendedor-card__chip-value">
                {displayValue(selectedVendedor.mail)}
              </span>
            </span>
            <span className="production-vendedor-card__chip" title={selectedVendedor.contact}>
              <span className="production-vendedor-card__chip-label">Contacto</span>
              <span className="production-vendedor-card__chip-value">
                {displayValue(selectedVendedor.contact)}
              </span>
            </span>
            <span className="production-vendedor-card__chip" title={selectedVendedor.address}>
              <span className="production-vendedor-card__chip-label">Dirección</span>
              <span className="production-vendedor-card__chip-value">
                {displayValue(selectedVendedor.address)}
              </span>
            </span>
          </div>
        </div>
      ) : (
        <p className="production-client-picker__hint production-vendedor-picker__hint">
          Seleccione un vendedor de la lista para cargar sus datos de contacto.
        </p>
      )}
    </div>
  )
}

export default ProductionVendedorPicker
