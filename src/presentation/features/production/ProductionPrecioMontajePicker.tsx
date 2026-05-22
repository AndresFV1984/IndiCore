import React, { useMemo } from 'react'
import { PrecioMontaje } from '../../../core/domain/entities/PrecioMontaje'

interface ProductionPrecioMontajePickerProps {
  items: PrecioMontaje[]
  selectedId: string
  onSelect: (item: PrecioMontaje | null) => void
}

export const formatPrecioMontajeCost = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const ProductionPrecioMontajePicker: React.FC<ProductionPrecioMontajePickerProps> = ({
  items,
  selectedId,
  onSelect,
}) => {
  const activeItems = useMemo(() => items.filter(p => p.state), [items])

  const selected = useMemo(
    () => items.find(p => p.id === selectedId) ?? null,
    [items, selectedId]
  )

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    if (!id) {
      onSelect(null)
      return
    }
    const item = activeItems.find(p => p.id === id)
    if (item) onSelect(item)
  }

  return (
    <div className="production-pm-picker">
      <div className="production-form-field production-pm-picker__select-field">
        <label className="production-form-label" htmlFor="pm-montaje-select">
          Precio de montaje
        </label>
        <select
          id="pm-montaje-select"
          className="production-form-input production-form-select production-pm-picker__select"
          value={selectedId}
          onChange={handleChange}
        >
          <option value="">Seleccionar montaje…</option>
          {activeItems.map(item => (
            <option key={item.id} value={item.id}>
              {item.name} — {formatPrecioMontajeCost(item.cost)}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="production-pm-picker__fields">
          <div className="production-form-field production-pm-picker__field-cost">
            <label className="production-form-label" htmlFor="pm-montaje-valor">
              Valor
            </label>
            <input
              id="pm-montaje-valor"
              type="text"
              className="production-form-input production-form-input--readonly production-pm-picker__valor-input"
              value={formatPrecioMontajeCost(selected.cost)}
              readOnly
              tabIndex={-1}
            />
          </div>
          <div className="production-form-field production-pm-picker__field-name">
            <label className="production-form-label" htmlFor="pm-montaje-nombre-display">
              Nombre
            </label>
            <input
              id="pm-montaje-nombre-display"
              type="text"
              className="production-form-input production-form-input--readonly production-pm-picker__nombre-input"
              value={selected.name}
              readOnly
              tabIndex={-1}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductionPrecioMontajePicker
