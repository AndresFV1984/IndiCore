import React, { useEffect, useId, useMemo, useState } from 'react'
import type {
  PaperRow,
  TerminadoProduccionLinea,
  TerminadosProduccionRegistro,
} from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem, YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import type { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import type { CatalogRecord } from '../../catalog/catalogRecord'
import ActionIcon from '../../components/ui/ActionIcon'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import TerminadosPlanchaSelect from './TerminadosPlanchaSelect'
import TerminadosPlanchaDetalleFields from './TerminadosPlanchaDetalleFields'
import TerminadosRegistrosList from './TerminadosRegistrosList'
import ProductionTerminadosCobroResumen from './ProductionTerminadosCobroResumen'
import { TERMINADOS_COPY as copy } from './constants/terminadosCopy'
import {
  buildTerminadoProduccionLinea,
  buildTerminadosAsignadosRows,
  buildTerminadosCorteContexts,
  createTerminadosProduccionEntrada,
  patchTerminadosRegistroForContext,
  resolveCompletedTerminadosCorteRowKeys,
  resolveEntradaTerminadosTotal,
  resolveTerminadosEntradasForContext,
} from './utils/terminadosUtils'
import { formatTerminadoPrecioCop } from './utils/terminadoPricingUtils'
import { formatCatalogValorCmCuadradoNumber } from '../catalog/catalogRecord'

const asignacionCopy = copy.asignacion

interface ProductionTerminadosPanelProps {
  coloresPlanchas: DisenoColorPlanchaItem[]
  paperRows: PaperRow[]
  tiposPapel: TipoPapel[]
  margenRedondeo: number
  clienteSuministraPapel: YesNoChoice
  terminadosCatalog: CatalogRecord[]
  quickAccessTerminados: CatalogRecord[]
  registros: TerminadosProduccionRegistro[]
  activeCorteRowKey: string
  onActiveCorteRowKeyChange: (key: string) => void
  onRegistrosChange: (
    updater:
      | TerminadosProduccionRegistro[]
      | ((prev: TerminadosProduccionRegistro[]) => TerminadosProduccionRegistro[])
  ) => void
}

const ProductionTerminadosPanel: React.FC<ProductionTerminadosPanelProps> = ({
  coloresPlanchas,
  paperRows,
  tiposPapel,
  margenRedondeo,
  clienteSuministraPapel,
  terminadosCatalog,
  quickAccessTerminados,
  registros,
  activeCorteRowKey,
  onActiveCorteRowKeyChange,
  onRegistrosChange,
}) => {
  const registroLabelId = useId()
  const planchaDetalleLabelId = useId()
  const terminadoSelectId = useId()
  const registrosLabelId = useId()
  const [pinnedCatalogIds, setPinnedCatalogIds] = useState<string[]>([])
  const [selectorError, setSelectorError] = useState<string | null>(null)
  const [draftByKey, setDraftByKey] = useState<Record<string, TerminadoProduccionLinea[]>>({})
  const [editingEntradaId, setEditingEntradaId] = useState<string | null>(null)

  const contexts = useMemo(
    () =>
      buildTerminadosCorteContexts(
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
      resolveCompletedTerminadosCorteRowKeys(
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

  const showTerminadosComposer = !isActivePlanchaCompleta || editingEntradaId !== null

  const asignadosRows = useMemo(
    () => buildTerminadosAsignadosRows(completableContexts, registros),
    [completableContexts, registros]
  )

  const showRegistrosSection = asignadosRows.length > 0

  const draftLineas = draftByKey[activeCorteRowKey] ?? []

  const assignedIds = useMemo(
    () => new Set(draftLineas.map(linea => linea.terminadoId)),
    [draftLineas]
  )

  const availableTerminados = useMemo(
    () => terminadosCatalog.filter(item => !assignedIds.has(item.id)),
    [terminadosCatalog, assignedIds]
  )

  const selectableTerminados = useMemo(
    () => availableTerminados.filter(item => !pinnedCatalogIds.includes(item.id)),
    [availableTerminados, pinnedCatalogIds]
  )

  const pinnedCatalogTerminados = useMemo(
    () =>
      pinnedCatalogIds
        .map(id => terminadosCatalog.find(item => item.id === id))
        .filter((item): item is CatalogRecord => Boolean(item)),
    [pinnedCatalogIds, terminadosCatalog]
  )

  const showQuickAccessSection =
    quickAccessTerminados.length > 0 || pinnedCatalogTerminados.length > 0

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

  const setDraftLineas = (lineas: TerminadoProduccionLinea[]) => {
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

  const handleAddTerminado = (terminado: CatalogRecord) => {
    if (!activeContext || !showTerminadosComposer) return
    if (assignedIds.has(terminado.id)) {
      setSelectorError(asignacionCopy.selector.duplicate)
      return
    }
    const linea = buildTerminadoProduccionLinea(
      terminado,
      activeContext.row,
      activeContext.tamanosBuenos
    )
    setDraftLineas([...draftLineas, linea])
    setSelectorError(null)
  }

  const handleQuickAccess = (terminado: CatalogRecord) => {
    handleAddTerminado(terminado)
  }

  const handleCatalogPick = (terminadoId: string) => {
    if (!terminadoId || !showTerminadosComposer) return
    if (assignedIds.has(terminadoId)) {
      setSelectorError(asignacionCopy.selector.duplicate)
      return
    }
    setPinnedCatalogIds(prev => (prev.includes(terminadoId) ? prev : [...prev, terminadoId]))
    setSelectorError(null)
  }

  const handleAddPinnedTerminado = (terminado: CatalogRecord) => {
    handleAddTerminado(terminado)
  }

  const handleRemoveLinea = (lineaId: string) => {
    setDraftLineas(draftLineas.filter(linea => linea.id !== lineaId))
  }

  const handleCreateRegistro = () => {
    if (!activeContext || draftLineas.length === 0) return
    if (isActivePlanchaCompleta && !editingEntradaId) return
    const entrada = createTerminadosProduccionEntrada(draftLineas, editingEntradaId ?? undefined)

    onRegistrosChange(prev => {
      const currentEntradas = resolveTerminadosEntradasForContext(prev, activeContext)
      const nextEntradas = editingEntradaId
        ? currentEntradas.map(item => (item.id === editingEntradaId ? entrada : item))
        : [...currentEntradas, entrada]
      return patchTerminadosRegistroForContext(prev, activeContext, nextEntradas)
    })

    clearDraft()
    setPinnedCatalogIds([])
  }

  const handleEditEntrada = (corteRowKey: string, entradaId: string) => {
    const context = completableContexts.find(item => item.corteRowKey === corteRowKey)
    if (!context) return
    const entrada = resolveTerminadosEntradasForContext(registros, context).find(
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
      const nextEntradas = resolveTerminadosEntradasForContext(prev, context).filter(
        item => item.id !== entradaId
      )
      return patchTerminadosRegistroForContext(prev, context, nextEntradas)
    })
    if (editingEntradaId === entradaId) {
      clearDraft()
    }
  }

  const handleCancelEdit = () => {
    clearDraft()
  }

  return (
    <div className="production-terminados-panel">
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
                  htmlFor="prod-terminados-plancha-select"
                >
                  {asignacionCopy.registro.label}
                </label>
                <TerminadosPlanchaSelect
                  id="prod-terminados-plancha-select"
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
                  <TerminadosPlanchaDetalleFields context={activeContext} />
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
              className="production-terminados-selector-section"
            >
            {terminadosCatalog.length === 0 ? (
              <p className="production-empty-hint">{asignacionCopy.selector.emptyCatalog}</p>
            ) : !showTerminadosComposer ? (
              <p className="production-diseno-cliente-hint">
                {asignacionCopy.selector.planchaCompletaHint}
              </p>
            ) : (
              <div className="production-terminados-selector">
                <div className="production-terminados-selector__row">
                  <label className="production-form-label" htmlFor={terminadoSelectId}>
                    {asignacionCopy.selector.allLabel}
                  </label>
                  <select
                    id={terminadoSelectId}
                    className="production-form-input production-form-select production-form-select--placeholder"
                    value=""
                    onChange={e => handleCatalogPick(e.target.value)}
                  >
                    <option value="">{asignacionCopy.selector.placeholder}</option>
                    {selectableTerminados.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {showQuickAccessSection ? (
                  <div className="production-terminados-quick-access">
                    <div className="production-terminados-quick-access__head">
                      <span className="production-terminados-quick-access__title">
                        {asignacionCopy.selector.quickAccess}
                      </span>
                      <span className="production-terminados-quick-access__hint">
                        {asignacionCopy.selector.quickAccessHint}
                      </span>
                    </div>
                    <div className="production-terminados-quick-access__chips">
                      {quickAccessTerminados.map(item => {
                        const disabled = assignedIds.has(item.id)
                        const fromSelect = pinnedCatalogIds.includes(item.id)

                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={[
                              'production-terminados-quick-access__chip',
                              fromSelect ? 'production-terminados-quick-access__chip--from-select' : '',
                              disabled ? 'production-terminados-quick-access__chip--disabled' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={disabled}
                            onClick={() =>
                              fromSelect ? handleAddPinnedTerminado(item) : handleQuickAccess(item)
                            }
                          >
                            <span className="production-terminados-quick-access__chip-icon" aria-hidden>
                              {fromSelect ? '◎' : '⚡'}
                            </span>
                            {item.name}
                          </button>
                        )
                      })}
                      {pinnedCatalogTerminados
                        .filter(
                          terminado => !quickAccessTerminados.some(item => item.id === terminado.id)
                        )
                        .map(terminado => (
                          <button
                            key={terminado.id}
                            type="button"
                            className={[
                              'production-terminados-quick-access__chip',
                              'production-terminados-quick-access__chip--from-select',
                              assignedIds.has(terminado.id)
                                ? 'production-terminados-quick-access__chip--disabled'
                                : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={assignedIds.has(terminado.id)}
                            onClick={() => handleAddPinnedTerminado(terminado)}
                          >
                            <span className="production-terminados-quick-access__chip-icon" aria-hidden>
                              ◎
                            </span>
                            {terminado.name}
                          </button>
                        ))}
                    </div>
                  </div>
                ) : null}

                {selectorError ? (
                  <p className="production-terminados-selector__error" role="alert">
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
            {!showTerminadosComposer ? (
              <p className="production-diseno-cliente-hint">
                {asignacionCopy.asignados.planchaCompletaHint}
              </p>
            ) : draftLineas.length === 0 ? (
              <p className="production-empty-hint">{asignacionCopy.asignados.empty}</p>
            ) : (
              <div className="production-terminados-asignados">
                <div className="production-terminados-asignados__table-wrap">
                  <table className="production-terminados-asignados__table">
                    <thead>
                      <tr>
                        <th>{asignacionCopy.asignados.columns.terminado}</th>
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
                          <td>{linea.terminadoNombre}</td>
                          <td>{despieceLabel}</td>
                          <td>{formatCatalogValorCmCuadradoNumber(linea.valorCmCuadrado)}</td>
                          <td>{linea.tamanosBuenos.toLocaleString('es-CO')}</td>
                          <td>{formatTerminadoPrecioCop(linea.costoMinimo)}</td>
                          <td>{formatTerminadoPrecioCop(linea.precioCalculado)}</td>
                          <td className="production-terminados-asignados__cobro">
                            <strong>{formatTerminadoPrecioCop(linea.precioCobro)}</strong>
                            {linea.precioCobro > linea.precioCalculado ? (
                              <span className="production-terminados-asignados__minimo">
                                {asignacionCopy.asignados.cobroMinimoHint}
                              </span>
                            ) : null}
                          </td>
                          <td className="production-terminados-asignados__actions-cell">
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
                <div className="production-terminados-asignados__subtotal">
                  <span>{asignacionCopy.asignados.subtotal}</span>
                  <strong>{formatTerminadoPrecioCop(draftSubtotal)}</strong>
                </div>
                <footer className="production-terminados-asignados__actions">
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
            <TerminadosRegistrosList
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
          <ProductionTerminadosCobroResumen
            contexts={completableContexts}
            registros={registros}
            activeCorteRowKey={activeCorteRowKey}
          />
        ) : null}
      </div>
    </div>
  )
}

export default ProductionTerminadosPanel
