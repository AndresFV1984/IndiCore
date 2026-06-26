import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import type {
  ImpresionLadoTintas,
  ImpresionTintasRegistro,
  ImpresionTipoBifronte,
  ImpresionTiroRetiroEntrada,
} from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import { useTarifaMillarHook } from '../../hooks/useTarifaMillar'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import ImpresionTiroRetiroDiagram from './ImpresionTiroRetiroDiagram'
import ImpresionTintasVolteoSection from './ImpresionTintasVolteoSection'
import ImpresionLadoTintasFields, {
  type ImpresionLadoTintasChangeMeta,
} from './ImpresionLadoTintasFields'
import ImpresionPlanchaDetalleFields from './ImpresionPlanchaDetalleFields'
import ImpresionPruebaContratoSection from './ImpresionPruebaContratoSection'
import ProductionPreprensaRegistroPickerSection from './ProductionPreprensaRegistroPickerSection'
import ImpresionTintasEntradasList from './ImpresionTintasEntradasList'
import ProductionImpresionTintasResumen from './ProductionImpresionTintasResumen'
import {
  resolveTamanosBuenosParaMillaresColorBasicoForItem,
  resolveTamanosBuenosParaMillaresPantoneForItem,
} from './utils/coloresPlanchasUtils'
import {
  buildImpresionGrupoMillaresPreview,
  computeImpresionPrecioTintaBreakdown,
  countDistinctNonPantoneInLado,
  countPantoneTintasInLado,
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
  replicateNewRetiroSlotsFromTiro,
  replicateTiroSlotInkToRetiro,
  replicateTiroTintasChangesToRetiro,
} from './utils/impresionTintasUtils'
import { isImpresionConVolteo, canUseImpresionVolteoForGrupo, resolveImpresionVolteoBloqueadoHint, sanitizeImpresionTipoBifronteForVolteo } from './constants/impresionTipoBifronte'
import {
  entradaUsesPantoneInks,
  entradaUsesPrimaryOrSecondaryInks,
  resolveTarifaColorBasicoMillar,
  resolveTarifaPantoneMillar,
  shouldApplyColorBasicoTarifa,
  shouldApplyPantoneTarifa,
} from './utils/impresionColorBasicoTarifaUtils'
import { getImpresionVolteoMillarRulesFromTarifa } from './utils/impresionVolteoTarifaUtils'
import { resolveTarifaMillarPrecioConVolteoDefault } from './constants/impresionTarifaMillar'
import {
  emptyImpresionTintasDraftTarifa,
  patchImpresionTintasDraftTarifaVolteo,
  readImpresionTintasDraftTarifa,
  syncImpresionTintasDraftTarifa,
  type ImpresionTintasDraftTarifa,
} from './utils/impresionTintasDraftTarifa'
import {
  resolveClienteSuministraPruebaSherpa,
} from './utils/impresionPruebaSherpaUtils'
import {
  resolveClienteSuministraTintaPantone,
  resolvePrecioCobroTintaPantone,
} from './utils/impresionTintaPantoneSuministroUtils'

const tintasCopy = copy.tintas
const registroCopy = tintasCopy.registro
const ladoCopy = tintasCopy.lado
const entradasCopy = tintasCopy.entradas
const volteoCopy = tintasCopy.tintasVolteo

