import type { Order, OrderSpecs } from '../entities/Order.js'
import type { ProductionTraceEvent, ProductionTracePhaseId } from '../entities/ProductionTrace.js'
import {
  getAssignedProductionPhases,
  type ProductionStatusPhaseId,
} from '../policies/productionOrderStatusPolicy.js'

const PHASE_OPERATOR_ID_FIELD: Record<ProductionStatusPhaseId, keyof OrderSpecs> = {
  preprensa: 'operadorPreprensaId',
  'corte-papel': 'operadorCortePapelId',
  impresion: 'operadorImpresionId',
  terminados: 'operadorTerminadosId',
  acabados: 'operadorAcabadosId',
}

export const PRODUCTION_OPERATOR_BASE_SEQUENCE = [
  'preprensa',
  'corte-papel',
  'impresion',
] as const satisfies readonly ProductionStatusPhaseId[]

export type ProductionOperatorProcessKind = 'base' | 'terminado' | 'acabado'

export type ProductionOperatorProcessStatus = 'pendiente' | 'en-proceso' | 'terminado'

export interface ProductionOperatorProcessRow {
  processKey: string
  kind: ProductionOperatorProcessKind
  phase: ProductionTracePhaseId
  label: string
  section: 'base' | 'terminados' | 'acabados'
  sequence: number
  prerequisiteKey: string | null
  totalUnits: number
  completedUnits: number
  deliveredUnits: number
  pendingUnits: number
  availableUnits: number
  assignedToUser: boolean
  /** Puede registrar avance de procesamiento (respeta secuencia del proceso anterior). */
  canRegisterProgress: boolean
  /** Puede registrar entrega parcial de lo ya procesado en este proceso. */
  canRegisterDelivery: boolean
  /** @deprecated Usar canRegisterProgress */
  canOperate: boolean
  status: ProductionOperatorProcessStatus
}

export interface ProductionOperatorOrderSummary {
  totalUnits: number
  completedAllProcesses: number
  deliveredUnits: number
  deliverableBalance: number
  deliveryProgressPct: number
  processCompletionPct: number
  laborTimeMs: number
  isOrderComplete: boolean
}

export interface ProductionOperatorDeliveryEntry {
  id: string
  at: string
  processKey: string
  processLabel: string
  units: number
  note?: string
  userId: string
}

export interface BuildOperatorProcessRowsInput {
  order: Order
  events: ProductionTraceEvent[]
  userId: string
  activeProductionStatus?: string
}

export interface ValidateOperatorUnitsInput {
  rows: ProductionOperatorProcessRow[]
  processKey: string
  units: number
  mode?: 'progress' | 'delivery'
}

const TERMINADO_PREFIX = 'terminado:'
const ACABADO_PREFIX = 'acabado:'

export const toTerminadoProcessKey = (terminadoId: string): string =>
  `${TERMINADO_PREFIX}${terminadoId}`

export const toAcabadoProcessKey = (operacionId: string): string =>
  `${ACABADO_PREFIX}${operacionId}`

export const resolveProcessPhase = (processKey: string): ProductionTracePhaseId => {
  if (processKey.startsWith(TERMINADO_PREFIX)) return 'terminados'
  if (processKey.startsWith(ACABADO_PREFIX)) return 'acabados'
  return processKey as ProductionTracePhaseId
}

export const orderIsAssignedToOperator = (specs: OrderSpecs, userId: string): boolean =>
  getAssignedProductionPhases(specs, userId).length > 0

export const filterOrdersAssignedToOperator = (orders: Order[], userId: string): Order[] =>
  orders.filter(order => orderIsAssignedToOperator(order.specs, userId))

export const operatorIsAssignedToProcess = (
  specs: OrderSpecs,
  userId: string,
  processKey: string
): boolean => {
  const phase = resolveProcessPhase(processKey)
  if (phase === 'cobro') return false
  const field = PHASE_OPERATOR_ID_FIELD[phase as ProductionStatusPhaseId]
  return specs[field] === userId
}

