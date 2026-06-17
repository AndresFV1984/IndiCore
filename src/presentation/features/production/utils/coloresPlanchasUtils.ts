import type { PaperRow } from '../../../../core/domain/entities/Order'
import {
  DisenoColorPlanchaItem,
  DisenoColoresOption,
  PreprensaDisenoSpecs,
  YesNoChoice,
} from '../../../../core/domain/entities/PreprensaDiseno'
import { createId } from '../../../../core/utils/createId'
import { TamanoPlancha } from '../../../../core/domain/entities/TamanoPlancha'
import {
  DISENO_COLORES_COUNT_OPTIONS,
  getColoresCountFromOption,
  getDisenoColoresCountMeta,
  normalizeDisenoColoresValue,
} from '../constants/preprensaDisenoColors'

export const getColoresOptionMeta = (colores: DisenoColoresOption) =>
  getDisenoColoresCountMeta(colores)

export const getColoresCount = (colores: DisenoColoresOption | ''): number =>
  getColoresCountFromOption(colores)

/** Número de planchas asociado a la opción de colores (1–7+). */
export const resolveNumeroPlanchasItem = (item: DisenoColorPlanchaItem): number =>
  getColoresCount(item.colores)

/** Planchas a cobrar en reposición (× precio plancha). */
export const resolveCantidadReposicionCobro = (item: DisenoColorPlanchaItem): number =>
  item.cantidadReposicion ?? 0

export type TamanosBuenosCalcResult =
  | { ok: true; value: number }
  | { ok: false; reason: 'sin-cavidad' | 'sin-cantidad' }

/** Redondeo matemático al entero más cercano (valores positivos). */
export const roundToInteger = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.round(value)
}

/** Cociente con redondeo matemático estándar (p. ej. 3850 ÷ 24 → 160). */
export const roundDivision = (dividend: number, divisor: number): number => {
  if (dividend <= 0 || divisor <= 0) return 0
  return roundToInteger(dividend / divisor)
}

/** Tamaños buenos = cantidad ÷ cavidades, redondeado al entero más cercano. */
export const computeTamanosBuenos = (
  cantidad: number,
  numeroCavidades: number
): TamanosBuenosCalcResult => {
  if (numeroCavidades <= 0) return { ok: false, reason: 'sin-cavidad' }
  if (cantidad <= 0) return { ok: false, reason: 'sin-cantidad' }
  return { ok: true, value: roundDivision(cantidad, numeroCavidades) }
}

/** Tamaños buenos vigentes de un registro (siempre desde cantidad y cavidades). */
export const resolveTamanosBuenosForItem = (item: DisenoColorPlanchaItem): number =>
  resolveTamanosBuenosValue(item.cantidad, item.numeroCavidades)

export const resolveTamanosBuenosValue = (
  cantidad: number,
  numeroCavidades: number
): number => {
  const result = computeTamanosBuenos(cantidad, numeroCavidades)
  return result.ok ? result.value : 0
}

export const applyTamanosBuenosToItem = (
  item: DisenoColorPlanchaItem
): DisenoColorPlanchaItem => ({
  ...item,
  tamanosBuenos: resolveTamanosBuenosValue(item.cantidad, item.numeroCavidades),
})

/** Normaliza descripción/detalle para comparar duplicados (sin distinguir mayúsculas). */
export const normalizeRegistroDetalle = (detalle: string): string =>
  detalle.trim().toLocaleLowerCase('es-CO')

/** Mismo tipo de plancha y misma descripción/detalle en la lista de especificaciones técnicas. */
export const hasDuplicateColoresPlanchaRegistro = (
  items: DisenoColorPlanchaItem[],
  planchaId: string,
  detalle: string,
  excludeId?: string
): boolean => {
  const normalizedPlanchaId = planchaId.trim()
  const normalizedDetalle = normalizeRegistroDetalle(detalle)
  if (!normalizedPlanchaId || !normalizedDetalle) return false
  return items.some(
    item =>
      item.id !== excludeId &&
      item.planchaId === normalizedPlanchaId &&
      normalizeRegistroDetalle(item.detalle) === normalizedDetalle
  )
}