const volteoBloqueadoCopy = {
  cavidadesPares: volteoCopy.volteoRequiereCavidadesPares,
  tiroRetiroColorBasico: volteoCopy.volteoRequiereTiroRetiroColorBasico,
  tiroRetiroPantone: volteoCopy.volteoRequiereTiroRetiroPantone,
}

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
  const composerLabelId = useId()
  const registrosLabelId = useId()
  const skipResetOnPlanchaChangeRef = useRef(false)
  const skipReloadAfterSaveRef = useRef(false)
  const draftSidesRef = useRef({
    tiro: emptyImpresionLadoTintas(),
    retiro: emptyImpresionLadoTintas(),
  })
  const [draftTiro, setDraftTiro] = useState<ImpresionLadoTintas>(emptyImpresionLadoTintas())
  const [draftRetiro, setDraftRetiro] = useState<ImpresionLadoTintas>(emptyImpresionLadoTintas())
  const [draftTarifa, setDraftTarifa] = useState<ImpresionTintasDraftTarifa>(
    emptyImpresionTintasDraftTarifa()
  )
  const [draftClienteSuministraTintaPantone, setDraftClienteSuministraTintaPantone] =
    useState<'si' | 'no'>('si')
  const [draftPrecioCobroTintaPantone, setDraftPrecioCobroTintaPantone] = useState(0)
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
  const numeroCavidades = activePlancha?.numeroCavidades ?? 0
  const volteoPermitidoColorBasico = canUseImpresionVolteoForGrupo(
    'colorBasico',
    numeroCavidades,
    draftTiro,
    draftRetiro
  )
  const volteoPermitidoPantone = canUseImpresionVolteoForGrupo(
    'pantone',
    numeroCavidades,
    draftTiro,
    draftRetiro
  )
  const volteoBloqueadoHintColorBasico = resolveImpresionVolteoBloqueadoHint(
    'colorBasico',
    numeroCavidades,
    draftTiro,
    draftRetiro,
    volteoBloqueadoCopy
  )
  const volteoBloqueadoHintPantone = resolveImpresionVolteoBloqueadoHint(
    'pantone',
    numeroCavidades,
    draftTiro,
    draftRetiro,
    volteoBloqueadoCopy
  )
  const draftTotal = draftTiro.cantidad + draftRetiro.cantidad
  const hasDraftContent =
    draftTiro.cantidad > 0 ||
    draftRetiro.cantidad > 0 ||
    draftTiro.tintas.some(t => t.trim()) ||
    draftRetiro.tintas.some(t => t.trim())
  const canSaveDraft = isImpresionEntradaDraftValid(draftTiro, draftRetiro, maxColoresPlancha)
  const showColorBasicoTarifa = shouldApplyColorBasicoTarifa(
    draftTiro,
    draftRetiro,
    maxColoresPlancha
  )
  const showPantoneTarifa = shouldApplyPantoneTarifa(draftTiro, draftRetiro, maxColoresPlancha)
  const hasPartialInkSelection =
    (entradaUsesPrimaryOrSecondaryInks(draftTiro, draftRetiro) ||
      entradaUsesPantoneInks(draftTiro, draftRetiro)) &&
    !canSaveDraft
  const tarifaColorBasico = resolveTarifaColorBasicoMillar(tarifasMillar)
  const tarifaPantone = resolveTarifaPantoneMillar(tarifasMillar)
  const volteoMillarRulesColorBasico = getImpresionVolteoMillarRulesFromTarifa(tarifaColorBasico)
  const volteoMillarRulesPantone = getImpresionVolteoMillarRulesFromTarifa(tarifaPantone)
  const defaultVolteoPrecioColorBasico = resolveTarifaMillarPrecioConVolteoDefault(tarifaColorBasico)
  const defaultVolteoPrecioPantone = resolveTarifaMillarPrecioConVolteoDefault(tarifaPantone)
  const showComposerForm = !hasActiveEntrada || Boolean(editingEntradaId)
  const isDraftColorCountComplete =
    maxColoresPlancha > 0 && draftTotal === maxColoresPlancha
  const showTiroRetiroDiagram = showComposerForm && isDraftColorCountComplete
  const conVolteoColorBasico = isImpresionConVolteo(draftTarifa.tipoBifronteColorBasico)
  const conVolteoPantone = isImpresionConVolteo(draftTarifa.tipoBifrontePantone)

  const tamanosBuenosMillaresColorBasico = useMemo(
    () =>
      activePlancha
        ? resolveTamanosBuenosParaMillaresColorBasicoForItem(activePlancha, conVolteoColorBasico)
        : null,
    [activePlancha, conVolteoColorBasico]
  )

  const tamanosBuenosMillaresPantone = useMemo(
    () =>
      activePlancha
        ? resolveTamanosBuenosParaMillaresPantoneForItem(activePlancha, conVolteoPantone)
        : null,
    [activePlancha, conVolteoPantone]
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
    if (!activePlancha || !showColorBasicoTarifa || !tamanosBuenosMillaresColorBasico) return null
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
      tamanosBuenosMillaresColorBasico.value,
      pricing,
      tamanosBuenosMillaresColorBasico.source
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
    tamanosBuenosMillaresColorBasico,
    volteoMillarRulesColorBasico,
  ])

  const millaresPreviewPantone = useMemo(() => {
    if (!activePlancha || !showPantoneTarifa || !tamanosBuenosMillaresPantone) return null
    const tintasTiro = countPantoneTintasInLado(draftTiro)
    const tintasRetiro = countPantoneTintasInLado(draftRetiro)
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
      tamanosBuenosMillaresPantone.value,
      pricing,
      tamanosBuenosMillaresPantone.source
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
    tamanosBuenosMillaresPantone,
    volteoMillarRulesPantone,
  ])

  const canCommitEntrada =
    canSaveDraft &&
    (!showColorBasicoTarifa || (millaresPreviewColorBasico?.millaresCalculados ?? 0) > 0) &&
    (!showPantoneTarifa || (millaresPreviewPantone?.millaresCalculados ?? 0) > 0)

  const showRegistrosSection = tableRows.length > 0

  const clearDraft = () => {
    const empty = emptyImpresionLadoTintas()
    draftSidesRef.current = { tiro: empty, retiro: empty }
    setDraftTiro(empty)
    setDraftRetiro(empty)
    setDraftTarifa(emptyImpresionTintasDraftTarifa())
    setDraftClienteSuministraTintaPantone('si')
    setDraftPrecioCobroTintaPantone(0)
    setEditingEntradaId(null)
    setDraftError(null)
  }

  const loadPantoneSuministroDraft = (registro: ImpresionTintasRegistro) => {
    setDraftClienteSuministraTintaPantone(resolveClienteSuministraTintaPantone(registro))
    setDraftPrecioCobroTintaPantone(Math.max(0, registro.precioCobroTintaPantone ?? 0))
  }

  const loadDraftFromEntrada = (entrada: ImpresionTiroRetiroEntrada, registro: ImpresionTintasRegistro) => {
    setEditingEntradaId(entrada.id)
    const tiro = {
      cantidad: entrada.tiro.cantidad,
      tintas: [...entrada.tiro.tintas],
    }
    const retiro = {
      cantidad: entrada.retiro.cantidad,
      tintas: [...entrada.retiro.tintas],
    }
    draftSidesRef.current = { tiro, retiro }
    setDraftTiro(tiro)
    setDraftRetiro(retiro)
    const tarifa = readImpresionTintasDraftTarifa(registro)
    const plancha =
      coloresPlanchas.find(item => item.id === registro.colorPlanchaId) ?? activePlancha
    const cavidades = plancha?.numeroCavidades ?? 0
    setDraftTarifa({
      ...tarifa,
      tipoBifronteColorBasico: sanitizeImpresionTipoBifronteForVolteo(
        tarifa.tipoBifronteColorBasico,
        'colorBasico',
        cavidades,
        entrada.tiro,
        entrada.retiro
      ),
      tipoBifrontePantone: sanitizeImpresionTipoBifronteForVolteo(
        tarifa.tipoBifrontePantone,
        'pantone',
        cavidades,
        entrada.tiro,
        entrada.retiro
      ),
    })
    loadPantoneSuministroDraft(registro)
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
    if (editingEntradaId || hasDraftContent || !activeRegistro) return
    loadPantoneSuministroDraft(activeRegistro)
  }, [activeColorPlanchaId, activeRegistro, editingEntradaId, hasDraftContent])

  useEffect(() => {
    if (tarifasMillarLoading || !showComposerForm) return
    setDraftTarifa(prev =>
      syncImpresionTintasDraftTarifa(prev, tarifasMillar, draftTiro, draftRetiro, maxColoresPlancha)
    )
  }, [draftTiro, draftRetiro, maxColoresPlancha, showComposerForm, tarifasMillar, tarifasMillarLoading])

  useEffect(() => {
    setDraftTarifa(prev => {
      const needsColorBasico =
        !volteoPermitidoColorBasico && isImpresionConVolteo(prev.tipoBifronteColorBasico)
      const needsPantone =
        !volteoPermitidoPantone && isImpresionConVolteo(prev.tipoBifrontePantone)
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
        next = patchImpresionTintasDraftTarifaVolteo(
          next,
          tarifasMillar,
          'pantone',
          'diferente-plancha'
        )
      }
      return next
    })
  }, [volteoPermitidoColorBasico, volteoPermitidoPantone, tarifasMillar])

  const persistRegistro = (registro: ImpresionTintasRegistro) => {
    onRegistroChange(registro)
  }

  const applyDraftSides = (tiro: ImpresionLadoTintas, retiro: ImpresionLadoTintas) => {
    const clamped = clampImpresionEntradaDraftSides(tiro, retiro, maxColoresPlancha)
    draftSidesRef.current = clamped
    setDraftTiro(clamped.tiro)
    setDraftRetiro(clamped.retiro)
  }

  const handleTiroDraftChange = (
    nextTiro: ImpresionLadoTintas,
    meta?: ImpresionLadoTintasChangeMeta
  ) => {
    const { tiro: prevTiro, retiro: prevRetiro } = draftSidesRef.current
    const nextRetiro =
      meta?.type === 'tinta'
        ? replicateTiroSlotInkToRetiro(nextTiro, prevRetiro, meta.slotIndex, maxColoresPlancha)
        : replicateTiroTintasChangesToRetiro(prevTiro, nextTiro, prevRetiro, maxColoresPlancha)
    applyDraftSides(nextTiro, nextRetiro)
    if (draftError) setDraftError(null)
  }

  const handleRetiroDraftChange = (
    nextRetiro: ImpresionLadoTintas,
    meta?: ImpresionLadoTintasChangeMeta
  ) => {
    const { tiro: prevTiro } = draftSidesRef.current
    const cantidadChanged = meta?.type === 'cantidad'
    const resolvedRetiro = cantidadChanged
      ? replicateNewRetiroSlotsFromTiro(draftSidesRef.current.retiro, nextRetiro, prevTiro)
      : nextRetiro
    applyDraftSides(prevTiro, resolvedRetiro)
    if (draftError) setDraftError(null)
  }

  useEffect(() => {
    draftSidesRef.current = { tiro: draftTiro, retiro: draftRetiro }
  }, [draftTiro, draftRetiro])

  const handleSaveDraft = () => {
    if (!activeRegistro || !activePlancha) return
    if (!canCommitEntrada) {
      setDraftError(entradasCopy.validationError(maxColoresPlancha))
      return
    }
    if (
      (showColorBasicoTarifa && !tamanosBuenosMillaresColorBasico) ||
      (showPantoneTarifa && !tamanosBuenosMillaresPantone)
    ) {
      return
    }

    const precioTintaBreakdown = computeImpresionPrecioTintaBreakdown(
      draftTiro,
      draftRetiro,
      tamanosBuenosMillaresColorBasico?.value ?? tamanosBuenosMillaresPantone?.value ?? 0,
      buildBreakdownInput(),
      {
        tamanosBuenosColorBasico: tamanosBuenosMillaresColorBasico?.value,
        tamanosBuenosPantone: tamanosBuenosMillaresPantone?.value,
        tamanosBuenosReferenciaColorBasico:
          tamanosBuenosMillaresColorBasico?.tamanosBuenosReferencia ?? null,
        tamanosBuenosReferenciaPantone:
          tamanosBuenosMillaresPantone?.tamanosBuenosReferencia ?? null,
      }
    )
    const cobroTintaPantone = showPantoneTarifa
      ? resolvePrecioCobroTintaPantone({
          clienteSuministraTintaPantone: draftClienteSuministraTintaPantone,
          precioCobroTintaPantone: draftPrecioCobroTintaPantone,
        })
      : 0
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
        precioCobroTintaPantone: cobroTintaPantone,
        precioTinta: precioTintaBreakdown.total + cobroTintaPantone,
        millaresVolteo: precioTintaBreakdown.millaresVolteo,
        precioVolteo: precioTintaBreakdown.volteo,
      },
      maxColoresPlancha
    )

    persistRegistro({
      ...activeRegistro,
      ...draftTarifa,
      clienteSuministraTintaPantone: showPantoneTarifa ? draftClienteSuministraTintaPantone : 'si',
      precioCobroTintaPantone: showPantoneTarifa ? draftPrecioCobroTintaPantone : 0,
      entradas: [entrada],
    })
    skipReloadAfterSaveRef.current = true
    clearDraft()
  }

  const handleTipoBifronteColorBasicoChange = (tipoBifronte: ImpresionTipoBifronte | '') => {
    const tipo = sanitizeImpresionTipoBifronteForVolteo(
      (tipoBifronte || 'diferente-plancha') as ImpresionTipoBifronte,
      'colorBasico',
      numeroCavidades,
      draftTiro,
      draftRetiro
    )
    setDraftTarifa(prev =>
      patchImpresionTintasDraftTarifaVolteo(prev, tarifasMillar, 'colorBasico', tipo)
    )
    if (draftError) setDraftError(null)
  }

  const handleTipoBifrontePantoneChange = (tipoBifronte: ImpresionTipoBifronte | '') => {
    const tipo = sanitizeImpresionTipoBifronteForVolteo(
      (tipoBifronte || 'diferente-plancha') as ImpresionTipoBifronte,
      'pantone',
      numeroCavidades,
      draftTiro,
      draftRetiro
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

  const handleClienteSuministraTintaPantoneChange = (value: 'si' | 'no') => {
    setDraftClienteSuministraTintaPantone(value)
    if (value === 'si') setDraftPrecioCobroTintaPantone(0)
  }

  const handlePrecioCobroTintaPantoneChange = (precio: number) => {
    setDraftPrecioCobroTintaPantone(precio)
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

  const handlePruebaSherpaSuministroChange = (value: 'si' | 'no') => {
    if (!activeRegistro) return
    persistRegistro({
      ...activeRegistro,
      clienteSuministraPruebaSherpa: value,
      precioPruebaSherpa: value === 'si' ? 0 : activeRegistro.precioPruebaSherpa ?? 0,
    })
  }

  const handlePruebaSherpaPrecioChange = (precio: number) => {
    if (!activeRegistro) return
    persistRegistro({
      ...activeRegistro,
      precioPruebaSherpa: precio,
    })
  }

  return (
    <>
      <p className="production-workspace-panel-desc">{tintasCopy.panelDesc}</p>

      <div className="production-ws-sections-stack">
        <ProductionPreprensaRegistroPickerSection
          copy={registroCopy}
          selectId="prod-impresion-plancha-select"
          coloresPlanchas={coloresPlanchas}
          selectedId={activeColorPlanchaId}
          onChange={onActiveColorPlanchaIdChange}
          completedPlanchaIds={completedPlanchaIds}
        >
          {activePlancha && activeRegistro ? (
            <>
              <ImpresionPlanchaDetalleFields
                cantidad={activePlancha.cantidad}
                numeroCavidades={activePlancha.numeroCavidades}
                tipoBifronteColorBasico={draftTarifa.tipoBifronteColorBasico}
                tipoBifrontePantone={draftTarifa.tipoBifrontePantone}
              />
              <ImpresionPruebaContratoSection
                clienteSuministraPruebaSherpa={resolveClienteSuministraPruebaSherpa(activeRegistro)}
                precioPruebaSherpa={Math.max(0, activeRegistro.precioPruebaSherpa ?? 0)}
                onSuministroChange={handlePruebaSherpaSuministroChange}
                onPrecioChange={handlePruebaSherpaPrecioChange}
              />
            </>
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
                            onChange={handleTiroDraftChange}
                          />
                          <ImpresionLadoTintasFields
                            idPrefix="prod-impresion-retiro"
                            title={ladoCopy.retiro}
                            hint={ladoCopy.retiroHint}
                            lado={draftRetiro}
                            maxColoresPlancha={maxColoresPlancha}
                            otherLadoCantidad={draftTiro.cantidad}
                            onChange={handleRetiroDraftChange}
                          />
                        </div>

                        {hasPartialInkSelection ? (
                          <p
                            className="production-diseno-cliente-hint production-impresion-tintas-tarifas-await"
                            role="status"
                          >
                            {entradasCopy.tarifasAwaitPlanchaCompleta(maxColoresPlancha)}
                          </p>
                        ) : null}

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
                            tamanosBuenosReferenciaColorBasico={
                              tamanosBuenosMillaresColorBasico?.tamanosBuenosReferencia ?? null
                            }
                            tamanosBuenosReferenciaPantone={
                              tamanosBuenosMillaresPantone?.tamanosBuenosReferencia ?? null
                            }
                            conVolteoPermitidoColorBasico={volteoPermitidoColorBasico}
                            conVolteoPermitidoPantone={volteoPermitidoPantone}
                            conVolteoBloqueadoHintColorBasico={volteoBloqueadoHintColorBasico}
                            conVolteoBloqueadoHintPantone={volteoBloqueadoHintPantone}
                            clienteSuministraTintaPantone={draftClienteSuministraTintaPantone}
                            precioCobroTintaPantone={draftPrecioCobroTintaPantone}
                            onClienteSuministraTintaPantoneChange={
                              handleClienteSuministraTintaPantoneChange
                            }
                            onPrecioCobroTintaPantoneChange={handlePrecioCobroTintaPantoneChange}
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
        </ProductionPreprensaRegistroPickerSection>

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
