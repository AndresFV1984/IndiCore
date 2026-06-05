import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import type {
  ImpresionLadoTintas,
  ImpresionTintasRegistro,
  ImpresionTipoBifronte,
  ImpresionTiroRetiroEntrada,
} from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import { useTarifaMillarHook } from '../../hooks/useTarifaMillar'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import ImpresionTintasTarifaFields from './ImpresionTintasTarifaFields'
import ImpresionLadoTintasFields from './ImpresionLadoTintasFields'
import ImpresionPlanchaDetalleFields from './ImpresionPlanchaDetalleFields'
import ImpresionPlanchaSelect from './ImpresionPlanchaSelect'
import ImpresionTintasEntradasList from './ImpresionTintasEntradasList'
import ProductionImpresionTintasResumen from './ProductionImpresionTintasResumen'
import { resolveTamanosBuenosForItem } from './utils/coloresPlanchasUtils'
import ImpresionPrecioTintaBreakdownDisplay from './ImpresionPrecioTintaBreakdown'
import { computeImpresionPrecioTintaBreakdown } from './utils/impresionPrecioTintaUtils'
import {
  buildImpresionTintasTableRows,
  clampImpresionEntradaDraftSides,
  clampImpresionEntradaToPlanchaColores,
  createImpresionTiroRetiroEntrada,
  emptyImpresionLadoTintas,
  isImpresionEntradaDraftValid,
  isImpresionPlanchaCompleta,
  resolveCompletedPlanchaIds,
  resolvePlanchaColoresMax,
} from './utils/impresionTintasUtils'
import { isImpresionConVolteo } from './constants/impresionTipoBifronte'
import {
  resolveTarifaColorBasicoMillar,
  resolveTarifaPantoneMillar,
  resolveTintasMillarPatchForEntrada,
  shouldApplyColorBasicoTarifa,
  shouldApplyPantoneTarifa,
} from './utils/impresionColorBasicoTarifaUtils'
import {
  resolvePrecioVolteoMillarPatch,
  resolveTarifaVolteoMillar,
} from './utils/impresionVolteoTarifaUtils'

const tintasCopy = copy.tintas
const registroCopy = tintasCopy.registro
const planchaDetalleCopy = tintasCopy.planchaDetalle
const ladoCopy = tintasCopy.lado
const entradasCopy = tintasCopy.entradas

interface ProductionImpresionTintasPanelProps {
  coloresPlanchas: DisenoColorPlanchaItem[]
  registros: ImpresionTintasRegistro[]
  activeColorPlanchaId: string
  onActiveColorPlanchaIdChange: (id: string) => void
  onRegistroChange: (registro: ImpresionTintasRegistro) => void
}

