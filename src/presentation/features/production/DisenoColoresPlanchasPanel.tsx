import React, { useMemo, useRef, useState } from 'react'
import { DisenoColorPlanchaItem, DisenoColoresOption } from '../../../core/domain/entities/PreprensaDiseno'
import { TamanoPlancha } from '../../../core/domain/entities/TamanoPlancha'
import { ColoresCountIcon } from './DisenoColoresPicker'
import DisenoColoresPicker from './DisenoColoresPicker'
import { buildTipoPlanchaSnapshot } from './DisenoTipoPlanchaPicker'
import { getColoresOptionMeta } from './utils/coloresPlanchasUtils'

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

interface DisenoColoresPlanchasPanelProps {
  items: DisenoColorPlanchaItem[]
  planchas: TamanoPlancha[]
  onChange: (items: DisenoColorPlanchaItem[]) => void
  /** Trabajo anterior: valores de plancha en cero y registros editables con observación */
  historialMode?: boolean
}

const DisenoColoresPlanchasPanel: React.FC<DisenoColoresPlanchasPanelProps> = ({
  items,
  planchas,
  onChange,
  historialMode = false,
}) => {
  const [draftColor, setDraftColor] = useState<DisenoColoresOption | ''>('')
  const [draftPlanchaId, setDraftPlanchaId] = useState('')
  const [draftCavidades, setDraftCavidades] = useState('')
  const [draftDetalle, setDraftDetalle] = useState('')
  const [draftError, setDraftError] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [pickerKey, setPickerKey] = useState(0)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const activePlanchas = useMemo(() => planchas.filter(p => p.active), [planchas])

  const resolveDisplay = (item: DisenoColorPlanchaItem) => {
    const catalog = planchas.find(p => p.id === item.planchaId)
    const meta = getColoresOptionMeta(item.colores)
    const valor =
      item.planchaValor === 0
        ? 0
        : historialMode
          ? item.planchaValor
          : (catalog?.valor ?? item.planchaValor)
    return {
      meta,
      nombreMedida: catalog
        ? `${catalog.name} — ${catalog.medida}`
        : item.planchaNombreMedida,
      valor,
    }
  }

  const resetDraft = () => {
    setDraftColor('')
    setDraftPlanchaId('')
    setDraftCavidades('')
    setDraftDetalle('')
    setDraftError(null)
    setPickerKey(k => k + 1)
  }

  const handleAddRegistro = () => {
    if (!draftColor) {
      setDraftError('Seleccione un color de la lista.')
      return
    }
    if (!draftPlanchaId) {
      setDraftError('Seleccione el tipo de plancha.')
      return
    }
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
    const currentItems = itemsRef.current
    const plancha = planchas.find(p => p.id === draftPlanchaId)
    if (!plancha) return
    const snapshot = buildTipoPlanchaSnapshot(plancha)
    onChange([
      ...currentItems,
      {
        id: crypto.randomUUID(),
        colores: draftColor,
        numeroCavidades,
        detalle,
        observacion: '',
        ...snapshot,
      },
    ])
    resetDraft()
  }

  const handleRemove = (id: string) => {
    onChange(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, patch: Partial<DisenoColorPlanchaItem>) => {
    onChange(items.map(item => (item.id === id ? { ...item, ...patch } : item)))
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

  /** Solo cambia la plancha seleccionada; el valor sigue en $0 hasta pulsar Actualizar. */
  const handleHistorialPlanchaSelect = (id: string, planchaId: string) => {
    clearRowError(id)
    if (!planchaId) {
      updateItem(id, {
        planchaId: '',
        planchaNombreMedida: '',
        planchaValor: 0,
      })
      return
    }
    const plancha = planchas.find(p => p.id === planchaId)
    if (!plancha) return
    updateItem(id, {
      planchaId: plancha.id,
      planchaNombreMedida: `${plancha.name} — ${plancha.medida}`,
      planchaValor: 0,
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
    updateItem(item.id, {
      ...buildTipoPlanchaSnapshot(plancha),
      observacion,
    })
  }

  const showDraftForm = Boolean(draftColor)

  return (
    <div className="production-form-field production-form-field--full production-diseno-colores-planchas">
      <div className="production-diseno-colores-add">
        <div className="production-form-field">
          <span className="production-form-label" id="diseno-colores-add-label">
            Cantidad de colores
          </span>
          <p className="production-diseno-colores-add__hint">
            Elija 1, 2 o 3 colores. Cada tono indica una tinta en preprensa.
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
                <label className="production-form-label" htmlFor="diseno-add-plancha">
                  Tipo plancha
                </label>
                <select
                  id="diseno-add-plancha"
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
                onClick={handleAddRegistro}
                disabled={activePlanchas.length === 0}
              >
                Agregar registro
              </button>
            </div>
          </div>
        ) : (
          <p className="production-diseno-cliente-hint">
            Seleccione un color del listado. Luego complete cavidades, tipo de plancha y detalle.
            Puede repetir el mismo color y el mismo tipo de plancha en varios registros (por
            ejemplo, distintas cavidades o detalle).
          </p>
        )}

        {activePlanchas.length === 0 && (
          <p className="production-diseno-cliente-hint">
            No hay tipos de plancha activos. Regístrelos en Catálogos › Tipo Plancha.
          </p>
        )}
      </div>

      {items.length > 0 && (
        <div
          className={[
            'production-diseno-colores-registros-wrap',
            historialMode ? 'production-diseno-colores-registros-wrap--historial' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="production-form-label">Registros agregados</span>
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
              const valorDisplay =
                display.valor > 0 ? formatValor(display.valor) : '$0'
              const planchaInCatalog = activePlanchas.some(p => p.id === item.planchaId)
              const valorActualizado = item.planchaValor > 0
              const rowError = rowErrors[item.id]

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
                  <div className="production-diseno-colores-registro__color">
                    {display.meta && (
                      <>
                        <ColoresCountIcon
                          dotCount={display.meta.dotCount}
                          showPlus={display.meta.showPlusInIcon}
                        />
                        <span className="production-diseno-colores-registro__color-label">
                          {display.meta.label}
                        </span>
                      </>
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
                      'production-diseno-color-plancha-item__grid',
                      historialMode
                        ? 'production-diseno-color-plancha-item__grid--historial'
                        : 'production-diseno-color-plancha-item__grid--4',
                    ].join(' ')}
                  >
                    <div className="production-form-field">
                      <span className="production-form-label">Cavidades</span>
                      <input
                        type="text"
                        className="production-form-input production-form-input--readonly"
                        value={item.numeroCavidades > 0 ? String(item.numeroCavidades) : ''}
                        readOnly
                      />
                    </div>
                    {historialMode ? (
                      <>
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
                            value={valorDisplay}
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
                          {rowError && (
                            <p className="production-form-error">{rowError}</p>
                          )}
                          <button
                            type="button"
                            className="production-diseno-colores-registro__update-btn"
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
                            value={display.valor > 0 ? formatValor(display.valor) : ''}
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
                    className="production-diseno-color-plancha-item__remove"
                    onClick={() => handleRemove(item.id)}
                  >
                    Quitar registro
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default DisenoColoresPlanchasPanel