/** Suma de tamaños buenos (recalculados) + sobrante en Preprensa › Especificaciones técnicas. */
export const sumTamanosBuenosYSobrante = (items: DisenoColorPlanchaItem[]): number =>
  items.reduce(
    (sum, item) => sum + resolveTamanosBuenosForItem(item) + (item.sobrante ?? 0),
    0
  )

/**
 * Corte de papel › Cantidad hojas =
 * Σ (tamaños buenos + sobrante) ÷ piezas por pliego (despiece en Tipo de papel),
 * con redondeo matemático al entero más cercano.
 */
export const deriveCantidadHojas = (
  items: DisenoColorPlanchaItem[],
  piezasPorPliego: number
): number => roundDivision(sumTamanosBuenosYSobrante(items), piezasPorPliego)

/** Alcance de colores/planchas para un registro de corte (uno o todos). */
export const resolveColoresPlanchaForRow = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  row: PaperRow
): DisenoColorPlanchaItem[] => {
  const registroId = row.colorPlanchaId ?? row.faltanteDeColorPlanchaId
  if (registroId) {
    const item = coloresPlanchas.find(c => c.id === registroId)
    return item ? [item] : []
  }
  return coloresPlanchas
}

/** @deprecated Usar deriveCantidadHojas con piezas por pliego del despiece seleccionado. */
export const deriveCantidadHojasFromColoresPlanchas = (
  items: DisenoColorPlanchaItem[]
): number => deriveCantidadHojas(items, 1)

/** @deprecated Usar getColoresCount */
export const getColoresInkNumber = getColoresCount

export const computeRegistroValorTotal = (
  numeroPlanchas: number,
  precioPlancha: number
): number => Math.round(numeroPlanchas * precioPlancha)

export const isClienteSuministraPlanchas = (
  clienteSuministraPlanchas: YesNoChoice | undefined
): boolean => (clienteSuministraPlanchas ?? 'no') === 'si'

export const resolveItemClienteSuministraPlanchas = (
  item: DisenoColorPlanchaItem,
  context?: ColoresPlanchasPricingContext
): YesNoChoice =>
  item.clienteSuministraPlanchas ?? context?.clienteSuministraPlanchas ?? 'no'

export const isItemClienteSuministraPlanchas = (
  item: DisenoColorPlanchaItem,
  context?: ColoresPlanchasPricingContext
): boolean => isClienteSuministraPlanchas(resolveItemClienteSuministraPlanchas(item, context))

export const deriveClienteSuministraPlanchasFromItems = (
  items: DisenoColorPlanchaItem[]
): YesNoChoice =>
  items.some(item => item.clienteSuministraPlanchas === 'si') ? 'si' : 'no'

export type ColoresPlanchasPricingContext = {
  historialMode?: boolean
  clienteSuministraPlanchas?: YesNoChoice
}

export const buildItemPricingContext = (
  item: DisenoColorPlanchaItem,
  context: ColoresPlanchasPricingContext = {}
): ColoresPlanchasPricingContext => ({
  historialMode: context.historialMode,
  clienteSuministraPlanchas: resolveItemClienteSuministraPlanchas(item, context),
})

/** Diseño existente: precio solo si hay reposición o registro manual de esta orden. */
export const itemAplicaPrecioPlancha = (
  item: DisenoColorPlanchaItem,
  context?: ColoresPlanchasPricingContext | boolean
): boolean => {
  const historialMode =
    typeof context === 'boolean' ? context : Boolean(context?.historialMode)
  const clienteSuministra =
    typeof context === 'boolean'
      ? false
      : isItemClienteSuministraPlanchas(item, context)
  if (clienteSuministra) return false
  return !historialMode || Boolean(item.registroManual) || Boolean(item.reposicionPlancha)
}

export const clearColoresPlanchasPrecios = (
  items: DisenoColorPlanchaItem[]
): DisenoColorPlanchaItem[] =>
  items.map(item => ({
    ...item,
    planchaValor: 0,
    valorTotal: 0,
    reposicionPlancha: false,
    cantidadReposicion: 0,
  }))

