import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DisenoColorPlanchaItem, DisenoColoresOption } from '../../../core/domain/entities/PreprensaDiseno'
import { createId } from '../../../core/utils/createId'
import { TamanoPlancha } from '../../../core/domain/entities/TamanoPlancha'
import ActionIcon from '../../components/ui/ActionIcon'
import DisenoColoresPicker, { ColoresCountIcons } from './DisenoColoresPicker'
import { buildTipoPlanchaSnapshot } from './DisenoTipoPlanchaPicker'
import {
  buildClienteSuministraPlanchaDetalle,
  extractDescripcionUsuarioClienteSuministra,
  buildPrecioPatchFromCatalog,
  buildItemPricingContext,
  computeRegistroValorTotal,
  getColoresCount,
  getColoresOptionMeta,
  hasDuplicateColoresPlanchaRegistro,
  isItemClienteSuministraPlanchas,
  resolveItemClienteSuministraPlanchas,
  resolveItemValorTotal,
  resolveNumeroPlanchasItem,
  resolvePrecioPlanchaDisplay,
  sumValorTotalPlanchas,
  applyTamanosBuenosToItem,
  computeTamanosBuenos,
  resolveTamanosBuenosValue,
  syncColoresPlanchasCantidadFromOrder,
  type ColoresPlanchasPricingContext,
} from './utils/coloresPlanchasUtils'
import { PREPRENSA_DISENO_COPY } from './constants/preprensaDisenoCopy'
import { PreprensaFieldNotice, PreprensaValidationNotice } from './PreprensaFieldNotice'
import PreprensaPlanchaSuministroShell from './PreprensaPlanchaSuministroShell'
import { resolvePlanchaSuministroSelectorState, patchRegistroClienteSuministraPlanchas } from './utils/preprensaClienteSuministraPlanchasChange'
import type { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'

const coloresCopy = PREPRENSA_DISENO_COPY.coloresPlanchas
const planchaSuministroCopy = PREPRENSA_DISENO_COPY.planchaSuministro

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
  itemClienteSuministra: boolean
}

const formatNumFieldValue = (n: number) => (n > 0 ? String(n) : '')

const validationCopy = coloresCopy.validation

const tamanosBuenosPendingMessage = (reason: 'sin-cavidad' | 'sin-cantidad'): string =>
  reason === 'sin-cavidad'
    ? coloresCopy.tamanosBuenosNeedCavidades
    : coloresCopy.tamanosBuenosNeedCantidad

const tamanosBuenosDisplayValue = (cantidad: number, numeroCavidades: number): string => {
  const calc = computeTamanosBuenos(cantidad, numeroCavidades)
  if (calc.ok) return calc.value.toLocaleString('es-CO')
  return '—'
}

