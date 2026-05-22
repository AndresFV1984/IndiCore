import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DisenoColorPlanchaItem, DisenoColoresOption } from '../../../core/domain/entities/PreprensaDiseno'
import { createId } from '../../../core/utils/createId'
import { TamanoPlancha } from '../../../core/domain/entities/TamanoPlancha'
import ActionIcon from '../../components/ui/ActionIcon'
import DisenoColoresPicker, { ColoresCountIcons } from './DisenoColoresPicker'
import { buildTipoPlanchaSnapshot } from './DisenoTipoPlanchaPicker'
import {
  buildPrecioPatchFromCatalog,
  computeRegistroValorTotal,
  getColoresCount,
  getColoresOptionMeta,
  resolveItemValorTotal,
  resolveNumeroPlanchasItem,
  resolvePrecioPlanchaDisplay,
  sumValorTotalPlanchas,
} from './utils/coloresPlanchasUtils'

const formatValor = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const parseDigits = (value: string): number => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

/** Evita que un clic en botón mueva el scroll al enfocar el control. */
const preventMouseDownFocusScroll = (e: React.MouseEvent) => {
  e.preventDefault()
}

/**
 * Compensa cambios de altura encima del panel (p. ej. al cerrar el formulario de alta)
 * para mantener la lista de colores en la misma posición del viewport.
 */
const preserveViewportAroundAnchor = (
  anchor: HTMLElement | null,
  mutate: () => void
) => {
  const topBefore = anchor?.getBoundingClientRect().top
  mutate()
  if (anchor == null || topBefore == null) return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const topAfter = anchor.getBoundingClientRect().top
      const delta = topAfter - topBefore
      if (Math.abs(delta) >= 0.5) {
        window.scrollBy({ top: delta, left: 0 })
      }
    })
  })
}

interface DetalleOpRequiredGateProps {
  onGoToDetalleOpTab?: () => void
}

const DetalleOpRequiredGate: React.FC<DetalleOpRequiredGateProps> = ({ onGoToDetalleOpTab }) => (
  <div className="production-plancha-detalle-op-gate" role="status">
    <div className="production-plancha-detalle-op-gate__icon" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
    <div className="production-plancha-detalle-op-gate__content">
      <p className="production-plancha-detalle-op-gate__eyebrow">Antes de seleccionar colores y planchas</p>
      <h4 className="production-plancha-detalle-op-gate__title">Registre la cantidad en Detalle OP</h4>
      <p className="production-plancha-detalle-op-gate__text">
        Complete el campo <strong>Cantidad</strong> en Especificaciones › Detalle OP. Con ese dato podrá
        elegir colores, tipos de plancha y agregar registros.
      </p>
      {onGoToDetalleOpTab && (
        <button
          type="button"
          className="production-plancha-detalle-op-gate__btn"
          onClick={onGoToDetalleOpTab}
        >
          Completar Cantidad en Detalle OP
        </button>
      )}
    </div>
  </div>
)

interface PlanchaRegistroRow {
  item: DisenoColorPlanchaItem
  meta: ReturnType<typeof getColoresOptionMeta>
  nombreMedida: string
  precioPlancha: number
  valorTotal: number
}

interface PlanchasRegistrosTableProps {
  rows: PlanchaRegistroRow[]
  valorTotalPlanchas: number
  onCantidadChange: (id: string, value: string) => void
  onRemove: (id: string) => void
}

const PlanchasRegistrosTable: React.FC<PlanchasRegistrosTableProps> = ({
  rows,
  valorTotalPlanchas,
  onCantidadChange,
  onRemove,
}) => (
  <div className="production-plancha-list">
  <div className="production-plancha-table-wrap">
    <table className="production-plancha-table">
      <thead>
        <tr>
          <th scope="col" className="production-plancha-table__th production-plancha-table__th--color">
            Colores
          </th>
          <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
            Cantidad
          </th>
          <th scope="col" className="production-plancha-table__th">
            Tipo plancha
          </th>
          <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
            Precio plancha
          </th>
          <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
            Número planchas
          </th>
          <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
            Valor total
          </th>
          <th scope="col" className="production-plancha-table__th production-plancha-table__th--desc">
            Descripción
          </th>
          <th scope="col" className="production-plancha-table__th production-plancha-table__th--act">
            <span className="sr-only">Eliminar</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ item, meta, nombreMedida, precioPlancha, valorTotal }) => (
          <tr key={item.id} className="production-plancha-table__row">
            <td className="production-plancha-table__td production-plancha-table__td--color">
              {meta && (
                <span className="production-plancha-table__color" title={meta.label}>
                  <ColoresCountIcons
                    count={meta.count}
                    size="sm"
                    showPlusSuffix={meta.value === '7-colores-o-mas'}
                  />
                  <span className="production-plancha-table__color-tag">{meta.shortLabel}</span>
                </span>
              )}
            </td>
            <td className="production-plancha-table__td production-plancha-table__td--num">
              <input
                type="text"
                inputMode="numeric"
                className="production-form-input production-plancha-table__input-num"
                value={item.cantidad > 0 ? String(item.cantidad) : ''}
                onChange={e => onCantidadChange(item.id, e.target.value)}
                onKeyDown={blockNonDigitKey}
                placeholder="Cantidad"
                aria-label={`Cantidad — ${meta?.label ?? 'registro'}`}
              />
            </td>
            <td className="production-plancha-table__td" title={nombreMedida}>
              <span className="production-plancha-table__truncate">{nombreMedida || '—'}</span>
            </td>
            <td className="production-plancha-table__td production-plancha-table__td--num">
              {precioPlancha > 0 ? formatValor(precioPlancha) : '—'}
            </td>
            <td className="production-plancha-table__td production-plancha-table__td--num">
              {item.numeroPlanchas > 0 ? item.numeroPlanchas : '—'}
            </td>
            <td className="production-plancha-table__td production-plancha-table__td--num production-plancha-table__td--total">
              {valorTotal > 0 ? formatValor(valorTotal) : '$0'}
            </td>
            <td className="production-plancha-table__td production-plancha-table__td--desc" title={item.detalle}>
              <span className="production-plancha-table__truncate">
                {item.detalle.trim() || '—'}
              </span>
            </td>
            <td className="production-plancha-table__td production-plancha-table__td--act">
              <button
                type="button"
                className="action-icon-button action-icon-delete production-plancha-table__remove"
                onClick={() => onRemove(item.id)}
                title="Eliminar"
                aria-label="Eliminar registro"
              >
                <ActionIcon name="delete" size={14} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  <div
    className="production-plancha-total"
    role="status"
    aria-label={`Valor total planchas: ${formatValor(valorTotalPlanchas)}`}
  >
    <div className="production-plancha-total__info">
      <span className="production-plancha-total__label">Valor Total Planchas</span>
      <span className="production-plancha-total__hint">
        Suma del valor total de {rows.length} {rows.length === 1 ? 'registro' : 'registros'}
      </span>
    </div>
    <strong className="production-plancha-total__value">{formatValor(valorTotalPlanchas)}</strong>
  </div>
  </div>
)