/** Texto estándar en descripción cuando el cliente entrega la plancha. */
const CLIENTE_SUMINISTRA_PLANCHA_LEAD = 'cliente suministra'
const LEGACY_CLIENTE_SUMINISTRA_PLANCHA_LEAD = 'cliente suministra plancha'

const stripDetalleSeparador = (value: string): string =>
  value.replace(/^[:.\-—–|]\s*/, '').trim()

const buildClienteSuministraPlanchaSuffix = (tipoPlancha: string): string => {
  const tipo = tipoPlancha.trim()
  return tipo ? `Cliente suministra — ${tipo}` : 'Cliente suministra planchas'
}

/** Formato anterior (duplicaba «plancha» con el nombre del tipo). */
const buildLegacyClienteSuministraPlanchaSuffix = (tipoPlancha: string): string => {
  const tipo = tipoPlancha.trim()
  return tipo ? `Cliente suministra plancha ${tipo}` : 'Cliente suministra plancha'
}

const clienteSuministraSuffixCandidates = (tipoPlancha: string): string[] => [
  buildClienteSuministraPlanchaSuffix(tipoPlancha),
  buildLegacyClienteSuministraPlanchaSuffix(tipoPlancha),
]

/** Extrae la parte editable del usuario, sin el texto automático de suministro. */
export const extractDescripcionUsuarioClienteSuministra = (
  detalle: string,
  tipoPlancha = ''
): string => {
  const rest = detalle.trim()
  if (!rest) return ''

  for (const suffix of clienteSuministraSuffixCandidates(tipoPlancha)) {
    const suffixLower = suffix.toLowerCase()
    const suffixIndex = rest.toLowerCase().indexOf(suffixLower)
    if (suffixIndex > 0) {
      const before = rest.slice(0, suffixIndex).replace(/\s*[—–\-|]\s*$/, '').trim()
      if (
        before &&
        !before.toLowerCase().startsWith(CLIENTE_SUMINISTRA_PLANCHA_LEAD) &&
        !before.toLowerCase().startsWith(LEGACY_CLIENTE_SUMINISTRA_PLANCHA_LEAD)
      ) {
        return before
      }
    }
    if (rest.toLowerCase() === suffixLower) return ''
  }

  // Compatibilidad con orden anterior: prefijo al inicio
  if (rest.toLowerCase().startsWith(LEGACY_CLIENTE_SUMINISTRA_PLANCHA_LEAD)) {
    let legacy = rest.slice(LEGACY_CLIENTE_SUMINISTRA_PLANCHA_LEAD.length).trim()
    legacy = stripDetalleSeparador(legacy)
    const tipo = tipoPlancha.trim()
    if (tipo && legacy.toLowerCase().startsWith(tipo.toLowerCase())) {
      legacy = legacy.slice(tipo.length).trim()
      legacy = stripDetalleSeparador(legacy)
    }
    return legacy
  }

  if (rest.toLowerCase().startsWith(CLIENTE_SUMINISTRA_PLANCHA_LEAD)) {
    let legacy = rest.slice(CLIENTE_SUMINISTRA_PLANCHA_LEAD.length).trim()
    legacy = stripDetalleSeparador(legacy)
    const tipo = tipoPlancha.trim()
    if (tipo && legacy.toLowerCase().startsWith(tipo.toLowerCase())) {
      legacy = legacy.slice(tipo.length).trim()
      legacy = stripDetalleSeparador(legacy)
    }
    return legacy
  }

  return rest
}

export const buildClienteSuministraPlanchaDetalle = (
  tipoPlancha: string,
  descripcionUsuario?: string
): string => {
  const suffix = buildClienteSuministraPlanchaSuffix(tipoPlancha)
  const user = extractDescripcionUsuarioClienteSuministra(descripcionUsuario ?? '', tipoPlancha)
  if (!user) return suffix
  return `${user} — ${suffix}`
}

