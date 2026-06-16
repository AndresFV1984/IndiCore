import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductionWorkflowNav from './ProductionWorkflowNav'
import StatusBadge from '../../components/ui/StatusBadge'
import { useOrdersHook } from '../../hooks/useOrders'
import { Container } from '../../../di/container'
import { Money } from '../../../core/domain/value-objects/Money'
import { CreateOrderDTO, OrderSpecs, type PaperRow, type ImpresionTintasRegistro, type TerminadosProduccionRegistro, type AcabadosProduccionRegistro } from '../../../core/domain/entities/Order'
import { ROUTES } from '../../../config/appRoutes'
import { formatProductionOrderId } from '../../../core/domain/value-objects/ProductionOrderId'
import {
  PRODUCTION_WORKFLOW_TABS,
  ProductionWorkflowTabId,
} from './productionTabs'
import '../remissions/Remissions.css'
import '../orders/Orders.css'
import './Production.css'
import ProductionKpiGrid from './ProductionKpiGrid'
import ProductionSpecsSubNav from './ProductionSpecsSubNav'
import ProductionPreprensaSubNav from './ProductionPreprensaSubNav'
import ProductionImpresionSubNav from './ProductionImpresionSubNav'
import ProductionCortePapelSubNav from './ProductionCortePapelSubNav'
import ProductionTerminadosSubNav from './ProductionTerminadosSubNav'
import ProductionAcabadosSubNav from './ProductionAcabadosSubNav'
import ProductionImpresionTintasPanel from './ProductionImpresionTintasPanel'
import ProductionTerminadosPanel from './ProductionTerminadosPanel'
import ProductionAcabadosPanel from './ProductionAcabadosPanel'
import ProductionClientPicker from './ProductionClientPicker'
import ProductionDetalleOpPanel from './ProductionDetalleOpPanel'
import ProductionOperadorAssignmentSection from './ProductionOperadorAssignmentSection'
import { SpecsSubTabId } from './productionSpecsSubTabs'
import { PreprensaSubTabId } from './productionPreprensaSubTabs'
import { CortePapelSubTabId } from './productionCortePapelSubTabs'
import { ImpresionSubTabId } from './productionImpresionSubTabs'
import { TerminadosSubTabId } from './productionTerminadosSubTabs'
import { AcabadosSubTabId } from './productionAcabadosSubTabs'
import { useUsersHook } from '../../hooks/useUsers'
import type { UserPermission, UserRole } from '../../../core/domain/auth/userPermissions'
import {
  OPERADOR_ASSIGNMENT_FIELDS,
  normalizeOperadorPermissionFilters,
  resolveOperadorRoleFilter,
  type ProductionAssignmentPhaseId,
} from './utils/productionOperatorAssignment'
import { Client } from '../../../core/domain/entities/Client'
import { Vendedor } from '../../../core/domain/entities/Vendedor'
import { TamanoPlancha } from '../../../core/domain/entities/TamanoPlancha'
import { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import { PrecioMontaje } from '../../../core/domain/entities/PrecioMontaje'
import { emptyPreprensaDiseno, PreprensaDisenoSpecs } from '../../../core/domain/entities/PreprensaDiseno'
import { buildPreprensaFromHistorial, clearPreprensaHistorialSelection, normalizePreprensaSnapshot } from './utils/applyPreprensaFromHistorial'
import {
  applyColoresPlanchasForHistorialReuse,
  buildColoresPlanchasPatch,
} from './utils/coloresPlanchasUtils'
import { ClienteDisenoOption } from './utils/buildClienteDisenos'
import ProductionPreprensaDiseno from './ProductionPreprensaDiseno'
import PreprensaDisenoModoShell from './PreprensaDisenoModoShell'
import { patchPreprensaDesignNuevo } from './utils/preprensaDesignNuevoChange'
import { patchCorteClienteSuministraPapel } from './utils/corteClienteSuministraPapelChange'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import { buildClienteDisenosFromOrders } from './utils/buildClienteDisenos'
import { useTipoPapelHook } from '../../hooks/useTipoPapel'
import { useTerminadosHook } from '../../hooks/useTerminados'
import { useOperacionesHook } from '../../hooks/useOperaciones'
import ProductionCortePapelForm from './ProductionCortePapelForm'
import { emptyPaperRow, normalizeTipoPapelList, syncPaperRowsWithTipoPapelCatalog } from './utils/tipoPapelDisplay'
import { DEFAULT_MARGEN_REDONDEO, normalizeMargenRedondeo } from './utils/cortePapelCalculations'
import {
  appendFaltanteLitografiaRow,
  findPaperRowForActiveId,
  isFaltanteLitografiaRow,
  resetPaperRowForActiveId,
  upsertPaperRow,
} from './utils/cortePapelFaltante'
import {
  paperRowsMatchColoresPlanchas,
  resolveOrderCortePapelMetrics,
  syncPaperRowsWithColoresPlanchas,
} from './utils/paperRowsSync'
import { CORTE_PAPEL_COPY as cortePapelCopy } from './constants/cortePapelCopy'
import {
  buildProductionNewOrderDraft,
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
  syncImpresionTintasRegistros,
} from './utils/impresionTintasUtils'
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
import { confirmAction } from '../../utils/actionFeedback'

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
  terminadosRegistros: [],
  acabadosRegistros: [],
  machineOutputValue: new Money(0),
  chapoliado: false,
  finishes: [],
  operations: [],
})

