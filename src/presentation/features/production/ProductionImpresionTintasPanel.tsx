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
import ImpresionTiroRetiroDiagram from './ImpresionTiroRetiroDiagram'
import ImpresionTintasVolteoSection from './ImpresionTintasVolteoSection'
import ImpresionLadoTintasFields from './ImpresionLadoTintasFields'
import ImpresionPlanchaDetalleFields from './ImpresionPlanchaDetalleFields'
import ImpresionPlanchaSelect from './ImpresionPlanchaSelect'
import ImpresionTintasEntradasList from './ImpresionTintasEntradasList'
import ProductionImpresionTintasResumen from './ProductionImpresionTintasResumen'
import { resolveTamanosBuenosParaMillaresForItem, resolveUsarReferenciaTamanosBuenosConVolteo } from './utils/coloresPlanchasUtils'
import {
  buildImpresionGrupoMillaresPreview,
  computeImpresionPrecioTintaBreakdown,
  countDistinctNonPantoneInLado,
  countDistinctPantoneInLado,
  resolveImpresionTarifaMillarPricing,
  type ImpresionPrecioTintaBreakdownInput,
} from './utils/impresionPrecioTintaUtils'
import {
  buildImpresionTintasTableRows,
  clampImpresionEntradaDraftSides,
  clampImpresionEntradaToPlanchaColores,
  createImpresionTiroRetiroEntrada,
  emptyImpresionLadoTintas,
  isImpresionEntradaDraftValid,
  resolveCompletedPlanchaIds,
  resolvePlanchaColoresMax,
} from './utils/impresionTintasUtils'
import { isImpresionConVolteo, canUseImpresionVolteo, sanitizeImpresionTipoBifronteForCavidades } from './constants/impresionTipoBifronte'
import {
  entradaUsesPantoneInks,
  entradaUsesPrimaryOrSecondaryInks,
  resolveTarifaColorBasicoMillar,
  resolveTarifaPantoneMillar,
} from './utils/impresionColorBasicoTarifaUtils'
import { getImpresionVolteoMillarRulesFromTarifa } from './utils/impresionVolteoTarifaUtils'
import { resolveTarifaMillarPrecioVolteoPorTipo } from './constants/impresionTarifaMillar'
import {
  emptyImpresionTintasDraftTarifa,
  patchImpresionTintasDraftTarifaVolteo,
  readImpresionTintasDraftTarifa,
  syncImpresionTintasDraftTarifa,
  type ImpresionTintasDraftTarifa,
} from './utils/impresionTintasDraftTarifa'

