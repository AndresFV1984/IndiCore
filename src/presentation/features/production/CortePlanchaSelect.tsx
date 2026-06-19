import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import { getColoresOptionMeta } from './utils/coloresPlanchasUtils'
import {
  formatImpresionPlanchaColoresLabel,
  formatImpresionPlanchaSelectLabel,
} from './utils/impresionTintasUtils'

const registroCopy = copy.registroPreprensa

export interface CortePlanchaSelectOption {
  id: string
  label: string
  completo: boolean
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

const PlanchaSelectRow: React.FC<{ option: CortePlanchaSelectOption }> = ({ option }) => (
  <>
    {option.plancha ? <PlanchaColoresBadge item={option.plancha} /> : null}
    <span className="production-impresion-plancha-select__label" title={option.label}>
      {option.label}
    </span>
    {option.completo ? (
      <span className="production-impresion-plancha-select__completed-badge">
        {registroCopy.completado}
      </span>
    ) : null}
  </>
)

interface CortePlanchaSelectProps {
  id: string
  labelId: string
  options: CortePlanchaSelectOption[]
  value: string
  onChange: (id: string) => void
  placeholder: string
  faltanteGroupLabel?: string
}

const CortePlanchaSelect: React.FC<CortePlanchaSelectProps> = ({
  id,
  labelId,
  options,
  value,
  onChange,
  placeholder,
  faltanteGroupLabel,
}) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const preprensaOptions = useMemo(
    () => options.filter(option => !option.esFaltanteLitografia),
    [options]
  )
  const faltanteOptions = useMemo(
    () => options.filter(option => option.esFaltanteLitografia),
    [options]
  )
  const selected = options.find(option => option.id === value) ?? null
  const selectedCompleta = Boolean(selected?.completo)

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

  const renderOption = (option: CortePlanchaSelectOption, isCurrent: boolean) => (
    <li key={option.id} role="presentation">
      <button
        type="button"
        role="option"
        aria-selected={isCurrent}
        className={clsx(
          'production-colores-select__option',
          'production-impresion-plancha-select__option',
          isCurrent && 'production-colores-select__option--current',
          option.completo && 'production-impresion-plancha-select__option--completed',
          option.esFaltanteLitografia && 'production-corte-plancha-select__option--faltante'
        )}
        onClick={() => handleSelect(option.id)}
      >
        <PlanchaSelectRow option={option} />
      </button>
    </li>
  )

  return (
    <div
      ref={rootRef}
      className={clsx(
        'production-impresion-plancha-select',
        'production-colores-select',
        'production-corte-plancha-select',
        selected ? 'production-colores-select--filled' : 'production-colores-select--empty',
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
          aria-labelledby={selected ? labelId : undefined}
          aria-label={selected ? undefined : placeholder}
          onClick={() => setOpen(prev => !prev)}
        >
          <span className="production-colores-select__trigger-inner production-impresion-plancha-select__trigger-inner">
            {selected ? (
              <PlanchaSelectRow option={selected} />
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
          {preprensaOptions.map(option => renderOption(option, value === option.id))}
          {faltanteOptions.length > 0 && preprensaOptions.length > 0 && faltanteGroupLabel ? (
            <li
              role="presentation"
              className="production-corte-plancha-select__group-label"
              aria-hidden
            >
              {faltanteGroupLabel}
            </li>
          ) : null}
          {faltanteOptions.map(option => renderOption(option, value === option.id))}
        </ul>
      ) : null}
    </div>
  )
}

export default CortePlanchaSelect