export const applyClienteSuministraPlanchaDetalleToItems = (
  items: DisenoColorPlanchaItem[]
): DisenoColorPlanchaItem[] =>
  items.map(item => {
    const nombre = item.planchaNombreMedida?.trim()
    const withDetalle = nombre
      ? {
          ...item,
          detalle: buildClienteSuministraPlanchaDetalle(
            nombre,
            extractDescripcionUsuarioClienteSuministra(item.detalle, nombre)
          ),
        }
      : item
    return {
      ...withDetalle,
      planchaValor: 0,
      valorTotal: 0,
    }
  })

/** Restaura la descripción editable al volver a cobrar planchas de la empresa. */
export const applyLitografiaPlanchaDetalleToItems = (
  items: DisenoColorPlanchaItem[]
): DisenoColorPlanchaItem[] =>
  items.map(item => {
    const nombre = item.planchaNombreMedida?.trim() ?? ''
    const userPart = extractDescripcionUsuarioClienteSuministra(item.detalle, nombre)
    return { ...item, detalle: userPart }
  })

/** Recalcula precios guardados al volver a litografía (p. ej. tras suministro del cliente). */
export const restoreLitografiaPlanchaPreciosInItems = (
  items: DisenoColorPlanchaItem[],
  planchas: TamanoPlancha[] = [],
  context: ColoresPlanchasPricingContext = {}
): DisenoColorPlanchaItem[] =>
  items.map(item => {
    if (!itemAplicaPrecioPlancha(item, context)) {
      if (item.planchaValor > 0 || item.valorTotal > 0) {
        return { ...item, planchaValor: 0, valorTotal: 0 }
      }
      return item
    }
    const cantidadCobro = item.reposicionPlancha
      ? resolveCantidadReposicionCobro(item)
      : item.numeroPlanchas
    const plancha = planchas.find(p => p.id === item.planchaId)
    if (plancha) {
      return { ...item, ...buildPrecioPatchFromCatalog(item, plancha, cantidadCobro, context) }
    }
    if (item.planchaValor > 0 && cantidadCobro > 0) {
      return {
        ...item,
        valorTotal: computeRegistroValorTotal(cantidadCobro, item.planchaValor),
      }
    }
    return item
  })

export const resolveItemValorTotal = (
  item: DisenoColorPlanchaItem,
  options?: ColoresPlanchasPricingContext
): number => {
  if (!itemAplicaPrecioPlancha(item, options)) return 0
  if (item.reposicionPlancha) {
    const cantidadCobro = resolveCantidadReposicionCobro(item)
    if (cantidadCobro > 0 && item.planchaValor > 0) {
      return computeRegistroValorTotal(cantidadCobro, item.planchaValor)
    }
    return 0
  }
  if (item.valorTotal > 0) return item.valorTotal
  if (item.numeroPlanchas > 0 && item.planchaValor > 0) {
    return computeRegistroValorTotal(item.numeroPlanchas, item.planchaValor)
  }
  return 0
}

export const sumValorTotalPlanchas = (
  items: DisenoColorPlanchaItem[],
  context: ColoresPlanchasPricingContext = {}
): number =>
  items.reduce((sum, item) => sum + resolveItemValorTotal(item, context), 0)

export const resolvePrecioPlanchaDisplay = (
  item: DisenoColorPlanchaItem,
  catalogValor: number | undefined,
  context: ColoresPlanchasPricingContext
): number => {
  if (!itemAplicaPrecioPlancha(item, context)) return 0
  return catalogValor ?? item.planchaValor ?? 0
}

export const buildPrecioPatchFromCatalog = (
  item: DisenoColorPlanchaItem,
  plancha: TamanoPlancha | undefined,
  cantidadCobro: number,
  context: ColoresPlanchasPricingContext = {}
): Pick<
  DisenoColorPlanchaItem,
  'planchaId' | 'planchaNombreMedida' | 'planchaValor' | 'valorTotal'