const collectTerminadoCatalog = (
  specs: OrderSpecs
): Array<{ id: string; label: string }> => {
  const seen = new Map<string, string>()
  for (const registro of specs.terminadosRegistros ?? []) {
    for (const entrada of registro.entradas ?? []) {
      for (const linea of entrada.lineas ?? []) {
        if (!seen.has(linea.terminadoId)) {
          seen.set(linea.terminadoId, linea.terminadoNombre)
        }
      }
    }
    for (const linea of registro.lineas ?? []) {
      if (!seen.has(linea.terminadoId)) {
        seen.set(linea.terminadoId, linea.terminadoNombre)
      }
    }
  }
  return [...seen.entries()].map(([id, label]) => ({ id, label }))
}

const collectAcabadoCatalog = (
  specs: OrderSpecs
): Array<{ id: string; label: string }> => {
  const seen = new Map<string, string>()
  for (const registro of specs.acabadosRegistros ?? []) {
    for (const entrada of registro.entradas ?? []) {
      for (const linea of entrada.lineas ?? []) {
        if (!seen.has(linea.operacionId)) {
          seen.set(linea.operacionId, linea.operacionNombre)
        }
      }
    }
  }
  return [...seen.entries()].map(([id, label]) => ({ id, label }))
}

const eventMatchesProcess = (
  event: ProductionTraceEvent,
  processKey: string
): boolean => {
  if (event.processKey) return event.processKey === processKey
  return event.processKey == null && event.phase === processKey
}

const sumProcessProgressUnits = (
  events: ProductionTraceEvent[],
  orderId: string,
  processKey: string
): number =>
  events
    .filter(
      event =>
        event.orderId === orderId &&
        event.type === 'avance_unidades' &&
        eventMatchesProcess(event, processKey)
    )
    .reduce((sum, event) => sum + Math.max(0, event.unidades ?? 0), 0)

const sumDeliveredUnits = (
  events: ProductionTraceEvent[],
  orderId: string,
  processKey: string
): number =>
  events
    .filter(
      event =>
        event.orderId === orderId &&
        event.type === 'entrega_parcial' &&
        eventMatchesProcess(event, processKey)
    )
    .reduce((sum, event) => sum + Math.max(0, event.unidades ?? 0), 0)

const resolvePrerequisiteKey = (
  processKey: string,
  terminadoKeys: string[]
): string | null => {
  if (processKey === 'preprensa') return null
  if (processKey === 'corte-papel') return 'preprensa'
  if (processKey === 'impresion') return 'corte-papel'
  if (processKey.startsWith(TERMINADO_PREFIX)) return 'impresion'
  if (processKey.startsWith(ACABADO_PREFIX)) {
    if (terminadoKeys.length === 0) return 'impresion'
    return terminadoKeys[0] ?? 'impresion'
  }
  return null
}

const resolveAvailableUnits = (
  processKey: string,
  completedByKey: Record<string, number>,
  terminadoKeys: string[],
  totalUnits: number
): number => {
  if (processKey === 'preprensa') return totalUnits
  if (processKey.startsWith(ACABADO_PREFIX) && terminadoKeys.length > 0) {
    return Math.min(...terminadoKeys.map(key => completedByKey[key] ?? 0))
  }
  const prerequisite = resolvePrerequisiteKey(processKey, terminadoKeys)
  if (!prerequisite) return totalUnits
  return completedByKey[prerequisite] ?? 0
}

const resolveProcessStatus = (
  completedUnits: number,
  totalUnits: number,
  canRegisterProgress: boolean
): ProductionOperatorProcessStatus => {
  if (completedUnits >= totalUnits && totalUnits > 0) return 'terminado'
  if (completedUnits > 0 || canRegisterProgress) return 'en-proceso'
  return 'pendiente'
}