const ProductionImpresionTintasPanel: React.FC<ProductionImpresionTintasPanelProps> = ({
  coloresPlanchas,
  registros,
  activeColorPlanchaId,
  onActiveColorPlanchaIdChange,
  onRegistroChange,
}) => {
  const planchaLabelId = useId()
  const planchaDetalleLabelId = useId()
  const composerLabelId = useId()
  const registrosLabelId = useId()
  const skipResetOnPlanchaChangeRef = useRef(false)
  const skipReloadAfterSaveRef = useRef(false)
  const [draftTiro, setDraftTiro] = useState<ImpresionLadoTintas>(emptyImpresionLadoTintas())
  const [draftRetiro, setDraftRetiro] = useState<ImpresionLadoTintas>(emptyImpresionLadoTintas())
  const [editingEntradaId, setEditingEntradaId] = useState<string | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)
  const { items: tarifasMillar, loading: tarifasMillarLoading } = useTarifaMillarHook()

  const completedPlanchaIds = useMemo(() => resolveCompletedPlanchaIds(registros), [registros])
  const tableRows = useMemo(
    () => buildImpresionTintasTableRows(coloresPlanchas, registros),
    [coloresPlanchas, registros]
  )

  const activeRegistro = useMemo(
    () => registros.find(item => item.colorPlanchaId === activeColorPlanchaId) ?? null,
    [registros, activeColorPlanchaId]
  )

  const activePlancha = useMemo(
    () => coloresPlanchas.find(item => item.id === activeColorPlanchaId) ?? null,
    [coloresPlanchas, activeColorPlanchaId]
  )

  const activeEntrada = activeRegistro?.entradas[0] ?? null
  const hasActiveEntrada = Boolean(activeEntrada)

  const maxColoresPlancha = activePlancha ? resolvePlanchaColoresMax(activePlancha) : 0
  const draftTotal = draftTiro.cantidad + draftRetiro.cantidad
  const canSaveDraft = isImpresionEntradaDraftValid(draftTiro, draftRetiro, maxColoresPlancha)
  const showColorBasicoTarifa = shouldApplyColorBasicoTarifa(
    draftTiro,
    draftRetiro,
    maxColoresPlancha
  )
  const showPantoneTarifa = shouldApplyPantoneTarifa(draftTiro, draftRetiro, maxColoresPlancha)
  const tarifaColorBasico = resolveTarifaColorBasicoMillar(tarifasMillar)
  const tarifaPantone = resolveTarifaPantoneMillar(tarifasMillar)
  const tipoBifronte = activeRegistro?.tipoBifronte ?? ''
  const conVolteo = isImpresionConVolteo(tipoBifronte)
  const tarifaVolteo = conVolteo ? resolveTarifaVolteoMillar(tarifasMillar, tipoBifronte) : null
  const draftPrecioTinta = useMemo(() => {
    if (!activePlancha || !canSaveDraft) {
      return {
        cantidadTintasColorBasico: 0,
        cantidadTintasPantone: 0,
        millaresColorBasico: 0,
        millaresPantone: 0,
        millaresTotal: 0,
        colorBasico: 0,
        pantone: 0,
        total: 0,
        millaresVolteo: 0,
        volteo: 0,
        grandTotal: 0,
      }
    }
    const precioColorBasico =
      tarifaColorBasico?.precio ?? activeRegistro?.precioColorBasicoMillar ?? 0
    const precioPantone =
      tarifaPantone?.precio ?? activeRegistro?.precioPantoneMillar ?? 0
    const precioVolteo =
      conVolteo ? (tarifaVolteo?.precio ?? activeRegistro?.precioVolteoMillar ?? 0) : 0
    return computeImpresionPrecioTintaBreakdown(
      draftTiro,
      draftRetiro,
      resolveTamanosBuenosForItem(activePlancha),
      precioColorBasico,
      precioPantone,
      precioVolteo
    )
  }, [
    activePlancha,
    activeRegistro?.precioColorBasicoMillar,
    activeRegistro?.precioPantoneMillar,
    activeRegistro?.precioVolteoMillar,
    canSaveDraft,
    conVolteo,
    draftRetiro,
    draftTiro,
    tarifaColorBasico,
    tarifaPantone,
    tarifaVolteo,
  ])

  const clearDraft = () => {
    setDraftTiro(emptyImpresionLadoTintas())
    setDraftRetiro(emptyImpresionLadoTintas())
    setEditingEntradaId(null)
    setDraftError(null)
  }

  const loadDraftFromEntrada = (entrada: ImpresionTiroRetiroEntrada) => {
    setEditingEntradaId(entrada.id)
    setDraftTiro({
      cantidad: entrada.tiro.cantidad,
      tintas: [...entrada.tiro.tintas],
    })
    setDraftRetiro({
      cantidad: entrada.retiro.cantidad,
      tintas: [...entrada.retiro.tintas],
    })
    setDraftError(null)
  }

  useEffect(() => {
    if (skipResetOnPlanchaChangeRef.current) {
      skipResetOnPlanchaChangeRef.current = false
      return
    }
    if (skipReloadAfterSaveRef.current) {
      skipReloadAfterSaveRef.current = false
      return
    }
    clearDraft()
  }, [activeColorPlanchaId, activeEntrada?.id])

  const persistRegistro = (registro: ImpresionTintasRegistro) => {
    onRegistroChange(registro)
  }

  const applyDraftSides = (tiro: ImpresionLadoTintas, retiro: ImpresionLadoTintas) => {
    const clamped = clampImpresionEntradaDraftSides(tiro, retiro, maxColoresPlancha)
    setDraftTiro(clamped.tiro)
    setDraftRetiro(clamped.retiro)
  }

  const handleSaveDraft = () => {
    if (!activeRegistro || !activePlancha) return
    if (!canSaveDraft) {
      setDraftError(entradasCopy.validationError(maxColoresPlancha))
      return
    }
    const tamanosBuenos = resolveTamanosBuenosForItem(activePlancha)
    const precioColorBasico =
      tarifaColorBasico?.precio ?? activeRegistro.precioColorBasicoMillar ?? 0
    const precioPantone =
      tarifaPantone?.precio ?? activeRegistro.precioPantoneMillar ?? 0
    const precioVolteo =
      conVolteo ? (tarifaVolteo?.precio ?? activeRegistro.precioVolteoMillar ?? 0) : 0
    const precioTintaBreakdown = computeImpresionPrecioTintaBreakdown(
      draftTiro,
      draftRetiro,
      tamanosBuenos,
      precioColorBasico,
      precioPantone,
      precioVolteo
    )
    const entrada = clampImpresionEntradaToPlanchaColores(
      {
        ...createImpresionTiroRetiroEntrada(
          draftTiro,
          draftRetiro,
          editingEntradaId ?? activeEntrada?.id
        ),
        cantidadTintasColorBasico: precioTintaBreakdown.cantidadTintasColorBasico,
        cantidadTintasPantone: precioTintaBreakdown.cantidadTintasPantone,
        millaresColorBasico: precioTintaBreakdown.millaresColorBasico,
        millaresPantone: precioTintaBreakdown.millaresPantone,
        precioTintaColorBasico: precioTintaBreakdown.colorBasico,
        precioTintaPantone: precioTintaBreakdown.pantone,
        precioTinta: precioTintaBreakdown.total,
        millaresVolteo: precioTintaBreakdown.millaresVolteo,
        precioVolteo: precioTintaBreakdown.volteo,
      },
      maxColoresPlancha
    )

    persistRegistro({
      ...activeRegistro,
      entradas: [entrada],
    })
    skipReloadAfterSaveRef.current = true
    clearDraft()
  }

  const handleTipoBifronteChange = (tipoBifronte: ImpresionTipoBifronte | '') => {
    if (!activeRegistro) return
    persistRegistro({
      ...activeRegistro,
      tipoBifronte,
      ...resolvePrecioVolteoMillarPatch(tarifasMillar, tipoBifronte),
    })
    if (draftError) setDraftError(null)
  }

  useEffect(() => {
    if (!activeRegistro || tarifasMillarLoading) return
    const patch = resolveTintasMillarPatchForEntrada(
      tarifasMillar,
      draftTiro,
      draftRetiro,
      maxColoresPlancha
    )
    if (
      activeRegistro.tarifaColorBasicoMillarId === patch.tarifaColorBasicoMillarId &&
      activeRegistro.precioColorBasicoMillar === patch.precioColorBasicoMillar &&
      activeRegistro.tarifaPantoneMillarId === patch.tarifaPantoneMillarId &&
      activeRegistro.precioPantoneMillar === patch.precioPantoneMillar
    ) {
      return
    }
    onRegistroChange({
      ...activeRegistro,
      ...patch,
    })
  }, [
    activeRegistro,
    draftTiro,
    draftRetiro,
    maxColoresPlancha,
    tarifasMillar,
    tarifasMillarLoading,
    onRegistroChange,
  ])

  useEffect(() => {
    if (!activeRegistro || tarifasMillarLoading || tarifasMillar.length === 0) return
    const tipoBifronte = activeRegistro.tipoBifronte ?? ''
    if (!isImpresionConVolteo(tipoBifronte)) return
    const tarifa = resolveTarifaVolteoMillar(tarifasMillar, tipoBifronte)
    if (!tarifa) return
    if (
      activeRegistro.tarifaVolteoMillarId === tarifa.id &&
      activeRegistro.precioVolteoMillar === tarifa.precio
    ) {
      return
    }
    onRegistroChange({
      ...activeRegistro,
      tarifaVolteoMillarId: tarifa.id,
      precioVolteoMillar: tarifa.precio,
    })
  }, [activeRegistro, tarifasMillar, tarifasMillarLoading, onRegistroChange])

  const handleEditEntrada = (colorPlanchaId: string, entradaId: string) => {
    const registro = registros.find(item => item.colorPlanchaId === colorPlanchaId)
    const entrada = registro?.entradas.find(item => item.id === entradaId)
    if (!entrada) return

    if (colorPlanchaId !== activeColorPlanchaId) {
      skipResetOnPlanchaChangeRef.current = true
      onActiveColorPlanchaIdChange(colorPlanchaId)
    }

    loadDraftFromEntrada(entrada)
  }

  const handleRemoveEntrada = (colorPlanchaId: string, entradaId: string) => {
    const registro = registros.find(item => item.colorPlanchaId === colorPlanchaId)
    if (!registro) return
    persistRegistro({
      ...registro,
      entradas: registro.entradas.filter(item => item.id !== entradaId),
    })
    if (editingEntradaId === entradaId) {
      clearDraft()
    }
  }

  const handleCancelEdit = () => {
    clearDraft()
  }

  return (
    <>
      <p className="production-workspace-panel-desc">{tintasCopy.panelDesc}</p>

      <div className="production-ws-sections-stack">
        <ProductionWorkspaceSection
          tag={registroCopy.tag}
          title={registroCopy.title}
          tone={0}
        >
          {coloresPlanchas.length === 0 ? (
            <p className="production-diseno-cliente-hint">{registroCopy.emptySinRegistros}</p>
          ) : (
            <div className="production-plancha-workspace production-impresion-tintas-workspace">
              <section
                className="production-plancha-workspace__picker-zone production-plancha-workspace__picker-zone--selected"
                aria-labelledby={planchaLabelId}
              >
                <label
                  className="production-form-label"
                  id={planchaLabelId}
                  htmlFor="prod-impresion-plancha-select"
                >
                  {registroCopy.label}
                </label>
                <ImpresionPlanchaSelect
                  id="prod-impresion-plancha-select"
                  labelId={planchaLabelId}
                  coloresPlanchas={coloresPlanchas}
                  value={activeColorPlanchaId}
                  completedPlanchaIds={completedPlanchaIds}
                  onChange={onActiveColorPlanchaIdChange}
                  placeholder={registroCopy.placeholder}
                />
                <span className="production-plancha-workspace__hint">{registroCopy.hint}</span>
              </section>

              {activePlancha && activeRegistro ? (
                <section
                  className="production-plancha-workspace__picker-zone production-impresion-plancha-detalle-zone"
                  aria-labelledby={planchaDetalleLabelId}
                >
                  <span
                    className="production-plancha-workspace__zone-label"
                    id={planchaDetalleLabelId}
                  >
                    {planchaDetalleCopy.zoneLabel}
                  </span>
                  <ImpresionPlanchaDetalleFields
                    cantidad={activePlancha.cantidad}
                    numeroCavidades={activePlancha.numeroCavidades}
                    tipoBifronte={activeRegistro.tipoBifronte ?? ''}
                    precioVolteoMillar={activeRegistro.precioVolteoMillar}
                    tarifasMillar={tarifasMillar}
                    tarifasMillarLoading={tarifasMillarLoading}
                    onTipoBifronteChange={handleTipoBifronteChange}
                  />
                </section>
              ) : null}

              {activePlancha && activeRegistro ? (
                <section
                  className="production-plancha-workspace__composer"
                  aria-labelledby={composerLabelId}
                >
                  <div className="production-plancha-draft production-impresion-tintas-draft">
                    <header className="production-plancha-draft__head">
                      <span className="production-plancha-workspace__zone-label" id={composerLabelId}>
                        {entradasCopy.pasoTiroRetiro}
                      </span>
                    </header>

                    <div className="production-plancha-draft__body production-impresion-tintas-draft__body">
                      <p className="production-plancha-draft__intro">
                        {editingEntradaId || hasActiveEntrada
                          ? entradasCopy.editTitle
                          : entradasCopy.addTitle}
                        .{' '}
                        {editingEntradaId || hasActiveEntrada
                          ? entradasCopy.editHint
                          : entradasCopy.addHint}
                      </p>

                      {draftError ? (
                        <p className="production-impresion-tintas-composer__error" role="alert">
                          {draftError}
                        </p>
                      ) : null}

                      <p
                        className={[
                          'production-impresion-tintas-registro__limite',
                          draftTotal > maxColoresPlancha
                            ? 'production-impresion-tintas-registro__limite--excedido'
                            : draftTotal < maxColoresPlancha
                              ? 'production-impresion-tintas-registro__limite--incompleto'
                              : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        role="status"
                      >
                        {registroCopy.limiteColores(draftTotal, maxColoresPlancha)}
                      </p>

                      <div className="production-impresion-tintas-lados">
                        <ImpresionLadoTintasFields
                          idPrefix="prod-impresion-tiro"
                          title={ladoCopy.tiro}
                          hint={ladoCopy.tiroHint}
                          lado={draftTiro}
                          maxColoresPlancha={maxColoresPlancha}
                          otherLadoCantidad={draftRetiro.cantidad}
                          onChange={tiro => {
                            applyDraftSides(tiro, draftRetiro)
                            if (draftError) setDraftError(null)
                          }}
                        />
                        <ImpresionLadoTintasFields
                          idPrefix="prod-impresion-retiro"
                          title={ladoCopy.retiro}
                          hint={ladoCopy.retiroHint}
                          lado={draftRetiro}
                          maxColoresPlancha={maxColoresPlancha}
                          otherLadoCantidad={draftTiro.cantidad}
                          onChange={retiro => {
                            applyDraftSides(draftTiro, retiro)
                            if (draftError) setDraftError(null)
                          }}
                        />
                      </div>

                      {showColorBasicoTarifa || showPantoneTarifa ? (
                        <div className="production-impresion-tintas-tarifas">
                          {showColorBasicoTarifa ? (
                            <ImpresionTintasTarifaFields
                              variant="colorBasico"
                              tarifa={tarifaColorBasico}
                              precioMillar={activeRegistro.precioColorBasicoMillar}
                              tarifasMillarLoading={tarifasMillarLoading}
                            />
                          ) : null}
                          {showPantoneTarifa ? (
                            <ImpresionTintasTarifaFields
                              variant="pantone"
                              tarifa={tarifaPantone}
                              precioMillar={activeRegistro.precioPantoneMillar}
                              tarifasMillarLoading={tarifasMillarLoading}
                            />
                          ) : null}
                        </div>
                      ) : null}

                      {canSaveDraft ? (
                        <div className="production-impresion-precio-tinta-preview">
                          <span className="production-form-label">
                            {entradasCopy.calcularMillaresLabel}
                          </span>
                          <ImpresionPrecioTintaBreakdownDisplay breakdown={draftPrecioTinta} />
                          <span className="production-plancha-draft__field-hint">
                            {entradasCopy.millaresFormula}
                          </span>
                          <span className="production-plancha-draft__field-hint">
                            {entradasCopy.millaresFormulaColorBasico}
                          </span>
                          <span className="production-plancha-draft__field-hint">
                            {entradasCopy.millaresFormulaPantone}
                          </span>
                          {conVolteo ? (
                            <span className="production-plancha-draft__field-hint">
                              {entradasCopy.millaresFormulaVolteo}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="production-plancha-draft__actions production-impresion-tintas-draft__actions">
                        {editingEntradaId ? (
                          <button
                            type="button"
                            className="production-plancha-draft__btn production-plancha-draft__btn--ghost"
                            onClick={handleCancelEdit}
                          >
                            {entradasCopy.cancelEdit}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="production-plancha-draft__btn production-plancha-draft__btn--primary"
                          disabled={!canSaveDraft}
                          onClick={handleSaveDraft}
                        >
                          {editingEntradaId || hasActiveEntrada
                            ? entradasCopy.saveEdit
                            : entradasCopy.addButton}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              <section
                className="production-plancha-workspace__list"
                aria-labelledby={registrosLabelId}
              >
                <span className="production-plancha-workspace__zone-label" id={registrosLabelId}>
                  {entradasCopy.pasoRegistros}
                </span>
                <ImpresionTintasEntradasList
                  rows={tableRows}
                  activeColorPlanchaId={activeColorPlanchaId}
                  editingEntradaId={editingEntradaId}
                  onEdit={handleEditEntrada}
                  onRemove={handleRemoveEntrada}
                />
              </section>
            </div>
          )}
        </ProductionWorkspaceSection>

        {coloresPlanchas.length > 0 ? (
          <ProductionImpresionTintasResumen
            coloresPlanchas={coloresPlanchas}
            registros={registros}
            activeColorPlanchaId={activeColorPlanchaId}
            onSelectPlancha={onActiveColorPlanchaIdChange}
          />
        ) : null}
      </div>
    </>
  )
}

export default ProductionImpresionTintasPanel
