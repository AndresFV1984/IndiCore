import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Vendedor } from '../../../core/domain/entities/Vendedor'
import { DOCUMENT_LABELS } from '../../constants/documentTypes'

interface ProductionVendedorPickerProps {
  vendedores: Vendedor[]
  selectedId: string
  onSelect: (vendedor: Vendedor | null) => void
}

const displayValue = (value: string) => value.trim() || '—'

const documentLabel = (v: Vendedor) => DOCUMENT_LABELS[v.document_type] ?? v.document_type

const VENDEDOR_DETAIL_ROWS: { label: string; getValue: (v: Vendedor) => string }[] = [
  { label: 'Tipo de documento', getValue: v => documentLabel(v) },
  { label: 'Número de identificación', getValue: v => v.identification_number },
  { label: 'Correo electrónico', getValue: v => v.mail },
  { label: 'Teléfono / contacto', getValue: v => v.contact },
  { label: 'Dirección', getValue: v => v.address },
]

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
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedVendedor = useMemo(
    () => vendedores.find(v => v.id === selectedId) ?? null,
    [vendedores, selectedId]
  )

  const activeVendedores = useMemo(() => vendedores.filter(v => v.state), [vendedores])

  const filteredVendedores = useMemo(() => {
    const list = activeVendedores.filter(v => matchesQuery(v, query))
    return list.slice(0, 12)
  }, [activeVendedores, query])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
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

  return (
    <div className="production-client-picker production-vendedor-picker" ref={rootRef}>
      <label className="production-form-label" htmlFor="prod-vendedor-search">
        Buscar vendedor
      </label>
      <div className="production-client-picker__search-wrap">
        <span className="production-client-picker__search-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
            <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </span>
        <input
          id="prod-vendedor-search"
          type="search"
          className="production-client-picker__input"
          placeholder="Nombre o número de documento…"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        {isOpen && (
          <ul className="production-client-picker__list" role="listbox">
            {filteredVendedores.length > 0 ? (
              filteredVendedores.map(vendedor => (
                <li key={vendedor.id} role="option">
                  <button
                    type="button"
                    className={`production-client-picker__option${
                      vendedor.id === selectedId ? ' production-client-picker__option--selected' : ''
                    }`}
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
          </ul>
        )}
      </div>

      {selectedVendedor ? (
        <div className="production-client-card production-vendedor-card">
          <div className="production-client-card__head">
            <div>
              <p className="production-client-card__title">{selectedVendedor.name}</p>
            </div>
            <button type="button" className="production-client-card__change" onClick={handleClear}>
              Cambiar
            </button>
          </div>
          <dl className="production-client-card__grid">
            {VENDEDOR_DETAIL_ROWS.map(row => (
              <React.Fragment key={row.label}>
                <dt>{row.label}</dt>
                <dd>{displayValue(row.getValue(selectedVendedor))}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      ) : (
        <p className="production-client-picker__hint">
          Seleccione un vendedor de la lista para cargar sus datos.
        </p>
      )}
    </div>
  )
}

export default ProductionVendedorPicker