export const buildOperatorProcessRows = ({
  order,
  events,
  userId,
}: BuildOperatorProcessRowsInput): ProductionOperatorProcessRow[] => {
  const totalUnits = Math.max(0, order.specs.quantity ?? 0)
  const terminados = collectTerminadoCatalog(order.specs)
  const acabados = collectAcabadoCatalog(order.specs)
  const terminadoKeys = terminados.map(item => toTerminadoProcessKey(item.id))

  const definitions: Array<{
    processKey: string
    kind: ProductionOperatorProcessKind
    phase: ProductionTracePhaseId
    label: string
    section: ProductionOperatorProcessRow['section']
    sequence: number
  }> = [
    { processKey: 'preprensa', kind: 'base', phase: 'preprensa', label: 'Pre-prensa', section: 'base', sequence: 1 },
    { processKey: 'corte-papel', kind: 'base', phase: 'corte-papel', label: 'Corte papel', section: 'base', sequence: 2 },
    { processKey: 'impresion', kind: 'base', phase: 'impresion', label: 'Impresión', section: 'base', sequence: 3 },
    ...terminados.map((item, index) => ({
      processKey: toTerminadoProcessKey(item.id),
      kind: 'terminado' as const,
      phase: 'terminados' as const,
      label: item.label,
      section: 'terminados' as const,
      sequence: 10 + index,
    })),
    ...acabados.map((item, index) => ({
      processKey: toAcabadoProcessKey(item.id),
      kind: 'acabado' as const,
      phase: 'acabados' as const,
      label: item.label,
      section: 'acabados' as const,
      sequence: 20 + index,
    })),
  ]

  const progressByKey: Record<string, number> = {}
  const deliveredByKey: Record<string, number> = {}
  for (const definition of definitions) {
    progressByKey[definition.processKey] = sumProcessProgressUnits(
      events,
      order.id,
      definition.processKey
    )
    deliveredByKey[definition.processKey] = sumDeliveredUnits(
      events,
      order.id,
      definition.processKey
    )
  }

  return definitions.map(definition => {
    const completedUnits = Math.min(totalUnits, progressByKey[definition.processKey] ?? 0)
    const deliveredUnits = Math.min(completedUnits, deliveredByKey[definition.processKey] ?? 0)
    const availableUnits = resolveAvailableUnits(
      definition.processKey,
      progressByKey,
      terminadoKeys,
      totalUnits
    )
    const pendingUnits = Math.max(0, totalUnits - completedUnits)
    const assignedToUser = operatorIsAssignedToProcess(order.specs, userId, definition.processKey)

    const canRegisterProgress = assignedToUser && availableUnits > completedUnits
    const canRegisterDelivery =
      assignedToUser && completedUnits > deliveredUnits && completedUnits > 0

    return {
      processKey: definition.processKey,
      kind: definition.kind,
      phase: definition.phase,
      label: definition.label,
      section: definition.section,
      sequence: definition.sequence,
      prerequisiteKey: resolvePrerequisiteKey(definition.processKey, terminadoKeys),
      totalUnits,
      completedUnits,
      deliveredUnits,
      pendingUnits,
      availableUnits,
      assignedToUser,
      canRegisterProgress,
      canRegisterDelivery,
      canOperate: canRegisterProgress,
      status: resolveProcessStatus(completedUnits, totalUnits, canRegisterProgress),
    }
  })
}

