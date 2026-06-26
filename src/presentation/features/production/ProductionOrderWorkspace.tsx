import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductionWorkflowNav from './ProductionWorkflowNav'
import ProductionWorkflowPanel from './ProductionWorkflowPanel'
import ProductionOrderStatusControl from './ProductionOrderStatusControl'
import ProductionPhaseStatusAction from './ProductionPhaseStatusAction'
import { useOrdersHook } from '../../hooks/useOrders'
import { useAuth } from '../../hooks/useAuth'
import { userCanSuperviseProductionStatus } from '../../../core/domain/policies/productionOrderStatusPolicy'
import { Container } from '../../../di/container'
import { Money } from '../../../core/domain/value-objects/Money'
import { CreateOrderDTO, OrderSpecs, type PaperRow, type ImpresionTintasRegistro, type ImpresionEstimarTintasRegistro, type TerminadosProduccionRegistro, type AcabadosProduccionRegistro } from '../../../core/domain/entities/Order'
import { ROUTES } from '../../../config/appRoutes'
import { formatProductionOrderId } from '../../../core/domain/value-objects/ProductionOrderId'
import {
  PRODUCTION_WORKFLOW_TABS,
  ProductionWorkflowTabId,
} from './productionTabs'
import '../remissions/Remissions.css'
import '../orders/Orders.css'
import './Production.css'
import ProductionSpecsSubNav from './ProductionSpecsSubNav'
import ProductionPreprensaSubNav from './ProductionPreprensaSubNav'
import ProductionImpresionSubNav from './ProductionImpresionSubNav'
import ProductionCortePapelSubNav from './ProductionCortePapelSubNav'
import ProductionTerminadosSubNav from './ProductionTerminadosSubNav'
import ProductionAcabadosSubNav from './ProductionAcabadosSubNav'
import ProductionCobroSubNav from './ProductionCobroSubNav'
import ProductionClientPicker from './ProductionClientPicker'
import ProductionOperadorAssignmentSection from './ProductionOperadorAssignmentSection'
import {
  LazyProductionAcabadosPanel,
  LazyProductionCortePapelForm,
  LazyProductionDetalleOpPanel,
  LazyProductionImpresionConversionImagenPanel,
  LazyProductionImpresionMuestraPanel,
  LazyProductionImpresionTintasPanel,
  LazyProductionOrderCobroPanel,
  LazyProductionTerminadosPanel,
  prefetchPreprensaWorkspacePanels,
  withProductionPanelSuspense,
} from './productionWorkspaceLazyPanels'
import PreprensaDisenoModoShell from './PreprensaDisenoModoShell'
import ProductionPreprensaDiseno from './ProductionPreprensaDiseno'
import { SpecsSubTabId } from './productionSpecsSubTabs'
import { PreprensaSubTabId } from './productionPreprensaSubTabs'
import { CortePapelSubTabId } from './productionCortePapelSubTabs'
import { ImpresionSubTabId } from './productionImpresionSubTabs'
import { TerminadosSubTabId } from './productionTerminadosSubTabs'
import { AcabadosSubTabId } from './productionAcabadosSubTabs'
import { CobroSubTabId } from './productionCobroSubTabs'
import { useUsersHook } from '../../hooks/useUsers'
import type { UserPermission, UserRole } from '../../../core/domain/auth/userPermissions'
import {
  OPERADOR_ASSIGNMENT_FIELDS,
  normalizeOperadorPermissionFilters,
  resolveOperadorRoleFilter,
  type ProductionAssignmentPhaseId,
} from './utils/productionOperatorAssignment'
import { productionTraceRecorder } from '../../services/productionTraceRecorder'
import { Client } from '../../../core/domain/entities/Client'
import { Vendedor } from '../../../core/domain/entities/Vendedor'
import { TamanoPlancha } from '../../../core/domain/entities/TamanoPlancha'
import { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import { PrecioMontaje } from '../../../core/domain/entities/PrecioMontaje'
import { emptyPreprensaDiseno, PreprensaDisenoSpecs } from '../../../core/domain/entities/PreprensaDiseno'
import { buildPreprensaFromHistorial, clearPreprensaHistorialSelection, normalizePreprensaSnapshot } from './utils/applyPreprensaFromHistorial'
import { reconcilePrecioMontajeSnapshot } from './utils/preprensaMontajeResolve'
import {
  applyColoresPlanchasForHistorialReuse,
  buildColoresPlanchasPatch,
} from './utils/coloresPlanchasUtils'
import { ClienteDisenoOption } from './utils/buildClienteDisenos'
import { patchPreprensaDesignNuevo, preprensaDisenoHasRegisteredContent } from './utils/preprensaDesignNuevoChange'
import { PREPRENSA_DISENO_COPY } from './constants/preprensaDisenoCopy'
import { patchCorteClienteSuministraPapel } from './utils/corteClienteSuministraPapelChange'
import { removeCorteRegistroFromPaperRows } from './utils/cortePapelCortadoChange'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import { buildClienteDisenosFromOrders } from './utils/buildClienteDisenos'
import { useTipoPapelHook } from '../../hooks/useTipoPapel'
import { useTerminadosHook } from '../../hooks/useTerminados'
import { useOperacionesHook } from '../../hooks/useOperaciones'
import { emptyPaperRow, normalizeTipoPapelList, syncPaperRowsWithTipoPapelCatalog } from './utils/tipoPapelDisplay'
import { DEFAULT_MARGEN_REDONDEO, normalizeMargenRedondeo } from './utils/cortePapelCalculations'
import {
  findPaperRowForActiveId,
  isFaltanteLitografiaRow,
  resetPaperRowForActiveId,
  resolveHojasFaltanteCliente,
  syncFaltanteLitografiaForParent,
  upsertPaperRow,
} from './utils/cortePapelFaltante'
import {
  paperRowsMatchColoresPlanchas,
  resolveOrderCortePapelMetrics,
  syncPaperRowsWithColoresPlanchas,
} from './utils/paperRowsSync'
import { CORTE_PAPEL_COPY as cortePapelCopy } from './constants/cortePapelCopy'
import { PRODUCTION_COBRO_COPY } from './constants/productionCobroCopy'
import {
  hydrateOrderSpecsFromDraft,
  productionDraftHasContent,
  resolveActiveTabFromDraft,
  resolveCortePapelSubTabFromDraft,
  resolveImpresionSubTabFromDraft,
  resolvePreprensaSubTabFromDraft,
} from './utils/productionNewOrderDraft'
import {
  impresionTintasRegistrosEqual,
  patchImpresionTintasRegistro,
  resolveCompletedPlanchaIds,
  syncImpresionTintasRegistros,
} from './utils/impresionTintasUtils'
import {
  impresionEstimarTintasRegistrosEqual,
  patchImpresionEstimarTintasRegistro,
  resolveEstimarTintasCompletedPlanchaIds,
  syncImpresionEstimarTintasRegistros,
} from './utils/estimarTintasRegistrosUtils'
import {
  hasPersistedProductionNewOrderDraft,
  useProductionNewOrderDraftStore,
} from '../../stores/productionNewOrderDraftStore'
import {
  buildFinishesFromTerminadosRegistros,
  syncTerminadosRegistros,
  terminadosRegistrosEqual,
} from './utils/terminadosUtils'
import {
  buildOperationsFromAcabadosRegistros,
  syncAcabadosRegistros,
  acabadosRegistrosEqual,
} from './utils/acabadosUtils'
import type { ProductionStatusPhaseId } from '../../../core/domain/policies/productionOrderStatusPolicy'
import { DEFAULT_PRODUCTION_ORDER_STATUS } from '../../../core/domain/value-objects/ProductionOrderStatus'
import { confirmAction } from '../../utils/actionFeedback'
import { useProductionNewOrderDraftAutosave } from './hooks/useProductionNewOrderDraftAutosave'

const parseQuantityDigits = (value: string): number => {
  const digits = value.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits)
}

const blockNonDigitKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const allowed = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
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

const emptySpecs = (): OrderSpecs => ({
  paperRows: [emptyPaperRow()],
  quantity: 0,
  cantidadHojas: 0,
  margenRedondeo: DEFAULT_MARGEN_REDONDEO,
  valorCorte: 0,
  clienteSuministraPapel: 'no',
  mounting: false,
  mountingValue: new Money(0),
  design: true,
  preprensaDiseno: emptyPreprensaDiseno(),
  plates: 0,
  platesValue: new Money(0),
  thousands: 0,
  inks: '',
  impresionTintasRegistros: [],
  impresionEstimarTintasRegistros: [],
  terminadosRegistros: [],
  acabadosRegistros: [],
  machineOutputValue: new Money(0),
  chapoliado: false,
  finishes: [],
  operations: [],
  cobroDescuentoModo: 'porcentaje',
  cobroDescuentoValor: 0,
})

const ProductionOrderWorkspace: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const isNew = orderId === 'new'
  const { orders, loading: ordersLoading, createOrder, updateProductionOrderStatus } = useOrdersHook()
  const { session } = useAuth()
  const { items: tiposPapelStore, loading: loadingTiposPapel } = useTipoPapelHook()
  const { items: terminadosCatalog, quickAccessItems: quickAccessTerminados } = useTerminadosHook()
  const { items: acabadosCatalog, quickAccessItems: quickAccessAcabados } = useOperacionesHook()
  const { users } = useUsersHook()
  const [tiposPapelCatalog, setTiposPapelCatalog] = useState<TipoPapel[]>([])

  const tiposPapel = useMemo(
    () =>
      normalizeTipoPapelList(
        tiposPapelCatalog.length > 0 ? tiposPapelCatalog : tiposPapelStore
      ),
    [tiposPapelCatalog, tiposPapelStore]
  )

  const [activeTab, setActiveTab] = useState<ProductionWorkflowTabId>('especificaciones')
  const [visitedWorkflowTabs, setVisitedWorkflowTabs] = useState<Set<ProductionWorkflowTabId>>(
    () => new Set(['especificaciones'])
  )
  const [specsSubTab, setSpecsSubTab] = useState<SpecsSubTabId>('cliente')
  const [preprensaSubTab, setPreprensaSubTab] = useState<PreprensaSubTabId>('diseno')
  const [cortePapelSubTab, setCortePapelSubTab] = useState<CortePapelSubTabId>('corte')
  const [impresionSubTab, setImpresionSubTab] = useState<ImpresionSubTabId>('tintas')
  const [terminadosSubTab, setTerminadosSubTab] = useState<TerminadosSubTabId>('asignacion')
  const [acabadosSubTab, setAcabadosSubTab] = useState<AcabadosSubTabId>('acabado')
  const [cobroSubTab, setCobroSubTab] = useState<CobroSubTabId>('factura')
  const [activeCorteColorPlanchaId, setActiveCorteColorPlanchaId] = useState('')
  const [activeImpresionColorPlanchaId, setActiveImpresionColorPlanchaId] = useState('')
  const [activeTerminadosCorteRowKey, setActiveTerminadosCorteRowKey] = useState('')
  const [activeAcabadosCorteRowKey, setActiveAcabadosCorteRowKey] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [planchas, setPlanchas] = useState<TamanoPlancha[]>([])
  const [preciosMontaje, setPreciosMontaje] = useState<PrecioMontaje[]>([])
  const [vendedorId, setVendedorId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existingOrder = useMemo(
    () => (isNew ? null : orders.find(o => o.id === orderId) ?? null),
    [isNew, orderId, orders]
  )

  const [clientId, setClientId] = useState('')
  const [workName, setWorkName] = useState('')
  const [specs, setSpecs] = useState<OrderSpecs>(emptySpecs)

  useEffect(() => {
    if (!isNew) return
    prefetchPreprensaWorkspacePanels()
  }, [isNew])

  useEffect(() => {
    const container = Container.getInstance()
    container
      .getClientUseCases()
      .getClients()
      .then((list: Client[]) => {
        setClients(list)
      })
      .catch(() => setClients([]))
    container
      .getVendedorUseCases()
      .getVendedores()
      .then((list: Vendedor[]) => setVendedores(list))
      .catch(() => setVendedores([]))
    container
      .getTamanoPlanchaUseCases()
      .getTiposPlancha()
      .then(setPlanchas)
      .catch(() => setPlanchas([]))
    container
      .getPrecioMontajeUseCases()
      .getPreciosMontaje()
      .then(setPreciosMontaje)
      .catch(() => setPreciosMontaje([]))
    container
      .getTipoPapelUseCases()
      .getTiposPapel()
      .then(list => setTiposPapelCatalog(normalizeTipoPapelList(list)))
      .catch(() => setTiposPapelCatalog([]))
  }, [])

  useEffect(() => {
    if (tiposPapelStore.length === 0) return
    setTiposPapelCatalog(normalizeTipoPapelList(tiposPapelStore))
  }, [tiposPapelStore])

  const draftHydratedRef = useRef(false)
  const [draftHydrated, setDraftHydrated] = useState(false)
  const setDraft = useProductionNewOrderDraftStore(s => s.setDraft)
  const clearDraft = useProductionNewOrderDraftStore(s => s.clearDraft)
  const hasDraft = useProductionNewOrderDraftStore(
    s => s.draft != null && productionDraftHasContent(s.draft)
  )

  const mergeSpecsWithCorteMetrics = useCallback(
    (prev: OrderSpecs, patch: Partial<OrderSpecs> = {}): OrderSpecs => {
      const preprensaDiseno = patch.preprensaDiseno
        ? { ...prev.preprensaDiseno, ...patch.preprensaDiseno }
        : prev.preprensaDiseno
      const clienteSuministraPapel = patch.clienteSuministraPapel ?? prev.clienteSuministraPapel ?? 'no'
      const coloresPlanchas = preprensaDiseno.coloresPlanchas
      const paperRowsRaw = patch.paperRows ?? prev.paperRows
      const paperRows = syncPaperRowsWithTipoPapelCatalog(
        syncPaperRowsWithColoresPlanchas(coloresPlanchas, paperRowsRaw),
        tiposPapel
      )
      const metrics = resolveOrderCortePapelMetrics(
        coloresPlanchas,
        paperRows,
        tiposPapel,
        normalizeMargenRedondeo(patch.margenRedondeo ?? prev.margenRedondeo),
        clienteSuministraPapel
      )
      return {
        ...prev,
        ...patch,
        preprensaDiseno,
        clienteSuministraPapel,
        paperRows,
        margenRedondeo: normalizeMargenRedondeo(patch.margenRedondeo ?? prev.margenRedondeo),
        ...metrics,
      }
    },
    [tiposPapel]
  )

  const ensureWorkflowTabVisited = useCallback((tabId: ProductionWorkflowTabId) => {
    setVisitedWorkflowTabs(prev => {
      if (prev.has(tabId)) return prev
      const next = new Set(prev)
      next.add(tabId)
      return next
    })
  }, [])

  const hydrateFromPersistedDraft = useCallback(() => {
    const draft = useProductionNewOrderDraftStore.getState().draft
    if (!draft || !productionDraftHasContent(draft)) return false
    const restoredTab = resolveActiveTabFromDraft(draft)
    setClientId(draft.clientId)
    setVendedorId(draft.vendedorId)
    setWorkName(draft.workName)
    setActiveTab(restoredTab)
    setVisitedWorkflowTabs(prev => {
      const next = new Set(prev)
      next.add('especificaciones')
      next.add(restoredTab)
      return next
    })
    setSpecsSubTab(draft.specsSubTab)
    setPreprensaSubTab(resolvePreprensaSubTabFromDraft(draft.preprensaSubTab))
    setCortePapelSubTab(resolveCortePapelSubTabFromDraft(draft.cortePapelSubTab))
    setImpresionSubTab(resolveImpresionSubTabFromDraft(draft))
    setActiveCorteColorPlanchaId(draft.activeCorteColorPlanchaId)
    setSpecs(
      mergeSpecsWithCorteMetrics(hydrateOrderSpecsFromDraft(draft.specs), {})
    )
    return true
  }, [mergeSpecsWithCorteMetrics])

  const resetNewOrderForm = useCallback(() => {
    setClientId('')
    setVendedorId('')
    setWorkName('')
    setSpecs(emptySpecs())
    setActiveTab('especificaciones')
    setSpecsSubTab('cliente')
    setPreprensaSubTab('diseno')
    setCortePapelSubTab('corte')
    setImpresionSubTab('tintas')
    setActiveCorteColorPlanchaId('')
    setActiveImpresionColorPlanchaId('')
    setError(null)
  }, [])

  useEffect(() => {
    if (!isNew) {
      draftHydratedRef.current = false
      setDraftHydrated(false)
      return
    }
    if (draftHydratedRef.current) return
    draftHydratedRef.current = true
    if (!hydrateFromPersistedDraft()) {
      resetNewOrderForm()
    }
    setDraftHydrated(true)
  }, [isNew, orderId, hydrateFromPersistedDraft, resetNewOrderForm])

  useProductionNewOrderDraftAutosave(isNew, draftHydrated, {
    clientId,
    workName,
    vendedorId,
    specs,
    activeTab,
    specsSubTab,
    preprensaSubTab,
    cortePapelSubTab,
    impresionSubTab,
    activeCorteColorPlanchaId,
  })

  const impresionColoresPlanchas = useMemo(
    () => normalizePreprensaSnapshot(specs.preprensaDiseno).coloresPlanchas,
    [specs.preprensaDiseno]
  )

  const completedImpresionPlanchaIds = useMemo(
    () => resolveCompletedPlanchaIds(specs.impresionTintasRegistros ?? []),
    [specs.impresionTintasRegistros]
  )

  const completedEstimarTintasPlanchaIds = useMemo(
    () => resolveEstimarTintasCompletedPlanchaIds(specs.impresionEstimarTintasRegistros ?? []),
    [specs.impresionEstimarTintasRegistros]
  )

  useEffect(() => {
    const preprensaIds = specs.preprensaDiseno.coloresPlanchas.map(item => item.id)
    const faltanteCorteIds = specs.paperRows
      .filter(row => isFaltanteLitografiaRow(row) && row.corteRowId)
      .map(row => row.corteRowId as string)
    const allowedIds = new Set([...preprensaIds, ...faltanteCorteIds])
    setActiveCorteColorPlanchaId(prev => {
      if (prev && allowedIds.has(prev)) return prev
      // Mantener sin selección tras commit o al iniciar; solo reasignar si el id activo quedó inválido.
      if (prev) return preprensaIds[0] ?? ''
      return ''
    })
  }, [specs.preprensaDiseno.coloresPlanchas, specs.paperRows])

  useEffect(() => {
    const preprensaIds = impresionColoresPlanchas.map(item => item.id)
    setActiveImpresionColorPlanchaId(prev =>
      prev && preprensaIds.includes(prev) ? prev : preprensaIds[0] ?? ''
    )
  }, [impresionColoresPlanchas])

  useEffect(() => {
    setSpecs(prev => {
      const next = syncImpresionTintasRegistros(
        impresionColoresPlanchas,
        prev.impresionTintasRegistros ?? []
      )
      if (impresionTintasRegistrosEqual(next, prev.impresionTintasRegistros ?? [])) {
        return prev
      }
      return { ...prev, impresionTintasRegistros: next }
    })
  }, [impresionColoresPlanchas])

  useEffect(() => {
    setSpecs(prev => {
      const next = syncImpresionEstimarTintasRegistros(
        impresionColoresPlanchas,
        prev.impresionEstimarTintasRegistros ?? []
      )
      if (impresionEstimarTintasRegistrosEqual(next, prev.impresionEstimarTintasRegistros ?? [])) {
        return prev
      }
      return { ...prev, impresionEstimarTintasRegistros: next }
    })
  }, [impresionColoresPlanchas])

  useEffect(() => {
    setSpecs(prev => {
      const next = syncTerminadosRegistros(
        prev.preprensaDiseno.coloresPlanchas,
        prev.paperRows,
        tiposPapel,
        normalizeMargenRedondeo(prev.margenRedondeo),
        prev.clienteSuministraPapel ?? 'no',
        prev.terminadosRegistros ?? []
      )
      if (terminadosRegistrosEqual(next, prev.terminadosRegistros ?? [])) {
        return prev
      }
      return {
        ...prev,
        terminadosRegistros: next,
        finishes: buildFinishesFromTerminadosRegistros(next),
      }
    })
  }, [
    specs.preprensaDiseno.coloresPlanchas,
    specs.paperRows,
    specs.margenRedondeo,
    specs.clienteSuministraPapel,
    tiposPapel,
  ])

  useEffect(() => {
    setSpecs(prev => {
      const next = syncAcabadosRegistros(
        prev.preprensaDiseno.coloresPlanchas,
        prev.paperRows,
        tiposPapel,
        normalizeMargenRedondeo(prev.margenRedondeo),
        prev.clienteSuministraPapel ?? 'no',
        prev.acabadosRegistros ?? []
      )
      if (acabadosRegistrosEqual(next, prev.acabadosRegistros ?? [])) {
        return prev
      }
      return {
        ...prev,
        acabadosRegistros: next,
        operations: buildOperationsFromAcabadosRegistros(next),
      }
    })
  }, [
    specs.preprensaDiseno.coloresPlanchas,
    specs.paperRows,
    specs.margenRedondeo,
    specs.clienteSuministraPapel,
    tiposPapel,
  ])

  useEffect(() => {
    if (paperRowsMatchColoresPlanchas(specs.preprensaDiseno.coloresPlanchas, specs.paperRows)) {
      return
    }
    setSpecs(prev =>
      mergeSpecsWithCorteMetrics(prev, {
        paperRows: syncPaperRowsWithColoresPlanchas(
          prev.preprensaDiseno.coloresPlanchas,
          prev.paperRows
        ),
      })
    )
  }, [
    specs.preprensaDiseno.coloresPlanchas,
    specs.paperRows,
    specs.clienteSuministraPapel,
    mergeSpecsWithCorteMetrics,
  ])

  useEffect(() => {
    if (isNew || !existingOrder) return
    setClientId(existingOrder.clientId)
    setVendedorId(existingOrder.vendedorId ?? '')
    setWorkName(existingOrder.workName)
    const legacyRow = existingOrder.specs.paperRows[0]
    const preprensaDiseno = normalizePreprensaSnapshot(existingOrder.specs.preprensaDiseno)
    const row = legacyRow ?? emptyPaperRow()
    setSpecs(
      mergeSpecsWithCorteMetrics(
        {
          ...existingOrder.specs,
          margenRedondeo: normalizeMargenRedondeo(existingOrder.specs.margenRedondeo),
          clienteSuministraPapel: existingOrder.specs.clienteSuministraPapel ?? 'no',
          preprensaDiseno,
          impresionTintasRegistros: syncImpresionTintasRegistros(
            preprensaDiseno.coloresPlanchas,
            existingOrder.specs.impresionTintasRegistros ?? []
          ),
          impresionEstimarTintasRegistros: syncImpresionEstimarTintasRegistros(
            preprensaDiseno.coloresPlanchas,
            existingOrder.specs.impresionEstimarTintasRegistros ?? []
          ),
          terminadosRegistros: syncTerminadosRegistros(
            preprensaDiseno.coloresPlanchas,
            existingOrder.specs.paperRows?.length
              ? existingOrder.specs.paperRows
              : [row],
            tiposPapel,
            normalizeMargenRedondeo(existingOrder.specs.margenRedondeo),
            existingOrder.specs.clienteSuministraPapel ?? 'no',
            existingOrder.specs.terminadosRegistros ?? []
          ),
          acabadosRegistros: syncAcabadosRegistros(
            preprensaDiseno.coloresPlanchas,
            existingOrder.specs.paperRows?.length
              ? existingOrder.specs.paperRows
              : [row],
            tiposPapel,
            normalizeMargenRedondeo(existingOrder.specs.margenRedondeo),
            existingOrder.specs.clienteSuministraPapel ?? 'no',
            existingOrder.specs.acabadosRegistros ?? []
          ),
          paperRows: existingOrder.specs.paperRows?.length
            ? existingOrder.specs.paperRows
            : [row],
        },
        {}
      )
    )
  }, [isNew, existingOrder, mergeSpecsWithCorteMetrics])

  const clientName = clients.find(c => c.id === clientId)?.name ?? clientId

  const disenosCliente = useMemo(
    () =>
      buildClienteDisenosFromOrders(
        orders,
        clientId,
        isNew ? undefined : orderId
      ),
    [orders, clientId, isNew, orderId]
  )

  const updateSpecs = <K extends keyof OrderSpecs>(key: K, value: OrderSpecs[K]) => {
    setSpecs(prev => ({ ...prev, [key]: value }))
  }

  const patchOperadorAssignment = useCallback(
    (
      phase: ProductionAssignmentPhaseId,
      patch: { userId?: string; role?: UserRole; permissions?: UserPermission[] }
    ) => {
      const fields = OPERADOR_ASSIGNMENT_FIELDS[phase]
      const prevUserId = (specs[fields.id] as string | undefined) ?? ''
      setSpecs(prev => ({
        ...prev,
        [fields.id]:
          patch.userId !== undefined ? patch.userId : (prev[fields.id] as string | undefined) ?? '',
        [fields.rol]:
          patch.role !== undefined
            ? patch.role
            : resolveOperadorRoleFilter(prev[fields.rol] as UserRole | undefined),
        [fields.permisos]:
          patch.permissions !== undefined
            ? normalizeOperadorPermissionFilters(phase, patch.permissions)
            : normalizeOperadorPermissionFilters(
                phase,
                prev[fields.permisos] as UserPermission[] | undefined
              ),
      }))

      const nextUserId = patch.userId ?? prevUserId
      if (
        patch.userId &&
        patch.userId !== prevUserId &&
        !isNew &&
        orderId &&
        workName.trim()
      ) {
        void productionTraceRecorder.recordAssignment({
          orderId,
          workName: workName.trim(),
          phase,
          userId: nextUserId,
          orderStatus: existingOrder?.status,
        })
      }
    },
    [specs, isNew, orderId, workName, existingOrder?.status]
  )

  const renderPhaseStatusAction = (phase: ProductionStatusPhaseId) => {
    if (!session || isNew || !existingOrder) return null

    return (
      <ProductionPhaseStatusAction
        phase={phase}
        currentStatus={existingOrder?.productionStatus ?? DEFAULT_PRODUCTION_ORDER_STATUS}
        specs={specs}
        permissions={session.permissions}
        userId={session.userId}
        disabled={saving}
        onChange={status => updateProductionOrderStatus(orderId!, status)}
      />
    )
  }

  const renderOperadorSection = (
    phase: ProductionAssignmentPhaseId,
    etapa: string,
    inputId: string
  ) => {
    const fields = OPERADOR_ASSIGNMENT_FIELDS[phase]
    return (
      <ProductionOperadorAssignmentSection
        users={users}
        phaseId={phase}
        selectedId={(specs[fields.id] as string | undefined) ?? ''}
        roleFilter={resolveOperadorRoleFilter(specs[fields.rol] as UserRole | undefined)}
        permissionFilters={normalizeOperadorPermissionFilters(
          phase,
          specs[fields.permisos] as UserPermission[] | undefined
        )}
        onSelect={userId => patchOperadorAssignment(phase, { userId })}
        onRoleFilterChange={role => patchOperadorAssignment(phase, { role })}
        onPermissionFiltersChange={permissions =>
          patchOperadorAssignment(phase, { permissions })
        }
        etapa={etapa}
        inputId={inputId}
      />
    )
  }

  const handleImpresionTintasRegistroChange = useCallback((registro: ImpresionTintasRegistro) => {
    setSpecs(prev => ({
      ...prev,
      impresionTintasRegistros: patchImpresionTintasRegistro(
        prev.impresionTintasRegistros ?? [],
        registro
      ),
    }))
  }, [])

  const handleEstimarTintasRegistroChange = useCallback(
    (registro: ImpresionEstimarTintasRegistro) => {
      setSpecs(prev => ({
        ...prev,
        impresionEstimarTintasRegistros: patchImpresionEstimarTintasRegistro(
          prev.impresionEstimarTintasRegistros ?? [],
          registro
        ),
      }))
    },
    []
  )

  const handleTerminadosRegistrosChange = useCallback(
    (
      updater:
        | TerminadosProduccionRegistro[]
        | ((prev: TerminadosProduccionRegistro[]) => TerminadosProduccionRegistro[])
    ) => {
      setSpecs(prev => {
        const current = prev.terminadosRegistros ?? []
        const next = typeof updater === 'function' ? updater(current) : updater
        if (terminadosRegistrosEqual(next, current)) {
          return prev
        }
        return {
          ...prev,
          terminadosRegistros: next,
          finishes: buildFinishesFromTerminadosRegistros(next),
        }
      })
    },
    []
  )

  const handleAcabadosRegistrosChange = useCallback(
    (
      updater:
        | AcabadosProduccionRegistro[]
        | ((prev: AcabadosProduccionRegistro[]) => AcabadosProduccionRegistro[])
    ) => {
      setSpecs(prev => {
        const current = prev.acabadosRegistros ?? []
        const next = typeof updater === 'function' ? updater(current) : updater
        if (acabadosRegistrosEqual(next, current)) {
          return prev
        }
        return {
          ...prev,
          acabadosRegistros: next,
          operations: buildOperationsFromAcabadosRegistros(next),
        }
      })
    },
    []
  )

  const updatePreprensaDiseno = (patch: Partial<PreprensaDisenoSpecs>) => {
    setSpecs(prev => {
      const next = { ...prev.preprensaDiseno, ...patch }
      return mergeSpecsWithCorteMetrics(prev, {
        preprensaDiseno: next,
        design: next.designNuevo === 'si',
      })
    })
  }

  const handlePreprensaDesignNuevoChange = async (value: YesNoChoice) => {
    if (value === specs.preprensaDiseno.designNuevo) return

    if (preprensaDisenoHasRegisteredContent(specs.preprensaDiseno)) {
      const targetLabel =
        value === 'si'
          ? PREPRENSA_DISENO_COPY.modo.nuevo
          : PREPRENSA_DISENO_COPY.modo.existente
      const confirmed = await confirmAction(
        PREPRENSA_DISENO_COPY.modo.switchConfirmMessage(targetLabel),
        {
          title: PREPRENSA_DISENO_COPY.modo.switchConfirmTitle,
          confirmLabel: PREPRENSA_DISENO_COPY.modo.switchConfirmLabel,
          variant: 'danger',
        }
      )
      if (!confirmed) return
    }

    updatePreprensaDiseno(patchPreprensaDesignNuevo(value))
  }

  const applyHistorialTrabajo = (option: ClienteDisenoOption) => {
    const sourceOrder = orders.find(o => o.id === option.sourceOrderId)
    const raw = sourceOrder?.specs.preprensaDiseno ?? option.preprensaSnapshot
    const coloresPlanchas = applyColoresPlanchasForHistorialReuse(raw, specs.quantity, planchas)
    const historialBase = buildPreprensaFromHistorial(raw, option.sourceOrderId, option.workName)
    const montaje = reconcilePrecioMontajeSnapshot(
      {
        precioMontajeId: historialBase.precioMontajeId ?? '',
        precioMontajeNombre: historialBase.precioMontajeNombre ?? '',
        precioMontajeCosto: historialBase.precioMontajeCosto ?? 0,
      },
      preciosMontaje
    )
    const preprensaDiseno: PreprensaDisenoSpecs = {
      ...emptyPreprensaDiseno(),
      ...historialBase,
      ...montaje,
      ...buildColoresPlanchasPatch(coloresPlanchas, { historialMode: true }),
    }
    setSpecs(prev =>
      mergeSpecsWithCorteMetrics(prev, {
        design: false,
        preprensaDiseno,
      })
    )
  }

  const clienteSuministraPapel = specs.clienteSuministraPapel ?? 'no'
  const paperRow = findPaperRowForActiveId(specs.paperRows, activeCorteColorPlanchaId)

  const handlePaperRowCommit = (row: PaperRow) => {
    setSpecs(prev => {
      let paperRows = upsertPaperRow(prev.paperRows, row)
      const clienteSuministra = prev.clienteSuministraPapel ?? 'no'

      if (clienteSuministra === 'si' && !isFaltanteLitografiaRow(row) && row.colorPlanchaId) {
        const hojasFaltante = resolveHojasFaltanteCliente(
          prev.preprensaDiseno.coloresPlanchas,
          row,
          clienteSuministra
        )
        paperRows = syncFaltanteLitografiaForParent(paperRows, row, hojasFaltante).paperRows
      }

      return mergeSpecsWithCorteMetrics(prev, { paperRows })
    })
    setActiveCorteColorPlanchaId('')
  }

  const handlePaperRowDelete = (activeId: string) => {
    setSpecs(prev =>
      mergeSpecsWithCorteMetrics(prev, {
        paperRows: resetPaperRowForActiveId(prev.paperRows, activeId),
      })
    )
    if (activeCorteColorPlanchaId === activeId) {
      setActiveCorteColorPlanchaId('')
    }
  }

  const handlePapelCortadoReset = (colorPlanchaId: string) => {
    setSpecs(prev =>
      mergeSpecsWithCorteMetrics(prev, {
        paperRows: removeCorteRegistroFromPaperRows(prev.paperRows, colorPlanchaId),
      })
    )
  }

  const handleClienteSuministraPapelChange = (value: OrderSpecs['clienteSuministraPapel']) => {
    if (value === (specs.clienteSuministraPapel ?? 'no')) return

    setSpecs(prev => {
      const patch = patchCorteClienteSuministraPapel(
        value,
        prev.preprensaDiseno.coloresPlanchas,
        prev.paperRows
      )
      setActiveCorteColorPlanchaId('')
      return mergeSpecsWithCorteMetrics(prev, patch)
    })
  }

  const goToTab = (id: ProductionWorkflowTabId) => {
    if (id === 'preprensa') {
      prefetchPreprensaWorkspacePanels()
    }
    ensureWorkflowTabVisited(id)
    setActiveTab(id)
    setError(null)
    if (id === 'preprensa') {
      setPreprensaSubTab('diseno')
    }
    if (id === 'corte-papel') {
      setCortePapelSubTab('corte')
    }
    if (id === 'cobro') {
      setCobroSubTab('factura')
    }
  }

  const goToAdjacentTab = (direction: -1 | 1) => {
    const index = PRODUCTION_WORKFLOW_TABS.findIndex(t => t.id === activeTab)
    const next = PRODUCTION_WORKFLOW_TABS[index + direction]
    if (next) goToTab(next.id)
  }

  const handleDiscardDraft = async () => {
    const hasDraft = hasPersistedProductionNewOrderDraft()
    if (
      hasDraft &&
      !(await confirmAction(
        '¿Eliminar el borrador de esta orden? Se perderá toda la información no guardada.',
        { variant: 'danger', confirmLabel: 'Eliminar borrador', title: 'Eliminar borrador' }
      ))
    ) {
      return
    }
    if (!hasDraft) {
      resetNewOrderForm()
      navigate(ROUTES.production.path)
      return
    }
    clearDraft()
    resetNewOrderForm()
    navigate(ROUTES.production.path)
  }

  const handleSave = async () => {
    if (!clientId.trim()) {
      setError('Selecciona un cliente en Especificaciones.')
      goToTab('especificaciones')
      setSpecsSubTab('cliente')
      return
    }
    if (!workName.trim()) {
      setError('Indica el nombre del trabajo.')
      goToTab('especificaciones')
      setSpecsSubTab('detalle-op')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const dto: CreateOrderDTO = {
        clientId: clientId.trim(),
        workName: workName.trim(),
        date: new Date(),
        specs: {
          ...specs,
          design: specs.preprensaDiseno.designNuevo === 'si',
        },
        vendedorId: vendedorId.trim() || undefined,
      }
      const order = await createOrder(dto)
      for (const phase of Object.keys(OPERADOR_ASSIGNMENT_FIELDS) as ProductionAssignmentPhaseId[]) {
        const fields = OPERADOR_ASSIGNMENT_FIELDS[phase]
        const userId = dto.specs[fields.id] as string | undefined
        if (userId) {
          void productionTraceRecorder.recordAssignment({
            orderId: order.id,
            workName: order.workName,
            phase,
            userId,
            orderStatus: order.status,
          })
        }
      }
      clearDraft()
      navigate(`${ROUTES.production.path}/${order.id}`, { replace: true })
    } catch {
      setError('No se pudo guardar la orden. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const productionStatus =
    existingOrder?.productionStatus ?? DEFAULT_PRODUCTION_ORDER_STATUS

  const workflowStatusPanel = useMemo(() => {
    if (isNew) {
      if (!session || !userCanSuperviseProductionStatus(session.permissions)) return null
      return (
        <ProductionOrderStatusControl
          status={DEFAULT_PRODUCTION_ORDER_STATUS}
          specs={specs}
          permissions={session.permissions}
          userId={session.userId}
          pendingCreation
          editable={false}
          onChange={async () => {}}
        />
      )
    }

    if (!existingOrder) return null

    if (session) {
      return (
        <ProductionOrderStatusControl
          status={productionStatus}
          specs={existingOrder.specs}
          permissions={session.permissions}
          userId={session.userId}
          disabled={saving}
          editable
          onChange={status => updateProductionOrderStatus(existingOrder.id, status)}
          onSaved={() => navigate(ROUTES.production.path)}
        />
      )
    }

    return (
      <ProductionOrderStatusControl
        status={productionStatus}
        specs={existingOrder.specs}
        permissions={[]}
        userId=""
        editable={false}
        onChange={async () => {}}
      />
    )
  }, [existingOrder, isNew, navigate, productionStatus, saving, session, specs, updateProductionOrderStatus])

  if (!isNew && !ordersLoading && orders.length > 0 && !existingOrder) {
    return (
      <div className="orders-container production-workspace">
        <p className="orders-error">No se encontró la orden solicitada.</p>
        <Link to={ROUTES.production.path} className="production-workspace-back">
          ← Volver al listado
        </Link>
      </div>
    )
  }

  if (ordersLoading && !isNew && !existingOrder) {
    return <div className="orders-loading">Cargando orden de producción…</div>
  }

  const activeStepIndex = PRODUCTION_WORKFLOW_TABS.findIndex(t => t.id === activeTab)
  const nextStep = PRODUCTION_WORKFLOW_TABS[activeStepIndex + 1]
  const orderCode = orderId ? formatProductionOrderId(orderId) : ''
  const title = isNew ? 'Nueva orden de producción' : `Orden ${orderCode}`
  const breadcrumbSuffix = isNew ? 'Nueva' : orderCode

  return (
    <div
      className={`remissions-container production-workspace${isNew ? ' production-workspace--new-order' : ''}`}
    >
      <div className="remissions-header">
        <div className="remissions-header-left">
          <button
            type="button"
            className="production-workspace-back"
            onClick={() => navigate(ROUTES.production.path)}
          >
            ← Órdenes de producción
          </button>
          <h1 className="remissions-title">{title}</h1>
          <p className="remissions-breadcrumb">
            IndiColors › Producción › {breadcrumbSuffix}
            {workName ? ` · ${workName}` : ''}
          </p>
          {clientName && (
            <p className="remissions-breadcrumb" style={{ marginTop: 0 }}>
              {clientName}
            </p>
          )}
          {isNew && hasDraft && (
            <p className="production-draft-status" role="status">
              Borrador guardado automáticamente. Elimínelo solo si no desea continuar esta orden.
            </p>
          )}
        </div>
        <div className="remissions-header-right">
          {isNew ? (
            <button
              type="button"
              className="production-btn-secondary production-btn-secondary--danger"
              onClick={handleDiscardDraft}
            >
              Eliminar borrador
            </button>
          ) : null}
        </div>
      </div>

      <section className="production-workspace-tabs-card" aria-label="Etapas de producción">
        <ProductionWorkflowNav
          active={activeTab}
          onChange={goToTab}
          productionStatus={!isNew ? productionStatus : undefined}
          statusPanel={workflowStatusPanel}
        />
        <div
          className="production-workspace-panel"
        >
          {error && (
            <p className="orders-error" style={{ marginBottom: '1rem' }} role="alert">
              {error}
            </p>
          )}

          <ProductionWorkflowPanel
            tabId="especificaciones"
            activeTab={activeTab}
            visited={visitedWorkflowTabs.has('especificaciones')}
          >
            <>
              <h2 className="production-workspace-panel-title production-specs-title">Especificaciones</h2>

              <div className="production-specs-layout">
                <ProductionSpecsSubNav active={specsSubTab} onChange={setSpecsSubTab} />

                <div className="production-specs-content">
              {specsSubTab === 'cliente' && (
                <div
                  className="production-specs-panel production-specs-panel--sections"
                  role="tabpanel"
                  id="production-specs-panel-cliente"
                  aria-labelledby="production-specs-subtab-cliente"
                >
                  <ProductionWorkspaceSection
                    tag="Cliente"
                    title="Datos del cliente"
                    subtitle="Seleccione quién encarga esta orden"
                    tone={0}
                  >
                    <ProductionClientPicker
                      clients={clients}
                      selectedId={clientId}
                      onSelect={client => {
                        setClientId(client?.id ?? '')
                        updatePreprensaDiseno(clearPreprensaHistorialSelection())
                      }}
                    />
                  </ProductionWorkspaceSection>
                </div>
              )}

              {specsSubTab === 'detalle-op' && (
                <div
                  className="production-specs-panel production-specs-panel--sections"
                  role="tabpanel"
                  id="production-specs-panel-detalle-op"
                  aria-labelledby="production-specs-subtab-detalle-op"
                >
                  {withProductionPanelSuspense(
                    <LazyProductionDetalleOpPanel
                      workName={workName}
                      onWorkNameChange={setWorkName}
                      quantity={specs.quantity}
                      onQuantityChange={value => updateSpecs('quantity', value)}
                      onQuantityPaste={text =>
                        updateSpecs('quantity', parseQuantityDigits(text))
                      }
                      onQuantityKeyDown={blockNonDigitKey}
                      vendedores={vendedores}
                      vendedorId={vendedorId}
                      onVendedorSelect={v => setVendedorId(v?.id ?? '')}
                    />
                  )}
                </div>
              )}
                </div>
              </div>
            </>
          </ProductionWorkflowPanel>

          <ProductionWorkflowPanel
            tabId="preprensa"
            activeTab={activeTab}
            visited={visitedWorkflowTabs.has('preprensa')}
          >
            <>
              <h2 className="production-workspace-panel-title production-specs-title">Preprensa</h2>

              <div className="production-specs-layout">
                <ProductionPreprensaSubNav active={preprensaSubTab} onChange={setPreprensaSubTab} />

                <div className="production-specs-content">
                  {preprensaSubTab === 'responsable' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-preprensa-panel-responsable"
                      aria-labelledby="production-preprensa-subtab-responsable"
                    >
                      {renderOperadorSection('preprensa', 'Preprensa', 'preprensa-operador')}
                      {renderPhaseStatusAction('preprensa')}
                    </div>
                  )}
                  {preprensaSubTab === 'diseno' && (
                    <div
                      className="production-preprensa-diseno-detail"
                      role="tabpanel"
                      id="production-preprensa-panel-diseno"
                      aria-labelledby="production-preprensa-subtab-diseno"
                    >
                      <PreprensaDisenoModoShell
                        value={specs.preprensaDiseno.designNuevo}
                        onChange={handlePreprensaDesignNuevoChange}
                      />
                      <p className="production-workspace-panel-desc production-preprensa-diseno-desc">
                        Registre el tipo de diseño, complete los datos del arte (nombre, PDF, colores
                        y planchas) y seleccione los acabados que aplican a esta orden.
                      </p>
                      <ProductionPreprensaDiseno
                        diseno={specs.preprensaDiseno}
                        isNewOrder={isNew}
                        orderQuantity={specs.quantity}
                        clientId={clientId}
                        clientName={clientName}
                        clients={clients}
                        disenosCliente={disenosCliente}
                        ordersLoading={ordersLoading}
                        planchas={planchas}
                        preciosMontaje={preciosMontaje}
                        onChange={updatePreprensaDiseno}
                        onHistorialSelect={applyHistorialTrabajo}
                        onClientSelect={client => {
                          setClientId(client?.id ?? '')
                          updatePreprensaDiseno(clearPreprensaHistorialSelection())
                        }}
                        onGoToClienteTab={() => {
                          goToTab('especificaciones')
                          setSpecsSubTab('cliente')
                        }}
                        onGoToDetalleOpTab={() => {
                          goToTab('especificaciones')
                          setSpecsSubTab('detalle-op')
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          </ProductionWorkflowPanel>

          <ProductionWorkflowPanel
            tabId="corte-papel"
            activeTab={activeTab}
            visited={visitedWorkflowTabs.has('corte-papel')}
          >
            <>
              <h2 className="production-workspace-panel-title production-specs-title">
                Corte de papel
              </h2>

              <div className="production-specs-layout">
                <ProductionCortePapelSubNav
                  active={cortePapelSubTab}
                  onChange={setCortePapelSubTab}
                />

                <div className="production-specs-content">
                  {cortePapelSubTab === 'responsable' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-corte-papel-panel-responsable"
                      aria-labelledby="production-corte-papel-subtab-responsable"
                    >
                      {renderOperadorSection('corte-papel', 'Corte de papel', 'corte-operador')}
                      {renderPhaseStatusAction('corte-papel')}
                    </div>
                  )}
                  {cortePapelSubTab === 'corte' && (
                  <div
                    className="production-preprensa-diseno-detail"
                    role="tabpanel"
                    id="production-corte-papel-panel-corte"
                    aria-labelledby="production-corte-papel-subtab-corte"
                  >
                    {withProductionPanelSuspense(
                      <LazyProductionCortePapelForm
                        row={paperRow}
                        paperRows={specs.paperRows}
                        tiposPapel={tiposPapel}
                        coloresPlanchas={specs.preprensaDiseno.coloresPlanchas}
                        margenRedondeo={normalizeMargenRedondeo(specs.margenRedondeo)}
                        clienteSuministraPapel={specs.clienteSuministraPapel ?? 'no'}
                        loadingTiposPapel={loadingTiposPapel && tiposPapel.length === 0}
                        activeColorPlanchaId={activeCorteColorPlanchaId}
                        onActiveColorPlanchaIdChange={setActiveCorteColorPlanchaId}
                        onPaperRowCommit={handlePaperRowCommit}
                        onPaperRowDelete={handlePaperRowDelete}
                        onClienteSuministraPapelChange={handleClienteSuministraPapelChange}
                        onPapelCortadoReset={handlePapelCortadoReset}
                        onMargenRedondeoChange={value =>
                          setSpecs(prev =>
                            mergeSpecsWithCorteMetrics(prev, {
                              margenRedondeo: normalizeMargenRedondeo(value),
                            })
                          )
                        }
                      />
                    )}
                    </div>
                  )}
                </div>
              </div>
            </>
          </ProductionWorkflowPanel>

          <ProductionWorkflowPanel
            tabId="impresion"
            activeTab={activeTab}
            visited={visitedWorkflowTabs.has('impresion')}
          >
            <>
              <h2 className="production-workspace-panel-title">Impresión</h2>

              <div className="production-specs-layout">
                <ProductionImpresionSubNav
                  active={impresionSubTab}
                  onChange={setImpresionSubTab}
                />

                <div className="production-specs-content">
                  {impresionSubTab === 'responsable' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-impresion-panel-responsable"
                      aria-labelledby="production-impresion-subtab-responsable"
                    >
                      {renderOperadorSection('impresion', 'Impresión', 'impresion-operador')}
                      {renderPhaseStatusAction('impresion')}
                    </div>
                  )}
                  {impresionSubTab === 'tintas' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-impresion-panel-tintas"
                      aria-labelledby="production-impresion-subtab-tintas"
                    >
                      {withProductionPanelSuspense(
                        <LazyProductionImpresionTintasPanel
                          coloresPlanchas={impresionColoresPlanchas}
                          registros={specs.impresionTintasRegistros ?? []}
                          activeColorPlanchaId={activeImpresionColorPlanchaId}
                          onActiveColorPlanchaIdChange={setActiveImpresionColorPlanchaId}
                          onRegistroChange={handleImpresionTintasRegistroChange}
                        />
                      )}
                    </div>
                  )}
                  {impresionSubTab === 'muestra' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-impresion-panel-muestra"
                      aria-labelledby="production-impresion-subtab-muestra"
                    >
                      {withProductionPanelSuspense(
                        <LazyProductionImpresionMuestraPanel
                          coloresPlanchas={impresionColoresPlanchas}
                          paperRows={specs.paperRows}
                          tiposPapel={tiposPapel}
                          activeColorPlanchaId={activeImpresionColorPlanchaId}
                          onActiveColorPlanchaIdChange={setActiveImpresionColorPlanchaId}
                          completedPlanchaIds={completedEstimarTintasPlanchaIds}
                          registros={specs.impresionEstimarTintasRegistros ?? []}
                          onRegistroChange={handleEstimarTintasRegistroChange}
                        />
                      )}
                    </div>
                  )}
                  {impresionSubTab === 'conversionImagen' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-impresion-panel-conversion-imagen"
                      aria-labelledby="production-impresion-subtab-conversionImagen"
                    >
                      {withProductionPanelSuspense(<LazyProductionImpresionConversionImagenPanel />)}
                    </div>
                  )}
                </div>
              </div>
            </>
          </ProductionWorkflowPanel>

          <ProductionWorkflowPanel
            tabId="terminados"
            activeTab={activeTab}
            visited={visitedWorkflowTabs.has('terminados')}
          >
            <>
              <h2 className="production-workspace-panel-title">Terminados</h2>

              <div className="production-specs-layout">
                <ProductionTerminadosSubNav
                  active={terminadosSubTab}
                  onChange={setTerminadosSubTab}
                  isNewOrder={isNew}
                />

                <div className="production-specs-content">
                  {terminadosSubTab === 'responsable' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-terminados-panel-responsable"
                      aria-labelledby="production-terminados-subtab-responsable"
                    >
                      {renderOperadorSection('terminados', 'Terminados', 'terminados-operador')}
                      {renderPhaseStatusAction('terminados')}
                    </div>
                  )}
                  {terminadosSubTab === 'asignacion' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-terminados-panel-asignacion"
                      aria-labelledby="production-terminados-subtab-asignacion"
                    >
                      {withProductionPanelSuspense(
                        <LazyProductionTerminadosPanel
                          coloresPlanchas={specs.preprensaDiseno.coloresPlanchas}
                          paperRows={specs.paperRows}
                          tiposPapel={tiposPapel}
                          margenRedondeo={normalizeMargenRedondeo(specs.margenRedondeo)}
                          clienteSuministraPapel={specs.clienteSuministraPapel ?? 'no'}
                          terminadosCatalog={terminadosCatalog}
                          quickAccessTerminados={quickAccessTerminados}
                          registros={specs.terminadosRegistros ?? []}
                          activeCorteRowKey={activeTerminadosCorteRowKey}
                          onActiveCorteRowKeyChange={setActiveTerminadosCorteRowKey}
                          onRegistrosChange={handleTerminadosRegistrosChange}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          </ProductionWorkflowPanel>

          <ProductionWorkflowPanel
            tabId="acabados"
            activeTab={activeTab}
            visited={visitedWorkflowTabs.has('acabados')}
          >
            <>
              <h2 className="production-workspace-panel-title">Acabados</h2>

              <div className="production-specs-layout">
                <ProductionAcabadosSubNav active={acabadosSubTab} onChange={setAcabadosSubTab} />

                <div className="production-specs-content">
                  {acabadosSubTab === 'responsable' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-acabados-panel-responsable"
                      aria-labelledby="production-acabados-subtab-responsable"
                    >
                      {renderOperadorSection('acabados', 'Acabados', 'acabados-operador')}
                      {renderPhaseStatusAction('acabados')}
                    </div>
                  )}
                  {acabadosSubTab === 'acabado' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-acabados-panel-acabado"
                      aria-labelledby="production-acabados-subtab-acabado"
                    >
                      {withProductionPanelSuspense(
                        <LazyProductionAcabadosPanel
                          coloresPlanchas={specs.preprensaDiseno.coloresPlanchas}
                          paperRows={specs.paperRows}
                          tiposPapel={tiposPapel}
                          margenRedondeo={normalizeMargenRedondeo(specs.margenRedondeo)}
                          clienteSuministraPapel={specs.clienteSuministraPapel ?? 'no'}
                          acabadosCatalog={acabadosCatalog}
                          quickAccessAcabados={quickAccessAcabados}
                          registros={specs.acabadosRegistros ?? []}
                          activeCorteRowKey={activeAcabadosCorteRowKey}
                          onActiveCorteRowKeyChange={setActiveAcabadosCorteRowKey}
                          onRegistrosChange={handleAcabadosRegistrosChange}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          </ProductionWorkflowPanel>

          <ProductionWorkflowPanel
            tabId="cobro"
            activeTab={activeTab}
            visited={visitedWorkflowTabs.has('cobro')}
          >
            <>
              <h2 className="production-workspace-panel-title">{PRODUCTION_COBRO_COPY.title}</h2>

              <div className="production-specs-layout">
                <ProductionCobroSubNav active={cobroSubTab} onChange={setCobroSubTab} />

                <div className="production-specs-content">
                  {cobroSubTab === 'responsable' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-cobro-panel-responsable"
                      aria-labelledby="production-cobro-subtab-responsable"
                    >
                      {renderOperadorSection('cobro', 'Cobro', 'cobro-operador')}
                    </div>
                  )}
                  {cobroSubTab === 'factura' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-cobro-panel-factura"
                      aria-labelledby="production-cobro-subtab-factura"
                    >
                      {withProductionPanelSuspense(
                        <LazyProductionOrderCobroPanel
                          clientName={clientName}
                          workName={workName}
                          quantity={specs.quantity}
                          specs={specs}
                          tiposPapel={tiposPapel}
                          cobroDescuentoModo={specs.cobroDescuentoModo ?? 'porcentaje'}
                          cobroDescuentoValor={specs.cobroDescuentoValor ?? 0}
                          onCobroDescuentoChange={patch =>
                            setSpecs(prev => ({ ...prev, ...patch }))
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          </ProductionWorkflowPanel>

          <footer className="production-workspace-footer">
            <button
              type="button"
              className="production-btn-secondary"
              disabled={activeTab === PRODUCTION_WORKFLOW_TABS[0].id}
              onClick={() => goToAdjacentTab(-1)}
            >
              Anterior
            </button>
            {activeTab !== PRODUCTION_WORKFLOW_TABS[PRODUCTION_WORKFLOW_TABS.length - 1].id ? (
              <button
                type="button"
                className="orders-btn-new"
                onClick={() => goToAdjacentTab(1)}
              >
                {nextStep ? `Siguiente: ${nextStep.label}` : 'Siguiente etapa'}
              </button>
            ) : isNew ? (
              <button
                type="button"
                className="orders-btn-new"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Crear orden'}
              </button>
            ) : (
              <button type="button" className="orders-btn-new" onClick={() => navigate(ROUTES.production.path)}>
                Volver al listado
              </button>
            )}
          </footer>
        </div>
      </section>
    </div>
  )
}

export default ProductionOrderWorkspace
