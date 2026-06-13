import React, { useEffect, useId, useMemo, useState } from 'react'
import type {
  AcabadoProduccionLinea,
  AcabadosProduccionRegistro,
  PaperRow,
} from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem, YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import type { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import type { CatalogRecord } from '../../catalog/catalogRecord'
import ActionIcon from '../../components/ui/ActionIcon'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import AcabadosPlanchaSelect from './AcabadosPlanchaSelect'
import AcabadosPlanchaDetalleFields from './AcabadosPlanchaDetalleFields'
import AcabadosRegistrosList from './AcabadosRegistrosList'
import ProductionAcabadosCobroResumen from './ProductionAcabadosCobroResumen'
import { ACABADOS_COPY as copy } from './constants/acabadosCopy'
import {
  buildAcabadoProduccionLinea,
  buildAcabadosAsignadosRows,
  buildAcabadosCorteContexts,
  createAcabadosProduccionEntrada,
  patchAcabadosRegistroForContext,
  resolveCompletedAcabadosCorteRowKeys,
  resolveAcabadosEntradasForContext,
} from './utils/acabadosUtils'
import { formatTerminadoPrecioCop } from './utils/terminadoPricingUtils'
import { formatCatalogValorCmCuadradoNumber } from '../catalog/catalogRecord'

const asignacionCopy = copy.asignacion

interface ProductionAcabadosPanelProps {
  coloresPlanchas: DisenoColorPlanchaItem[]
  paperRows: PaperRow[]
  tiposPapel: TipoPapel[]
  margenRedondeo: number
  clienteSuministraPapel: YesNoChoice
  acabadosCatalog: CatalogRecord[]
  quickAccessAcabados: CatalogRecord[]
  registros: AcabadosProduccionRegistro[]
  activeCorteRowKey: string
  onActiveCorteRowKeyChange: (key: string) => void
  onRegistrosChange: (
    updater:
      | AcabadosProduccionRegistro[]
      | ((prev: AcabadosProduccionRegistro[]) => AcabadosProduccionRegistro[])
  ) => void
}

const ProductionAcabadosPanel: React.FC<ProductionAcabadosPanelProps> = ({
  coloresPlanchas,
  paperRows,
  tiposPapel,
  margenRedondeo,
  clienteSuministraPapel,
  acabadosCatalog,
  quickAccessAcabados,
  registros,
  activeCorteRowKey,
  onActiveCorteRowKeyChange,
  onRegistrosChange,
}) => {
  const registroLabelId = useId()
  const planchaDetalleLabelId = useId()
  const acabadoSelectId = useId()
  const registrosLabelId = useId()
  const [pinnedCatalogIds, setPinnedCatalogIds] = useState<string[]>([])
  const [selectorError, setSelectorError] = useState<string | null>(null)
  const [draftByKey, setDraftByKey] = useState<Record<string, AcabadoProduccionLinea[]>>({})
  const [editingEntradaId, setEditingEntradaId] = useState<string | null>(null)

  const contexts = useMemo(
    () =>
      buildAcabadosCorteContexts(
        coloresPlanchas,
        paperRows,
        tiposPapel,
        margenRedondeo,
        clienteSuministraPapel
      ),
    [coloresPlanchas, paperRows, tiposPapel, margenRedondeo, clienteSuministraPapel]
  )

  const completableContexts = useMemo(
    () => contexts.filter(ctx => ctx.completo),
    [contexts]
  )

  const completedRowKeys = useMemo(
    () =>
      resolveCompletedAcabadosCorteRowKeys(
        coloresPlanchas,
        paperRows,
        tiposPapel,
        margenRedondeo,
        clienteSuministraPapel,
        registros
      ),
    [coloresPlanchas, paperRows, tiposPapel, margenRedondeo, clienteSuministraPapel, registros]
  )

  useEffect(() => {
    if (activeCorteRowKey && completableContexts.some(ctx => ctx.corteRowKey === activeCorteRowKey)) {
      return
    }
    const first = completableContexts[0]?.corteRowKey ?? ''
    if (first !== activeCorteRowKey) {
      onActiveCorteRowKeyChange(first)
    }
  }, [activeCorteRowKey, completableContexts, onActiveCorteRowKeyChange])

  const activeContext = useMemo(
    () => completableContexts.find(ctx => ctx.corteRowKey === activeCorteRowKey) ?? null,
    [completableContexts, activeCorteRowKey]
  )

  const isActivePlanchaCompleta = useMemo(
    () => Boolean(activeCorteRowKey && completedRowKeys.includes(activeCorteRowKey)),
    [activeCorteRowKey, completedRowKeys]
  )

  const showAcabadosComposer = !isActivePlanchaCompleta || editingEntradaId !== null

  const asignadosRows = useMemo(
    () => buildAcabadosAsignadosRows(completableContexts, registros),
    [completableContexts, registros]
  )

  const showRegistrosSection = asignadosRows.length > 0

  const draftLineas = draftByKey[activeCorteRowKey] ?? []

  const assignedIds = useMemo(
    () => new Set(draftLineas.map(linea => linea.operacionId)),
    [draftLineas]
  )

  const availableAcabados = useMemo(
    () => acabadosCatalog.filter(item => !assignedIds.has(item.id)),
    [acabadosCatalog, assignedIds]
  )

  const selectableAcabados = useMemo(
    () => availableAcabados.filter(item => !pinnedCatalogIds.includes(item.id)),
    [availableAcabados, pinnedCatalogIds]
  )

  const pinnedCatalogAcabados = useMemo(
    () =>
      pinnedCatalogIds
        .map(id => acabadosCatalog.find(item => item.id === id))
        .filter((item): item is CatalogRecord => Boolean(item)),
    [pinnedCatalogIds, acabadosCatalog]
  )

  const showQuickAccessSection =
    quickAccessAcabados.length > 0 || pinnedCatalogAcabados.length > 0

  const draftSubtotal = useMemo(
    () => draftLineas.reduce((acc, linea) => acc + linea.precioCobro, 0),
    [draftLineas]
  )

  const canCreateRegistro =
    draftLineas.length > 0 && (!isActivePlanchaCompleta || editingEntradaId !== null)

  const despieceLabel = activeContext
    ? `${activeContext.despieceNombre}${
        activeContext.despieceMedida !== '—' ? ` · ${activeContext.despieceMedida}` : ''
      }`
    : '—'

  const setDraftLineas = (lineas: AcabadoProduccionLinea[]) => {
    if (!activeCorteRowKey) return
    setDraftByKey(prev => ({ ...prev, [activeCorteRowKey]: lineas }))
  }

  const clearDraft = () => {
    if (!activeCorteRowKey) return
    setDraftByKey(prev => {
      const next = { ...prev }
      delete next[activeCorteRowKey]
      return next
    })
    setEditingEntradaId(null)
  }

  useEffect(() => {
    if (!isActivePlanchaCompleta || editingEntradaId) return
    setDraftByKey(prev => {
      if (!activeCorteRowKey || !(activeCorteRowKey in prev)) return prev
      const next = { ...prev }
      delete next[activeCorteRowKey]
      return next
    })
    setPinnedCatalogIds([])
    setSelectorError(null)
  }, [activeCorteRowKey, isActivePlanchaCompleta, editingEntradaId])

  const handleAddAcabado = (operacion: CatalogRecord) => {
    if (!activeContext || !showAcabadosComposer) return
    if (assignedIds.has(operacion.id)) {
      setSelectorError(asignacionCopy.selector.duplicate)
      return
    }
    const linea = buildAcabadoProduccionLinea(
      operacion,
      activeContext.row,
      activeContext.tamanosBuenos
    )
    setDraftLineas([...draftLineas, linea])
    setSelectorError(null)
  }

  const handleQuickAccess = (operacion: CatalogRecord) => {
    handleAddAcabado(operacion)
  }

  const handleCatalogPick = (operacionId: string) => {
    if (!operacionId || !showAcabadosComposer) return
    if (assignedIds.has(operacionId)) {
      setSelectorError(asignacionCopy.selector.duplicate)
      return
    }
    setPinnedCatalogIds(prev => (prev.includes(operacionId) ? prev : [...prev, operacionId]))
    setSelectorError(null)
  }

  const handleAddPinnedAcabado = (operacion: CatalogRecord) => {
    handleAddAcabado(operacion)
  }

  const handleRemoveLinea = (lineaId: string) => {
    setDraftLineas(draftLineas.filter(linea => linea.id !== lineaId))
  }

  const handleCreateRegistro = () => {
    if (!activeContext || draftLineas.length === 0) return
    if (isActivePlanchaCompleta && !editingEntradaId) return
    const entrada = createAcabadosProduccionEntrada(draftLineas, editingEntradaId ?? undefined)

    onRegistrosChange(prev => {
      const currentEntradas = resolveAcabadosEntradasForContext(prev, activeContext)
      const nextEntradas = editingEntradaId
        ? currentEntradas.map(item => (item.id === editingEntradaId ? entrada : item))
        : [...currentEntradas, entrada]
      return patchAcabadosRegistroForContext(prev, activeContext, nextEntradas)
    })

    clearDraft()
    setPinnedCatalogIds([])
  }

  const handleEditEntrada = (corteRowKey: string, entradaId: string) => {
    const context = completableContexts.find(item => item.corteRowKey === corteRowKey)
    if (!context) return
    const entrada = resolveAcabadosEntradasForContext(registros, context).find(
      item => item.id === entradaId
    )
    if (!entrada) return
    if (activeCorteRowKey !== corteRowKey) {
      onActiveCorteRowKeyChange(corteRowKey)
    }
    setDraftLineas(entrada.lineas.map(linea => ({ ...linea })))
    setEditingEntradaId(entradaId)
    setSelectorError(null)
  }

  const handleRemoveEntrada = (corteRowKey: string, entradaId: string) => {
    const context = completableContexts.find(item => item.corteRowKey === corteRowKey)
    if (!context) return
    onRegistrosChange(prev => {
      const nextEntradas = resolveAcabadosEntradasForContext(prev, context).filter(
        item => item.id !== entradaId
      )
      return patchAcabadosRegistroForContext(prev, context, nextEntradas)
    })
    if (editingEntradaId === entradaId) {
      clearDraft()
    }
  }

  const handleCancelEdit = () => {
    clearDraft()
  }

  return (
    <div className="production-acabados-panel">
      <p className="production-workspace-panel-desc">{asignacionCopy.desc}</p>

      <div className="production-ws-sections-stack">
        <ProductionWorkspaceSection
          tag={asignacionCopy.registro.tag}
          title={asignacionCopy.registro.title}
          subtitle={asignacionCopy.registro.subtitle}
          tone={0}
        >
          {completableContexts.length === 0 ? (
            <p className="production-diseno-cliente-hint">{asignacionCopy.registro.emptySinRegistros}</p>
          ) : (
            <div className="production-plancha-workspace production-impresion-tintas-workspace">
              <section
                className="production-plancha-workspace__picker-zone production-plancha-workspace__picker-zone--selected"
                aria-labelledby={registroLabelId}
              >
                <label
                  className="production-form-label"
                  id={registroLabelId}
                  htmlFor="prod-acabados-plancha-select"
                >
                  {asignacionCopy.registro.label}
                </label>
                <AcabadosPlanchaSelect
                  id="prod-acabados-plancha-select"
                  labelId={registroLabelId}
                  contexts={completableContexts}
                  coloresPlanchas={coloresPlanchas}
                  value={activeCorteRowKey}
                  completedRowKeys={completedRowKeys}
                  onChange={onActiveCorteRowKeyChange}
                  placeholder={asignacionCopy.registro.placeholder}
                />
                <span className="production-plancha-workspace__hint">{asignacionCopy.registro.hint}</span>
              </section>

              {activeContext ? (
                <section
                  className="production-plancha-workspace__picker-zone production-impresion-plancha-detalle-zone"
                  aria-labelledby={planchaDetalleLabelId}
                >
                  <span
                    className="production-plancha-workspace__zone-label"
                    id={planchaDetalleLabelId}
                  >
                    {asignacionCopy.planchaDetalle.zoneLabel}
                  </span>
                  <AcabadosPlanchaDetalleFields context={activeContext} />
                </section>
              ) : null}
            </div>
          )}
        </ProductionWorkspaceSection>

        {activeContext ? (
          <>
            <ProductionWorkspaceSection
              tag={asignacionCopy.selector.tag}
              title={asignacionCopy.selector.title}
              tone={1}
              className="production-acabados-selector-section"
            >
            {acabadosCatalog.length === 0 ? (
              <p className="production-empty-hint">{asignacionCopy.selector.emptyCatalog}</p>
            ) : !showAcabadosComposer ? (
              <p className="production-diseno-cliente-hint">
                {asignacionCopy.selector.planchaCompletaHint}
              </p>
            ) : (
              <div className="production-acabados-selector">
                <div className="production-acabados-selector__row">
                  <label className="production-form-label" htmlFor={acabadoSelectId}>
                    {asignacionCopy.selector.allLabel}
                  </label>
                  <select
                    id={acabadoSelectId}
                    className="production-form-input production-form-select production-form-select--placeholder"
                    value=""
                    onChange={e => handleCatalogPick(e.target.value)}
                  >
                    <option value="">{asignacionCopy.selector.placeholder}</option>
                    {selectableAcabados.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {showQuickAccessSection ? (
                  <div className="production-acabados-quick-access">
                    <div className="production-acabados-quick-access__head">
                      <span className="production-acabados-quick-access__title">
                        {asignacionCopy.selector.quickAccess}
                      </span>
                      <span className="production-acabados-quick-access__hint">
                        {asignacionCopy.selector.quickAccessHint}
                      </span>
                    </div>
                    <div className="production-acabados-quick-access__chips">
                      {quickAccessAcabados.map(item => {
                        const disabled = assignedIds.has(item.id)
                        const fromSelect = pinnedCatalogIds.includes(item.id)

                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={[
                              'production-acabados-quick-access__chip',
                              fromSelect ? 'production-acabados-quick-access__chip--from-select' : '',
                              disabled ? 'production-acabados-quick-access__chip--disabled' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={disabled}
                            onClick={() =>
                              fromSelect ? handleAddPinnedAcabado(item) : handleQuickAccess(item)
                            }
                          >
                            <span className="production-acabados-quick-access__chip-icon" aria-hidden>
                              {fromSelect ? '◎' : '⚡'}
                            </span>
                            {item.name}
                          </button>
                        )
                      })}
                      {pinnedCatalogAcabados
                        .filter(
                          operacion => !quickAccessAcabados.some(item => item.id === operacion.id)
                        )
                        .map(operacion => (
                          <button
                            key={operacion.id}
                            type="button"
                            className={[
                              'production-acabados-quick-access__chip',
                              'production-acabados-quick-access__chip--from-select',
                              assignedIds.has(operacion.id)
                                ? 'production-acabados-quick-access__chip--disabled'
                                : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={assignedIds.has(operacion.id)}
                            onClick={() => handleAddPinnedAcabado(operacion)}
                          >
                            <span className="production-acabados-quick-access__chip-icon" aria-hidden>
                              ◎
                            </span>
                            {operacion.name}
                          </button>
                        ))}
                    </div>
                  </div>
                ) : null}

                {selectorError ? (
                  <p className="production-acabados-selector__error" role="alert">
                    {selectorError}
                  </p>
                ) : null}
              </div>
            )}
          </ProductionWorkspaceSection>

          <ProductionWorkspaceSection
            tag={asignacionCopy.asignados.tag}
            title={asignacionCopy.asignados.title}
            tone={3}
          >
            {!showAcabadosComposer ? (
              <p className="production-diseno-cliente-hint">
                {asignacionCopy.asignados.planchaCompletaHint}
              </p>
            ) : draftLineas.length === 0 ? (
              <p className="production-empty-hint">{asignacionCopy.asignados.empty}</p>
            ) : (
              <div className="production-acabados-asignados">
                <div className="production-acabados-asignados__table-wrap">
                  <table className="production-acabados-asignados__table">
                    <thead>
                      <tr>
                        <th>{asignacionCopy.asignados.columns.acabado}</th>
                        <th>{asignacionCopy.asignados.columns.despiece}</th>
                        <th>{asignacionCopy.asignados.columns.valorCmCuadrado}</th>
                        <th>{asignacionCopy.asignados.columns.tamanosBuenos}</th>
                        <th>{asignacionCopy.asignados.columns.costoMinimo}</th>
                        <th>{asignacionCopy.asignados.columns.costoCalculado}</th>
                        <th>{asignacionCopy.asignados.columns.cobro}</th>
                        <th>
                          <span className="sr-only">{asignacionCopy.asignados.columns.acciones}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftLineas.map(linea => (
                        <tr key={linea.id}>
                          <td>{linea.operacionNombre}</td>
                          <td>{despieceLabel}</td>
                          <td>{formatCatalogValorCmCuadradoNumber(linea.valorCmCuadrado)}</td>
                          <td>{linea.tamanosBuenos.toLocaleString('es-CO')}</td>
                          <td>{formatTerminadoPrecioCop(linea.costoMinimo)}</td>
                          <td>{formatTerminadoPrecioCop(linea.precioCalculado)}</td>
                          <td className="production-acabados-asignados__cobro">
                            <strong>{formatTerminadoPrecioCop(linea.precioCobro)}</strong>
                            {linea.precioCobro > linea.precioCalculado ? (
                              <span className="production-acabados-asignados__minimo">
                                {asignacionCopy.asignados.cobroMinimoHint}
                              </span>
                            ) : null}
                          </td>
                          <td className="production-acabados-asignados__actions-cell">
                            <button
                              type="button"
                              className="action-icon-button action-icon-delete production-plancha-table__remove"
                              onClick={() => handleRemoveLinea(linea.id)}
                              title={asignacionCopy.asignados.remove}
                              aria-label={asignacionCopy.asignados.remove}
                            >
                              <ActionIcon name="delete" size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="production-acabados-asignados__subtotal">
                  <span>{asignacionCopy.asignados.subtotal}</span>
                  <strong>{formatTerminadoPrecioCop(draftSubtotal)}</strong>
                </div>
                <footer className="production-acabados-asignados__actions">
                  {editingEntradaId ? (
                    <button
                      type="button"
                      className="production-plancha-draft__btn production-plancha-draft__btn--ghost"
                      onClick={handleCancelEdit}
                    >
                      {asignacionCopy.asignados.cancelEdit}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="production-plancha-draft__btn production-plancha-draft__btn--primary"
                    disabled={!canCreateRegistro}
                    onClick={handleCreateRegistro}
                  >
                    {editingEntradaId
                      ? asignacionCopy.asignados.guardarRegistro
                      : asignacionCopy.asignados.crearRegistro}
                  </button>
                </footer>
              </div>
            )}
          </ProductionWorkspaceSection>
        </>
      ) : null}

        {showRegistrosSection ? (
          <ProductionWorkspaceSection
            tag={asignacionCopy.registros.tag}
            title={asignacionCopy.registros.title}
            tone={4}
          >
          <section
            className="production-plancha-workspace__list"
            aria-labelledby={registrosLabelId}
          >
            <span className="production-plancha-workspace__zone-label" id={registrosLabelId}>
              {asignacionCopy.registros.pasoRegistros}
            </span>
            <AcabadosRegistrosList
              rows={asignadosRows}
              activeCorteRowKey={activeCorteRowKey}
              editingEntradaId={editingEntradaId}
              onEdit={handleEditEntrada}
              onRemove={handleRemoveEntrada}
            />
          </section>
        </ProductionWorkspaceSection>
        ) : null}

        {showRegistrosSection ? (
          <ProductionAcabadosCobroResumen
            contexts={completableContexts}
            registros={registros}
            activeCorteRowKey={activeCorteRowKey}
          />
        ) : null}
      </div>
    </div>
  )
}

export default ProductionAcabadosPanel