export const validateOperatorUnitsSubmission = ({
  rows,
  processKey,
  units,
  mode = 'progress',
}: ValidateOperatorUnitsInput): { ok: true } | { ok: false; message: string } => {
  if (!Number.isFinite(units) || units <= 0) {
    return { ok: false, message: 'Ingrese una cantidad mayor a cero.' }
  }

  const row = rows.find(item => item.processKey === processKey)
  if (!row) {
    return { ok: false, message: 'Proceso no encontrado.' }
  }
  if (!row.assignedToUser) {
    return { ok: false, message: 'No está asignado a este proceso.' }
  }

  if (mode === 'delivery') {
    const deliverableBalance = Math.max(0, row.completedUnits - row.deliveredUnits)
    if (deliverableBalance <= 0) {
      return {
        ok: false,
        message: 'No hay unidades procesadas pendientes de entrega en este proceso.',
      }
    }
    if (units > deliverableBalance) {
      return {
        ok: false,
        message: `Solo puede entregar hasta ${deliverableBalance.toLocaleString('es-CO')} unidades en este proceso.`,
      }
    }
    return { ok: true }
  }

  const prerequisite = row.prerequisiteKey
    ? rows.find(item => item.processKey === row.prerequisiteKey)
    : null
  if (prerequisite && row.completedUnits >= row.availableUnits && row.availableUnits < row.totalUnits) {
    return {
      ok: false,
      message: `Debe completar unidades en el proceso anterior (${prerequisite.label}) antes de continuar.`,
    }
  }

  const maxAllowed = Math.min(row.totalUnits, row.availableUnits)
  if (row.completedUnits >= maxAllowed) {
    return {
      ok: false,
      message: 'No hay unidades disponibles en el proceso anterior para continuar.',
    }
  }

  const nextTotal = row.completedUnits + units
  if (nextTotal > maxAllowed) {
    return {
      ok: false,
      message: `Solo puede procesar hasta ${Math.max(0, maxAllowed - row.completedUnits).toLocaleString('es-CO')} unidades en este proceso.`,
    }
  }

  if (nextTotal > row.totalUnits) {
    return {
      ok: false,
      message: `La cantidad supera el total de la orden (${row.totalUnits.toLocaleString('es-CO')}).`,
    }
  }

  return { ok: true }
}

export const buildOperatorOrderSummary = (
  rows: ProductionOperatorProcessRow[],
  events: ProductionTraceEvent[],
  order: Order,
  userId: string,
  now = Date.now()
): ProductionOperatorOrderSummary => {
  const totalUnits = Math.max(0, order.specs.quantity ?? 0)
  const baseRows = rows.filter(row => row.kind === 'base')
  const minBaseCompleted =
    baseRows.length > 0
      ? Math.min(...baseRows.map(row => row.completedUnits))
      : 0
  const allRowsCompleted =
    rows.length > 0 ? rows.every(row => row.completedUnits >= totalUnits) : false
  const completedAllProcesses = allRowsCompleted ? totalUnits : minBaseCompleted

  const deliveredUnits = events
    .filter(
      event =>
        event.orderId === order.id &&
        event.type === 'entrega_parcial' &&
        event.userId === userId
    )
    .reduce((sum, event) => sum + Math.max(0, event.unidades ?? 0), 0)

  const deliverableBalance = Math.max(0, completedAllProcesses - deliveredUnits)
  const deliveryProgressPct =
    totalUnits > 0 ? Math.round((deliveredUnits / totalUnits) * 100) : 0
  const processCompletionPct =
    totalUnits > 0 ? Math.round((completedAllProcesses / totalUnits) * 100) : 0

  const userEvents = events
    .filter(event => event.orderId === order.id && event.userId === userId)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
  const startedAt = userEvents[0]?.at
  const endedAt = allRowsCompleted ? userEvents.at(-1)?.at ?? null : null
  const laborTimeMs =
    startedAt != null
      ? Math.max(0, Date.parse(endedAt ?? new Date(now).toISOString()) - Date.parse(startedAt))
      : 0

  return {
    totalUnits,
    completedAllProcesses,
    deliveredUnits,
    deliverableBalance,
    deliveryProgressPct,
    processCompletionPct,
    laborTimeMs,
    isOrderComplete: allRowsCompleted,
  }
}

export const buildOperatorDeliveryHistory = (
  events: ProductionTraceEvent[],
  orderId: string,
  rows: ProductionOperatorProcessRow[]
): ProductionOperatorDeliveryEntry[] => {
  const labelByKey = new Map(rows.map(row => [row.processKey, row.label]))
  return events
    .filter(
      event =>
        event.orderId === orderId &&
        (event.type === 'entrega_parcial' || event.type === 'avance_unidades')
    )
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .map(event => ({
      id: event.id,
      at: event.at,
      processKey: event.processKey ?? event.phase,
      processLabel: labelByKey.get(event.processKey ?? event.phase) ?? event.phase,
      units: event.unidades ?? 0,
      note: event.nota,
      userId: event.userId,
    }))
}
