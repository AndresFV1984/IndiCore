import React from 'react'
import type { DespieceAsociado } from '@/core/domain/entities/CortePapel'
import type { DespiecePliego } from '@/core/domain/entities/DespiecePliego'
import type { MedidaDimension } from '@/core/domain/value-objects/MedidaDimensions'
import { formatMedidaDisplayFrom, formatPiezasLabel, parseMedidaParts } from './cortePapelUtils'

interface DespieceMetricsProps extends MedidaDimension {
  piezasPorPliego: number
  showName?: boolean
  name?: string
  /** Piezas antes que medida (p. ej. columna en catálogo de cortes). */
  piezasFirst?: boolean
}

/** Texto compacto para listas: «4 piezas · 10×5 cm» o «10×5 cm · 4 piezas». */
export const DespieceMetrics: React.FC<DespieceMetricsProps> = ({
  ancho,
  alto,
  unidadMedida,
  piezasPorPliego,
  showName = false,
  name,
  piezasFirst = false,
}) => {
  const { value, unit } = parseMedidaParts({ ancho, alto, unidadMedida })
  const piezasLabel = formatPiezasLabel(piezasPorPliego)
  const medidaLabel = formatMedidaDisplayFrom({ ancho, alto, unidadMedida })

  const piezasEl = (
    <span className="catalog-corte-despiece-inline__piezas">{piezasLabel}</span>
  )
  const medidaEl = (
    <span className="catalog-corte-despiece-inline__medida">
      {value}
      <span className="catalog-corte-despiece-inline__unit">{unit}</span>
    </span>
  )
  const sep = (
    <span className="catalog-corte-despiece-inline__sep" aria-hidden>
      ·
    </span>
  )

  return (
    <span
      className={`catalog-corte-despiece-inline${piezasFirst ? ' catalog-corte-despiece-inline--piezas-first' : ''}`}
      title={
        piezasFirst ? `${piezasLabel} · ${medidaLabel}` : `${medidaLabel} · ${piezasLabel}`
      }
    >
      {piezasFirst ? (
        <>
          {piezasEl}
          {sep}
          {medidaEl}
        </>
      ) : (
        <>
          {medidaEl}
          {sep}
          {piezasEl}
        </>
      )}
      {showName && name?.trim() ? (
        <span className="catalog-corte-despiece-inline__name">({name.trim()})</span>
      ) : null}
    </span>
  )
}

interface DespieceAsociadoChipsProps {
  despieces: DespieceAsociado[]
  onRemove?: (despieceId: string) => void
  emptyLabel?: string
  showName?: boolean
  piezasFirst?: boolean
}

export const DespieceAsociadoChips: React.FC<DespieceAsociadoChipsProps> = ({
  despieces,
  onRemove,
  emptyLabel = '—',
  showName = true,
  piezasFirst = false,
}) => {
  if (despieces.length === 0) {
    return <span className="catalog-corte-despiece-none">{emptyLabel}</span>
  }

  if (!onRemove) {
    return (
      <>
        {despieces.map(d => (
          <DespieceMetrics
            key={d.despieceId}
            ancho={d.ancho}
            alto={d.alto}
            unidadMedida={d.unidadMedida}
            piezasPorPliego={d.piezasPorPliego}
            name={d.name}
            showName={showName}
            piezasFirst={piezasFirst}
          />
        ))}
      </>
    )
  }

  return (
    <ul className="catalog-corte-despiece-chips">
      {despieces.map(d => (
        <li key={d.despieceId} className="catalog-corte-despiece-chip">
          <DespieceMetrics
            ancho={d.ancho}
            alto={d.alto}
            unidadMedida={d.unidadMedida}
            piezasPorPliego={d.piezasPorPliego}
            name={d.name}
            showName={showName}
            piezasFirst={piezasFirst}
          />
          <button
            type="button"
            className="catalog-corte-despiece-chip__remove"
            onClick={() => onRemove(d.despieceId)}
            aria-label={`Quitar despiece ${formatMedidaDisplayFrom(d)}`}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}

interface DespieceAsociadoPickerProps {
  catalog: DespiecePliego[]
  selected: DespieceAsociado[]
  onChange: (next: DespieceAsociado[]) => void
  single?: boolean
}

const toAsociado = (item: DespiecePliego): DespieceAsociado => ({
  despieceId: item.id,
  name: item.name,
  ancho: item.ancho,
  alto: item.alto,
  unidadMedida: item.unidadMedida,
  piezasPorPliego: item.piezasPorPliego,
})

export const DespieceAsociadoPicker: React.FC<DespieceAsociadoPickerProps> = ({
  catalog,
  selected,
  onChange,
  single = false,
}) => {
  const selectedIds = new Set(selected.map(s => s.despieceId))

  const toggle = (item: DespiecePliego) => {
    if (single) {
      onChange(selectedIds.has(item.id) ? [] : [toAsociado(item)])
      return
    }
    if (selectedIds.has(item.id)) {
      onChange(selected.filter(s => s.despieceId !== item.id))
      return
    }
    onChange([...selected, toAsociado(item)])
  }

  if (catalog.length === 0) {
    return (
      <p className="catalog-corte-despiece-picker-empty">
        No hay despieces en el catálogo. Cree registros en «Despiece por pliego» primero.
      </p>
    )
  }

  return (
    <div className="catalog-corte-despiece-picker">
      <p className="catalog-corte-despiece-picker-hint">
        {single
          ? 'Seleccione un despiece del catálogo.'
          : 'Seleccione uno o más despieces del catálogo.'}
      </p>
      <div
        className="catalog-corte-despiece-picker-grid"
        role={single ? 'radiogroup' : 'group'}
        aria-label="Despieces disponibles"
      >
        {catalog.map(item => {
          const isSelected = selectedIds.has(item.id)
          return (
            <button
              key={item.id}
              type="button"
              className={`catalog-corte-despiece-option${isSelected ? ' is-selected' : ''}`}
              onClick={() => toggle(item)}
              aria-pressed={isSelected}
              role={single ? 'radio' : undefined}
              aria-checked={single ? isSelected : undefined}
            >
              {item.name?.trim() ? (
                <span className="catalog-corte-despiece-option__name">{item.name.trim()}</span>
              ) : null}
              <DespieceMetrics
                ancho={item.ancho}
                alto={item.alto}
                unidadMedida={item.unidadMedida}
                piezasPorPliego={item.piezasPorPliego}
              />
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <div className="catalog-corte-despiece-picker-summary">
          <span className="catalog-corte-despiece-picker-summary-label">
            {single ? 'Despiece seleccionado' : 'Seleccionados'}
          </span>
          <DespieceAsociadoChips
            despieces={selected}
            onRemove={id => onChange(selected.filter(s => s.despieceId !== id))}
          />
        </div>
      )}
    </div>
  )
}