const TamanosBuenosReadonlyField: React.FC<{
  cantidad: number
  numeroCavidades: number
}> = ({ cantidad, numeroCavidades }) => {
  const calc = computeTamanosBuenos(cantidad, numeroCavidades)
  const pendingId = 'diseno-tamanos-buenos-pending-hint'
  return (
    <div className="production-form-field">
      <span className="production-form-label">Tamaños buenos</span>
      <input
        type="text"
        className={[
          'production-form-input',
          'production-form-input--readonly',
          !calc.ok ? 'production-form-input--awaiting' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        value={tamanosBuenosDisplayValue(cantidad, numeroCavidades)}
        readOnly
        tabIndex={-1}
        title={coloresCopy.tamanosBuenosFormula}
        aria-label="Tamaños buenos calculados"
        aria-describedby={!calc.ok ? pendingId : undefined}
      />
      <span className="production-plancha-draft__field-hint">{coloresCopy.tamanosBuenosFormula}</span>
      {!calc.ok ? (
        <PreprensaFieldNotice id={pendingId} variant="warning">
          {tamanosBuenosPendingMessage(calc.reason)}
        </PreprensaFieldNotice>
      ) : null}
    </div>
  )
}

const TamanosBuenosCell: React.FC<{
  cantidad: number
  numeroCavidades: number
}> = ({ cantidad, numeroCavidades }) => {
  const calc = computeTamanosBuenos(cantidad, numeroCavidades)
  return (
    <td className="production-plancha-table__td production-plancha-table__td--num production-plancha-table__td--calc">
      {calc.ok ? (
        <span className="production-plancha-table__calc-value" title={coloresCopy.tamanosBuenosFormula}>
          {calc.value.toLocaleString('es-CO')}
        </span>
      ) : (
        <span
          className="production-plancha-table__calc-pending"
          title={tamanosBuenosPendingMessage(calc.reason)}
          role="status"
        >
          —
        </span>
      )}
    </td>
  )
}

const PlanchaTableNumCell: React.FC<{
  itemId: string
  value: number
  onChange: (id: string, raw: string) => void
  label: string
  placeholder: string
  locked?: boolean
  alwaysEditable?: boolean
}> = ({
  itemId,
  value,
  onChange,
  label,
  placeholder,
  locked = false,
  alwaysEditable = false,
}) => {
  const readOnly = !alwaysEditable && locked
  return (
    <td className="production-plancha-table__td production-plancha-table__td--num">
      <input
        type="text"
        inputMode="numeric"
        className="production-form-input production-plancha-table__input-num"
        value={formatNumFieldValue(value)}
        onChange={e => onChange(itemId, e.target.value)}
        onKeyDown={blockNonDigitKey}
        placeholder={placeholder}
        aria-label={`${label} — registro`}
        readOnly={readOnly}
        disabled={readOnly}
        tabIndex={readOnly ? -1 : undefined}
      />
    </td>
  )
}

const PlanchaTableDetalleCell: React.FC<{ detalle: string }> = ({ detalle }) => (
  <td
    className="production-plancha-table__td production-plancha-table__td--desc"
    title={detalle.trim() || undefined}
  >
    <span className="production-plancha-table__truncate">{detalle.trim() || '—'}</span>
  </td>
)

interface PlanchasRegistrosTableProps {
  rows: PlanchaRegistroRow[]
  valorTotalPlanchas: number
  editingItemId?: string | null
  onCantidadChange: (id: string, value: string) => void
  onCavidadesChange: (id: string, value: string) => void
  onSobranteChange: (id: string, value: string) => void
  onEdit?: (id: string) => void
  onRemove: (id: string) => void
  /** Sin cantidad en Detalle OP: solo visualización */
  locked?: boolean
}

const PlanchasRegistrosTable: React.FC<PlanchasRegistrosTableProps> = ({
  rows,
  valorTotalPlanchas,
  editingItemId = null,
  onCantidadChange,
  onCavidadesChange,
  onSobranteChange,
  onEdit,
  onRemove,
  locked = false,
}) => {
  const todosClienteSuministra =
    rows.length > 0 && rows.every(row => row.itemClienteSuministra)

  return (
  <div
    className={[
      'production-plancha-list',
      locked ? 'production-plancha-list--locked' : '',
    ]
      .filter(Boolean)
      .join(' ')}
  >
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
          <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
            Cavidades
          </th>
          <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
            Tamaños buenos
          </th>
          <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
            Sobrante
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
            <span className="sr-only">Acciones</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ item, meta, nombreMedida, precioPlancha, valorTotal, itemClienteSuministra }) => {
          const isEditing = editingItemId === item.id
          return (
          <tr
            key={item.id}
            className={[
              'production-plancha-table__row',
              isEditing ? 'production-plancha-table__row--editing' : '',
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
                    showPlusSuffix={meta.value === '7-colores-o-mas'}
                  />
                  <span className="production-plancha-table__color-tag">{meta.shortLabel}</span>
                </span>
              )}
            </td>
            <PlanchaTableNumCell
              itemId={item.id}
              value={item.cantidad}
              onChange={onCantidadChange}
              label="Cantidad"
              placeholder="Cantidad"
              locked={locked}
            />
            <PlanchaTableNumCell
              itemId={item.id}
              value={item.numeroCavidades}
              onChange={onCavidadesChange}
              label="Cavidades"
              placeholder="Cavidades"
              alwaysEditable
            />
            <TamanosBuenosCell cantidad={item.cantidad} numeroCavidades={item.numeroCavidades} />
            <PlanchaTableNumCell
              itemId={item.id}
              value={item.sobrante}
              onChange={onSobranteChange}
              label="Sobrante"
              placeholder="Sobrante"
              alwaysEditable
            />
            <td className="production-plancha-table__td" title={nombreMedida}>
              <span className="production-plancha-table__truncate">{nombreMedida || '—'}</span>
            </td>
            <td className="production-plancha-table__td production-plancha-table__td--num">
              {itemClienteSuministra
                ? planchaSuministroCopy.precioNoAplica
                : precioPlancha > 0
                  ? formatValor(precioPlancha)
                  : '—'}
            </td>
            <td className="production-plancha-table__td production-plancha-table__td--num">
              {item.numeroPlanchas > 0 ? item.numeroPlanchas : '—'}
            </td>
            <td className="production-plancha-table__td production-plancha-table__td--num production-plancha-table__td--total">
              {valorTotal > 0 ? formatValor(valorTotal) : '$0'}
            </td>
            <PlanchaTableDetalleCell detalle={item.detalle} />
            <td className="production-plancha-table__td production-plancha-table__td--act">
              <div className="production-plancha-table__actions">
                {onEdit ? (
                  <button
                    type="button"
                    className={[
                      'action-icon-button action-icon-edit production-plancha-table__edit',
                      isEditing ? 'production-plancha-table__edit--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => onEdit(item.id)}
                    title={isEditing ? coloresCopy.registro.editing : coloresCopy.registro.edit}
                    aria-label={isEditing ? coloresCopy.registro.editing : coloresCopy.registro.edit}
                    aria-pressed={isEditing}
                    disabled={locked}
                  >
                    <ActionIcon name="edit" size={14} />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="action-icon-button action-icon-delete production-plancha-table__remove"
                  onClick={() => onRemove(item.id)}
                  title="Eliminar"
                  aria-label="Eliminar registro"
                  disabled={locked}
                >
                  <ActionIcon name="delete" size={14} />
                </button>
              </div>
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
        {todosClienteSuministra
          ? planchaSuministroCopy.totalPlanchasHintCliente
          : `Suma del valor total de ${rows.length} ${rows.length === 1 ? 'registro' : 'registros'}`}
      </span>
    </div>
    <strong className="production-plancha-total__value">{formatValor(valorTotalPlanchas)}</strong>
  </div>
  </div>
  )
}

interface PlanchasRegistrosTableExistenteProps {
  rows: PlanchaRegistroRow[]
  valorTotalPlanchas: number
  editingItemId?: string | null
  onCantidadChange: (id: string, value: string) => void
  onCavidadesChange: (id: string, value: string) => void
  onSobranteChange: (id: string, value: string) => void
  onReposicionChange: (id: string, checked: boolean) => void
  onCantidadReposicionChange: (id: string, value: string) => void
  onObservacionChange: (id: string, value: string) => void
  onEdit?: (id: string) => void
  onRemove: (id: string) => void
  locked?: boolean
}

const PlanchasRegistrosTableExistente: React.FC<PlanchasRegistrosTableExistenteProps> = ({
  rows,
  valorTotalPlanchas,
  editingItemId = null,
  onCantidadChange,
  onCavidadesChange,
  onSobranteChange,
  onReposicionChange,
  onCantidadReposicionChange,
  onObservacionChange,
  onEdit,
  onRemove,
  locked = false,
}) => {
  const todosClienteSuministra =
    rows.length > 0 && rows.every(row => row.itemClienteSuministra)

  return (
  <div
    className={[
      'production-plancha-list',
      locked ? 'production-plancha-list--locked' : '',
    ]
      .filter(Boolean)
      .join(' ')}
  >
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
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              Cavidades
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              Tamaños buenos
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              Sobrante
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
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ item, meta, nombreMedida, precioPlancha, valorTotal, itemClienteSuministra }) => {
            const esManual = Boolean(item.registroManual)
            const reposicionActiva = esManual || Boolean(item.reposicionPlancha)
            const esSieteOMas = item.colores === '7-colores-o-mas'
            const isEditing = editingItemId === item.id

            return (
              <tr
                key={item.id}
                className={[
                  'production-plancha-table__row',
                  reposicionActiva ? 'production-plancha-table__row--reposicion' : '',
                  isEditing ? 'production-plancha-table__row--editing' : '',
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
                <PlanchaTableNumCell
                  itemId={item.id}
                  value={item.cantidad}
                  onChange={onCantidadChange}
                  label="Cantidad"
                  placeholder="Cantidad"
                  locked={locked}
                />
                <PlanchaTableNumCell
                  itemId={item.id}
                  value={item.numeroCavidades}
                  onChange={onCavidadesChange}
                  label="Cavidades"
                  placeholder="Cavidades"
                  alwaysEditable
                />
                <TamanosBuenosCell
                  cantidad={item.cantidad}
                  numeroCavidades={item.numeroCavidades}
                />
                <PlanchaTableNumCell
                  itemId={item.id}
                  value={item.sobrante}
                  onChange={onSobranteChange}
                  label="Sobrante"
                  placeholder="Sobrante"
                  alwaysEditable
                />
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
                        disabled={locked}
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
                      readOnly={locked}
                      disabled={locked}
                      tabIndex={locked ? -1 : undefined}
                    />
                  ) : (
                    <span className="production-plancha-table__muted">—</span>
                  )}
                </td>
                <td className="production-plancha-table__td production-plancha-table__td--num">
                  {itemClienteSuministra
                    ? planchaSuministroCopy.precioNoAplica
                    : reposicionActiva && precioPlancha > 0
                      ? formatValor(precioPlancha)
                      : '—'}
                </td>
                <td className="production-plancha-table__td production-plancha-table__td--num production-plancha-table__td--total">
                  {reposicionActiva && valorTotal > 0 ? formatValor(valorTotal) : '$0'}
                </td>
                <PlanchaTableDetalleCell detalle={item.detalle} />
                <td className="production-plancha-table__td production-plancha-table__td--obs">
                  {!esManual && item.reposicionPlancha ? (
                    <input
                      type="text"
                      className="production-form-input production-plancha-table__input-obs"
                      value={item.observacion}
                      onChange={e => onObservacionChange(item.id, e.target.value)}
                      placeholder="Motivo de la reposición…"
                      aria-label={`Observación — ${meta?.label ?? 'registro'}`}
                      readOnly={locked}
                      disabled={locked}
                      tabIndex={locked ? -1 : undefined}
                    />
                  ) : (
                    <span className="production-plancha-table__muted">—</span>
                  )}
                </td>
                <td className="production-plancha-table__td production-plancha-table__td--act">
                  <div className="production-plancha-table__actions">
                    {onEdit ? (
                      <button
                        type="button"
                        className={[
                          'action-icon-button action-icon-edit production-plancha-table__edit',
                          isEditing ? 'production-plancha-table__edit--active' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => onEdit(item.id)}
                        title={isEditing ? coloresCopy.registro.editing : coloresCopy.registro.edit}
                        aria-label={isEditing ? coloresCopy.registro.editing : coloresCopy.registro.edit}
                        aria-pressed={isEditing}
                        disabled={locked}
                      >
                        <ActionIcon name="edit" size={14} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="action-icon-button action-icon-delete production-plancha-table__remove"
                      onClick={() => onRemove(item.id)}
                      title="Eliminar"
                      aria-label="Eliminar registro"
                      disabled={locked}
                    >
                      <ActionIcon name="delete" size={14} />
                    </button>
                  </div>
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
          {todosClienteSuministra
            ? planchaSuministroCopy.totalPlanchasHintCliente
            : `Suma con reposición activa · ${rows.length} ${rows.length === 1 ? 'registro' : 'registros'}`}
        </span>
      </div>
      <strong className="production-plancha-total__value">{formatValor(valorTotalPlanchas)}</strong>
    </div>
  </div>
  )
}

interface RegistroOpComposerFormProps {
  meta: ReturnType<typeof getColoresOptionMeta>
  draftColor: DisenoColoresOption | ''
  onDraftColorChange: (value: DisenoColoresOption) => void
  onDraftColorReset?: () => void
  colorPickerPlaceholder: string
  draftCantidad: string
  onCantidadChange: (value: string) => void
  draftCavidades: string
  onCavidadesChange: (value: string) => void
  draftSobrante: string
  onSobranteChange: (value: string) => void
  detalleOpCantidadLista: boolean
  draftPlanchaId: string
  activePlanchas: TamanoPlancha[]
  onPlanchaChange: (id: string) => void
  draftPrecioPlancha: number
  clienteSuministraPlanchas: boolean
  draftNumeroPlanchas: number
  isSieteOMasColores: boolean
  draftNumeroPlanchasManual: string
  onNumeroPlanchasManualChange: (value: string) => void
  draftValorTotal: number
  draftDescripcion: string
  draftDetalleClienteSuministra: string
  onDescripcionChange: (value: string) => void
  draftError: string | null
  onCancel: () => void
  onAdd: () => void
  canAdd: boolean
  isEditing?: boolean
  clienteSuministraPlanchasChoice?: YesNoChoice
  onDraftClienteSuministraPlanchasChange?: (value: YesNoChoice) => void
  suministroSelectorVisible?: boolean
  suministroDisabledValues?: YesNoChoice[]
  /** Diseño existente: campos de reposición al editar registro importado */
  historialEditMode?: boolean
  editingRegistroManual?: boolean
  draftReposicionPlancha?: boolean
  onReposicionPlanchaChange?: (checked: boolean) => void
  draftCantidadReposicion?: string
  onCantidadReposicionChange?: (value: string) => void
  draftObservacion?: string
  onObservacionChange?: (value: string) => void
  historialPlanchaFallbackLabel?: string
}

const RegistroOpComposerForm: React.FC<RegistroOpComposerFormProps> = ({
  meta,
  draftColor,
  onDraftColorChange,
  onDraftColorReset,
  colorPickerPlaceholder,
  draftCantidad,
  onCantidadChange,
  draftCavidades,
  onCavidadesChange,
  draftSobrante,
  onSobranteChange,
  detalleOpCantidadLista,
  draftPlanchaId,
  activePlanchas,
  onPlanchaChange,
  draftPrecioPlancha,
  clienteSuministraPlanchas,
  draftNumeroPlanchas,
  isSieteOMasColores,
  draftNumeroPlanchasManual,
  onNumeroPlanchasManualChange,
  draftValorTotal,
  draftDescripcion,
  draftDetalleClienteSuministra,
  onDescripcionChange,
  draftError,
  onCancel,
  onAdd,
  canAdd,
  isEditing = false,
  clienteSuministraPlanchasChoice = 'no',
  onDraftClienteSuministraPlanchasChange,
  suministroSelectorVisible = false,
  suministroDisabledValues = [],
  historialEditMode = false,
  editingRegistroManual = false,
  draftReposicionPlancha = false,
  onReposicionPlanchaChange,
  draftCantidadReposicion = '',
  onCantidadReposicionChange,
  draftObservacion = '',
  onObservacionChange,
  historialPlanchaFallbackLabel = '',
}) => {
  const numeroPlanchasDisplay = isSieteOMasColores
    ? draftNumeroPlanchasManual
    : draftNumeroPlanchas > 0
      ? String(draftNumeroPlanchas)
      : ''

  const tamanosBuenosCalc = computeTamanosBuenos(
    parseDigits(draftCantidad),
    parseDigits(draftCavidades)
  )

  return (
    <div className="production-plancha-draft">
      <header className="production-plancha-draft__head">
        <span className="production-plancha-workspace__zone-label">
          {isEditing ? coloresCopy.registro.editing : '2. Datos del registro'}
        </span>
      </header>

      {draftError ? (
        <PreprensaValidationNotice title={coloresCopy.validationTitle} message={draftError} />
      ) : null}

      {suministroSelectorVisible && onDraftClienteSuministraPlanchasChange ? (
        <PreprensaPlanchaSuministroShell
          variant="compact"
          value={clienteSuministraPlanchasChoice}
          onChange={onDraftClienteSuministraPlanchasChange}
          disabledValues={suministroDisabledValues}
        />
      ) : null}

      <div className="production-plancha-draft__fields">
        <div className="production-form-field production-form-field--full">
          <label className="production-form-label" id="diseno-draft-colores-label">
            Cantidad de colores
          </label>
          {isEditing ? (
            <DisenoColoresPicker
              id="diseno-draft-colores"
              labelId="diseno-draft-colores-label"
              placeholder=""
              value={draftColor}
              disabled={!detalleOpCantidadLista}
              onChange={onDraftColorChange}
            />
          ) : meta ? (
            <div className="production-plancha-draft__color-selected">
              <span className="production-plancha-draft__color-selected-value">
                <ColoresCountIcons
                  count={meta.count}
                  size="md"
                  showPlusSuffix={meta.value === '7-colores-o-mas'}
                />
                <span className="production-plancha-draft__color-selected-label">{meta.label}</span>
              </span>
              {onDraftColorReset ? (
                <button
                  type="button"
                  className="production-plancha-draft__color-change"
                  onClick={onDraftColorReset}
                >
                  Cambiar colores
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

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
            {historialPlanchaFallbackLabel && draftPlanchaId ? (
              <option value={draftPlanchaId}>{historialPlanchaFallbackLabel} (trabajo anterior)</option>
            ) : null}
            {activePlanchas.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.medida}
              </option>
            ))}
          </select>
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
          </div>

          <div className="production-plancha-draft__readonly">
            <label className="production-form-label" htmlFor="diseno-add-cavidades-op">
              Cavidades
            </label>
            <input
              id="diseno-add-cavidades-op"
              type="text"
              inputMode="numeric"
              className="production-form-input"
              value={draftCavidades}
              onChange={e => onCavidadesChange(e.target.value.replace(/\D/g, ''))}
              onKeyDown={blockNonDigitKey}
              placeholder="Cavidades"
              aria-label="Cavidades del registro"
            />
          </div>

          <div className="production-plancha-draft__readonly">
            <span className="production-form-label">Tamaños buenos</span>
            <input
              type="text"
              className={[
                'production-form-input',
                'production-form-input--readonly',
                !tamanosBuenosCalc.ok ? 'production-form-input--awaiting' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              value={
                tamanosBuenosCalc.ok
                  ? tamanosBuenosCalc.value.toLocaleString('es-CO')
                  : '—'
              }
              readOnly
              tabIndex={-1}
              aria-label="Tamaños buenos calculados"
              aria-describedby={
                !tamanosBuenosCalc.ok ? 'diseno-add-tamanos-buenos-hint' : undefined
              }
            />
            {!tamanosBuenosCalc.ok ? (
              <PreprensaFieldNotice id="diseno-add-tamanos-buenos-hint" variant="warning">
                {tamanosBuenosPendingMessage(tamanosBuenosCalc.reason)}
              </PreprensaFieldNotice>
            ) : null}
          </div>

          <div className="production-plancha-draft__readonly">
            <label className="production-form-label" htmlFor="diseno-add-sobrante">
              Sobrante
            </label>
            <input
              id="diseno-add-sobrante"
              type="text"
              inputMode="numeric"
              className="production-form-input"
              value={draftSobrante}
              onChange={e => onSobranteChange(e.target.value.replace(/\D/g, ''))}
              onKeyDown={blockNonDigitKey}
              placeholder="Sobrante"
              aria-label="Sobrante del registro"
            />
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
          </div>

          <div className="production-plancha-draft__readonly">
            <span className="production-form-label">Precio plancha</span>
            <input
              type="text"
              className="production-form-input production-form-input--readonly"
              value={
                clienteSuministraPlanchas
                  ? planchaSuministroCopy.precioNoAplica
                  : draftPrecioPlancha > 0
                    ? formatValor(draftPrecioPlancha)
                    : ''
              }
              readOnly
              tabIndex={-1}
              placeholder={
                clienteSuministraPlanchas
                  ? planchaSuministroCopy.precioNoAplica
                  : draftPlanchaId
                    ? '—'
                    : 'Seleccione plancha…'
              }
            />
          </div>
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
            placeholder={
              clienteSuministraPlanchas
                ? 'Ej. Tinta Pantone, acabado… (opcional)'
                : 'Ej. Tinta Pantone, acabado…'
            }
          />
          {clienteSuministraPlanchas ? (
            <p className="production-plancha-draft__detalle-auto" role="status">
              {draftDetalleClienteSuministra || planchaSuministroCopy.detalleClienteSuministraHint}
            </p>
          ) : null}
        </div>

        {historialEditMode && !editingRegistroManual ? (
          <div className="production-plancha-draft__historial-fields">
            <div className="production-form-field production-form-field--full">
              <label className="production-plancha-table__reposicion">
                <input
                  type="checkbox"
                  checked={draftReposicionPlancha}
                  onChange={e => onReposicionPlanchaChange?.(e.target.checked)}
                  disabled={!detalleOpCantidadLista}
                />
                <span>Reposición plancha</span>
              </label>
            </div>
            {draftReposicionPlancha ? (
              <>
                <div className="production-plancha-draft__readonly">
                  <label className="production-form-label" htmlFor="diseno-draft-cant-rep">
                    Cantidad reposición
                  </label>
                  <input
                    id="diseno-draft-cant-rep"
                    type="text"
                    inputMode="numeric"
                    className="production-form-input"
                    value={draftCantidadReposicion}
                    disabled={!detalleOpCantidadLista}
                    onChange={e =>
                      onCantidadReposicionChange?.(e.target.value.replace(/\D/g, ''))
                    }
                    onKeyDown={blockNonDigitKey}
                    placeholder={isSieteOMasColores ? 'Mín. 7' : undefined}
                    aria-label="Cantidad reposición"
                  />
                </div>
                <div className="production-form-field production-form-field--full">
                  <label className="production-form-label" htmlFor="diseno-draft-obs">
                    Observación
                  </label>
                  <input
                    id="diseno-draft-obs"
                    type="text"
                    className="production-form-input"
                    value={draftObservacion}
                    disabled={!detalleOpCantidadLista}
                    onChange={e => onObservacionChange?.(e.target.value)}
                    placeholder="Motivo de la reposición…"
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="production-plancha-draft__total" aria-live="polite">
          <div className="production-plancha-draft__total-text">
            <span className="production-plancha-draft__total-label">Valor total</span>
          </div>
          <strong className="production-plancha-draft__total-value">
            {draftValorTotal > 0 ? formatValor(draftValorTotal) : '$0'}
          </strong>
        </div>
      </div>

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
          {isEditing ? coloresCopy.registro.saveEdit : 'Agregar registro'}
        </button>
      </footer>
    </div>
  )
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
  /** Fallback de órdenes anteriores sin suministro por registro */
  clienteSuministraPlanchas?: YesNoChoice
  onGoToDetalleOpTab?: () => void
}

const DisenoColoresPlanchasPanel: React.FC<DisenoColoresPlanchasPanelProps> = ({
  items,
  planchas,
  onChange,
  isNewOrder = false,
  orderQuantity = 0,
  historialMode = false,
  clienteSuministraPlanchas: legacyClienteSuministraPlanchas = 'no',
  onGoToDetalleOpTab,
}) => {
  const usePlanchaPricing = isNewOrder
  const legacyPricingContext: ColoresPlanchasPricingContext = useMemo(
    () => ({
      historialMode,
      clienteSuministraPlanchas: legacyClienteSuministraPlanchas,
    }),
    [historialMode, legacyClienteSuministraPlanchas]
  )
  const detalleOpCantidadLista = !usePlanchaPricing || orderQuantity > 0
  const coloresListaEditable = detalleOpCantidadLista

  const [draftColor, setDraftColor] = useState<DisenoColoresOption | ''>('')
  const [draftPlanchaId, setDraftPlanchaId] = useState('')
  const [draftNumeroPlanchasManual, setDraftNumeroPlanchasManual] = useState('')
  const [draftCantidad, setDraftCantidad] = useState('')
  const [draftDescripcion, setDraftDescripcion] = useState('')
  const [draftCavidades, setDraftCavidades] = useState('')
  const [draftSobrante, setDraftSobrante] = useState('')
  const [draftDetalle, setDraftDetalle] = useState('')
  const [draftClienteSuministraPlanchas, setDraftClienteSuministraPlanchas] =
    useState<YesNoChoice>('no')
  const [draftReposicionPlancha, setDraftReposicionPlancha] = useState(false)
  const [draftCantidadReposicion, setDraftCantidadReposicion] = useState('')
  const [draftObservacion, setDraftObservacion] = useState('')
  const [draftError, setDraftError] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const coloresPanelRef = useRef<HTMLDivElement>(null)
  const draftZoneRef = useRef<HTMLDivElement>(null)

  const preserveColoresPanelViewport = (mutate: () => void) => {
    preserveViewportAroundAnchor(coloresPanelRef.current, mutate)
  }

  const activePlanchas = useMemo(() => planchas.filter(p => p.active), [planchas])
  const editingItem = useMemo(
    () => (editingItemId ? items.find(item => item.id === editingItemId) ?? null : null),
    [editingItemId, items]
  )
  const draftPlancha = useMemo(
    () =>
      activePlanchas.find(p => p.id === draftPlanchaId) ??
      planchas.find(p => p.id === draftPlanchaId),
    [activePlanchas, planchas, draftPlanchaId]
  )
  const draftPlanchaInCatalog = activePlanchas.some(p => p.id === draftPlanchaId)
  const historialPlanchaFallbackLabel =
    draftPlanchaId && !draftPlanchaInCatalog && editingItem
      ? editingItem.planchaNombreMedida
      : ''
  const draftTipoPlancha = draftPlancha
    ? `${draftPlancha.name} — ${draftPlancha.medida}`
    : editingItem?.planchaId === draftPlanchaId
      ? editingItem.planchaNombreMedida
      : ''
  const draftDetalleClienteSuministra = draftTipoPlancha
    ? buildClienteSuministraPlanchaDetalle(draftTipoPlancha, draftDescripcion)
    : ''
  const draftPrecioPlancha =
    draftClienteSuministraPlanchas === 'si'
      ? 0
      : (draftPlancha?.valor ??
        (editingItem?.planchaId === draftPlanchaId ? editingItem.planchaValor : 0))
  const isSieteOMasColores = draftColor === '7-colores-o-mas'
  const draftNumeroPlanchas = isSieteOMasColores
    ? parseDigits(draftNumeroPlanchasManual)
    : getColoresCount(draftColor)
  const editingHistorialImport = Boolean(
    historialMode && editingItem && !editingItem.registroManual
  )
  const draftValorTotal = useMemo(() => {
    if (draftClienteSuministraPlanchas === 'si' || draftPrecioPlancha <= 0) return 0
    if (editingHistorialImport) {
      if (!draftReposicionPlancha) return 0
      const cantidadReposicion =
        parseDigits(draftCantidadReposicion) || getColoresCount(draftColor)
      if (cantidadReposicion <= 0) return 0
      return computeRegistroValorTotal(cantidadReposicion, draftPrecioPlancha)
    }
    if (draftNumeroPlanchas <= 0) return 0
    return computeRegistroValorTotal(draftNumeroPlanchas, draftPrecioPlancha)
  }, [
    draftClienteSuministraPlanchas,
    draftPrecioPlancha,
    editingHistorialImport,
    draftReposicionPlancha,
    draftCantidadReposicion,
    draftColor,
    draftNumeroPlanchas,
  ])

  const valorTotalPlanchas = useMemo(
    () => sumValorTotalPlanchas(items, legacyPricingContext),
    [items, legacyPricingContext]
  )

  useEffect(() => {
    if (!detalleOpCantidadLista) {
      setDraftColor('')
      setDraftPlanchaId('')
      setDraftDescripcion('')
      setDraftNumeroPlanchasManual('')
      setDraftCantidad('')
      setDraftCavidades('')
      setDraftSobrante('')
      setDraftClienteSuministraPlanchas('no')
      setDraftReposicionPlancha(false)
      setDraftCantidadReposicion('')
      setDraftObservacion('')
      setDraftError(null)
      setEditingItemId(null)
    }
  }, [detalleOpCantidadLista])

  useEffect(() => {
    if (!usePlanchaPricing || orderQuantity <= 0) return
    const synced = syncColoresPlanchasCantidadFromOrder(itemsRef.current, orderQuantity)
    if (synced) onChange(synced)
  }, [usePlanchaPricing, orderQuantity, onChange])

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
    const itemPricingContext = buildItemPricingContext(item, legacyPricingContext)
    const itemClienteSuministra = isItemClienteSuministraPlanchas(item, legacyPricingContext)
    const precioPlancha = resolvePrecioPlanchaDisplay(item, catalog?.valor, itemPricingContext)
    const valorTotal = resolveItemValorTotal(
      { ...item, planchaValor: precioPlancha },
      itemPricingContext
    )
    return {
      meta,
      nombreMedida: catalog
        ? `${catalog.name} — ${catalog.medida}`
        : item.planchaNombreMedida,
      precioPlancha,
      valorTotal,
      catalog,
      itemClienteSuministra,
    }
  }

  const resetDraftAfterAdd = () => {
    setDraftColor('')
    setDraftPlanchaId('')
    setDraftDescripcion('')
    setDraftNumeroPlanchasManual('')
    setDraftCantidad('')
    setDraftCavidades('')
    setDraftSobrante('')
    setDraftClienteSuministraPlanchas('no')
    setDraftReposicionPlancha(false)
    setDraftCantidadReposicion('')
    setDraftObservacion('')
    setDraftError(null)
    setEditingItemId(null)
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
    setDraftSobrante('')
    setDraftDetalle('')
    setDraftClienteSuministraPlanchas('no')
    setDraftReposicionPlancha(false)
    setDraftCantidadReposicion('')
    setDraftObservacion('')
    setDraftError(null)
    setEditingItemId(null)
  }

  const defaultCantidadFromOp = () =>
    orderQuantity > 0 ? String(orderQuantity) : ''

  const loadItemIntoDraft = (item: DisenoColorPlanchaItem) => {
    const itemClienteSuministra = isItemClienteSuministraPlanchas(item, legacyPricingContext)
    const clienteSuministraChoice = resolveItemClienteSuministraPlanchas(
      item,
      legacyPricingContext
    )
    setDraftColor(item.colores)
    setDraftPlanchaId(item.planchaId)
    setDraftClienteSuministraPlanchas(clienteSuministraChoice)
    setDraftDescripcion(
      itemClienteSuministra
        ? extractDescripcionUsuarioClienteSuministra(item.detalle, item.planchaNombreMedida)
        : item.detalle
    )
    setDraftCantidad(item.cantidad > 0 ? String(item.cantidad) : defaultCantidadFromOp())
    setDraftCavidades(item.numeroCavidades > 0 ? String(item.numeroCavidades) : '')
    setDraftSobrante(item.sobrante > 0 ? String(item.sobrante) : '')
    setDraftNumeroPlanchasManual(
      item.colores === '7-colores-o-mas' && item.numeroPlanchas >= 7
        ? String(item.numeroPlanchas)
        : item.colores === '7-colores-o-mas'
          ? '7'
          : ''
    )
    setDraftReposicionPlancha(Boolean(item.reposicionPlancha))
    setDraftCantidadReposicion(
      (item.cantidadReposicion ?? 0) > 0 ? String(item.cantidadReposicion) : ''
    )
    setDraftObservacion(item.observacion ?? '')
    setDraftError(null)
  }

  const handleDraftColorChange = (value: DisenoColoresOption) => {
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
  }

  const handleEditRegistro = (id: string) => {
    const item = itemsRef.current.find(entry => entry.id === id)
    if (!item) return
    setEditingItemId(id)
    loadItemIntoDraft(item)
    requestAnimationFrame(() => {
      draftZoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleDraftSuministroChange = (value: YesNoChoice) => {
    setDraftClienteSuministraPlanchas(value)
    if (value === 'no') {
      setDraftDescripcion(prev =>
        draftTipoPlancha
          ? extractDescripcionUsuarioClienteSuministra(prev, draftTipoPlancha)
          : prev
      )
    }
    if (draftError) setDraftError(null)
  }

  const handleDraftReposicionChange = (checked: boolean) => {
    setDraftReposicionPlancha(checked)
    if (checked) {
      setDraftCantidadReposicion(prev => {
        if (prev && parseDigits(prev) > 0) return prev
        const defaultCantidad =
          draftColor === '7-colores-o-mas'
            ? Math.max(getColoresCount(draftColor), 7)
            : getColoresCount(draftColor)
        return defaultCantidad > 0 ? String(defaultCantidad) : ''
      })
    } else {
      setDraftCantidadReposicion('')
      setDraftObservacion('')
    }
    if (draftError) setDraftError(null)
  }

  const draftMeta = draftColor ? getColoresOptionMeta(draftColor) : null
  const draftEsClienteSuministra = draftClienteSuministraPlanchas === 'si'

  const handleAddRegistro = () => {
    if (!draftColor) {
      setDraftError(validationCopy.selectColor)
      return
    }
    if (!draftPlanchaId) {
      setDraftError(validationCopy.selectPlancha)
      return
    }
    const plancha = planchas.find(p => p.id === draftPlanchaId)
    if (!plancha) return
    const snapshot = buildTipoPlanchaSnapshot(plancha)

    if (usePlanchaPricing) {
      if (orderQuantity <= 0) {
        setDraftError(validationCopy.detalleOpCantidad)
        return
      }
      const numeroPlanchas = isSieteOMasColores
        ? parseDigits(draftNumeroPlanchasManual)
        : getColoresCount(draftColor)
      if (numeroPlanchas <= 0) {
        setDraftError(
          isSieteOMasColores
            ? validationCopy.numeroPlanchasSiete
            : validationCopy.numeroPlanchasColores
        )
        return
      }
      if (isSieteOMasColores && numeroPlanchas < 7) {
        setDraftError(validationCopy.numeroPlanchasMinimo)
        return
      }
      const cantidad = parseDigits(draftCantidad)
      if (cantidad <= 0) {
        setDraftError(validationCopy.cantidadRegistro)
        return
      }
      const descripcion = draftEsClienteSuministra
        ? buildClienteSuministraPlanchaDetalle(snapshot.planchaNombreMedida, draftDescripcion)
        : draftDescripcion.trim()
      if (!draftEsClienteSuministra && !descripcion) {
        setDraftError(validationCopy.descripcionRegistro)
        return
      }
      if (hasDuplicateColoresPlanchaRegistro(
        itemsRef.current,
        draftPlanchaId,
        descripcion,
        editingItemId ?? undefined
      )) {
        setDraftError(validationCopy.registroDuplicado)
        return
      }
      const valorTotal = draftEsClienteSuministra
        ? 0
        : computeRegistroValorTotal(numeroPlanchas, plancha.valor)
      const numeroCavidades = parseDigits(draftCavidades)
      const sobrante = parseDigits(draftSobrante)
      const existing = editingItemId
        ? itemsRef.current.find(item => item.id === editingItemId)
        : null
      if (editingItemId && !existing) {
        setEditingItemId(null)
        return
      }
      const esHistorialImport = Boolean(historialMode && existing && !existing.registroManual)

      if (esHistorialImport && existing) {
        const reposicionPlancha = draftReposicionPlancha
        const cantidadReposicion = reposicionPlancha
          ? parseDigits(draftCantidadReposicion) || getColoresCount(draftColor)
          : 0
        if (
          reposicionPlancha &&
          draftColor === '7-colores-o-mas' &&
          cantidadReposicion > 0 &&
          cantidadReposicion < 7
        ) {
          setDraftError(validationCopy.numeroPlanchasMinimo)
          return
        }
        preserveColoresPanelViewport(() => {
          const itemPricingContext = buildItemPricingContext(
            {
              ...existing,
              clienteSuministraPlanchas: draftClienteSuministraPlanchas,
            },
            legacyPricingContext
          )
          const baseItem = applyTamanosBuenosToItem({
            ...existing,
            colores: draftColor,
            cantidad,
            numeroCavidades,
            sobrante,
            detalle: descripcion,
            observacion: reposicionPlancha ? draftObservacion.trim() : '',
            reposicionPlancha,
            cantidadReposicion,
            numeroPlanchas: getColoresCount(draftColor),
            registroManual: false,
            clienteSuministraPlanchas: draftClienteSuministraPlanchas,
            ...snapshot,
          })
          const precioPatch =
            reposicionPlancha && draftClienteSuministraPlanchas !== 'si'
              ? buildPrecioPatchFromCatalog(
                  { ...baseItem, reposicionPlancha: true, cantidadReposicion },
                  plancha,
                  cantidadReposicion,
                  itemPricingContext
                )
              : {
                  ...snapshot,
                  planchaValor: 0,
                  valorTotal: 0,
                }
          const nextItem = patchRegistroClienteSuministraPlanchas(
            { ...baseItem, ...precioPatch },
            draftClienteSuministraPlanchas,
            planchas,
            historialMode
          )
          onChange(
            itemsRef.current.map(item => (item.id === editingItemId ? nextItem : item))
          )
          resetDraftAfterAdd()
        })
        return
      }

      preserveColoresPanelViewport(() => {
        const baseItem = applyTamanosBuenosToItem({
          ...(existing ?? {}),
          id: editingItemId ?? createId(),
          colores: draftColor,
          cantidad,
          numeroPlanchas,
          valorTotal,
          numeroCavidades,
          sobrante,
          detalle: descripcion,
          observacion: existing?.observacion ?? '',
          reposicionPlancha: existing?.reposicionPlancha ?? false,
          cantidadReposicion: existing?.cantidadReposicion ?? 0,
          registroManual: existing?.registroManual ?? historialMode,
          clienteSuministraPlanchas: draftClienteSuministraPlanchas,
          ...snapshot,
        })
        const nextItem = patchRegistroClienteSuministraPlanchas(
          baseItem,
          draftClienteSuministraPlanchas,
          planchas,
          historialMode
        )
        onChange(
          editingItemId
            ? itemsRef.current.map(item => (item.id === editingItemId ? nextItem : item))
            : [...itemsRef.current, nextItem]
        )
        resetDraftAfterAdd()
      })
    } else {
      const numeroCavidades = parseDigits(draftCavidades)
      if (numeroCavidades <= 0) {
        setDraftError(validationCopy.cavidadesRegistro)
        return
      }
      const detalle = draftDetalle.trim()
      if (!detalle) {
        setDraftError(validationCopy.detalleRegistro)
        return
      }
      if (hasDuplicateColoresPlanchaRegistro(
        itemsRef.current,
        draftPlanchaId,
        detalle,
        editingItemId ?? undefined
      )) {
        setDraftError(validationCopy.registroDuplicado)
        return
      }
      preserveColoresPanelViewport(() => {
        onChange([
          ...itemsRef.current,
          applyTamanosBuenosToItem({
            id: createId(),
            colores: draftColor,
            cantidad: 0,
            numeroPlanchas: 0,
            valorTotal: 0,
            numeroCavidades,
            sobrante: parseDigits(draftSobrante),
            detalle,
            observacion: '',
            ...snapshot,
          }),
        ])
        resetDraft()
      })
      return
    }
    return
  }

  const handleRemove = (id: string) => {
    if (usePlanchaPricing && !coloresListaEditable) return
    preserveColoresPanelViewport(() => {
      onChange(items.filter(item => item.id !== id))
    })
    if (editingItemId === id) {
      resetDraft()
    }
  }

  const updateItem = (id: string, patch: Partial<DisenoColorPlanchaItem>) => {
    if (usePlanchaPricing && !coloresListaEditable) return
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
    const itemConReposicion = { ...item, reposicionPlancha: true, cantidadReposicion }
    const itemPricingContext = buildItemPricingContext(item, legacyPricingContext)
    updateItem(id, {
      reposicionPlancha: true,
      numeroPlanchas: getColoresCount(item.colores),
      cantidadReposicion,
      ...buildPrecioPatchFromCatalog(
        itemConReposicion,
        catalog,
        cantidadReposicion,
        itemPricingContext
      ),
    })
  }

  const handleCantidadItemChange = (id: string, raw: string) => {
    if (usePlanchaPricing && !coloresListaEditable) return
    const digits = raw.replace(/\D/g, '')
    const cantidad = digits ? Number(digits) : 0
    preserveColoresPanelViewport(() => {
      onChange(
        itemsRef.current.map(item =>
          item.id === id ? applyTamanosBuenosToItem({ ...item, cantidad }) : item
        )
      )
    })
  }

  const patchItemFieldAlways = (
    id: string,
    patch: Pick<DisenoColorPlanchaItem, 'numeroCavidades' | 'sobrante'>
  ) => {
    preserveColoresPanelViewport(() => {
      onChange(
        itemsRef.current.map(item =>
          item.id === id ? applyTamanosBuenosToItem({ ...item, ...patch }) : item
        )
      )
    })
  }

  const handleCavidadesItemChange = (id: string, raw: string) => {
    const digits = raw.replace(/\D/g, '')
    patchItemFieldAlways(id, { numeroCavidades: digits ? Number(digits) : 0 })
  }

  const handleSobranteItemChange = (id: string, raw: string) => {
    const digits = raw.replace(/\D/g, '')
    patchItemFieldAlways(id, { sobrante: digits ? Number(digits) : 0 })
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
    const itemPricingContext = buildItemPricingContext(item, legacyPricingContext)
    updateItem(id, {
      cantidadReposicion,
      ...buildPrecioPatchFromCatalog(item, catalog, cantidadReposicion, itemPricingContext),
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
      setRowError(item.id, validationCopy.historialSinPlancha)
      return
    }
    const plancha = activePlanchas.find(p => p.id === item.planchaId)
    if (!plancha) {
      setRowError(item.id, validationCopy.historialPlanchaInactiva)
      return
    }
    if (!observacion) {
      setRowError(item.id, validationCopy.historialSinObservacion)
      return
    }
    const numeroPlanchas =
      item.numeroPlanchas > 0 ? item.numeroPlanchas : getColoresCount(item.colores)
    const valorTotal =
      numeroPlanchas > 0 ? computeRegistroValorTotal(numeroPlanchas, plancha.valor) : 0
    updateItem(item.id, {
      ...buildTipoPlanchaSnapshot(plancha),
      numeroPlanchas,
      valorTotal,
      observacion,
    })
  }

  const showDraftForm = Boolean(draftColor) && detalleOpCantidadLista
  const planchaSuministroSelector = resolvePlanchaSuministroSelectorState(
    showDraftForm,
    Boolean(editingItemId),
    draftClienteSuministraPlanchas
  )

  return (
    <div
      ref={coloresPanelRef}
      className="production-form-field production-form-field--full production-diseno-colores-planchas"
    >
      {usePlanchaPricing ? (
        <div className="production-plancha-workspace">
          {!coloresListaEditable && (
            <DetalleOpRequiredGate onGoToDetalleOpTab={onGoToDetalleOpTab} />
          )}

          {coloresListaEditable && (
          <section className="production-plancha-workspace__composer" aria-labelledby="diseno-colores-add-label">
              <>
            {!editingItemId ? (
            <div
              className={[
                'production-plancha-workspace__picker-zone',
                showDraftForm ? 'production-plancha-workspace__picker-zone--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="production-plancha-workspace__zone-label" id="diseno-colores-add-label">
                1. Cantidad de colores
              </span>
              <DisenoColoresPicker
                id="diseno-colores-add"
                labelId="diseno-colores-add-label"
                placeholder={coloresCopy.colorPickerPlaceholder}
                value={draftColor}
                disabled={!detalleOpCantidadLista}
                onChange={handleDraftColorChange}
              />
            </div>
            ) : null}

            {showDraftForm && draftMeta && (
              <div
                ref={draftZoneRef}
                className={[
                  'production-plancha-workspace__draft-zone',
                  editingItemId ? 'production-plancha-workspace__draft-zone--editing' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <RegistroOpComposerForm
                    meta={draftMeta}
                    draftColor={draftColor}
                    onDraftColorChange={handleDraftColorChange}
                    onDraftColorReset={editingItemId ? undefined : () => setDraftColor('')}
                    colorPickerPlaceholder={coloresCopy.colorPickerPlaceholder}
                    draftCantidad={draftCantidad}
                    onCantidadChange={value => {
                      setDraftCantidad(value)
                      if (draftError) setDraftError(null)
                    }}
                    draftCavidades={draftCavidades}
                    onCavidadesChange={value => {
                      setDraftCavidades(value)
                      if (draftError) setDraftError(null)
                    }}
                    draftSobrante={draftSobrante}
                    onSobranteChange={value => {
                      setDraftSobrante(value)
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
                    clienteSuministraPlanchas={draftEsClienteSuministra}
                    draftNumeroPlanchas={draftNumeroPlanchas}
                    isSieteOMasColores={isSieteOMasColores}
                    draftNumeroPlanchasManual={draftNumeroPlanchasManual}
                    onNumeroPlanchasManualChange={value => {
                      setDraftNumeroPlanchasManual(value)
                      if (draftError) setDraftError(null)
                    }}
                    draftValorTotal={draftValorTotal}
                    draftDescripcion={draftDescripcion}
                    draftDetalleClienteSuministra={draftDetalleClienteSuministra}
                    onDescripcionChange={value => {
                      setDraftDescripcion(value)
                      if (draftError) setDraftError(null)
                    }}
                    draftError={draftError}
                    onCancel={resetDraft}
                    onAdd={handleAddRegistro}
                    canAdd={detalleOpCantidadLista && activePlanchas.length > 0}
                    isEditing={Boolean(editingItemId)}
                    clienteSuministraPlanchasChoice={draftClienteSuministraPlanchas}
                    onDraftClienteSuministraPlanchasChange={handleDraftSuministroChange}
                    suministroSelectorVisible={planchaSuministroSelector.visible}
                    suministroDisabledValues={planchaSuministroSelector.disabledValues}
                    historialEditMode={historialMode && Boolean(editingItemId)}
                    editingRegistroManual={Boolean(editingItem?.registroManual)}
                    draftReposicionPlancha={draftReposicionPlancha}
                    onReposicionPlanchaChange={handleDraftReposicionChange}
                    draftCantidadReposicion={draftCantidadReposicion}
                    onCantidadReposicionChange={value => {
                      setDraftCantidadReposicion(value)
                      if (draftError) setDraftError(null)
                    }}
                    draftObservacion={draftObservacion}
                    onObservacionChange={value => {
                      setDraftObservacion(value)
                      if (draftError) setDraftError(null)
                    }}
                    historialPlanchaFallbackLabel={historialPlanchaFallbackLabel}
                  />
              </div>
            )}

            {activePlanchas.length === 0 && (
              <p className="production-plancha-workspace__hint">Sin tipos de plancha activos.</p>
            )}
              </>
          </section>
          )}

          {items.length > 0 && (
            <section
              className={[
                'production-plancha-workspace__list',
                !coloresListaEditable ? 'production-plancha-workspace__list--locked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label="Registros"
            >
              {!coloresListaEditable && (
                <p className="production-plancha-workspace__list-locked-hint" role="status">
                  Los registros del diseño anterior están en solo lectura. Complete la{' '}
                  <strong>Cantidad</strong> en Detalle OP para habilitar edición, reposiciones y
                  nuevos registros.
                </p>
              )}
              {historialMode ? (
                <PlanchasRegistrosTableExistente
                  locked={!coloresListaEditable}
                  editingItemId={editingItemId}
                  rows={items.map(item => {
                    const display = resolveDisplay(item)
                    return {
                      item,
                      meta: display.meta,
                      nombreMedida: display.nombreMedida,
                      precioPlancha: display.precioPlancha,
                      valorTotal: display.valorTotal,
                      itemClienteSuministra: display.itemClienteSuministra,
                    }
                  })}
                  valorTotalPlanchas={valorTotalPlanchas}
                  onCantidadChange={handleCantidadItemChange}
                  onCavidadesChange={handleCavidadesItemChange}
                  onSobranteChange={handleSobranteItemChange}
                  onReposicionChange={handleReposicionChange}
                  onCantidadReposicionChange={handleCantidadReposicionChange}
                  onObservacionChange={handleHistorialObservacionChange}
                  onEdit={handleEditRegistro}
                  onRemove={handleRemove}
                />
              ) : (
                <PlanchasRegistrosTable
                  locked={!coloresListaEditable}
                  editingItemId={editingItemId}
                  rows={items.map(item => {
                    const display = resolveDisplay(item)
                    return {
                      item,
                      meta: display.meta,
                      nombreMedida: display.nombreMedida,
                      precioPlancha: display.precioPlancha,
                      valorTotal: display.valorTotal,
                      itemClienteSuministra: display.itemClienteSuministra,
                    }
                  })}
                  valorTotalPlanchas={valorTotalPlanchas}
                  onCantidadChange={handleCantidadItemChange}
                  onCavidadesChange={handleCavidadesItemChange}
                  onSobranteChange={handleSobranteItemChange}
                  onEdit={handleEditRegistro}
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
          <DisenoColoresPicker
            id="diseno-colores-add-legacy"
            labelId="diseno-colores-add-label"
            placeholder={coloresCopy.colorPickerPlaceholder}
            value={draftColor}
            onChange={handleDraftColorChange}
          />
        </div>

        {showDraftForm ? (
          <div className="production-diseno-colores-add__form">
            {draftError ? (
              <PreprensaValidationNotice
                title={coloresCopy.validationTitle}
                message={draftError}
              />
            ) : null}
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
                  <TamanosBuenosReadonlyField
                    cantidad={parseDigits(draftCantidad)}
                    numeroCavidades={parseDigits(draftCavidades)}
                  />
                  <div className="production-form-field">
                    <label className="production-form-label" htmlFor="diseno-add-sobrante-legacy">
                      Sobrante
                    </label>
                    <input
                      id="diseno-add-sobrante-legacy"
                      type="text"
                      inputMode="numeric"
                      className="production-form-input"
                      value={draftSobrante}
                      onChange={e => {
                        setDraftSobrante(e.target.value.replace(/\D/g, ''))
                        if (draftError) setDraftError(null)
                      }}
                      onKeyDown={blockNonDigitKey}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="production-form-field production-form-field--full">
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
        ) : null}

        {activePlanchas.length === 0 ? (
          <PreprensaFieldNotice variant="warning">{coloresCopy.sinPlanchasActivas}</PreprensaFieldNotice>
        ) : null}
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
                          <label
                            className="production-form-label"
                            htmlFor={`diseno-hist-cavidades-${item.id}`}
                          >
                            Cavidades
                          </label>
                          <input
                            id={`diseno-hist-cavidades-${item.id}`}
                            type="text"
                            inputMode="numeric"
                            className="production-form-input"
                            value={item.numeroCavidades > 0 ? String(item.numeroCavidades) : ''}
                            onChange={e =>
                              handleCavidadesItemChange(item.id, e.target.value)
                            }
                            onKeyDown={blockNonDigitKey}
                            placeholder="Cavidades"
                          />
                        </div>
                        <TamanosBuenosReadonlyField
                          cantidad={item.cantidad}
                          numeroCavidades={item.numeroCavidades}
                        />
                        <div className="production-form-field">
                          <label
                            className="production-form-label"
                            htmlFor={`diseno-hist-sobrante-${item.id}`}
                          >
                            Sobrante
                          </label>
                          <input
                            id={`diseno-hist-sobrante-${item.id}`}
                            type="text"
                            inputMode="numeric"
                            className="production-form-input"
                            value={item.sobrante > 0 ? String(item.sobrante) : ''}
                            onChange={e => handleSobranteItemChange(item.id, e.target.value)}
                            onKeyDown={blockNonDigitKey}
                            placeholder="Sobrante"
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
                          {rowError ? (
                            <PreprensaValidationNotice
                              title={coloresCopy.validationTitle}
                              message={rowError}
                            />
                          ) : null}
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
                          <label
                            className="production-form-label"
                            htmlFor={`diseno-legacy-cavidades-${item.id}`}
                          >
                            Cavidades
                          </label>
                          <input
                            id={`diseno-legacy-cavidades-${item.id}`}
                            type="text"
                            inputMode="numeric"
                            className="production-form-input"
                            value={item.numeroCavidades > 0 ? String(item.numeroCavidades) : ''}
                            onChange={e =>
                              handleCavidadesItemChange(item.id, e.target.value)
                            }
                            onKeyDown={blockNonDigitKey}
                            placeholder="Cavidades"
                          />
                        </div>
                        <TamanosBuenosReadonlyField
                          cantidad={item.cantidad}
                          numeroCavidades={item.numeroCavidades}
                        />
                        <div className="production-form-field">
                          <label
                            className="production-form-label"
                            htmlFor={`diseno-legacy-sobrante-${item.id}`}
                          >
                            Sobrante
                          </label>
                          <input
                            id={`diseno-legacy-sobrante-${item.id}`}
                            type="text"
                            inputMode="numeric"
                            className="production-form-input"
                            value={item.sobrante > 0 ? String(item.sobrante) : ''}
                            onChange={e => handleSobranteItemChange(item.id, e.target.value)}
                            onKeyDown={blockNonDigitKey}
                            placeholder="Sobrante"
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