> => {
  if (!plancha) {
    return { planchaValor: 0, valorTotal: 0 }
  }
  if (!itemAplicaPrecioPlancha(item, context)) {
    return {
      ...snapshotFromPlancha(plancha),
      planchaValor: 0,
      valorTotal: 0,
    }
  }
  const planchaValor = plancha.valor
  return {
    ...snapshotFromPlancha(plancha),
    planchaValor,
    valorTotal:
      cantidadCobro > 0
        ? computeRegistroValorTotal(cantidadCobro, planchaValor)
        : 0,
  }
}

/** Resumen en `colores`: opción con mayor cantidad de puntos en la lista */
export const deriveColoresSummary = (
  items: DisenoColorPlanchaItem[]
): DisenoColoresOption | '' => {
  if (!items.length) return ''
  return items.reduce((best, item) => {
    const bestN = getColoresCount(best.colores)
    const itemN = getColoresCount(item.colores)
    return itemN > bestN ? item : best
  }).colores
}

export const deriveCavidadesSummary = (items: DisenoColorPlanchaItem[]): number => {
  if (!items.length) return 0
  return Math.max(...items.map(i => i.numeroCavidades))
}

export const legacyPlanchaFromList = (
  items: DisenoColorPlanchaItem[]
): Pick<PreprensaDisenoSpecs, 'planchaId' | 'planchaNombreMedida' | 'planchaValor'> => {
  const first = items[0]
  if (!first) {
    return { planchaId: '', planchaNombreMedida: '', planchaValor: 0 }
  }
  return {
    planchaId: first.planchaId,
    planchaNombreMedida: first.planchaNombreMedida,
    planchaValor: first.planchaValor,
  }
}

const countFromColorIndex = (colorIndex: number): DisenoColoresOption | undefined =>
  DISENO_COLORES_COUNT_OPTIONS[Math.min(Math.max(colorIndex, 1), 7) - 1]?.value

const migrateItem = (
  item: DisenoColorPlanchaItem & { colorIndex?: number },
  fallbackColores: DisenoColoresOption | '',
  fallbackCavidades: number
): DisenoColorPlanchaItem => {
  const normalized = normalizeDisenoColoresValue(item.colores)
  const colores =
    normalized ||
    (item.colorIndex != null && item.colorIndex >= 1
      ? countFromColorIndex(item.colorIndex)
      : undefined) ||
    normalizeDisenoColoresValue(fallbackColores) ||
    '1-color'

  const cantidad = item.cantidad ?? 0
  const numeroPlanchas = item.numeroPlanchas ?? 0
  const planchaValor = item.planchaValor ?? 0
  const valorTotal =
    item.valorTotal ??
    (numeroPlanchas > 0 && planchaValor > 0
      ? computeRegistroValorTotal(numeroPlanchas, planchaValor)
      : 0)

  return {
    id: item.id,
    colores,
    planchaId: item.planchaId,
    planchaNombreMedida: item.planchaNombreMedida,
    planchaValor,
    cantidad,
    numeroPlanchas,
    valorTotal,
    numeroCavidades: item.numeroCavidades ?? fallbackCavidades,
    tamanosBuenos: resolveTamanosBuenosValue(
      cantidad,
      item.numeroCavidades ?? fallbackCavidades
    ),
    sobrante: item.sobrante ?? 0,
    detalle: item.detalle ?? '',
    observacion: item.observacion ?? '',
    reposicionPlancha: Boolean(item.reposicionPlancha),
    cantidadReposicion: item.cantidadReposicion ?? 0,
    registroManual: Boolean(item.registroManual),
  }
}

const snapshotFromPlancha = (plancha: TamanoPlancha) => ({
  planchaId: plancha.id,
  planchaNombreMedida: `${plancha.name} — ${plancha.medida}`,
  planchaValor: plancha.valor,
})

/**
 * Tras registrar la cantidad en Detalle OP: rellena filas de historial que quedaron en 0
 * (p. ej. diseño existente cargado antes de definir la cantidad).
 */
export const syncColoresPlanchasCantidadFromOrder = (
  items: DisenoColorPlanchaItem[],
  orderQuantity: number
): DisenoColorPlanchaItem[] | null => {
  if (orderQuantity <= 0) return null
  let changed = false
  const next = items.map(item => {
    if (item.registroManual || item.cantidad > 0) return item
    changed = true
    return applyTamanosBuenosToItem({ ...item, cantidad: orderQuantity })
  })
  return changed ? next : null
}

