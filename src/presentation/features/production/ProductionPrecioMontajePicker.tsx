import React, { useMemo } from 'react'
import clsx from 'clsx'
import { PrecioMontaje } from '../../../core/domain/entities/PrecioMontaje'
import type { PrecioMontajeSnapshot } from './utils/preprensaMontajeResolve'
import { PREPRENSA_DISENO_COPY } from './constants/preprensaDisenoCopy'
import { buildPrecioMontajePickerOptions } from './utils/preprensaMontajeResolve'

const copy = PREPRENSA_DISENO_COPY.nuevo.montaje

interface ProductionPrecioMontajePickerProps {
  items: PrecioMontaje[]
  snapshot: PrecioMontajeSnapshot
  onSelect: (item: PrecioMontaje | null) => void
  /** Si se indica, el select queda bajo ese título sin etiqueta duplicada */
  labelId?: string
}

export const formatPrecioMontajeCost = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const ProductionPrecioMontajePicker: React.FC<ProductionPrecioMontajePickerProps> = ({
  items,
  snapshot,
  onSelect,
  labelId,
}) => {
  const pickerState = useMemo(
    () => buildPrecioMontajePickerOptions(items, snapshot),
    [items, snapshot]
  )

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    if (!id) {
      onSelect(null)
      return
    }
    const item = items.find(entry => entry.id === id)
    if (item) {
      onSelect(item)
      return
    }
    if (id === snapshot.precioMontajeId.trim()) {
      onSelect(
        new PrecioMontaje(
          snapshot.precioMontajeId,
          snapshot.precioMontajeNombre,
          snapshot.precioMontajeCosto,
          false
        )
      )
    }
  }

  if (pickerState.activeItems.length === 0 && !pickerState.hasSelection) {
    return <p className="production-diseno-montaje-select__empty">{copy.empty}</p>
  }

  return (
    <div className="production-diseno-montaje-select">
      <div className="production-diseno-montaje-select__field">
        {labelId ? (
          <span className="sr-only" id="diseno-montaje-select-label">
            {copy.selectLabel}
          </span>
        ) : (
          <>
            <p className="production-diseno-montaje-select__hint">{copy.hint}</p>
            <label className="production-form-label" htmlFor="diseno-montaje-select">
              {copy.selectLabel}
            </label>
          </>
        )}
        <select
          id="diseno-montaje-select"
          className={clsx(
            'production-form-input',
            'production-form-select',
            'production-diseno-montaje-select__control',
            !pickerState.selectedId && 'production-diseno-montaje-select__control--empty'
          )}
          value={pickerState.selectedId}
          onChange={handleChange}
          aria-label={labelId ? undefined : copy.ariaLabel}
          aria-labelledby={
            labelId ? `${labelId} diseno-montaje-select-label` : undefined
          }
        >
          <option value="">{copy.sinMontajeOption}</option>
          {pickerState.options.map(option => {
            const cost =
              option.id === snapshot.precioMontajeId
                ? pickerState.displayCost
                : items.find(item => item.id === option.id)?.cost ?? 0
            const suffix = option.historial
              ? copy.historialSuffix
              : option.inactive
                ? copy.inactiveSuffix
                : ''
            return (
              <option key={option.id} value={option.id}>
                {option.label} — {formatPrecioMontajeCost(cost)}
                {suffix ? ` (${suffix})` : ''}
              </option>
            )
          })}
        </select>
      </div>

      {pickerState.hasSelection ? (
        <div className="production-diseno-montaje-select__resumen" role="status">
          <span className="production-diseno-montaje-select__resumen-label">
            {copy.resumenLabel}
          </span>
          <span className="production-diseno-montaje-select__resumen-name">
            {pickerState.displayName}
          </span>
          <strong className="production-diseno-montaje-select__resumen-price">
            {formatPrecioMontajeCost(pickerState.displayCost)}
          </strong>
        </div>
      ) : null}
    </div>
  )
}

export default ProductionPrecioMontajePicker
