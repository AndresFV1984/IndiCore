import React, { useMemo } from 'react'
import clsx from 'clsx'
import { PrecioMontaje } from '../../../core/domain/entities/PrecioMontaje'
import { PREPRENSA_DISENO_COPY } from './constants/preprensaDisenoCopy'

const copy = PREPRENSA_DISENO_COPY.nuevo.montaje

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

  if (activeItems.length === 0) {
    return <p className="production-diseno-montaje-select__empty">{copy.empty}</p>
  }

  return (
    <div className="production-diseno-montaje-select">
      <p className="production-diseno-montaje-select__hint">{copy.hint}</p>

      <div className="production-diseno-montaje-select__field">
        <label className="production-form-label" htmlFor="diseno-montaje-select">
          {copy.selectLabel}
        </label>
        <select
          id="diseno-montaje-select"
          className={clsx(
            'production-form-input',
            'production-form-select',
            'production-diseno-montaje-select__control',
            !selectedId && 'production-diseno-montaje-select__control--empty'
          )}
          value={selectedId}
          onChange={handleChange}
          aria-label={copy.ariaLabel}
        >
          <option value="">{copy.sinMontajeOption}</option>
          {activeItems.map(item => (
            <option key={item.id} value={item.id}>
              {item.name} — {formatPrecioMontajeCost(item.cost)}
            </option>
          ))}
        </select>
      </div>

      {selected ? (
        <div className="production-diseno-montaje-select__resumen" role="status">
          <span className="production-diseno-montaje-select__resumen-label">
            {copy.resumenLabel}
          </span>
          <span className="production-diseno-montaje-select__resumen-name">{selected.name}</span>
          <strong className="production-diseno-montaje-select__resumen-price">
            {formatPrecioMontajeCost(selected.cost)}
          </strong>
        </div>
      ) : null}
    </div>
  )
}

export default ProductionPrecioMontajePicker
