import {
  DisenoColorPlanchaItem,
  DisenoColoresOption,
  PreprensaDisenoSpecs,
} from '../../../../core/domain/entities/PreprensaDiseno'
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

/** @deprecated Usar getColoresCount */
export const getColoresInkNumber = getColoresCount

export const computeRegistroValorTotal = (
  numeroPlanchas: number,
  precioPlancha: number
): number => Math.round(numeroPlanchas * precioPlancha)

/** Diseño existente: precio solo si hay reposición o registro manual de esta orden. */
export const itemAplicaPrecioPlancha = (
  item: DisenoColorPlanchaItem,
  historialMode: boolean
): boolean =>
  !historialMode || Boolean(item.registroManual) || Boolean(item.reposicionPlancha)

export const resolveItemValorTotal = (
  item: DisenoColorPlanchaItem,
  options?: { historialMode?: boolean }
): number => {
  if (options?.historialMode && !itemAplicaPrecioPlancha(item, true)) return 0
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
  historialMode = false
): number =>
  items.reduce(
    (sum, item) => sum + resolveItemValorTotal(item, { historialMode }),
    0
  )

export const resolvePrecioPlanchaDisplay = (
  item: DisenoColorPlanchaItem,
  catalogValor: number | undefined,
  historialMode: boolean
): number => {
  if (!itemAplicaPrecioPlancha(item, historialMode)) return 0
  return catalogValor ?? item.planchaValor ?? 0
}

export const buildPrecioPatchFromCatalog = (
  item: DisenoColorPlanchaItem,
  plancha: TamanoPlancha | undefined,
  cantidadCobro: number
): Pick<
  DisenoColorPlanchaItem,
  'planchaId' | 'planchaNombreMedida' | 'planchaValor' | 'valorTotal'
> => {
  if (!plancha) {
    return { planchaValor: 0, valorTotal: 0 }
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

    return {
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
    }
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
        id: crypto.randomUUID(),
        colores: fallbackColores,
        planchaId: raw.planchaId,
        planchaNombreMedida: raw.planchaNombreMedida ?? '',
        planchaValor: raw.planchaValor ?? 0,
        cantidad: 0,
        numeroPlanchas: 0,
        valorTotal: 0,
        numeroCavidades: fallbackCavidades,
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
        id: crypto.randomUUID(),
        colores: '1-color',
        planchaId: raw.planchaId,
        planchaNombreMedida: raw.planchaNombreMedida ?? '',
        planchaValor: raw.planchaValor ?? 0,
        cantidad: 0,
        numeroPlanchas: 0,
        valorTotal: 0,
        numeroCavidades: fallbackCavidades,
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
  items: DisenoColorPlanchaItem[]
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
  valorTotalPlanchas: sumValorTotalPlanchas(items),
  ...legacyPlanchaFromList(items),
})
