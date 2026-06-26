import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { getColoresOptionMeta } from './utils/coloresPlanchasUtils'
import {
  formatImpresionPlanchaColoresLabel,
  formatImpresionPlanchaSelectLabel,
} from './utils/impresionTintasUtils'

const registroCopy = copy.tintas.registro

export interface ImpresionPlanchaSelectExtraOption {
  id: string
  label: string
  completada: boolean
  esFaltanteLitografia?: boolean
  plancha?: DisenoColorPlanchaItem
}

const PlanchaColoresBadge: React.FC<{ item: DisenoColorPlanchaItem }> = ({ item }) => {
  const coloresMeta = getColoresOptionMeta(item.colores)
  const coloresLabel = formatImpresionPlanchaColoresLabel(item)

  return (
    <span
      className="production-impresion-plancha-select__colores-badge"
      title={coloresLabel}
      aria-label={coloresLabel}
    >
      <span className="production-impresion-plancha-select__colores-badge-value">
        {coloresMeta.shortLabel}
      </span>
      <span className="production-impresion-plancha-select__colores-badge-unit">
        {coloresMeta.count === 1 ? 'color' : 'colores'}
      </span>
    </span>
  )
}

const PlanchaSelectRow: React.FC<{
  item?: DisenoColorPlanchaItem
  label?: string
  completada: boolean
  completedLabel: string
}> = ({ item, label, completada, completedLabel }) => {
  const displayLabel = item ? formatImpresionPlanchaSelectLabel(item) : (label ?? '')

  return (
    <>
      {item ? <PlanchaColoresBadge item={item} /> : null}
      <span className="production-impresion-plancha-select__label" title={displayLabel}>
        {displayLabel}
      </span>
      {completada ? (
        <span className="production-impresion-plancha-select__completed-badge">{completedLabel}</span>
      ) : null}
    </>
  )
}

interface ImpresionPlanchaSelectProps {
  id: string
  labelId: string
  coloresPlanchas: DisenoColorPlanchaItem[]
  value: string
  completedPlanchaIds?: string[]
  extraOptions?: ImpresionPlanchaSelectExtraOption[]
  faltanteGroupLabel?: string
  completedLabel?: string
  onChange: (id: string) => void
  placeholder: string
}

const ImpresionPlanchaSelect: React.FC<ImpresionPlanchaSelectProps> = ({
  id,
  labelId,
  coloresPlanchas,
  value,
  completedPlanchaIds = [],
  extraOptions = [],
  faltanteGroupLabel,
  completedLabel = registroCopy.completado,
  onChange,
  placeholder,
}) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const completedSet = useMemo(() => new Set(completedPlanchaIds), [completedPlanchaIds])
  const hasFaltanteOptions = extraOptions.some(option => option.esFaltanteLitografia)

  const selectedPlancha = coloresPlanchas.find(item => item.id === value) ?? null
  const selectedExtra = extraOptions.find(option => option.id === value) ?? null
  const selectedCompleta = selectedPlancha
    ? completedSet.has(selectedPlancha.id)
    : Boolean(selectedExtra?.completada)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleSelect = (nextId: string) => {
    onChange(nextId)
    setOpen(false)
  }

  const renderPlanchaOption = (item: DisenoColorPlanchaItem) => {
    const isCurrent = value === item.id
    const isCompleta = completedSet.has(item.id)

    return (
      <li key={item.id} role="presentation">
        <button
          type="button"
          role="option"
          aria-selected={isCurrent}
          className={clsx(
            'production-colores-select__option',
            'production-impresion-plancha-select__option',
            isCurrent && 'production-colores-select__option--current',
            isCompleta && 'production-impresion-plancha-select__option--completed'
          )}
          onClick={() => handleSelect(item.id)}
        >
          <PlanchaSelectRow item={item} completada={isCompleta} completedLabel={completedLabel} />
        </button>
      </li>
    )
  }

  const renderExtraOption = (option: ImpresionPlanchaSelectExtraOption) => {
    const isCurrent = value === option.id

    return (
      <li key={option.id} role="presentation">
        <button
          type="button"
          role="option"
          aria-selected={isCurrent}
          className={clsx(
            'production-colores-select__option',
            'production-impresion-plancha-select__option',
            isCurrent && 'production-colores-select__option--current',
            option.completada && 'production-impresion-plancha-select__option--completed',
            option.esFaltanteLitografia && 'production-corte-plancha-select__option--faltante'
          )}
          onClick={() => handleSelect(option.id)}
        >
          <PlanchaSelectRow
            item={option.plancha}
            label={option.label}
            completada={option.completada}
            completedLabel={completedLabel}
          />
        </button>
      </li>
    )
  }

  const preprensaExtraOptions = extraOptions.filter(option => !option.esFaltanteLitografia)
  const faltanteExtraOptions = extraOptions.filter(option => option.esFaltanteLitografia)

  return (
    <div
      ref={rootRef}
      className={clsx(
        'production-impresion-plancha-select',
        'production-colores-select',
        hasFaltanteOptions && 'production-corte-plancha-select',
        selectedPlancha || selectedExtra
          ? 'production-colores-select--filled'
          : 'production-colores-select--empty',
        open && 'production-impresion-plancha-select--open'
      )}
    >
      <div className="production-colores-select__row production-impresion-plancha-select__row">
        <button
          type="button"
          id={id}
          className={clsx(
            'production-colores-select__trigger',
            'production-impresion-plancha-select__trigger',
            selectedCompleta && 'production-impresion-plancha-select__trigger--completed'
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={selectedPlancha || selectedExtra ? labelId : undefined}
          aria-label={selectedPlancha || selectedExtra ? undefined : placeholder}
          onClick={() => setOpen(prev => !prev)}
        >
          <span className="production-colores-select__trigger-inner production-impresion-plancha-select__trigger-inner">
            {selectedPlancha ? (
              <PlanchaSelectRow
                item={selectedPlancha}
                completada={selectedCompleta}
                completedLabel={completedLabel}
              />
            ) : selectedExtra ? (
              <PlanchaSelectRow
                item={selectedExtra.plancha}
                label={selectedExtra.label}
                completada={selectedCompleta}
                completedLabel={completedLabel}
              />
            ) : (
              <span className="production-colores-select__placeholder">{placeholder}</span>
            )}
          </span>
          <span className="production-colores-select__chevron" aria-hidden />
        </button>
      </div>

      {open ? (
        <ul
          id={listboxId}
          className="production-colores-select__list production-impresion-plancha-select__list"
          role="listbox"
          aria-labelledby={labelId}
        >
          {coloresPlanchas.map(renderPlanchaOption)}
          {preprensaExtraOptions.map(renderExtraOption)}
          {faltanteExtraOptions.length > 0 && coloresPlanchas.length > 0 && faltanteGroupLabel ? (
            <li
              role="presentation"
              className="production-corte-plancha-select__group-label"
              aria-hidden
            >
              {faltanteGroupLabel}
            </li>
          ) : null}
          {faltanteExtraOptions.map(renderExtraOption)}
        </ul>
      ) : null}
    </div>
  )
}

export default ImpresionPlanchaSelect
