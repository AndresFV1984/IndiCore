import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import { TERMINADOS_COPY as copy } from './constants/terminadosCopy'
import { getColoresOptionMeta } from './utils/coloresPlanchasUtils'
import { formatImpresionPlanchaColoresLabel } from './utils/impresionTintasUtils'
import type { TerminadosCorteContext } from './utils/terminadosUtils'
import { resolveTerminadosContextPlancha } from './utils/terminadosUtils'

const registroCopy = copy.asignacion.registro

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
  context: TerminadosCorteContext
  coloresPlanchas: DisenoColorPlanchaItem[]
  completada: boolean
}> = ({ context, coloresPlanchas, completada }) => {
  const plancha = resolveTerminadosContextPlancha(context, coloresPlanchas)

  return (
    <>
      {plancha ? <PlanchaColoresBadge item={plancha} /> : null}
      <span className="production-impresion-plancha-select__label" title={context.label}>
        {context.label}
      </span>
      {completada ? (
        <span className="production-impresion-plancha-select__completed-badge">
          {registroCopy.completo}
        </span>
      ) : null}
    </>
  )
}

interface TerminadosPlanchaSelectProps {
  id: string
  labelId: string
  contexts: TerminadosCorteContext[]
  coloresPlanchas: DisenoColorPlanchaItem[]
  value: string
  completedRowKeys?: string[]
  onChange: (corteRowKey: string) => void
  placeholder: string
}

const TerminadosPlanchaSelect: React.FC<TerminadosPlanchaSelectProps> = ({
  id,
  labelId,
  contexts,
  coloresPlanchas,
  value,
  completedRowKeys = [],
  onChange,
  placeholder,
}) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const completedSet = useMemo(() => new Set(completedRowKeys), [completedRowKeys])
  const selected = contexts.find(item => item.corteRowKey === value) ?? null
  const selectedCompleta = selected ? completedSet.has(selected.corteRowKey) : false

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

  const handleSelect = (nextKey: string) => {
    onChange(nextKey)
    setOpen(false)
  }

  return (
    <div
      ref={rootRef}
      className={clsx(
        'production-impresion-plancha-select',
        'production-colores-select',
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
              <PlanchaSelectRow
                context={selected}
                coloresPlanchas={coloresPlanchas}
                completada={selectedCompleta}
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
          {contexts.map(context => {
            const isCurrent = value === context.corteRowKey
            const isCompleta = completedSet.has(context.corteRowKey)
            return (
              <li key={context.corteRowKey} role="presentation">
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
                  onClick={() => handleSelect(context.corteRowKey)}
                >
                  <PlanchaSelectRow
                    context={context}
                    coloresPlanchas={coloresPlanchas}
                    completada={isCompleta}
                  />
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export default TerminadosPlanchaSelect