const ProductionOrderWorkspace: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const isNew = orderId === 'new'
  const { orders, loading: ordersLoading, createOrder } = useOrdersHook()
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
  const [specsSubTab, setSpecsSubTab] = useState<SpecsSubTabId>('cliente')
  const [preprensaSubTab, setPreprensaSubTab] = useState<PreprensaSubTabId>('diseno')
  const [cortePapelSubTab, setCortePapelSubTab] = useState<CortePapelSubTabId>('corte')
  const [impresionSubTab, setImpresionSubTab] = useState<ImpresionSubTabId>('tintas')
  const [terminadosSubTab, setTerminadosSubTab] = useState<TerminadosSubTabId>('asignacion')
  const [acabadosSubTab, setAcabadosSubTab] = useState<AcabadosSubTabId>('acabado')
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

  const hydrateFromPersistedDraft = useCallback(() => {
    const draft = useProductionNewOrderDraftStore.getState().draft
    if (!draft || !productionDraftHasContent(draft)) return false
    setClientId(draft.clientId)
    setVendedorId(draft.vendedorId)
    setWorkName(draft.workName)
    setActiveTab(resolveActiveTabFromDraft(draft))
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
      return
    }
    if (draftHydratedRef.current) return
    draftHydratedRef.current = true
    if (!hydrateFromPersistedDraft()) {
      resetNewOrderForm()
    }
  }, [isNew, orderId, hydrateFromPersistedDraft, resetNewOrderForm])

  useEffect(() => {
    if (!isNew || !draftHydratedRef.current) return
    const snapshot = buildProductionNewOrderDraft({
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
    if (productionDraftHasContent(snapshot)) {
      setDraft(snapshot)
    } else {
      clearDraft()
    }
  }, [
    isNew,
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
    setDraft,
    clearDraft,
  ])

  const impresionColoresPlanchas = useMemo(
    () => normalizePreprensaSnapshot(specs.preprensaDiseno).coloresPlanchas,
    [specs.preprensaDiseno]
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
    },
    []
  )

  const renderOperadorSection = (
    phase: ProductionAssignmentPhaseId,
    etapa: string,
    tone: 0 | 1 | 2,
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
        tone={tone}
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

  const applyHistorialTrabajo = (option: ClienteDisenoOption) => {
    const sourceOrder = orders.find(o => o.id === option.sourceOrderId)
    const raw = sourceOrder?.specs.preprensaDiseno ?? option.preprensaSnapshot
    const coloresPlanchas = applyColoresPlanchasForHistorialReuse(raw, specs.quantity, planchas)
    const preprensaDiseno: PreprensaDisenoSpecs = {
      ...emptyPreprensaDiseno(),
      ...buildPreprensaFromHistorial(raw, option.sourceOrderId, option.workName),
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
    setSpecs(prev =>
      mergeSpecsWithCorteMetrics(prev, {
        paperRows: upsertPaperRow(prev.paperRows, row),
      })
    )
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

  const handleAddFaltanteLitografia = (parent: PaperRow, hojasFaltante: number) => {
    let nextActiveId: string | undefined
    setSpecs(prev => {
      const result = appendFaltanteLitografiaRow(prev.paperRows, parent, hojasFaltante)
      if (!result) return prev
      nextActiveId = result.corteRowId
      return mergeSpecsWithCorteMetrics(prev, { paperRows: result.paperRows })
    })
    if (nextActiveId) {
      queueMicrotask(() => setActiveCorteColorPlanchaId(nextActiveId!))
    }
  }

  const handleClienteSuministraPapelChange = (value: OrderSpecs['clienteSuministraPapel']) => {
    setSpecs(prev => {
      const patch = patchCorteClienteSuministraPapel(
        value,
        prev.preprensaDiseno.coloresPlanchas,
        prev.paperRows
      )
      const firstId = prev.preprensaDiseno.coloresPlanchas[0]?.id ?? ''
      setActiveCorteColorPlanchaId(firstId)
      return mergeSpecsWithCorteMetrics(prev, patch)
    })
  }

  const goToTab = (id: ProductionWorkflowTabId) => {
    setActiveTab(id)
    setError(null)
    if (id === 'prepensa') {
      setPreprensaSubTab('diseno')
    }
    if (id === 'corte-papel') {
      setCortePapelSubTab('corte')
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
      clearDraft()
      navigate(`${ROUTES.production.path}/${order.id}`, { replace: true })
    } catch {
      setError('No se pudo guardar la orden. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

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
          ) : (
            existingOrder && <StatusBadge status={existingOrder.status} />
          )}
        </div>
      </div>

      <ProductionKpiGrid orders={orders} />

      <section className="production-workspace-tabs-card" aria-label="Etapas de producción">
        <ProductionWorkflowNav active={activeTab} onChange={goToTab} />
        <div
          className="production-workspace-panel"
          role="tabpanel"
          id={`production-panel-${activeTab}`}
          aria-labelledby={`production-tab-${activeTab}`}
        >
          {error && (
            <p className="orders-error" style={{ marginBottom: '1rem' }} role="alert">
              {error}
            </p>
          )}

          {activeTab === 'especificaciones' && (
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
                  <ProductionDetalleOpPanel
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
                </div>
              )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'prepensa' && (
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
                      {renderOperadorSection('preprensa', 'Preprensa', 0, 'preprensa-operador')}
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
                        onChange={value =>
                          updatePreprensaDiseno(patchPreprensaDesignNuevo(value))
                        }
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
          )}

          {activeTab === 'corte-papel' && (
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
                      {renderOperadorSection('corte-papel', 'Corte de papel', 1, 'corte-operador')}
                    </div>
                  )}
                  {cortePapelSubTab === 'corte' && (
                  <div
                    className="production-preprensa-diseno-detail"
                    role="tabpanel"
                    id="production-corte-papel-panel-corte"
                    aria-labelledby="production-corte-papel-subtab-corte"
                  >
                    <ProductionCortePapelForm
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
                        onAddFaltanteLitografia={handleAddFaltanteLitografia}
                        onMargenRedondeoChange={value =>
                          setSpecs(prev =>
                            mergeSpecsWithCorteMetrics(prev, {
                              margenRedondeo: normalizeMargenRedondeo(value),
                            })
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'impresion' && (
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
                      {renderOperadorSection('impresion', 'Impresión', 2, 'impresion-operador')}
                    </div>
                  )}
                  {impresionSubTab === 'tintas' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-impresion-panel-tintas"
                      aria-labelledby="production-impresion-subtab-tintas"
                    >
                      <ProductionImpresionTintasPanel
                        coloresPlanchas={impresionColoresPlanchas}
                        registros={specs.impresionTintasRegistros ?? []}
                        activeColorPlanchaId={activeImpresionColorPlanchaId}
                        onActiveColorPlanchaIdChange={setActiveImpresionColorPlanchaId}
                        onRegistroChange={handleImpresionTintasRegistroChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'terminados' && (
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
                      {renderOperadorSection('terminados', 'Terminados', 1, 'terminados-operador')}
                    </div>
                  )}
                  {terminadosSubTab === 'asignacion' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-terminados-panel-asignacion"
                      aria-labelledby="production-terminados-subtab-asignacion"
                    >
                      <ProductionTerminadosPanel
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
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'acabados' && (
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
                      {renderOperadorSection('acabados', 'Acabados', 2, 'acabados-operador')}
                    </div>
                  )}
                  {acabadosSubTab === 'acabado' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-acabados-panel-acabado"
                      aria-labelledby="production-acabados-subtab-acabado"
                    >
                      <ProductionAcabadosPanel
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
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

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