/** Al reutilizar un trabajo anterior: migra al modelo de registros OP y aplica precio vigente si la plancha sigue en catálogo. */
export const applyColoresPlanchasForHistorialReuse = (
  raw: Partial<PreprensaDisenoSpecs>,
  orderQuantity = 0,
  planchas: TamanoPlancha[] = []
): DisenoColorPlanchaItem[] =>
  normalizeColoresPlanchas(raw).map(item => {
    const numeroPlanchas = getColoresCount(item.colores) || item.numeroCavidades || 0
    const cantidad = orderQuantity > 0 ? orderQuantity : item.cantidad > 0 ? item.cantidad : 0
    const catalogPlancha = planchas.find(p => p.id === item.planchaId && p.active)
    const nombreMedida = catalogPlancha
      ? `${catalogPlancha.name} — ${catalogPlancha.medida}`
      : item.planchaNombreMedida

    return applyTamanosBuenosToItem({
      ...item,
      planchaId: catalogPlancha?.id ?? item.planchaId,
      planchaNombreMedida: nombreMedida,
      cantidad,
      numeroPlanchas,
      reposicionPlancha: false,
      cantidadReposicion: 0,
      registroManual: false,
      planchaValor: 0,
      valorTotal: 0,
      observacion: '',
    })
  })

/** Migra plancha única legacy → lista por cantidad de colores. */
export const normalizeColoresPlanchas = (
  raw: Partial<PreprensaDisenoSpecs>
): DisenoColorPlanchaItem[] => {
  const fallbackCavidades = raw.numeroCavidades ?? 0
  const fallbackColores = normalizeDisenoColoresValue(raw.colores ?? '')

  if (raw.coloresPlanchas?.length) {
    return raw.coloresPlanchas.map(item =>
      migrateItem(
        item as DisenoColorPlanchaItem & { colorIndex?: number },
        fallbackColores,
        fallbackCavidades
      )
    )
  }
  if (raw.planchaId?.trim() && fallbackColores) {
    return [
      {
        id: createId(),
        colores: fallbackColores,
        planchaId: raw.planchaId,
        planchaNombreMedida: raw.planchaNombreMedida ?? '',
        planchaValor: raw.planchaValor ?? 0,
        cantidad: 0,
        numeroPlanchas: 0,
        valorTotal: 0,
        numeroCavidades: fallbackCavidades,
        tamanosBuenos: 0,
        sobrante: 0,
        detalle: '',
        observacion: '',
        reposicionPlancha: false,
        cantidadReposicion: 0,
        registroManual: false,
      },
    ]
  }
  if (raw.planchaId?.trim()) {
    return [
      {
        id: createId(),
        colores: '1-color',
        planchaId: raw.planchaId,
        planchaNombreMedida: raw.planchaNombreMedida ?? '',
        planchaValor: raw.planchaValor ?? 0,
        cantidad: 0,
        numeroPlanchas: 0,
        valorTotal: 0,
        numeroCavidades: fallbackCavidades,
        tamanosBuenos: 0,
        sobrante: 0,
        detalle: '',
        observacion: '',
        reposicionPlancha: false,
        cantidadReposicion: 0,
        registroManual: false,
      },
    ]
  }
  return []
}

export const buildColoresPlanchasPatch = (
  items: DisenoColorPlanchaItem[],
  context: ColoresPlanchasPricingContext = {}
): Pick<
  PreprensaDisenoSpecs,
  | 'coloresPlanchas'
  | 'colores'
  | 'numeroCavidades'
  | 'planchaId'
  | 'planchaNombreMedida'
  | 'planchaValor'
  | 'valorTotalPlanchas'
> => ({
  coloresPlanchas: items,
  colores: deriveColoresSummary(items),
  numeroCavidades: deriveCavidadesSummary(items),
  valorTotalPlanchas: sumValorTotalPlanchas(items, context),
  ...legacyPlanchaFromList(items),
})