interface PlanchasRegistrosTableExistenteProps {
  rows: PlanchaRegistroRow[]
  valorTotalPlanchas: number
  onCantidadChange: (id: string, value: string) => void
  onReposicionChange: (id: string, checked: boolean) => void
  onCantidadReposicionChange: (id: string, value: string) => void
  onObservacionChange: (id: string, value: string) => void
  onRemove: (id: string) => void
}

const PlanchasRegistrosTableExistente: React.FC<PlanchasRegistrosTableExistenteProps> = ({
  rows,
  valorTotalPlanchas,
  onCantidadChange,
  onReposicionChange,
  onCantidadReposicionChange,
  onObservacionChange,
  onRemove,
}) => (
  <div className="production-plancha-list">
    <div className="production-plancha-table-wrap production-plancha-table-wrap--existente">
      <table className="production-plancha-table production-plancha-table--existente">
        <thead>
          <tr>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--color">
              Colores
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              Cantidad
            </th>
            <th scope="col" className="production-plancha-table__th">
              Tipo plancha
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--reposicion">
              Reposición plancha
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              Número planchas
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              Cantidad reposición
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              Precio plancha
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              Valor total
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--desc">
              Descripción
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--obs">
              Observación
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--act">
              <span className="sr-only">Eliminar</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ item, meta, nombreMedida, precioPlancha, valorTotal }) => {
            const esManual = Boolean(item.registroManual)
            const reposicionActiva = esManual || Boolean(item.reposicionPlancha)
            const esSieteOMas = item.colores === '7-colores-o-mas'

            return (
              <tr
                key={item.id}
                className={[
                  'production-plancha-table__row',
                  reposicionActiva ? 'production-plancha-table__row--reposicion' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <td className="production-plancha-table__td production-plancha-table__td--color">
                  {meta && (
                    <span className="production-plancha-table__color" title={meta.label}>
                      <ColoresCountIcons
                        count={meta.count}
                        size="sm"
                        showPlusSuffix={esSieteOMas}
                      />
                      <span className="production-plancha-table__color-tag">{meta.shortLabel}</span>
                    </span>
                  )}
                </td>
                <td className="production-plancha-table__td production-plancha-table__td--num">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="production-form-input production-plancha-table__input-num"
                    value={item.cantidad > 0 ? String(item.cantidad) : ''}
                    onChange={e => onCantidadChange(item.id, e.target.value)}
                    onKeyDown={blockNonDigitKey}
                    placeholder="Cantidad"
                    aria-label={`Cantidad — ${meta?.label ?? 'registro'}`}
                  />
                </td>
                <td className="production-plancha-table__td" title={nombreMedida}>
                  <span className="production-plancha-table__truncate">{nombreMedida || '—'}</span>
                </td>
                <td className="production-plancha-table__td production-plancha-table__td--reposicion">
                  {esManual ? (
                    <span className="production-plancha-table__manual-tag">Registro nuevo</span>
                  ) : (
                    <label className="production-plancha-table__reposicion">
                      <input
                        type="checkbox"
                        checked={Boolean(item.reposicionPlancha)}
                        onChange={e => onReposicionChange(item.id, e.target.checked)}
                      />
                      <span>Reposición</span>
                    </label>
                  )}
                </td>
                <td className="production-plancha-table__td production-plancha-table__td--num">
                  <span>{getColoresCount(item.colores)}</span>
                </td>
                <td className="production-plancha-table__td production-plancha-table__td--num">
                  {!esManual && item.reposicionPlancha ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      className="production-form-input production-plancha-table__input-num"
                      value={
                        (item.cantidadReposicion ?? 0) > 0
                          ? String(item.cantidadReposicion)
                          : ''
                      }
                      onChange={e => onCantidadReposicionChange(item.id, e.target.value)}
                      onKeyDown={blockNonDigitKey}
                      placeholder={esSieteOMas ? 'Mín. 7' : undefined}
                      aria-label={`Cantidad reposición — ${meta?.label ?? 'registro'}`}
                    />
                  ) : (
                    <span className="production-plancha-table__muted">—</span>
                  )}
                </td>
                <td className="production-plancha-table__td production-plancha-table__td--num">
                  {reposicionActiva && precioPlancha > 0 ? formatValor(precioPlancha) : '—'}
                </td>
                <td className="production-plancha-table__td production-plancha-table__td--num production-plancha-table__td--total">
                  {reposicionActiva && valorTotal > 0 ? formatValor(valorTotal) : '$0'}
                </td>
                <td className="production-plancha-table__td production-plancha-table__td--desc" title={item.detalle}>
                  <span className="production-plancha-table__truncate">
                    {item.detalle.trim() || '—'}
                  </span>
                </td>
                <td className="production-plancha-table__td production-plancha-table__td--obs">
                  {!esManual && item.reposicionPlancha ? (
                    <input
                      type="text"
                      className="production-form-input production-plancha-table__input-obs"
                      value={item.observacion}
                      onChange={e => onObservacionChange(item.id, e.target.value)}
                      placeholder="Motivo de la reposición…"
                      aria-label={`Observación — ${meta?.label ?? 'registro'}`}
                    />
                  ) : (
                    <span className="production-plancha-table__muted">—</span>
                  )}
                </td>
                <td className="production-plancha-table__td production-plancha-table__td--act">
                  <button
                    type="button"
                    className="action-icon-button action-icon-delete production-plancha-table__remove"
                    onClick={() => onRemove(item.id)}
                    title="Eliminar"
                    aria-label="Eliminar registro"
                  >
                    <ActionIcon name="delete" size={14} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    <div
      className="production-plancha-total"
      role="status"
      aria-label={`Valor total planchas: ${formatValor(valorTotalPlanchas)}`}
    >
      <div className="production-plancha-total__info">
        <span className="production-plancha-total__label">Valor Total Planchas</span>
        <span className="production-plancha-total__hint">
          Suma con reposición activa · {rows.length}{' '}
          {rows.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>
      <strong className="production-plancha-total__value">{formatValor(valorTotalPlanchas)}</strong>
    </div>
  </div>
)

interface RegistroOpComposerFormProps {
  meta: ReturnType<typeof getColoresOptionMeta>
  draftCantidad: string
  onCantidadChange: (value: string) => void
  detalleOpCantidadLista: boolean
  draftPlanchaId: string
  activePlanchas: TamanoPlancha[]
  onPlanchaChange: (id: string) => void
  draftPrecioPlancha: number
  draftNumeroPlanchas: number
  isSieteOMasColores: boolean
  draftNumeroPlanchasManual: string
  onNumeroPlanchasManualChange: (value: string) => void
  draftValorTotal: number
  draftDescripcion: string
  onDescripcionChange: (value: string) => void
  draftError: string | null
  onCancel: () => void
  onAdd: () => void
  canAdd: boolean
}

const RegistroOpComposerForm: React.FC<RegistroOpComposerFormProps> = ({
  meta,
  draftCantidad,
  onCantidadChange,
  detalleOpCantidadLista,
  draftPlanchaId,
  activePlanchas,
  onPlanchaChange,
  draftPrecioPlancha,
  draftNumeroPlanchas,
  isSieteOMasColores,
  draftNumeroPlanchasManual,
  onNumeroPlanchasManualChange,
  draftValorTotal,
  draftDescripcion,
  onDescripcionChange,
  draftError,
  onCancel,
  onAdd,
  canAdd,
}) => {
  const numeroPlanchasDisplay = isSieteOMasColores
    ? draftNumeroPlanchasManual
    : draftNumeroPlanchas > 0
      ? String(draftNumeroPlanchas)
      : ''

  return (
    <div className="production-plancha-draft">
      <header className="production-plancha-draft__head">
        <span className="production-plancha-workspace__zone-label">2. Datos del registro</span>
      </header>

      <p className="production-plancha-draft__intro">
        Elija el tipo de plancha, revise el total calculado y agregue una descripción.
      </p>

      <div className="production-plancha-draft__fields">
        <div className="production-form-field production-form-field--full">
          <label className="production-form-label" htmlFor="diseno-add-plancha">
            Tipo plancha
          </label>
          <select
            id="diseno-add-plancha"
            className={`production-form-input production-form-select${draftPlanchaId ? '' : ' production-form-select--placeholder'}`}
            value={draftPlanchaId}
            disabled={!detalleOpCantidadLista}
            onChange={e => onPlanchaChange(e.target.value)}
          >
            <option value="">Seleccione tipo de plancha…</option>
            {activePlanchas.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.medida}
              </option>
            ))}
          </select>
          {!draftPlanchaId && (
            <span className="production-plancha-draft__field-hint">Paso 1 — obligatorio</span>
          )}
        </div>

        <div className="production-plancha-draft__readonly-grid">
          <div className="production-plancha-draft__readonly">
            <label className="production-form-label" htmlFor="diseno-add-cantidad">
              Cantidad
            </label>
            <input
              id="diseno-add-cantidad"
              type="text"
              inputMode="numeric"
              className="production-form-input"
              value={draftCantidad}
              disabled={!detalleOpCantidadLista}
              onChange={e => onCantidadChange(e.target.value.replace(/\D/g, ''))}
              onKeyDown={blockNonDigitKey}
              placeholder="Cantidad del registro"
              aria-label="Cantidad del registro"
            />
            <span className="production-plancha-draft__field-hint">
              Editable por registro; puede ajustarla en la tabla después de agregar
            </span>
          </div>

          <div className="production-plancha-draft__readonly">
            <label className="production-form-label" htmlFor="diseno-add-num-planchas">
              Número planchas
            </label>
            {isSieteOMasColores ? (
              <input
                id="diseno-add-num-planchas"
                type="text"
                inputMode="numeric"
                className="production-form-input"
                value={draftNumeroPlanchasManual}
                disabled={!detalleOpCantidadLista}
                onChange={e => onNumeroPlanchasManualChange(e.target.value.replace(/\D/g, ''))}
                onKeyDown={blockNonDigitKey}
                placeholder="Mínimo 7"
              />
            ) : (
              <input
                id="diseno-add-num-planchas"
                type="text"
                className="production-form-input production-form-input--readonly"
                value={numeroPlanchasDisplay}
                readOnly
                tabIndex={-1}
                aria-label="Número de planchas según colores"
              />
            )}
            <span className="production-plancha-draft__field-hint">
              {isSieteOMasColores ? 'Ingrese 7 o más' : 'Según colores elegidos'}
            </span>
          </div>

          <div className="production-plancha-draft__readonly">
            <span className="production-form-label">Precio plancha</span>
            <input
              type="text"
              className="production-form-input production-form-input--readonly"
              value={draftPrecioPlancha > 0 ? formatValor(draftPrecioPlancha) : ''}
              readOnly
              tabIndex={-1}
              placeholder={draftPlanchaId ? '—' : 'Seleccione plancha…'}
            />
          </div>
        </div>

        <div className="production-plancha-draft__total" aria-live="polite">
          <div className="production-plancha-draft__total-text">
            <span className="production-plancha-draft__total-label">Valor total</span>
            <span className="production-plancha-draft__total-formula">Precio plancha × Número planchas</span>
          </div>
          <strong className="production-plancha-draft__total-value">
            {draftValorTotal > 0 ? formatValor(draftValorTotal) : '$0'}
          </strong>
        </div>

        <div className="production-form-field production-form-field--full">
          <label className="production-form-label" htmlFor="diseno-add-descripcion">
            Descripción
          </label>
          <input
            id="diseno-add-descripcion"
            type="text"
            className="production-form-input"
            value={draftDescripcion}
            disabled={!detalleOpCantidadLista}
            onChange={e => onDescripcionChange(e.target.value)}
            placeholder="Ej. Tinta Pantone, acabado…"
          />
          <span className="production-plancha-draft__field-hint">Paso 2 — obligatorio</span>
        </div>
      </div>

      {draftError && <p className="production-form-error">{draftError}</p>}

      <footer className="production-plancha-draft__footer">
        <button
          type="button"
          className="production-plancha-draft__btn production-plancha-draft__btn--ghost"
          onMouseDown={preventMouseDownFocusScroll}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="production-plancha-draft__btn production-plancha-draft__btn--primary"
          onMouseDown={preventMouseDownFocusScroll}
          onClick={onAdd}
          disabled={!canAdd}
        >
          Agregar registro
        </button>
      </footer>
    </div>
  )
}

const blockNonDigitKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowed = [
    'Backspace',
    'Delete',
    'Tab',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]
  if (allowed.includes(e.key)) return
  if (!/^\d$/.test(e.key)) e.preventDefault()
}

interface DisenoColoresPlanchasPanelProps {
  items: DisenoColorPlanchaItem[]
  planchas: TamanoPlancha[]
  onChange: (items: DisenoColorPlanchaItem[]) => void
  /** Orden nueva: cantidad OP, número planchas y totales */
  isNewOrder?: boolean
  /** Especificaciones › Detalle OP › Cantidad */
  orderQuantity?: number
  /** Trabajo anterior: valores de plancha en cero y registros editables con observación */
  historialMode?: boolean
  onGoToDetalleOpTab?: () => void
}

const DisenoColoresPlanchasPanel: React.FC<DisenoColoresPlanchasPanelProps> = ({
  items,
  planchas,
  onChange,
  isNewOrder = false,
  orderQuantity = 0,
  historialMode = false,
  onGoToDetalleOpTab,
}) => {
  const usePlanchaPricing = isNewOrder
  const detalleOpCantidadLista = !usePlanchaPricing || orderQuantity > 0

  const [draftColor, setDraftColor] = useState<DisenoColoresOption | ''>('')
  const [draftPlanchaId, setDraftPlanchaId] = useState('')
  const [draftNumeroPlanchasManual, setDraftNumeroPlanchasManual] = useState('')
  const [draftCantidad, setDraftCantidad] = useState('')
  const [draftDescripcion, setDraftDescripcion] = useState('')
  const [draftCavidades, setDraftCavidades] = useState('')
  const [draftDetalle, setDraftDetalle] = useState('')
  const [draftError, setDraftError] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [pickerKey, setPickerKey] = useState(0)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const coloresPanelRef = useRef<HTMLDivElement>(null)

  const preserveColoresPanelViewport = (mutate: () => void) => {
    preserveViewportAroundAnchor(coloresPanelRef.current, mutate)
  }

  const activePlanchas = useMemo(() => planchas.filter(p => p.active), [planchas])
  const draftPlancha = useMemo(
    () => activePlanchas.find(p => p.id === draftPlanchaId),
    [activePlanchas, draftPlanchaId]
  )
  const draftPrecioPlancha = draftPlancha?.valor ?? 0
  const isSieteOMasColores = draftColor === '7-colores-o-mas'
  const draftNumeroPlanchas = isSieteOMasColores
    ? parseDigits(draftNumeroPlanchasManual)
    : getColoresCount(draftColor)
  const draftValorTotal = useMemo(() => {
    if (draftNumeroPlanchas <= 0 || draftPrecioPlancha <= 0) return 0
    return computeRegistroValorTotal(draftNumeroPlanchas, draftPrecioPlancha)
  }, [draftNumeroPlanchas, draftPrecioPlancha])

  const valorTotalPlanchas = useMemo(
    () => sumValorTotalPlanchas(items, historialMode),
    [items, historialMode]
  )

  useEffect(() => {
    if (!detalleOpCantidadLista) {
      setDraftColor('')
      setDraftPlanchaId('')
      setDraftDescripcion('')
      setDraftNumeroPlanchasManual('')
      setDraftCantidad('')
      setDraftError(null)
      setPickerKey(k => k + 1)
    }
  }, [detalleOpCantidadLista])

  useEffect(() => {
    if (!historialMode) return
    const current = itemsRef.current
    const needsSync = current.some(
      item =>
        !item.registroManual &&
        !item.reposicionPlancha &&
        item.numeroPlanchas !== getColoresCount(item.colores)
    )
    if (!needsSync) return
    onChange(
      current.map(item =>
        !item.registroManual && !item.reposicionPlancha
          ? { ...item, numeroPlanchas: getColoresCount(item.colores) }
          : item
      )
    )
  }, [historialMode, items, onChange])

  const resolveDisplay = (item: DisenoColorPlanchaItem) => {
    const catalog = planchas.find(p => p.id === item.planchaId && p.active)
    const meta = getColoresOptionMeta(item.colores)
    const precioPlancha = resolvePrecioPlanchaDisplay(
      item,
      catalog?.valor,
      historialMode
    )
    const valorTotal = resolveItemValorTotal(
      { ...item, planchaValor: precioPlancha },
      { historialMode }
    )
    return {
      meta,
      nombreMedida: catalog
        ? `${catalog.name} — ${catalog.medida}`
        : item.planchaNombreMedida,
      precioPlancha,
      valorTotal,
      catalog,
    }
  }

  const resetDraftAfterAdd = () => {
    setDraftColor('')
    setDraftPlanchaId('')
    setDraftDescripcion('')
    setDraftNumeroPlanchasManual('')
    setDraftCantidad('')
    setDraftError(null)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const resetDraft = () => {
    setDraftColor('')
    setDraftPlanchaId('')
    setDraftDescripcion('')
    setDraftNumeroPlanchasManual('')
    setDraftCantidad('')
    setDraftCavidades('')
    setDraftDetalle('')
    setDraftError(null)
    setPickerKey(k => k + 1)
  }

  const resetColorOnly = () => {
    setDraftColor('')
    setDraftPlanchaId('')
    setDraftDescripcion('')
    setDraftNumeroPlanchasManual('')
    setDraftCantidad('')
    setDraftError(null)
    setPickerKey(k => k + 1)
  }

  const defaultCantidadFromOp = () =>
    orderQuantity > 0 ? String(orderQuantity) : ''

  const draftMeta = draftColor ? getColoresOptionMeta(draftColor) : null

  const handleAddRegistro = () => {
    if (!draftColor) {
      setDraftError('Seleccione un color de la lista.')
      return
    }
    if (!draftPlanchaId) {
      setDraftError('Seleccione el tipo de plancha.')
      return
    }
    const plancha = planchas.find(p => p.id === draftPlanchaId)
    if (!plancha) return
    const snapshot = buildTipoPlanchaSnapshot(plancha)

    if (usePlanchaPricing) {
      if (orderQuantity <= 0) {
        setDraftError(
          'Registre la cantidad en Especificaciones › Detalle OP antes de agregar planchas.'
        )
        return
      }
      const numeroPlanchas = isSieteOMasColores
        ? parseDigits(draftNumeroPlanchasManual)
        : getColoresCount(draftColor)
      if (numeroPlanchas <= 0) {
        setDraftError(
          isSieteOMasColores
            ? 'Ingrese el número de planchas (7 o más).'
            : 'Seleccione la cantidad de colores de la lista.'
        )
        return
      }
      if (isSieteOMasColores && numeroPlanchas < 7) {
        setDraftError('El número de planchas debe ser 7 o mayor.')
        return
      }
      const cantidad = parseDigits(draftCantidad)
      if (cantidad <= 0) {
        setDraftError('Ingrese la cantidad del registro.')
        return
      }
      const descripcion = draftDescripcion.trim()
      if (!descripcion) {
        setDraftError('Ingrese la descripción del registro.')
        return
      }
      const valorTotal = computeRegistroValorTotal(numeroPlanchas, plancha.valor)
      preserveColoresPanelViewport(() => {
        onChange([
          ...itemsRef.current,
          {
            id: createId(),
            colores: draftColor,
            cantidad,
            numeroPlanchas,
            valorTotal,
            numeroCavidades: 0,
            detalle: descripcion,
            observacion: '',
            reposicionPlancha: false,
            cantidadReposicion: 0,
            registroManual: historialMode,
            ...snapshot,
          },
        ])
        resetDraftAfterAdd()
      })
    } else {
      const numeroCavidades = parseDigits(draftCavidades)
      if (numeroCavidades <= 0) {
        setDraftError('Ingrese el número de cavidades (mayor a cero).')
        return
      }
      const detalle = draftDetalle.trim()
      if (!detalle) {
        setDraftError('Ingrese el detalle del registro.')
        return
      }
      preserveColoresPanelViewport(() => {
        onChange([
          ...itemsRef.current,
          {
            id: createId(),
            colores: draftColor,
            cantidad: 0,
            numeroPlanchas: 0,
            valorTotal: 0,
            numeroCavidades,
            detalle,
            observacion: '',
            ...snapshot,
          },
        ])
        resetDraft()
      })
      return
    }
    return
  }

  const handleRemove = (id: string) => {
    preserveColoresPanelViewport(() => {
      onChange(items.filter(item => item.id !== id))
    })
  }

  const updateItem = (id: string, patch: Partial<DisenoColorPlanchaItem>) => {
    preserveColoresPanelViewport(() => {
      onChange(items.map(item => (item.id === id ? { ...item, ...patch } : item)))
    })
  }

  const clearRowError = (id: string) => {
    setRowErrors(prev => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const setRowError = (id: string, message: string) => {
    setRowErrors(prev => ({ ...prev, [id]: message }))
  }

  const handleReposicionChange = (id: string, checked: boolean) => {
    const item = itemsRef.current.find(i => i.id === id)
    if (!item || item.registroManual) return

    if (!checked) {
      updateItem(id, {
        reposicionPlancha: false,
        numeroPlanchas: getColoresCount(item.colores),
        cantidadReposicion: 0,
        planchaValor: 0,
        valorTotal: 0,
        observacion: '',
      })
      return
    }

    const catalog = activePlanchas.find(p => p.id === item.planchaId)
    const cantidadReposicion =
      (item.cantidadReposicion ?? 0) > 0
        ? item.cantidadReposicion!
        : getColoresCount(item.colores)
    updateItem(id, {
      reposicionPlancha: true,
      numeroPlanchas: getColoresCount(item.colores),
      cantidadReposicion,
      ...buildPrecioPatchFromCatalog(item, catalog, cantidadReposicion),
    })
  }

  const handleCantidadItemChange = (id: string, raw: string) => {
    const digits = raw.replace(/\D/g, '')
    const cantidad = digits ? Number(digits) : 0
    updateItem(id, { cantidad })
  }

  const handleCantidadReposicionChange = (id: string, raw: string) => {
    const item = itemsRef.current.find(i => i.id === id)
    if (!item?.reposicionPlancha) return

    const digits = raw.replace(/\D/g, '')
    const cantidadReposicion = digits ? Number(digits) : 0
    if (
      item.colores === '7-colores-o-mas' &&
      cantidadReposicion > 0 &&
      cantidadReposicion < 7
    ) {
      updateItem(id, { cantidadReposicion })
      return
    }

    const catalog = activePlanchas.find(p => p.id === item.planchaId)
    updateItem(id, {
      cantidadReposicion,
      ...buildPrecioPatchFromCatalog(item, catalog, cantidadReposicion),
    })
  }

  const handleHistorialObservacionChange = (id: string, observacion: string) => {
    updateItem(id, { observacion })
  }

  const handleHistorialPlanchaSelect = (id: string, planchaId: string) => {
    clearRowError(id)
    if (!planchaId) {
      updateItem(id, {
        planchaId: '',
        planchaNombreMedida: '',
        planchaValor: 0,
        valorTotal: 0,
      })
      return
    }
    const plancha = planchas.find(p => p.id === planchaId)
    if (!plancha) return
    updateItem(id, {
      planchaId: plancha.id,
      planchaNombreMedida: `${plancha.name} — ${plancha.medida}`,
      planchaValor: 0,
      valorTotal: 0,
    })
  }

  const handleActualizarRegistroHistorial = (item: DisenoColorPlanchaItem) => {
    clearRowError(item.id)
    const observacion = item.observacion.trim()
    if (!item.planchaId) {
      setRowError(item.id, 'Seleccione el tipo de plancha del catálogo actual.')
      return
    }
    const plancha = activePlanchas.find(p => p.id === item.planchaId)
    if (!plancha) {
      setRowError(
        item.id,
        'El tipo de plancha debe estar activo en Catálogos › Tipo Plancha.'
      )
      return
    }
    if (!observacion) {
      setRowError(item.id, 'Ingrese una observación al actualizar este registro.')
      return
    }
    const numeroPlanchas =
      item.numeroPlanchas > 0 ? item.numeroPlanchas : getColoresCount(item.colores)
    const valorTotal =
      numeroPlanchas > 0
        ? computeRegistroValorTotal(numeroPlanchas, plancha.valor)
        : 0
    updateItem(item.id, {
      ...buildTipoPlanchaSnapshot(plancha),
      numeroPlanchas,
      valorTotal,
      observacion,
    })
  }

  const showDraftForm = Boolean(draftColor) && detalleOpCantidadLista

  return (
    <div
      ref={coloresPanelRef}
      className="production-form-field production-form-field--full production-diseno-colores-planchas"
    >
      {usePlanchaPricing ? (
        <div className="production-plancha-workspace">
          <section className="production-plancha-workspace__composer" aria-labelledby="diseno-colores-add-label">
            {!detalleOpCantidadLista ? (
              <DetalleOpRequiredGate onGoToDetalleOpTab={onGoToDetalleOpTab} />
            ) : (
              <>
            <div
              className={[
                'production-plancha-workspace__picker-zone',
                showDraftForm ? 'production-plancha-workspace__picker-zone--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="production-plancha-workspace__zone-label" id="diseno-colores-add-label">
                1. Color
              </span>
              {showDraftForm && draftMeta ? (
                <div className="production-plancha-workspace__picker-done">
                  <ColoresCountIcons
                    count={draftMeta.count}
                    size="sm"
                    showPlusSuffix={draftMeta.value === '7-colores-o-mas'}
                  />
                  <span className="production-plancha-workspace__picker-done-label">{draftMeta.label}</span>
                  <button
                    type="button"
                    className="production-plancha-workspace__picker-done-change"
                    onClick={resetColorOnly}
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <DisenoColoresPicker
                  key={pickerKey}
                  id="diseno-colores-add"
                  labelId="diseno-colores-add-label"
                  placeholder="Seleccione cantidad de colores…"
                  value={draftColor}
                  disabled={!detalleOpCantidadLista}
                  onChange={value => {
                    setDraftColor(value)
                    setDraftCantidad(defaultCantidadFromOp())
                    if (value === '7-colores-o-mas') {
                      setDraftNumeroPlanchasManual(prev =>
                        prev && parseDigits(prev) >= 7 ? prev : '7'
                      )
                    } else {
                      setDraftNumeroPlanchasManual('')
                    }
                    setDraftError(null)
                  }}
                />
              )}
            </div>

            {showDraftForm && draftMeta && (
              <div className="production-plancha-workspace__draft-zone">
                <RegistroOpComposerForm
                    meta={draftMeta}
                    draftCantidad={draftCantidad}
                    onCantidadChange={value => {
                      setDraftCantidad(value)
                      if (draftError) setDraftError(null)
                    }}
                    detalleOpCantidadLista={detalleOpCantidadLista}
                    draftPlanchaId={draftPlanchaId}
                    activePlanchas={activePlanchas}
                    onPlanchaChange={id => {
                      setDraftPlanchaId(id)
                      if (draftError) setDraftError(null)
                    }}
                    draftPrecioPlancha={draftPrecioPlancha}
                    draftNumeroPlanchas={draftNumeroPlanchas}
                    isSieteOMasColores={isSieteOMasColores}
                    draftNumeroPlanchasManual={draftNumeroPlanchasManual}
                    onNumeroPlanchasManualChange={value => {
                      setDraftNumeroPlanchasManual(value)
                      if (draftError) setDraftError(null)
                    }}
                    draftValorTotal={draftValorTotal}
                    draftDescripcion={draftDescripcion}
                    onDescripcionChange={value => {
                      setDraftDescripcion(value)
                      if (draftError) setDraftError(null)
                    }}
                    draftError={draftError}
                    onCancel={resetDraft}
                    onAdd={handleAddRegistro}
                    canAdd={detalleOpCantidadLista && activePlanchas.length > 0}
                  />
              </div>
            )}

            {activePlanchas.length === 0 && (
              <p className="production-plancha-workspace__hint">Sin tipos de plancha activos.</p>
            )}
              </>
            )}
          </section>

          {items.length > 0 && (
            <section className="production-plancha-workspace__list" aria-label="Registros">
              {historialMode ? (
                <PlanchasRegistrosTableExistente
                  rows={items.map(item => {
                    const display = resolveDisplay(item)
                    return {
                      item,
                      meta: display.meta,
                      nombreMedida: display.nombreMedida,
                      precioPlancha: display.precioPlancha,
                      valorTotal: display.valorTotal,
                    }
                  })}
                  valorTotalPlanchas={valorTotalPlanchas}
                  onCantidadChange={handleCantidadItemChange}
                  onReposicionChange={handleReposicionChange}
                  onCantidadReposicionChange={handleCantidadReposicionChange}
                  onObservacionChange={handleHistorialObservacionChange}
                  onRemove={handleRemove}
                />
              ) : (
                <PlanchasRegistrosTable
                  rows={items.map(item => {
                    const display = resolveDisplay(item)
                    return {
                      item,
                      meta: display.meta,
                      nombreMedida: display.nombreMedida,
                      precioPlancha: display.precioPlancha,
                      valorTotal: display.valorTotal,
                    }
                  })}
                  valorTotalPlanchas={valorTotalPlanchas}
                  onCantidadChange={handleCantidadItemChange}
                  onRemove={handleRemove}
                />
              )}
            </section>
          )}
        </div>
      ) : (
      <div className="production-diseno-colores-add">
        <div className="production-form-field">
          <span className="production-form-label" id="diseno-colores-add-label">
            Colores
          </span>
          <p className="production-diseno-colores-add__hint">
            Elija la cantidad en el desplegable. Cada opción muestra iconos de tinta (Cian, Magenta,
            Amarillo, Negro, Rojo, Azul Pantone, Verde Pantone).
          </p>
          <DisenoColoresPicker
            key={pickerKey}
            id="diseno-colores-add"
            labelId="diseno-colores-add-label"
            value={draftColor}
            onChange={value => {
              setDraftColor(value)
              setDraftError(null)
            }}
          />
        </div>

        {showDraftForm ? (
          <div className="production-diseno-colores-add__form">
            <p className="production-diseno-colores-add__step">
              Complete los datos para{' '}
              <strong>{getColoresOptionMeta(draftColor)?.label}</strong>
            </p>
            <>
                <div className="production-diseno-color-plancha-item__grid production-diseno-color-plancha-item__grid--3">
                  <div className="production-form-field">
                    <label className="production-form-label" htmlFor="diseno-add-cavidades">
                      Cavidades
                    </label>
                    <input
                      id="diseno-add-cavidades"
                      type="text"
                      inputMode="numeric"
                      className="production-form-input"
                      value={draftCavidades}
                      onChange={e => {
                        setDraftCavidades(e.target.value.replace(/\D/g, ''))
                        if (draftError) setDraftError(null)
                      }}
                      onKeyDown={blockNonDigitKey}
                      placeholder="0"
                    />
                  </div>
                  <div className="production-form-field production-form-field--span-2">
                    <label className="production-form-label" htmlFor="diseno-add-plancha-legacy">
                      Tipo plancha
                    </label>
                    <select
                      id="diseno-add-plancha-legacy"
                      className="production-form-input production-form-select"
                      value={draftPlanchaId}
                      onChange={e => {
                        setDraftPlanchaId(e.target.value)
                        if (draftError) setDraftError(null)
                      }}
                    >
                      <option value="">Seleccionar tipo de plancha…</option>
                      {activePlanchas.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.medida}
                          {historialMode ? ` — ${formatValor(p.valor)}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="production-form-field production-form-field--full">
                  <label className="production-form-label" htmlFor="diseno-add-detalle">
                    Detalle
                  </label>
                  <input
                    id="diseno-add-detalle"
                    type="text"
                    className="production-form-input"
                    value={draftDetalle}
                    onChange={e => {
                      setDraftDetalle(e.target.value)
                      if (draftError) setDraftError(null)
                    }}
                    placeholder="Ej. Tinta pantone, observaciones…"
                  />
                </div>
              </>
            {draftError && <p className="production-form-error">{draftError}</p>}
            <div className="production-diseno-colores-add__actions">
              <button
                type="button"
                className="production-diseno-tipo-plancha__change"
                onClick={resetDraft}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="production-diseno-color-plancha-slot__add-btn"
                onMouseDown={preventMouseDownFocusScroll}
                onClick={handleAddRegistro}
                disabled={activePlanchas.length === 0}
              >
                Agregar registro
              </button>
            </div>
          </div>
        ) : (
          <p className="production-diseno-cliente-hint">
            Seleccione la cantidad de colores en el desplegable. Luego complete cavidades, tipo de
            plancha y detalle.
          </p>
        )}

        {activePlanchas.length === 0 && (
          <p className="production-diseno-cliente-hint">
            No hay tipos de plancha activos. Regístrelos en Catálogos › Tipo Plancha.
          </p>
        )}
      </div>
      )}

      {!usePlanchaPricing && items.length > 0 && (
        <div
          className={[
            'production-diseno-colores-registros-wrap',
            historialMode ? 'production-diseno-colores-registros-wrap--historial' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="production-diseno-colores-registros-wrap__head">
            <span className="production-form-label">Registros agregados</span>
            <span className="production-diseno-colores-registros-wrap__count">
              {items.length}
            </span>
          </div>
          {historialMode && (
            <p className="production-diseno-cliente-hint">
              Los valores se cargan en <strong>$0</strong>. Por cada registro: elija el tipo de
              plancha del catálogo actual, escriba una observación y pulse{' '}
              <strong>Actualizar registro</strong> para aplicar el precio vigente.
            </p>
          )}
          <ul className="production-diseno-colores-registros">
            {items.map(item => {
              const display = resolveDisplay(item)
              const planchaInCatalog = activePlanchas.some(p => p.id === item.planchaId)
              const valorActualizado = item.planchaValor > 0
              const rowError = rowErrors[item.id]
              const showPricingRow = usePlanchaPricing || item.valorTotal > 0 || item.cantidad > 0

              return (
                <li
                  key={item.id}
                  className={[
                    'production-diseno-colores-registro',
                    historialMode ? 'production-diseno-colores-registro--historial' : '',
                    historialMode && valorActualizado
                      ? 'production-diseno-colores-registro--actualizado'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <>
                      <div className="production-diseno-colores-registro__color">
                        {display.meta && (
                          <span className="production-colores-select__content">
                            <span className="production-diseno-colores-registro__color-label">
                              {display.meta.label}
                            </span>
                            <span className="production-colores-select__icons">
                              <ColoresCountIcons
                                count={display.meta.count}
                                size="sm"
                                showPlusSuffix={display.meta?.value === '7-colores-o-mas'}
                              />
                            </span>
                          </span>
                        )}
                        {historialMode && (
                          <span
                            className={[
                              'production-diseno-colores-registro__estado',
                              valorActualizado
                                ? 'production-diseno-colores-registro__estado--ok'
                                : 'production-diseno-colores-registro__estado--pendiente',
                            ].join(' ')}
                          >
                            {valorActualizado ? 'Valor actualizado' : 'Pendiente de actualizar'}
                          </span>
                        )}
                      </div>
                      <div
                        className={[
                          'production-diseno-colores-registro__body',
                          'production-diseno-color-plancha-item__grid',
                          historialMode
                            ? 'production-diseno-color-plancha-item__grid--historial'
                            : 'production-diseno-color-plancha-item__grid--4',
                        ].join(' ')}
                      >
                        {historialMode ? (
                      <>
                        <div className="production-form-field">
                          <span className="production-form-label">Cavidades</span>
                          <input
                            type="text"
                            className="production-form-input production-form-input--readonly"
                            value={item.numeroCavidades > 0 ? String(item.numeroCavidades) : ''}
                            readOnly
                          />
                        </div>
                        <div className="production-form-field production-form-field--span-2">
                          <label
                            className="production-form-label"
                            htmlFor={`diseno-hist-plancha-${item.id}`}
                          >
                            Tipo plancha
                          </label>
                          <select
                            id={`diseno-hist-plancha-${item.id}`}
                            className="production-form-input production-form-select"
                            value={item.planchaId}
                            onChange={e => {
                              handleHistorialPlanchaSelect(item.id, e.target.value)
                            }}
                          >
                            <option value="">Seleccionar tipo de plancha actual…</option>
                            {!planchaInCatalog && item.planchaId ? (
                              <option value={item.planchaId}>
                                {item.planchaNombreMedida} (trabajo anterior)
                              </option>
                            ) : null}
                            {activePlanchas.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} — {p.medida} — {formatValor(p.valor)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="production-form-field">
                          <span className="production-form-label">Valor</span>
                          <input
                            type="text"
                            className="production-form-input production-form-input--readonly"
                            value={
                              display.precioPlancha > 0
                                ? formatValor(display.precioPlancha)
                                : '$0'
                            }
                            readOnly
                            tabIndex={-1}
                          />
                        </div>
                        <div className="production-form-field production-form-field--full">
                          <span className="production-form-label">Detalle</span>
                          <input
                            type="text"
                            className="production-form-input production-form-input--readonly"
                            value={item.detalle}
                            readOnly
                          />
                        </div>
                        <div className="production-form-field production-form-field--full">
                          <label
                            className="production-form-label"
                            htmlFor={`diseno-hist-obs-${item.id}`}
                          >
                            Observación <span className="production-form-label__req">*</span>
                          </label>
                          <input
                            id={`diseno-hist-obs-${item.id}`}
                            type="text"
                            className="production-form-input"
                            value={item.observacion}
                            onChange={e => {
                              updateItem(item.id, { observacion: e.target.value })
                              if (rowError) clearRowError(item.id)
                            }}
                            placeholder="Ej. Se actualiza plancha a medida 70×100 cm vigente…"
                          />
                        </div>
                        <div className="production-diseno-colores-registro__actions production-form-field--full">
                          {rowError && <p className="production-form-error">{rowError}</p>}
                          <button
                            type="button"
                            className="production-diseno-colores-registro__update-btn"
                            onMouseDown={preventMouseDownFocusScroll}
                            onClick={() => handleActualizarRegistroHistorial(item)}
                            disabled={!item.planchaId || activePlanchas.length === 0}
                          >
                            {valorActualizado
                              ? 'Volver a aplicar valor del catálogo'
                              : 'Actualizar registro'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="production-form-field">
                          <span className="production-form-label">Cavidades</span>
                          <input
                            type="text"
                            className="production-form-input production-form-input--readonly"
                            value={item.numeroCavidades > 0 ? String(item.numeroCavidades) : ''}
                            readOnly
                          />
                        </div>
                        <div className="production-form-field">
                          <span className="production-form-label">Nombre y medida</span>
                          <input
                            type="text"
                            className="production-form-input production-form-input--readonly"
                            value={display.nombreMedida}
                            readOnly
                          />
                        </div>
                        <div className="production-form-field">
                          <span className="production-form-label">Valor</span>
                          <input
                            type="text"
                            className="production-form-input production-form-input--readonly"
                            value={
                              display.precioPlancha > 0 ? formatValor(display.precioPlancha) : ''
                            }
                            readOnly
                          />
                        </div>
                        <div className="production-form-field">
                          <span className="production-form-label">Detalle</span>
                          <input
                            type="text"
                            className="production-form-input production-form-input--readonly"
                            value={item.detalle}
                            readOnly
                          />
                        </div>
                      </>
                        )}
                      </div>
                      <button
                        type="button"
                        className="production-diseno-colores-registro__remove production-diseno-colores-registro__remove--footer"
                        onClick={() => handleRemove(item.id)}
                      >
                        Quitar registro
                      </button>
                    </>
                </li>
              )
            })}
          </ul>

          {usePlanchaPricing && (
            <div className="production-diseno-colores-grand-total">
              <label className="production-form-label" htmlFor="diseno-valor-total-planchas">
                Valor Total Planchas
              </label>
              <input
                id="diseno-valor-total-planchas"
                type="text"
                className="production-form-input production-form-input--readonly production-diseno-colores-valor-field production-diseno-colores-grand-total__input"
                value={formatValor(valorTotalPlanchas)}
                readOnly
                tabIndex={-1}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DisenoColoresPlanchasPanel