const tintasCopy = copy.tintas
const registroCopy = tintasCopy.registro
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
  const composerLabelId = useId()
  const registrosLabelId = useId()
  const skipResetOnPlanchaChangeRef = useRef(false)
  const skipReloadAfterSaveRef = useRef(false)
  const [draftTiro, setDraftTiro] = useState<ImpresionLadoTintas>(emptyImpresionLadoTintas())
  const [draftRetiro, setDraftRetiro] = useState<ImpresionLadoTintas>(emptyImpresionLadoTintas())
  const [draftTarifa, setDraftTarifa] = useState<ImpresionTintasDraftTarifa>(
    emptyImpresionTintasDraftTarifa()
  )
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
  const volteoPermitido = canUseImpresionVolteo(activePlancha?.numeroCavidades ?? 0)
  const draftTotal = draftTiro.cantidad + draftRetiro.cantidad
  const hasDraftContent =
    draftTiro.cantidad > 0 ||
    draftRetiro.cantidad > 0 ||
    draftTiro.tintas.some(t => t.trim()) ||
    draftRetiro.tintas.some(t => t.trim())
  const canSaveDraft = isImpresionEntradaDraftValid(draftTiro, draftRetiro, maxColoresPlancha)
  const showColorBasicoTarifa = entradaUsesPrimaryOrSecondaryInks(draftTiro, draftRetiro)
  const showPantoneTarifa = entradaUsesPantoneInks(draftTiro, draftRetiro)
  const tarifaColorBasico = resolveTarifaColorBasicoMillar(tarifasMillar)
  const tarifaPantone = resolveTarifaPantoneMillar(tarifasMillar)
  const volteoMillarRulesColorBasico = getImpresionVolteoMillarRulesFromTarifa(tarifaColorBasico)
  const volteoMillarRulesPantone = getImpresionVolteoMillarRulesFromTarifa(tarifaPantone)
  const defaultVolteoPrecioColorBasico = resolveTarifaMillarPrecioVolteoPorTipo(
    tarifaColorBasico,
    draftTarifa.tipoBifronteColorBasico
  )
  const defaultVolteoPrecioPantone = resolveTarifaMillarPrecioVolteoPorTipo(
    tarifaPantone,
    draftTarifa.tipoBifrontePantone
  )
  const showComposerForm = !hasActiveEntrada || Boolean(editingEntradaId)
  const showTiroRetiroDiagram = !hasActiveEntrada || Boolean(editingEntradaId)
  const usarReferenciaConVolteo = useMemo(
    () =>
      resolveUsarReferenciaTamanosBuenosConVolteo({
        conVolteoColorBasico: isImpresionConVolteo(draftTarifa.tipoBifronteColorBasico),
        conVolteoPantone: isImpresionConVolteo(draftTarifa.tipoBifrontePantone),
      }),
    [draftTarifa.tipoBifronteColorBasico, draftTarifa.tipoBifrontePantone]
  )

  const tamanosBuenosMillares = useMemo(
    () =>
      activePlancha
        ? resolveTamanosBuenosParaMillaresForItem(activePlancha, usarReferenciaConVolteo)
        : null,
    [activePlancha, usarReferenciaConVolteo]
  )

  const buildBreakdownInput = (): ImpresionPrecioTintaBreakdownInput => ({
    precioColorBasicoMillar: draftTarifa.precioColorBasicoMillar || tarifaColorBasico?.precio || 0,
    precioPantoneMillar: draftTarifa.precioPantoneMillar || tarifaPantone?.precio || 0,
    precioVolteoColorBasicoMillar:
      draftTarifa.precioVolteoColorBasicoMillar || defaultVolteoPrecioColorBasico,
    precioVolteoPantoneMillar:
      draftTarifa.precioVolteoPantoneMillar || defaultVolteoPrecioPantone,
    conVolteoColorBasico: isImpresionConVolteo(draftTarifa.tipoBifronteColorBasico),
    conVolteoPantone: isImpresionConVolteo(draftTarifa.tipoBifrontePantone),
    millarMinimoVentaColorBasico: tarifaColorBasico?.millarMinimoVenta,
    topeMinimoMillarColorBasico: tarifaColorBasico?.topeMinimoMillar,
    umbralDecimalMillarColorBasico: tarifaColorBasico?.umbralDecimalMillar,
    millarMinimoVentaPantone: tarifaPantone?.millarMinimoVenta,
    topeMinimoMillarPantone: tarifaPantone?.topeMinimoMillar,
    umbralDecimalMillarPantone: tarifaPantone?.umbralDecimalMillar,
    millarMinimoVentaVolteoColorBasico: volteoMillarRulesColorBasico.millarMinimoVenta,
    topeMinimoMillarVolteoColorBasico: volteoMillarRulesColorBasico.topeMinimoMillar,
    umbralDecimalMillarVolteoColorBasico: volteoMillarRulesColorBasico.umbralDecimalMillar,
    millarMinimoVentaVolteoPantone: volteoMillarRulesPantone.millarMinimoVenta,
    topeMinimoMillarVolteoPantone: volteoMillarRulesPantone.topeMinimoMillar,
    umbralDecimalMillarVolteoPantone: volteoMillarRulesPantone.umbralDecimalMillar,
  })

  const millaresPreviewColorBasico = useMemo(() => {
    if (!activePlancha || !showColorBasicoTarifa || !tamanosBuenosMillares) return null
    const tintasTiro = countDistinctNonPantoneInLado(draftTiro)
    const tintasRetiro = countDistinctNonPantoneInLado(draftRetiro)
    if (tintasTiro + tintasRetiro <= 0) return null
    const conVolteo = isImpresionConVolteo(draftTarifa.tipoBifronteColorBasico)
    const pricing = conVolteo
      ? resolveImpresionTarifaMillarPricing(
          draftTarifa.precioVolteoColorBasicoMillar || defaultVolteoPrecioColorBasico,
          volteoMillarRulesColorBasico.millarMinimoVenta,
          volteoMillarRulesColorBasico.topeMinimoMillar,
          volteoMillarRulesColorBasico.umbralDecimalMillar
        )
      : resolveImpresionTarifaMillarPricing(
          draftTarifa.precioColorBasicoMillar || tarifaColorBasico?.precio || 0,
          tarifaColorBasico?.millarMinimoVenta,
          tarifaColorBasico?.topeMinimoMillar,
          tarifaColorBasico?.umbralDecimalMillar
        )
    return buildImpresionGrupoMillaresPreview(
      'colorBasico',
      tintasTiro,
      tintasRetiro,
      tamanosBuenosMillares.value,
      pricing,
      tamanosBuenosMillares.source
    )
  }, [
    activePlancha,
    defaultVolteoPrecioColorBasico,
    draftRetiro,
    draftTarifa.precioColorBasicoMillar,
    draftTarifa.precioVolteoColorBasicoMillar,
    draftTarifa.tipoBifronteColorBasico,
    draftTiro,
    showColorBasicoTarifa,
    tarifaColorBasico,
    tamanosBuenosMillares,
    volteoMillarRulesColorBasico,
  ])

  const millaresPreviewPantone = useMemo(() => {
    if (!activePlancha || !showPantoneTarifa || !tamanosBuenosMillares) return null
    const tintasTiro = countDistinctPantoneInLado(draftTiro)
    const tintasRetiro = countDistinctPantoneInLado(draftRetiro)
    if (tintasTiro + tintasRetiro <= 0) return null
    const conVolteo = isImpresionConVolteo(draftTarifa.tipoBifrontePantone)
    const pricing = conVolteo
      ? resolveImpresionTarifaMillarPricing(
          draftTarifa.precioVolteoPantoneMillar || defaultVolteoPrecioPantone,
          volteoMillarRulesPantone.millarMinimoVenta,
          volteoMillarRulesPantone.topeMinimoMillar,
          volteoMillarRulesPantone.umbralDecimalMillar
        )
      : resolveImpresionTarifaMillarPricing(
          draftTarifa.precioPantoneMillar || tarifaPantone?.precio || 0,
          tarifaPantone?.millarMinimoVenta,
          tarifaPantone?.topeMinimoMillar,
          tarifaPantone?.umbralDecimalMillar
        )
    return buildImpresionGrupoMillaresPreview(
      'pantone',
      tintasTiro,
      tintasRetiro,
      tamanosBuenosMillares.value,
      pricing,
      tamanosBuenosMillares.source
    )
  }, [
    activePlancha,
    defaultVolteoPrecioPantone,
    draftRetiro,
    draftTarifa.precioPantoneMillar,
    draftTarifa.precioVolteoPantoneMillar,
    draftTarifa.tipoBifrontePantone,
    draftTiro,
    showPantoneTarifa,
    tarifaPantone,
    tamanosBuenosMillares,
    volteoMillarRulesPantone,
  ])

  const canCommitEntrada =
    canSaveDraft &&
    (!showColorBasicoTarifa || (millaresPreviewColorBasico?.millaresCalculados ?? 0) > 0) &&
    (!showPantoneTarifa || (millaresPreviewPantone?.millaresCalculados ?? 0) > 0)

  const showRegistrosSection = tableRows.length > 0

  const clearDraft = () => {
    setDraftTiro(emptyImpresionLadoTintas())
    setDraftRetiro(emptyImpresionLadoTintas())
    setDraftTarifa(emptyImpresionTintasDraftTarifa())
    setEditingEntradaId(null)
    setDraftError(null)
  }

  const loadDraftFromEntrada = (entrada: ImpresionTiroRetiroEntrada, registro: ImpresionTintasRegistro) => {
    setEditingEntradaId(entrada.id)
    setDraftTiro({
      cantidad: entrada.tiro.cantidad,
      tintas: [...entrada.tiro.tintas],
    })
    setDraftRetiro({
      cantidad: entrada.retiro.cantidad,
      tintas: [...entrada.retiro.tintas],
    })
    const tarifa = readImpresionTintasDraftTarifa(registro)
    const plancha =
      coloresPlanchas.find(item => item.id === registro.colorPlanchaId) ?? activePlancha
    const cavidades = plancha?.numeroCavidades ?? 0
    setDraftTarifa({
      ...tarifa,
      tipoBifronteColorBasico: sanitizeImpresionTipoBifronteForCavidades(
        tarifa.tipoBifronteColorBasico,
        cavidades
      ),
      tipoBifrontePantone: sanitizeImpresionTipoBifronteForCavidades(
        tarifa.tipoBifrontePantone,
        cavidades
      ),
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
    if (!hasDraftContent) return
    clearDraft()
  }, [activeColorPlanchaId, activeEntrada?.id])

  useEffect(() => {
    if (tarifasMillarLoading || !showComposerForm) return
    setDraftTarifa(prev => syncImpresionTintasDraftTarifa(prev, tarifasMillar, draftTiro, draftRetiro))
  }, [draftTiro, draftRetiro, showComposerForm, tarifasMillar, tarifasMillarLoading])

  useEffect(() => {
    if (volteoPermitido) return
    setDraftTarifa(prev => {
      const needsColorBasico = isImpresionConVolteo(prev.tipoBifronteColorBasico)
      const needsPantone = isImpresionConVolteo(prev.tipoBifrontePantone)
      if (!needsColorBasico && !needsPantone) return prev
      let next = prev
      if (needsColorBasico) {
        next = patchImpresionTintasDraftTarifaVolteo(
          next,
          tarifasMillar,
          'colorBasico',
          'diferente-plancha'
        )
      }
      if (needsPantone) {
        next = patchImpresionTintasDraftTarifaVolteo(next, tarifasMillar, 'pantone', 'diferente-plancha')
      }
      return next
    })
  }, [volteoPermitido, tarifasMillar])

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
    if (!canCommitEntrada) {
      setDraftError(entradasCopy.validationError(maxColoresPlancha))
      return
    }
    if (!tamanosBuenosMillares) return

    const precioTintaBreakdown = computeImpresionPrecioTintaBreakdown(
      draftTiro,
      draftRetiro,
      tamanosBuenosMillares.value,
      buildBreakdownInput(),
      { tamanosBuenosReferencia: tamanosBuenosMillares.tamanosBuenosReferencia }
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
      ...draftTarifa,
      entradas: [entrada],
    })
    skipReloadAfterSaveRef.current = true
    clearDraft()
  }

  const handleTipoBifronteColorBasicoChange = (tipoBifronte: ImpresionTipoBifronte | '') => {
    const tipo = sanitizeImpresionTipoBifronteForCavidades(
      (tipoBifronte || 'diferente-plancha') as ImpresionTipoBifronte,
      activePlancha?.numeroCavidades ?? 0
    )
    setDraftTarifa(prev =>
      patchImpresionTintasDraftTarifaVolteo(prev, tarifasMillar, 'colorBasico', tipo)
    )
    if (draftError) setDraftError(null)
  }

  const handleTipoBifrontePantoneChange = (tipoBifronte: ImpresionTipoBifronte | '') => {
    const tipo = sanitizeImpresionTipoBifronteForCavidades(
      (tipoBifronte || 'diferente-plancha') as ImpresionTipoBifronte,
      activePlancha?.numeroCavidades ?? 0
    )
    setDraftTarifa(prev =>
      patchImpresionTintasDraftTarifaVolteo(prev, tarifasMillar, 'pantone', tipo)
    )
    if (draftError) setDraftError(null)
  }

  const handlePrecioVolteoColorBasicoChange = (precio: number) => {
    setDraftTarifa(prev => ({ ...prev, precioVolteoColorBasicoMillar: precio }))
  }

  const handlePrecioVolteoPantoneChange = (precio: number) => {
    setDraftTarifa(prev => ({ ...prev, precioVolteoPantoneMillar: precio }))
  }

  const handlePrecioColorBasicoMillarChange = (precio: number) => {
    setDraftTarifa(prev => ({ ...prev, precioColorBasicoMillar: precio }))
  }

  const handlePrecioPantoneMillarChange = (precio: number) => {
    setDraftTarifa(prev => ({ ...prev, precioPantoneMillar: precio }))
  }

  const handleEditEntrada = (colorPlanchaId: string, entradaId: string) => {
    const registro = registros.find(item => item.colorPlanchaId === colorPlanchaId)
    const entrada = registro?.entradas.find(item => item.id === entradaId)
    if (!entrada || !registro) return

    if (colorPlanchaId !== activeColorPlanchaId) {
      skipResetOnPlanchaChangeRef.current = true
      onActiveColorPlanchaIdChange(colorPlanchaId)
    }

    loadDraftFromEntrada(entrada, registro)
  }

  const handleRemoveEntrada = (colorPlanchaId: string, entradaId: string) => {
    const registro = registros.find(item => item.colorPlanchaId === colorPlanchaId)
    if (!registro) return
    persistRegistro({
      ...registro,
      entradas: registro.entradas.filter(item => item.id !== entradaId),
      ...emptyImpresionTintasDraftTarifa(),
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
                <ImpresionPlanchaDetalleFields
                  cantidad={activePlancha.cantidad}
                  numeroCavidades={activePlancha.numeroCavidades}
                  tipoBifronteColorBasico={draftTarifa.tipoBifronteColorBasico}
                  tipoBifrontePantone={draftTarifa.tipoBifrontePantone}
                />
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

                    {!showComposerForm && hasActiveEntrada && activeEntrada ? (
                      <div className="production-impresion-tintas-draft__body">
                        <p className="production-diseno-cliente-hint">{entradasCopy.planchaCompletaHint}</p>
                      </div>
                    ) : null}

                    {showComposerForm ? (
                      <div className="production-plancha-draft__body production-impresion-tintas-draft__body">
                        <p className="production-plancha-draft__intro">
                          {editingEntradaId ? entradasCopy.editTitle : entradasCopy.addTitle}.{' '}
                          {editingEntradaId ? entradasCopy.editHint : entradasCopy.addHint}
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
                          <div className="production-impresion-tintas-tarifas-zone">
                            <ImpresionTintasVolteoSection
                            hasColorBasico={showColorBasicoTarifa}
                            hasPantone={showPantoneTarifa}
                            tipoBifronteColorBasico={draftTarifa.tipoBifronteColorBasico}
                            tipoBifrontePantone={draftTarifa.tipoBifrontePantone}
                            tarifaColorBasico={tarifaColorBasico}
                            tarifaPantone={tarifaPantone}
                            precioColorBasicoMillar={draftTarifa.precioColorBasicoMillar}
                            millarMinimoVentaColorBasico={tarifaColorBasico?.millarMinimoVenta}
                            topeMinimoMillarColorBasico={tarifaColorBasico?.topeMinimoMillar}
                            umbralDecimalMillarColorBasico={tarifaColorBasico?.umbralDecimalMillar}
                            precioPantoneMillar={draftTarifa.precioPantoneMillar}
                            millarMinimoVentaPantone={tarifaPantone?.millarMinimoVenta}
                            topeMinimoMillarPantone={tarifaPantone?.topeMinimoMillar}
                            umbralDecimalMillarPantone={tarifaPantone?.umbralDecimalMillar}
                            precioVolteoColorBasicoMillar={draftTarifa.precioVolteoColorBasicoMillar}
                            millarMinimoVentaVolteoColorBasico={
                              volteoMillarRulesColorBasico.millarMinimoVenta
                            }
                            topeMinimoMillarVolteoColorBasico={
                              volteoMillarRulesColorBasico.topeMinimoMillar
                            }
                            umbralDecimalMillarVolteoColorBasico={
                              volteoMillarRulesColorBasico.umbralDecimalMillar
                            }
                            precioVolteoPantoneMillar={draftTarifa.precioVolteoPantoneMillar}
                            millarMinimoVentaVolteoPantone={volteoMillarRulesPantone.millarMinimoVenta}
                            topeMinimoMillarVolteoPantone={volteoMillarRulesPantone.topeMinimoMillar}
                            umbralDecimalMillarVolteoPantone={
                              volteoMillarRulesPantone.umbralDecimalMillar
                            }
                            tarifasMillarLoading={tarifasMillarLoading}
                            millaresPreviewColorBasico={millaresPreviewColorBasico}
                            millaresPreviewPantone={millaresPreviewPantone}
                            conVolteoPermitido={volteoPermitido}
                            onTipoBifronteColorBasicoChange={handleTipoBifronteColorBasicoChange}
                            onTipoBifrontePantoneChange={handleTipoBifrontePantoneChange}
                            onPrecioColorBasicoMillarChange={handlePrecioColorBasicoMillarChange}
                            onPrecioPantoneMillarChange={handlePrecioPantoneMillarChange}
                            onPrecioVolteoColorBasicoMillarChange={handlePrecioVolteoColorBasicoChange}
                            onPrecioVolteoPantoneMillarChange={handlePrecioVolteoPantoneChange}
                          />
                          </div>
                        ) : null}

                        {showTiroRetiroDiagram ? (
                          <div className="production-impresion-tintas-diagram-zone">
                            <ImpresionTiroRetiroDiagram
                              tiro={draftTiro}
                              retiro={draftRetiro}
                              tipoBifronteColorBasico={draftTarifa.tipoBifronteColorBasico}
                              tipoBifrontePantone={draftTarifa.tipoBifrontePantone}
                              showColorBasico={showColorBasicoTarifa}
                              showPantone={showPantoneTarifa}
                              showVolteoChips={!(showColorBasicoTarifa || showPantoneTarifa)}
                            />
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
                            disabled={!canCommitEntrada}
                            onClick={handleSaveDraft}
                          >
                            {editingEntradaId ? entradasCopy.saveEdit : entradasCopy.addButton}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {showRegistrosSection ? (
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
              ) : null}
            </div>
          )}
        </ProductionWorkspaceSection>

        {coloresPlanchas.length > 0 ? (
          <ProductionImpresionTintasResumen
            coloresPlanchas={coloresPlanchas}
            registros={registros}
          />
        ) : null}
      </div>
    </>
  )
}

export default ProductionImpresionTintasPanel
