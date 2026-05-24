import React, { useMemo } from 'react'
import type { DespieceAsociado } from '@/core/domain/entities/CortePapel'
import type { DespiecePliego } from '@/core/domain/entities/DespiecePliego'
import type { MedidaDimension } from '@/core/domain/value-objects/MedidaDimensions'
import {
  formatDespiecePliegoOptionLabel,
  formatMedidaDisplayFrom,
  formatPiezasLabel,
  formatDespieceMedidaPiezas,
  parseMedidaParts,
} from './cortePapelUtils'

interface DespieceMetricsProps extends MedidaDimension {
  piezasPorPliego: number
  showName?: boolean
  name?: string
  /** Piezas antes que medida (por defecto: medida primero). */
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

interface DespieceAsociadoDirectoryListProps {
  despieces: DespieceAsociado[]
  emptyLabel?: string
}

const DESPIECE_INLINE_MAX = 1

const formatDespieceDirectoryLine = (d: DespieceAsociado): string => {
  const name = d.name?.trim()
  const metrics = formatDespieceMedidaPiezas(d)
  return name ? `${name} · ${metrics}` : metrics
}

const formatDespieceNamesPreview = (despieces: DespieceAsociado[], maxNames = 2): string => {
  const names = despieces.map(d => d.name?.trim()).filter(Boolean) as string[]
  if (names.length === 0) {
    return formatDespieceDirectoryLine(despieces[0])
  }
  if (names.length <= maxNames) {
    return names.join(', ')
  }
  const shown = names.slice(0, maxNames).join(', ')
  const rest = names.length - maxNames
  return `${shown} +${rest}`
}

const DespieceDirectoryCompactLine: React.FC<{ despiece: DespieceAsociado }> = ({ despiece }) => {
  const name = despiece.name?.trim()
  const metrics = formatDespieceMedidaPiezas(despiece)

  return (
    <span className="catalog-tipo-papel-despiece-line" title={formatDespieceDirectoryLine(despiece)}>
      {name ? (
        <>
          <span className="catalog-tipo-papel-despiece-line__name">{name}</span>
          <span className="catalog-tipo-papel-despiece-line__sep" aria-hidden>
            ·
          </span>
        </>
      ) : null}
      <span className="catalog-tipo-papel-despiece-line__metrics">{metrics}</span>
    </span>
  )
}

/** Listado en tablas de directorio: compacto; expandible si hay muchos despieces. */
export const DespieceAsociadoDirectoryList: React.FC<DespieceAsociadoDirectoryListProps> = ({
  despieces,
  emptyLabel = '—',
}) => {
  if (despieces.length === 0) {
    return <span className="catalog-corte-despiece-none">{emptyLabel}</span>
  }

  if (despieces.length <= DESPIECE_INLINE_MAX) {
    return (
      <ul className="catalog-tipo-papel-despiece-compact">
        {despieces.map(d => (
          <li key={d.despieceId} className="catalog-tipo-papel-despiece-compact__row">
            <DespieceDirectoryCompactLine despiece={d} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <details className="catalog-tipo-papel-despiece-details">
      <summary className="catalog-tipo-papel-despiece-details__summary">
        <span className="catalog-tipo-papel-despiece-details__badge" aria-hidden>
          {despieces.length}
        </span>
        <span className="catalog-tipo-papel-despiece-details__lead">
          <span className="catalog-tipo-papel-despiece-details__preview">
            {formatDespieceNamesPreview(despieces)}
          </span>
          <span className="catalog-tipo-papel-despiece-details__hint">
            Ver {despieces.length} despieces
          </span>
        </span>
        <span className="catalog-tipo-papel-despiece-details__chevron" aria-hidden />
      </summary>
      <ul className="catalog-tipo-papel-despiece-details__panel">
        {despieces.map(d => (
          <li key={d.despieceId} className="catalog-tipo-papel-despiece-details__item">
            <DespieceDirectoryCompactLine despiece={d} />
          </li>
        ))}
      </ul>
    </details>
  )
}

interface DespieceAsociadoPickerProps {
  catalog: DespiecePliego[]
  selected: DespieceAsociado[]
  onChange: (next: DespieceAsociado[]) => void
  single?: boolean
  selectId?: string
}

const toAsociado = (item: DespiecePliego): DespieceAsociado => ({
  despieceId: item.id,
  name: item.name,
  ancho: item.ancho,
  alto: item.alto,
  unidadMedida: item.unidadMedida,
  piezasPorPliego: item.piezasPorPliego,
})


const sortDespiecesCatalog = (items: DespiecePliego[]): DespiecePliego[] =>
  [...items].sort((a, b) => {
    const byName = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    if (byName !== 0) return byName
    return formatDespiecePliegoOptionLabel(a).localeCompare(formatDespiecePliegoOptionLabel(b), 'es', {
      sensitivity: 'base',
    })
  })

export const DespieceAsociadoPicker: React.FC<DespieceAsociadoPickerProps> = ({
  catalog,
  selected,
  onChange,
  single = false,
  selectId = 'catalog-despiece-select',
}) => {
  const sortedCatalog = useMemo(() => sortDespiecesCatalog(catalog), [catalog])
  const selectedIds = useMemo(() => new Set(selected.map(s => s.despieceId)), [selected])

  const availableCatalog = useMemo(
    () => (single ? sortedCatalog : sortedCatalog.filter(d => !selectedIds.has(d.id))),
    [sortedCatalog, selectedIds, single]
  )

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    if (!id) {
      if (single) onChange([])
      return
    }

    const item = catalog.find(d => d.id === id)
    if (!item) return

    if (single) {
      onChange([toAsociado(item)])
      return
    }

    if (!selectedIds.has(id)) {
      onChange([...selected, toAsociado(item)])
    }

    e.target.value = ''
  }

  if (catalog.length === 0) {
    return (
      <p className="catalog-corte-despiece-picker-empty">
        No hay despieces en el catálogo. Cree registros en «Despiece por pliego» primero.
      </p>
    )
  }

  return (
    <div className="catalog-despiece-select-picker">
      {!single && selected.length > 0 ? (
        <div className="catalog-despiece-select-picker__selected">
          <span className="catalog-corte-despiece-picker-summary-label">
            {selected.length} asociado{selected.length === 1 ? '' : 's'}
          </span>
          <DespieceAsociadoChips
            despieces={selected}
            onRemove={id => onChange(selected.filter(s => s.despieceId !== id))}
          />
        </div>
      ) : null}

      <select
        id={selectId}
        className="record-form-input"
        value={single ? (selected[0]?.despieceId ?? '') : ''}
        onChange={handleSelectChange}
      >
        <option value="">
          {single ? 'Seleccionar despiece por pliego…' : 'Agregar despiece por pliego…'}
        </option>
        {(single ? sortedCatalog : availableCatalog).map(item => (
          <option key={item.id} value={item.id}>
            {formatDespiecePliegoOptionLabel(item)}
          </option>
        ))}
      </select>

      {!single && availableCatalog.length === 0 && sortedCatalog.length > 0 ? (
        <p className="catalog-despiece-select-picker__note">
          Todos los despieces disponibles ya están asociados.
        </p>
      ) : null}
    </div>
  )
}
